let log_enabled = false;
export function log(...data: any) {
  if (log_enabled)
    console.log(...data)
}

export function logEnabled(enabled: boolean) {
  log_enabled = enabled;
}