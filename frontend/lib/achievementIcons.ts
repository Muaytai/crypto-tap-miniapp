export type AchievementLike = {
  id?: number;
  icon_name?: string;
};

export const ACHIEVEMENT_IMAGE_COUNT = 14;

/** Извлекает номер из icon_name вида `achievement_30` или использует id */
export function resolveAchievementImageNum(achievement: AchievementLike, sortIndex = 0): number {
  const icon = achievement.icon_name?.trim().toLowerCase() ?? "";
  const fromIcon = icon.match(/^achievement_(\d+)$/);
  if (fromIcon) {
    return parseInt(fromIcon[1], 10);
  }
  if (achievement.id != null && achievement.id > 0) {
    return achievement.id;
  }
  return sortIndex + 1;
}

export function achievementImageUrl(achievement: AchievementLike, sortIndex = 0): string {
  const num = resolveAchievementImageNum(achievement, sortIndex);
  const fileNum = ((num - 1) % ACHIEVEMENT_IMAGE_COUNT) + 1;
  return `/images/Achievements/Achievement_${fileNum}.png`;
}
