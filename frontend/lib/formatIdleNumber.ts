/** Короткая запись больших чисел в стиле idle-игр (K, M, … Sp, Sx), как на референс-скрине. */
const SUFFIXES = [
  "",
  "K",
  "M",
  "B",
  "T",
  "Qa",
  "Qi",
  "Sx",
  "Sp",
  "Oc",
  "No",
  "De",
  "UDe",
  "DDe",
  "TDe",
  "QdDe",
];

export function formatIdleNumber(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const abs = Math.abs(n);
  if (abs < 1000) return Math.floor(n).toLocaleString("ru-RU");
  const tier = Math.min(Math.floor(Math.log10(abs) / 3), SUFFIXES.length - 1);
  const scaled = n / 1000 ** tier;
  const decimals = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
  return `${scaled.toFixed(decimals)}${SUFFIXES[tier]}`;
}
