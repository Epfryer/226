import { publicationCovers } from "./publication-covers.generated";

/** Resolve only pre-generated local covers; unknown API covers keep their URL. */
export function getPublicationCover(originalPath: string) {
  const cover = publicationCovers[originalPath as keyof typeof publicationCovers];
  if (!cover) return { coverPath: originalPath };

  const { width, height, variants } = cover;
  const mobileWidth = Math.ceil(400 * width / height);
  const desktopWidth = Math.ceil(500 * width / height);
  return {
    coverPath: variants.find((variant) => variant.width >= 640)!.path,
    coverSrcSet: variants.map((variant) => `${variant.path} ${variant.width}w`).join(", "),
    // Cards have fixed 400/500px heights and are bounded by the page padding.
    coverSizes: `(min-width: 768px) min(${desktopWidth}px, calc(100vw - 32px)), min(${mobileWidth}px, calc(100vw - 32px))`,
    coverWidth: width,
    coverHeight: height,
  };
}
