/**
 * @loquia/worker — SCAFFOLDING ONLY (Milestone 2).
 *
 * Prepared as a Render Background Worker but runs NO real pipeline yet
 * (no STT / diarization / LLM / queue consumer). It stays alive so the Render
 * service has a valid long-running process; the real media pipeline is a later
 * milestone.
 */
export const WORKER_STATUS = 'prepared-no-pipeline-milestone-2' as const;

function main(): void {
  // eslint-disable-next-line no-console
  console.log('[loquia-worker] prepared — no pipeline in Milestone 2');
  // Keep the process alive without doing work.
  setInterval(() => {
    /* heartbeat placeholder */
  }, 60_000);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
