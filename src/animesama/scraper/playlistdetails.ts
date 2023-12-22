import { CheerioAPI, load } from "cheerio";
import { Anime } from "../models/types";
import { PlaylistDetails } from "@mochiapp/js/dist";


export class PlaylistDetailsScraper {
    private url: string;
    private html!: string;
    private $!: CheerioAPI;
    constructor(private anime: Anime) {
        // Made it so that if there's a cache in mochi's requests,
        // it's the same as playlistepisodes' request.
        this.url = this.anime.url.substring(-1) == '/' ? this.anime.url : this.anime.url + "/";
    }

    async scrape(): Promise<PlaylistDetails> {
        this.html = await request.get(this.url).then(resp => resp.text());
        this.$ = load(this.html);
        
        const synopsis = this.getInfoPart("Synopsis").text();
        const genres = this.getInfoPart("Genres").text().trim().split(", ");
        const altTitles = this.$("h2#titreAlter").text().split(", ");
        const preview = this.html.match(/function panneauAnime\(nom, url.*?src="(https:\/\/cdn\.statically\.io\/gh\/Anime-Sama\/IMG\/img\/.*?)">/s)![1];

        return {
            synopsis,
            altTitles,
            altPosters: [preview],
            altBanners: [],
            genres,
            // NOTE: there IS a preview on animesama, but idk if Mochi can even handle it well (eg it's often ytb)
            // or often it's just the same img as altPosters, so not really useful tbh
            previews: [] 
            
        } satisfies PlaylistDetails;
    }
    
    private getInfoPart(title: string) {
        const $ = this.$;
        const ref = $("h2.text-white.text-xl.font-bold.uppercase.border-b-2.mb-3.mt-5.border-slate-700").map((i, elem) => {
            const elemRef = $(elem);
            if (elemRef.text() == title)
              return $(elemRef.next())
          }).get()[0]
        return ref;
    }

}