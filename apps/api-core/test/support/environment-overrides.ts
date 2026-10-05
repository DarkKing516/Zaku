export function overrideEnvironment(overrides: Record<string, string>): () => void {
  const previousValues = Object.fromEntries(Object.keys(overrides).map((name) => [name, process.env[name]]));
  Object.assign(process.env, overrides);

  return () => {
    for (const [name, previousValue] of Object.entries(previousValues)) {
      if (previousValue === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = previousValue;
      }
    }
  };
}
