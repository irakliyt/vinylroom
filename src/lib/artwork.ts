const INTRO_ARTWORK =
  "https://is1-ssl.mzstatic.com/image/thumb/Features125/v4/8c/41/ef/8c41efae-a00f-84cf-9d6f-465bb0fc2f66/dj.aacpwrsd.jpg/300x300bb.jpg";

const LOCAL_INTRO_ARTWORK = "/artwork/acdc-thunderstruck-220.avif";

export function artworkVariant(url: string | undefined, size = 100) {
  if (!url) return undefined;
  if (url === INTRO_ARTWORK) return LOCAL_INTRO_ARTWORK;
  return url.replace(/\/300x300bb\.(jpg|png)$/i, `/${size}x${size}bb.$1`);
}
