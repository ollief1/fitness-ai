import { NextRequest, NextResponse } from "next/server";
import { askClaude } from "@/lib/claude";
import { getCurrentPhase } from "@/lib/training-phases";
import { getActivities } from "@/lib/store";
import { getUpcomingGoals } from "@/lib/goals-store";
import {
  getRecoveries,
  getSleeps,
  getCycles,
} from "@/lib/whoop-store";

function buildSystemPrompt(): string {
  return `You are an expert triathlon coach and sports scientist. You understand periodisation, training load management, and recovery optimisation for endurance athletes.

Your athlete is a triathlete training for upcoming races. You have access to their:
- Current training phase and periodisation context
- Recent training data from Strava (activities, volume, intensity)
- Recovery data from Whoop (recovery score, HRV, resting heart rate, sleep, strain)
- Upcoming race goals

Your job is to provide actionable, personalised training advice. Be specific and practical — not generic. Reference their actual data when making recommendations.

Key principles you follow:
- Respect the current training phase and its goals
- Monitor the acute:chronic training load ratio to avoid injury
- Use recovery data (HRV, recovery score) to modulate training intensity
- Consider the balance across swim/bike/run disciplines
- Account for upcoming race timing when suggesting intensity
- Flag any concerning patterns (overtraining, under-recovery, imbalanced training)

Keep your tone friendly and direct — like a knowledgeable coach talking to their athlete. Use plain language, not jargon.`;
}

async function buildTrainingContext(): Promise<string> {
  const [phase, activities, goals, recoveries, sleeps, cycles] = await Promise.all([
    getCurrentPhase(),
    getActivities(),
    getUpcomingGoals(),
    getRecoveries(),
    getSleeps(),
    getCycles(),
  ]);

  // Recent activities (last 14 days)
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const recentActivities = activities
    .filter((a) => new Date(a.start_date) >= twoWeeksAgo)
    .map((a) => ({
      name: a.name,
      type: a.type,
      date: a.start_date_local?.slice(0, 10),
      duration_min: Math.round(a.moving_time / 60),
      distance_km: +(a.distance / 1000).toFixed(1),
      avg_hr: a.average_heartrate,
      max_hr: a.max_heartrate,
    }));

  // Weekly volume summary (last 4 weeks)
  const weeklyVolume: Record<string, { swim: number; bike: number; run: number; total: number }> = {};
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  for (const act of activities) {
    const d = new Date(act.start_date_local);
    if (d < fourWeeksAgo) continue;
    const weekStart = new Date(d);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const key = weekStart.toISOString().slice(0, 10);
    if (!weeklyVolume[key]) weeklyVolume[key] = { swim: 0, bike: 0, run: 0, total: 0 };

    const hours = act.moving_time / 3600;
    weeklyVolume[key].total += hours;

    if (act.type === "Swim") weeklyVolume[key].swim += hours;
    else if (act.type === "Ride" || act.type === "VirtualRide") weeklyVolume[key].bike += hours;
    else if (act.type === "Run" || act.type === "Trail Run") weeklyVolume[key].run += hours;
  }

  // Format weekly volume
  const weekSummaries = Object.entries(weeklyVolume)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, vol]) => ({
      week,
      swim_hrs: +vol.swim.toFixed(1),
      bike_hrs: +vol.bike.toFixed(1),
      run_hrs: +vol.run.toFixed(1),
      total_hrs: +vol.total.toFixed(1),
    }));

  // Latest recovery data
  const latestRecovery = recoveries[0];
  const latestSleep = sleeps[0];
  const latestCycle = cycles[0];

  // Recovery trend (last 7 days)
  const recoveryTrend = recoveries.slice(0, 7).map((r) => ({
    date: r.date?.slice(0, 10),
    recovery_score: r.recovery_score,
    hrv: r.hrv_rmssd_milli,
    resting_hr: r.resting_heart_rate,
  }));

  const context = {
    today: new Date().toISOString().slice(0, 10),
    day_of_week: new Date().toLocaleDateString("en-GB", { weekday: "long" }),

    training_phase: {
      phase: phase.phase,
      label: phase.label,
      description: phase.description,
      weeks_to_race: phase.weeksToRace,
      week_in_phase: phase.weekInPhase,
      total_weeks_in_phase: phase.totalWeeksInPhase,
      is_override: phase.isOverride,
      target_race: phase.targetRace
        ? {
            name: phase.targetRace.name,
            date: phase.targetRace.date,
            discipline: phase.targetRace.discipline,
            distance: phase.targetRace.distance,
            target_time: phase.targetRace.target_time,
            priority: phase.targetRace.priority,
          }
        : null,
    },

    upcoming_races: goals.slice(0, 5).map((g) => ({
      name: g.name,
      date: g.date,
      discipline: g.discipline,
      distance: g.distance,
      priority: g.priority,
      target_time: g.target_time,
    })),

    recent_activities: recentActivities,
    weekly_volume: weekSummaries,

    recovery: {
      latest: latestRecovery
        ? {
            date: latestRecovery.date?.slice(0, 10),
            recovery_score: latestRecovery.recovery_score,
            hrv: latestRecovery.hrv_rmssd_milli,
            resting_hr: latestRecovery.resting_heart_rate,
          }
        : null,
      trend: recoveryTrend,
      latest_sleep: latestSleep
        ? {
            start: latestSleep.start,
            end: latestSleep.end,
            performance: latestSleep.score?.sleep_performance_percentage,
            efficiency: latestSleep.score?.sleep_efficiency_percentage,
          }
        : null,
      latest_strain: latestCycle
        ? {
            strain: latestCycle.strain,
            avg_hr: latestCycle.average_heart_rate,
            calories: latestCycle.kilojoule,
          }
        : null,
    },
  };

  return JSON.stringify(context, null, 2);
}

