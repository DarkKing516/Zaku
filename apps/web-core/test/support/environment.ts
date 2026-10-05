export function withEnvironment(overrides: Record<string, string | undefined>, run: () => void): void {
  const previous = Object.fromEntries(Object.keys(overrides).map((key) => [key, process.env[key]]));
  setVariables(overrides);
  try {
    run();
  } finally {
    setVariables(previous);
  }
}

// Assigning undefined to process.env would store the string "undefined".
function setVariables(values: Record<string, string | undefined>): void {
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}
