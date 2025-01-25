
export const getOptimizedImageUrl = (url: string, width: number = 800) => {
  if (url.includes('unsplash.com')) {
    // Add width parameter for Unsplash images
    return `${url}&w=${width}&q=80&auto=format`;
  }
  return url;
};

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};
