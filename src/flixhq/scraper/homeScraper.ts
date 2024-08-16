import { DiscoverListingOrientationType, DiscoverListingType, DiscoverListingsRequest, MochiResponse, PlaylistStatus, PlaylistType } from "@mochiapp/js/dist"
import { Paging } from "@mochiapp/js/src/common/types"
import { DiscoverListing, Playlist } from "@mochiapp/js/src/interfaces/source/types"
import { Cheerio, CheerioAPI, load } from "cheerio"
import { bannerRes } from "../utils/constants";
import { scrapeItemsBlock } from "./item";

export class HomeScraper {
  private $: CheerioAPI;

  constructor(html: string) {
    this.$ = load(html);
  }

  scrape(): DiscoverListing[] {
    return [
      this.scrapeFeatured(),
      ...this.scrapeAllBlocks()
    ]
  }

  private scrapeAllBlocks(): DiscoverListing[] {
    const data: DiscoverListing[] = [];

    const $ = this.$;
    $("div#main-wrapper div.container section.block_area.block_area_home").map((i, section) => {
      const sectionRef = $(section);
      const title = sectionRef.find("h2.cat-heading").text();
      if (title == "Coming Soon") 
        return;

      // TODO: replace any with proper type (formerly element)
      const block: any = sectionRef.find("div.film_list-wrap");
      if (block.length == 1) {
        data.push(this.makeBlockDiscoverListing(block, title))
      } else {
        // Annoying Trending block
        data.push(this.makeBlockDiscoverListing($(block[0]), title + " Movies"))
        data.push(this.makeBlockDiscoverListing($(block[1]), title + " TV Shows"))
      }
    })
    return data;
  }
  
  private makeBlockDiscoverListing(block: Cheerio<Element>, title: string): DiscoverListing {
    return {
      id: title,
      title: title,
      type: DiscoverListingType.default,
      orientation: DiscoverListingOrientationType.portrait,
      paging: {
        id: title,
        title: title,
        items: scrapeItemsBlock(block)
      } satisfies Paging<Playlist>,
    } satisfies DiscoverListing
  }

  private scrapeFeatured() {
    const $ = this.$;
    const swiperEntries: Playlist[] = $("div.swiper-wrapper").find("div.swiper-slide").map((i, slide) => {
      const banner = slide.attribs["style"].match(/background-image: url\((.*?)\)/)![1].replace(/\d+x\d+/, bannerRes);

      const slideRef = $(slide).find("div.container div.slide-caption");
      const titleElem = slideRef.find("h3.film-title a");
      const url = titleElem.attr("href")!;
      const title = titleElem.text();
      return {
        id: url,
        title: title,
        bannerImage: banner,
        url: url,
        status: PlaylistStatus.unknown,
        type: PlaylistType.video
      } satisfies Playlist
    }).get()

    const swiperElem = {
      id: "featured",
      title: "Featured",
      type: DiscoverListingType.featured,
      orientation: DiscoverListingOrientationType.landscape,
      paging: {
        id: "0",
        title: "Featured",
        items: swiperEntries
      } satisfies Paging<Playlist>
    } satisfies DiscoverListing;

    return swiperElem;
  }
}