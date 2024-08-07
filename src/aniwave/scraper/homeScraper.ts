import { DiscoverListingOrientationType, DiscoverListingType, DiscoverListingsRequest, MochiResponse, PlaylistStatus, PlaylistType, StatusError } from "@mochiapp/js/dist"
import { Paging } from "@mochiapp/js/src/common/types"
import { DiscoverListing, Playlist } from "@mochiapp/js/src/interfaces/source/types"
import { CheerioAPI, load } from "cheerio"
import { AJAX_BASENAME, BASENAME } from "../utils/variables";
import { parseSubpage } from "./subpage";

const bottomColumnsUrls = new Map<string, string>([
    ["completed", "completed"],
    ["new-added", "added"],
    ["new-release", "newest"],
]);

const bottomColumns = Array.from(bottomColumnsUrls.keys())

const bottomColumnsAlreadyDone = {
  "completed": [],
  "new-added": [],
  "new-release": [],
}


export class HomeScraper {
    $!: CheerioAPI;
    listingId?: string;
    page: number;

    constructor(listingRequest?: DiscoverListingsRequest) {
      this.page = 1;
      if (listingRequest) {
        this.listingId = listingRequest.listingId;
        this.page = parseInt(listingRequest.page);
      }
    }

    async scrape(): Promise<DiscoverListing[]> {
      if (!this.listingId) {
        const response = await request.get(`${BASENAME}/home`)
        this.check403(response);

        const html = response.text();
        this.$ = load(html);
        return this.scrapeAll();
      }
      if (this.listingId == "recently-updated") {
        const response = await request.get(`${AJAX_BASENAME}/home/widget/trending?page=${this.page}`)
        this.check403(response);

        const html = response.json()!["result"]
        this.$ = load(html);
        return [this.scrapeRecentlyUpdated()]
      }

      const bottomColumnUrl = bottomColumnsUrls.get(this.listingId);
      if (bottomColumnUrl != undefined) {
        const html = await request.get(`${BASENAME}/${bottomColumnUrl}?page=${this.page}`)
        this.$ = load(html.text());

        return [await this.scrapeSubpage()]
      }
      
      throw Error("How did you even get here? Unhandled listingId (" + this.listingId + ")");
    }

    private check403(response: MochiResponse) {
      if (response.status == 403) {
        throw new StatusError(403, "Blocked by Cloudflare.", response.text(), BASENAME);
      }
    }

    // Note sure if/how I add "Top anime",
    // as it has "Day/Week/Month" selectors
    private scrapeAll() {
      const allParts = [this.scrapeHotest(), this.scrapeRecentlyUpdated()]

      for (const columnId of bottomColumns) {
        allParts.push(this.scrapeBottomThreeColumns(columnId))
      }

      return allParts;
    }

    private scrapeHotest(): DiscoverListing {
        const $ = this.$;

        const swiper = $("#hotest .swiper-wrapper .swiper-slide.item");
        const hotestItems = swiper.map((i, anime) => {
            const animeRef = $(anime)
            const title = animeRef.find("h2.title.d-title").text()
            const image = animeRef.find("div.image > div").attr("style")?.replace("background-image: url('", "").replace("');", "")
            const url = animeRef.find(".info .actions > a").attr("href")!;
            return {
              id: url,
              title: title,
              posterImage: image,
              url: url,
              status: PlaylistStatus.unknown,
              type: PlaylistType.video
            } satisfies Playlist
          }).get()
          
          const hotestListing = {
            title: "Hotest",
            id: "hotest",
            type: DiscoverListingType.featured,
            orientation: DiscoverListingOrientationType.landscape,
            paging: {
              id: "hotest",
              title: "Hotest",
              items: hotestItems
              // Note: might do nextPage, since i think it's just the /trending? (kinda)
              // edit: to see, seeems like it's partially using ajax, check f12 when clicking on "all" "sub" "dub" etc on "Recently Updates"
            } satisfies Paging<Playlist>
          } satisfies DiscoverListing

          return hotestListing;
    }

