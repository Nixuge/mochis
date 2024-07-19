// url example:
// https://aniworld.to/anime/stream/neon-genesis-evangelion/staffel-1/episode-1/

export type UrlInfo = {
  id: string;
  season?: string;
  episode?: string;
};

export const getUrlInfo = (url: string): UrlInfo => {
  const match = url.match(
    /^(?:https:\/\/aniworld\.to)?\/(?:[^/]+)\/stream\/([^/]+)\/?([^/]+)?\/?([^/]+)?$/
  );
  if (!match) throw new Error(`Invalid url: ${url}`);

  const [, id, season, episode] = match;

  return {
    id: id,
    season: season || undefined,
    episode: episode || undefined,
  };
};
