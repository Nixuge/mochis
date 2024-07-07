import { PlaylistGroup, PlaylistGroupVariant, PlaylistItem } from "@mochiapp/js/dist";
import { CheerioAPI, load } from "cheerio";
import { AJAX_BASENAME, BASENAME } from "../utils/variables";
import { getVrf } from "../utils/urlGrabber";

// Basically it's late and I don't want to use a class bc it makes things kinda bad looking
// so since i'm calling scrapeEpisodes() every time before I call scrapeSeasonsDiv() anyways
// I just store it in a dirty variable outside of the function.
// It's not good but it works so oh well for now (& probably forever)
let $: CheerioAPI = undefined!;

export async function scrapeEpisodes(playlistId: string): Promise<PlaylistGroup | undefined> {
    const fullUrl = `${BASENAME}${playlistId}`;
    
    const html = await request.get(fullUrl);
    if (html.text().includes("<title>WAF</title>")) {
      console.error("Seems like you're getting captcha'd. Unfortunately I can't do much about it. Retry later/change your ip.");
      return undefined;
    }
    
    $ = load(html.text());
    const data_id = $("div#watch-main").attr("data-id");

    const url = `${AJAX_BASENAME}/episode/list/${data_id}?vrf=${getVrf(parseInt(data_id!).toString())}`
    
    let episodesHtml;
    try {
      // @ts-ignore
      episodesHtml = (await request.get(url, {headers: {"x-requested-with": "XMLHttpRequest"}})).json()["result"]      
    } catch(e) {
      console.error("If you see this, there's an issue.");
      return undefined;
    }
    const $$ = load(episodesHtml);
    
    // Note:
    // This *technically* isn't always correct, eg if a sub has 12 eps and a dub only 2, it'll always show 1-12 even for the dub variant.
    // However, the amount of logic required to avoid this thing is way greater than any benefit, for now it's staying as is
    const episodeCounts = $$(".dropdown.filter.range .dropdown-menu .dropdown-item");
    const firstEpisode = parseInt(episodeCounts.first().text().split("-")[0]);
    const lastEpisode = parseInt(episodeCounts.last().text().split("-")[1]);
    const allEpisodes = `${firstEpisode}-${lastEpisode}`;
    
    const answer: PlaylistGroup = {
      id: playlistId,
      number: 1, // not much way to reliably grab this
      variants: [],
      default: true
    }

    function makeDummyVariantObject(type: string) {
      return {
        id: type.toLowerCase(),
        title: type,
        pagings: [
          {
            id: allEpisodes,
            title: allEpisodes,
            items: []
          }
        ]

      } satisfies PlaylistGroupVariant
    }

    $$("li").map((i, li) => {
        const inScraper = $$(li);
        // data ids needed for next step
        const dataIds = inScraper.find("a").attr("data-ids")!;                
        // episode number
        const episodeNum = parseInt(inScraper.find("a").attr("data-num")!);
        // episode title
        const titleDiv = inScraper.find("a").find("span.d-title");
        let episodeTitle = (titleDiv.text()) ? titleDiv.text() : undefined;

        // the "title" attribute on the lis has all the properties to grab sub/dub/softsub
        let episodeReleaseDate: string | undefined = undefined;
        let variantReleaseDatesRaw: string | undefined = inScraper.attr("title");
        // Note: this is kinda wonky lmao
        // See on regex101 for what this does exactly.
        const variantReleaseDates: IterableIterator<RegExpMatchArray> = variantReleaseDatesRaw?.matchAll(/- ([a-zA-Z]*?): ([0-9]{4}\/[0-9]{2}\/[0-9]{2} [0-9]{2}:[0-9]{2} .*?)( |$)/g)!;

        // variantReleaseDatesRaw string also includes this if the episode is a filler
        if (variantReleaseDatesRaw?.includes("** Filler Episode **")) {
          episodeTitle = (episodeTitle == undefined)?
            `[F] Episode ${episodeNum}` :
            `[F] ${episodeTitle}`
        }

        
        for (let match of variantReleaseDates) {
          const variantType = match[1];
          if (variantType == "Release") {
            episodeReleaseDate = match[2]; // SHOULD work (should)
            continue;
          }
          // Never happens, but makes the compiler happy
          if (answer.variants == undefined)
            answer.variants = [];
          
          // get playlist group for variantType
          let playlistGroup: PlaylistGroupVariant | undefined = undefined;
          const playlistGroups = answer.variants.filter(variant => variant.title == variantType);
          if (playlistGroups.length == 0) {
            playlistGroup = makeDummyVariantObject(variantType);
            answer.variants.push(playlistGroup)
          } else {
            playlistGroup = playlistGroups[0];
          }
          playlistGroup.pagings?.[0].items?.push({
            id: dataIds + " | " + variantType.toLowerCase(), // kinda dirty but idk how else to pass data through to the next step
            title: episodeTitle,
            number: episodeNum,
            timestamp: episodeReleaseDate as unknown as Date,
            tags: []
          } satisfies PlaylistItem)
        }
    })

    return answer;
}

export async function scrapeSeasonsDiv(playlistId: string): Promise<PlaylistGroup[]> {
    const swiper = $("#w-seasons .swiper-wrapper .swiper-slide a");
    const seasons: PlaylistGroup[] = swiper.map((i, e) => {
        const seasonRef = load(e);
        return {
            id: e.attribs["href"],
            number: i+1,
            altTitle: seasonRef.text().trim(),
            variants: undefined, // opt but clearer to have it set to undefined like that
            default: false
        } satisfies PlaylistGroup
    }).get()

    return seasons;
}