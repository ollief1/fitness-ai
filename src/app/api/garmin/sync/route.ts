import { NextResponse } from "next/server";

export async function POST() {
  // Garmin sync requires Python and only works locally
  if (process.env.VERCEL) {
    return NextResponse.json(
      { error: "Garmin sync is only available when running locally" },
      { status: 400 }
    );
  }

  // Dynamic import to avoid bundling child_process on Vercel
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const path = await import("path");

  const execAsync = promisify(exec);
  const scriptPath = path.join(process.cwd(), "scripts", "garmin_sync.py");

  try {
    const { stdout, stderr } = await execAsync(`python3 "${scriptPath}"`, {
      timeout: 120000,
      cwd: process.cwd(),
    });

    return NextResponse.json({
      success: true,
      output: stdout,
      errors: stderr || undefined,
    });
  } catch (err) {
    const error = err as { message?: string; stdout?: string; stderr?: string };
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Sync failed",
        output: error.stdout,
        errors: error.stderr,
      },
      { status: 500 }
    );
  }
}
