/** Resize delivery copies only; keep the source files and detail/zoom URLs intact. */
export function deliveryImage(src: string, width: number): string {
  if (!/^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/v\d+\//.test(src)) return src;
  return src.replace("/image/upload/", `/image/upload/f_auto,q_auto,c_limit,w_${width}/`);
}

export function responsiveImageProps(src: string, sizes: string) {
  const optimized = deliveryImage(src, 640);
  return {
    src: optimized,
    ...(optimized !== src ? {
      srcSet: [320, 640, 960, 1280].map(width => `${deliveryImage(src, width)} ${width}w`).join(", "),
      sizes,
    } : {}),
  };
}
