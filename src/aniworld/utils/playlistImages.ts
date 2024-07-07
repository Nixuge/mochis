import * as cheerio from "cheerio";

export const getPlaylistImages = async (id: string, posterSize: 150 | 200 | 220 = 220) => {
  const url = `https://aniworld.to/anime/stream/${id}`;
  const response = await request.get(url);
  const $ = cheerio.load(response.text());

  const posterImage = $(".seriesCoverBox > img").attr("data-src");

  const bannerImage = $(".backdrop")
    .attr("style")
    ?.match(/url\(([^)]+)\)/)?.[1];

  return {
    posterImage: posterImage
      ? convertPosterSize(`https://aniworld.to${posterImage}`, posterSize)
      : undefined,
    bannerImage: bannerImage ? `https://aniworld.to${bannerImage}` : undefined,
  };
};

export const convertPosterSize = (url: string, posterSize: 150 | 200 | 220) => {
  return url.replace(/\d+x\d+/, `${posterSize}x${posterSize * 1.5}`);
};
