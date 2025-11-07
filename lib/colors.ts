export const BOX_COLORS = [
  "#FF5733", "#33FF57", "#3357FF", "#FF33A1", "#A133FF",
  "#33FFF6", "#F6FF33", "#FF8C33", "#8C33FF", "#33FF8C",
  "#FF6347", "#ADFF2F", "#1E90FF", "#FF00FF", "#BA55D3",
  "#00FA9A", "#FFD700", "#FF4500", "#9932CC", "#32CD32"
];

export const simpleStringHash = (str: string): number => {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; 
  }
  return Math.abs(hash);
};