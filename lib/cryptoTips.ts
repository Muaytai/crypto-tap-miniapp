/** Ротация «лампочки» — лёгкие факты про крипту (можно расширять). */
export const CRYPTO_TIPS: string[] = [
  "Биткоин ограничен 21 млн монет — дефицит заложен в протокол.",
  "Proof-of-Work тратит энергию на безопасность сети; Proof-of-Stake — на долю валидаторов.",
  "Приватный ключ = доступ к кошельку. Никому не отправляйте seed-фразу.",
  "Stablecoin привязан к фиату, но риски эмитента и резервов всё равно есть.",
  "Layer-2 (например rollups) снимают нагрузку с основной сети и удешевляют транзакции.",
];

export function tipForSession(seed: number): string {
  const i = Math.abs(Math.floor(seed)) % CRYPTO_TIPS.length;
  return CRYPTO_TIPS[i];
}
