export function formatSeconds(value: number): string {
  return value < 60 ? value.toFixed(2) + " s" : (value / 60).toFixed(2) + " min";
}

export function formatRatio(value: number | undefined): string {
  return value === undefined ? "—" : (value * 100).toFixed(1) + "%";
}

export function formatNumber(value: number | undefined): string {
  return value === undefined ? "—" : value.toFixed(2);
}
