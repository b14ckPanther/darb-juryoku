/** Percent for a 0..1 value in the reader's locale, for example 85%. */
export const formatPercent = (fraction: number) =>
  new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 0 }).format(fraction);

/** Fills `{name}` slots in a copy template from config, for example '{action}, {row}'. */
export const fillTemplate = (template: string, values: Record<string, string>) =>
  template.replaceAll(/\{(\w+)\}/g, (slot, key: string) => values[key] ?? slot);
