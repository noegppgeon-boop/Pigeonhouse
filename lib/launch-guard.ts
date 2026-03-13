// Launch guard — blocks API access until launch time
// Must match the LAUNCH_UTC in LaunchGate.tsx
export const LAUNCH_UTC = "2026-03-14T21:40:00Z";

export function isLaunched(): boolean {
  return Date.now() >= new Date(LAUNCH_UTC).getTime();
}

export function launchGuardResponse() {
  const timeLeft = new Date(LAUNCH_UTC).getTime() - Date.now();
  return {
    error: "Platform not yet launched",
    launchAt: LAUNCH_UTC,
    secondsLeft: Math.max(0, Math.floor(timeLeft / 1000)),
  };
}