// ── Daily insight ──

export async function GET() {
  try {
    const context = await buildTrainingContext();

    const response = await askClaude(
      buildSystemPrompt(),
      [
        {
          role: "user",
          content: `Here is my current training data:\n\n${context}\n\nGive me a brief daily training insight for today. Include:\n1. Where I am in my training cycle and what that means for today\n2. How my recovery looks and whether I should push or pull back\n3. A specific suggestion for today's training (or rest)\n4. Any patterns you notice that I should be aware of\n\nKeep it concise — 3-4 short paragraphs max.`,
        },
      ],
      800
    );

    const phase = await getCurrentPhase();

    return NextResponse.json({
      insight: response,
      phase: {
        phase: phase.phase,
        label: phase.label,
        description: phase.description,
        weeksToRace: phase.weeksToRace,
        targetRace: phase.targetRace?.name || null,
        isOverride: phase.isOverride,
      },
      generated: new Date().toISOString(),
    });
  } catch (err) {
    const error = err as Error;
    console.error("Advisor error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to generate insight" },
      { status: 500 }
    );
  }
}

// ── Weekly analysis ──

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const type = body.type || "weekly";

    const context = await buildTrainingContext();

    let prompt: string;
    let maxTokens: number;

    if (type === "plan") {
      prompt = `Here is my current training data:\n\n${context}\n\nCreate a structured 7-day training plan for this week (starting Monday). Consider my current training phase, recovery status, upcoming races, and recent training load.\n\nFor each day, provide:\n- **Day** (e.g. Monday)\n- **Discipline** (Swim / Bike / Run / Rest / Strength / Cross-train)\n- **Session title** (e.g. "Tempo Run", "Easy Swim + Drills", "Rest Day")\n- **Duration** (estimated time)\n- **Intensity** (Easy / Moderate / Hard / Recovery)\n- **Detail**: For key sessions (tempo, intervals, threshold, race-pace), give specific workout details including intervals, distances, paces or HR targets, rest periods, and warm-up/cool-down. For easy/recovery sessions, keep it simple with just duration, intensity guidance, and HR ceiling.\n\nFormat each day as:\n## Monday\n**Discipline:** Run\n**Session:** Easy Recovery Run\n**Duration:** 40 min\n**Intensity:** Easy\n**Detail:** Easy pace, keep HR under 145. Focus on relaxed form. No watch-checking.\n\nAt the end, add a brief **Week Summary** with total planned hours, discipline split, and the key sessions of the week.\n\nMake sure the plan respects my training phase, accounts for my recovery data, and balances the three disciplines appropriately for my target race.`;
      maxTokens = 2500;
    } else if (type === "session") {
      prompt = `Here is my current training data:\n\n${context}\n\nWhat should I train today? Give me a specific session suggestion.\n\nConsider:\n- What day of the week it is and typical training rhythm\n- My current training phase and its goals\n- My recovery score and HRV (should I push or pull back?)\n- What I've done in the last few days (avoid back-to-back hard days in the same discipline)\n- My upcoming race and what I need to work on\n\nProvide:\n1. **Discipline** (Swim / Bike / Run / Rest / Strength)\n2. **Session Title** (e.g. "Threshold Intervals on the Bike")\n3. **Duration**\n4. **Intensity** (Easy / Moderate / Hard)\n5. **The Workout**: If this is a key/quality session, give full detail — warm-up, main set with specific intervals/distances/paces/HR targets/rest periods, cool-down. If this is an easy/recovery day, keep it simple with duration and HR guidance.\n6. **Why this session**: Brief explanation of why this is the right session for today given my data.\n\nIf today should be a rest day, say so clearly and explain why.`;
      maxTokens = 1200;
    } else if (type === "weekly") {
      prompt = `Here is my current training data:\n\n${context}\n\nProvide a detailed weekly training analysis. Include:\n\n1. **Training Phase Assessment**: Where I am in my periodisation cycle, what the goals are for this phase, and whether my training aligns with those goals.\n\n2. **Volume & Load Review**: Analyse my weekly volume trends across swim/bike/run. Is volume progressing appropriately for my phase? Is the discipline balance right for my target race?\n\n3. **Recovery Analysis**: Based on my Whoop data (HRV trend, recovery scores, sleep, strain), how well am I recovering? Any red flags?\n\n4. **Key Observations**: What patterns stand out — good or concerning? Training consistency, intensity distribution, rest days.\n\n5. **Recommendations for Next Week**: Specific suggestions for next week's training. Include recommended volume, key sessions, and any adjustments based on recovery.\n\nBe specific and reference my actual numbers.`;
      maxTokens = 2000;
    } else {
      prompt = `Here is my current training data:\n\n${context}\n\nGive me a brief daily training insight for today. Include where I am in my cycle, how recovery looks, and what I should do today. Keep it to 3-4 short paragraphs.`;
      maxTokens = 800;
    }

    const response = await askClaude(
      buildSystemPrompt(),
      [{ role: "user", content: prompt }],
      maxTokens
    );

    const phase = await getCurrentPhase();

    const phaseInfo = {
      phase: phase.phase,
      label: phase.label,
      weeksToRace: phase.weeksToRace,
      targetRace: phase.targetRace?.name || null,
    };

    if (type === "plan") {
      return NextResponse.json({
        plan: response,
        type,
        phase: phaseInfo,
        generated: new Date().toISOString(),
      });
    }

    if (type === "session") {
      return NextResponse.json({
        session: response,
        type,
        phase: phaseInfo,
        generated: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      analysis: response,
      type,
      phase: phaseInfo,
      generated: new Date().toISOString(),
    });
  } catch (err) {
    const error = err as Error;
    console.error("Advisor error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to generate analysis" },
      { status: 500 }
    );
  }
}
