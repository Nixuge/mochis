import { PlaylistDetails } from "@mochiapp/js/dist";
import { baseUrl } from "../utils/constants";
import { load } from "cheerio";

export async function genericPlaylistDetails(id: string): Promise<PlaylistDetails> {
    const html = await request.get(`${baseUrl}${id}`).then(resp => resp.text())
    const $ = load(html);

    const ratings = parseFloat($("div.stats span").has("i.fa-star").first().text());

    const detailsRef = $("div.movie_information div.container div.m_i-detail");

    const synopsis = detailsRef.find("div.m_i-d-content div.description").text().trim();
    
    const elems: { [key: string]: string } = {};
    detailsRef.find("div.m_i-d-content div.elements div.row-line").map((i, elem) => {
      const elemRef = $(elem);
      const type = elemRef.find("span.type").text().replace(":", "").toLowerCase();
      const text = elemRef.text().replaceAll("\n", "").replaceAll("  ", "").split(":")[1].trim()
      elems[type] = text;
    })

    const genres = elems["genre"].split(", ");
    let yearReleased: number | undefined = undefined;
    try { yearReleased = parseInt(elems["released"].split("-")[0]); } catch {}
    return {
      synopsis: synopsis,
      altTitles: [],
      altPosters: [], // could scrape but i think it's the same most times so yeah meh
      altBanners: [], // same
      genres,
      yearReleased,
      ratings,
      previews: []
    } satisfies PlaylistDetails
  };