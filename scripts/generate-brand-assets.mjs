import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Small committed identity assets. Requires ImageMagick and DejaVu Sans.
const publicDir = fileURLToPath(new URL("../client/public/", import.meta.url));
execFileSync("magick", [
  "-background", "none", `${publicDir}favicon.svg`,
  "-define", "icon:auto-resize=48,32,16", `${publicDir}favicon.ico`,
]);
execFileSync("magick", [
  "-size", "1200x630", "xc:#f5f3ee",
  "-fill", "#111111", "-draw", "rectangle 64,64 72,566",
  "-font", "DejaVu-Sans-Bold", "-pointsize", "170", "-annotate", "+112+270", "D.EF",
  "-font", "DejaVu-Sans", "-pointsize", "46", "-annotate", "+120+365", "Ethan Fryer",
  "-pointsize", "25", "-annotate", "+120+445", "ARCHITECTURE  /  PUBLICATIONS  /  STUDIO",
  "-pointsize", "22", "-annotate", "+120+545", "ethanfryer.com",
  "-strip", `${publicDir}social-preview.png`,
]);