    private scrapeRecentlyUpdated(): DiscoverListing {
        const $ = this.$;
        // const recentUpdatesSec = $("#recent-update .body .ani.items .item"); // more accurate for home, but doesnt work w subpages
        const recentUpdatesSec = $(".ani.items .item");
        // TODO: MOVE THIS TO SCRAPER/ANIMEITEMSCRAPER & USE THE SAME IN SEARCH() AS THEY'RE SIMILAR
        const recentlyUpdatedItems = recentUpdatesSec.map((i, anime) => {
          const animeRef = $(anime);
          const titleElem = animeRef.find("a.name.d-title");
          const title = titleElem.text();
          let url = titleElem.attr("href")!.split("/").splice(0, 3).join("/"); // remove the /ep-x at the end
          const image = animeRef.find("div.ani.poster > a > img").attr("src");      
          return {
            id: url,
            title: title,
            posterImage: image,
            url: url,
            status: PlaylistStatus.unknown,
            type: PlaylistType.video
          } satisfies Playlist
        }).get()
    
        const previousRecentlyUpdatedPage = (this.page == 1) ? undefined : this.page - 1;
        const nextRecentlyUpdatedPage = this.page + 1;

        const recentlyUpdatedListing = {
          title: "Recently Updated",
          id: "recently-updated",
          type: DiscoverListingType.default,
          orientation: DiscoverListingOrientationType.portrait,
          paging: {
            id: this.page.toString(),
            title: "Recently Updated",
            items: recentlyUpdatedItems,
            previousPage: previousRecentlyUpdatedPage?.toString(),
            nextPage: nextRecentlyUpdatedPage?.toString()
          } satisfies Paging<Playlist>
        } satisfies DiscoverListing

        return recentlyUpdatedListing;
    }

    private scrapeBottomThreeColumns(id: string): DiscoverListing {
      const table = this.$("div.top-tables.mb-3 .body .top-table").filter((i, table) => {
        return table.attribs["data-name"] == id;
      })[0];
      const $ = load(table);

      const title = $("div.head a.title").contents().first().text();
      
      const items = $("div.body div.scaff.items a.item").map((i, item) => {
        const itemRef = $(item);
        
        const url = itemRef.attr("href")!;
        const posterImage = itemRef.find("div.poster span img").attr("src")?.replace("@100.jpg", "@1000.jpg"); // higher quality        
        
        const title = itemRef.find("div.info div.name.d-title").text()
        
        bottomColumnsAlreadyDone[id].push(url); // add to cache so that we don't re add another one similar after

        return {
          id: url,
          title,
          posterImage,
          url,
          status: PlaylistStatus.unknown,
          type: PlaylistType.video
        } satisfies Playlist
      }).get()

      const listing = {
        title: title,
        id: id,
        type: DiscoverListingType.default,
        orientation: DiscoverListingOrientationType.portrait,
        paging: {
          title: title,
          items: items,
          id: "0",
          nextPage: "1"
        } satisfies Paging<Playlist>
      } satisfies DiscoverListing

      return listing;
    }

    // Made for scraping additional pages of the bottom three columns
    private async scrapeSubpage(): Promise<DiscoverListing> {
      const parsedSubpage = parseSubpage(this.$, this.page);

      const alreadyDone = bottomColumnsAlreadyDone[this.listingId!];      
      const filteredItems = parsedSubpage.items.filter((val) => !alreadyDone.includes(val.id))

      return {
        title: "",
        id: this.listingId!,
        type: DiscoverListingType.default,
        orientation: DiscoverListingOrientationType.portrait,
        paging: {
          title: "",
          id: this.page.toString(),
          items: filteredItems,
          nextPage: parsedSubpage.nextPage,
          previousPage: (this.page-1).toString() // If we're here, the page is always 1+, and we start at 0, so we can just use page-1
        } satisfies Paging<Playlist>
      } satisfies DiscoverListing
    }
}