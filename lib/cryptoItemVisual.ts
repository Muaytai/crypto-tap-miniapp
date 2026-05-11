/** Эмодзи/метка для карточки предмета по названию (рус/англ). */
export function cryptoItemVisual(name: string): { emoji: string; tag: string } {
  const n = name.toLowerCase();
  if (n.includes("gpu") || n.includes("видео") || n.includes("риг"))
    return { emoji: "🎮", tag: "GPU" };
  if (n.includes("asic")) return { emoji: "⛏", tag: "ASIC" };
  if (n.includes("блок") || n.includes("psu") || n.includes("питан"))
    return { emoji: "⚡", tag: "PSU" };
  if (n.includes("кулер") || n.includes("охлажд") || n.includes("вентиля"))
    return { emoji: "🌀", tag: "AIR" };
  if (n.includes("кошел") || n.includes("wallet") || n.includes("ledger"))
    return { emoji: "🔐", tag: "SEC" };
  if (n.includes("сетев") || n.includes("оптоволок") || n.includes("fiber") || n.includes("patch"))
    return { emoji: "🔌", tag: "NET" };
  if (n.includes("плоскогуб") || n.includes("молот") || n.includes("паяль"))
    return { emoji: "🔧", tag: "LAB" };
  return { emoji: "💠", tag: "RIG" };
}
