export type UpgradeLike = {
  id?: number;
  name?: string;
  description?: string;
  icon_name?: string;
  upgrade_type?: string;
};

export const UPGRADE_IMAGE_COUNT = 11;

export function resolveUpgradeImageNum(upgrade: UpgradeLike, sortIndex = 0): number {
  const icon = upgrade.icon_name?.trim().toLowerCase() ?? "";
  const fromIcon = icon.match(/^upgrade_(\d+)$/);
  if (fromIcon) {
    const num = parseInt(fromIcon[1], 10);
    return ((num - 1) % UPGRADE_IMAGE_COUNT) + 1;
  }
  if (upgrade.id != null && upgrade.id > 0) {
    return ((upgrade.id - 1) % UPGRADE_IMAGE_COUNT) + 1;
  }
  return (sortIndex % UPGRADE_IMAGE_COUNT) + 1;
}

export function upgradeImageUrl(upgrade: UpgradeLike, sortIndex = 0): string {
  const num = resolveUpgradeImageNum(upgrade, sortIndex);
  return `/images/upgrades/upgrades_${num}.png`;
}
