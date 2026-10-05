const declaredAdapterKeys = new Set<string>();

export const SwitchableAdapterKeys = {
  declare(adapterKey: string): void {
    declaredAdapterKeys.add(adapterKey);
  },

  declared(): readonly string[] {
    return [...declaredAdapterKeys].sort();
  },
};
