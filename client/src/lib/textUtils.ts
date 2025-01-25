
export const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const formatText = (text: string): string => {
  return text
    .replace(/\s+/g, ' ')
    .trim();
};
