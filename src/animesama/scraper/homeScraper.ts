import { DiscoverListingOrientationType, DiscoverListingType, PlaylistStatus, PlaylistType } from "@mochiapp/js/dist"
import { DiscoverListing, Playlist } from "@mochiapp/js/src/interfaces/source/types"
import { load } from "cheerio"
import { findAnimeIDFromPoster } from "../searcher";

const listingType: { [title: string]: DiscoverListingType } = {
    "Découvrez des pépites": DiscoverListingType.featured,
    "Les classiques": DiscoverListingType.rank,
    "Derniers contenus sortis": DiscoverListingType.default,
    "Derniers épisodes ajoutés": DiscoverListingType.default
}

export function scrapeHome(html: string): DiscoverListing[] {
    const $ = load(html);
    const listings: DiscoverListing[] = $("h2.flex.text-white.text-xl.font-bold.uppercase.mt-6.mb-4.border-b-4.border-slate-500").map((i, titleElem) => {
        const titleRef = $(titleElem);

        let title = titleRef.text().trim();
        title = title[0].toUpperCase() + title.slice(1);

        if (title.includes("Sorties du")) // Unsure if I should add this back or not?
            return undefined;
        if (title.includes("Reprenez votre visionnage"))
            return undefined;
        if (title.toLowerCase().includes("scans"))
            return undefined;

        let divNode = titleRef.parent().next()
        while (divNode[0].type != "tag") {
            divNode = divNode.next() // Skip comments
        }

        // "Derniers ajouts"
        let animes: Playlist[] = divNode.find("div.shrink-0.w-32.outline.outline-sky-800").map((i, anime) => {
            const animeRef = $(anime);
            const animeTitle = animeRef.find("h1.text-gray-200").text();
            const posterImage = animeRef.find("img").attr("src")!;
            const url = animeRef.find("a").attr("href")!;

            const animeId = findAnimeIDFromPoster(posterImage);
            if (animeId == -1)
                return undefined
            
            return {
                id: animeId.toString(),
                title: animeTitle,
                posterImage,
                url,
                status: PlaylistStatus.unknown,
                type: PlaylistType.video
            }

        }).get()

        // Other columns
        if (animes.length == 0) {
            const regex = /carte(?:Pepite|Classique)\("(.*?)", "(.*?)", "(.*?)"/g;
            const matches = divNode.text().matchAll(regex);
            for (const match of matches) {
                const title = match[1]
                const url = "/catalogue/" + match[2];
                const image = `https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/${match[3]}.jpg`;

                const animeId = findAnimeIDFromPoster(image);
                if (animeId == -1)
                    continue;

                animes.push({
                    id: animeId.toString(),
                    title: title,
                    posterImage: image,
                    url: encodeURI(url),
                    status: PlaylistStatus.unknown,
                    type: PlaylistType.video
                })
            }
        }
        
        return {
            id: title,
            title: title,
            type: listingType[title] ?? DiscoverListingType.default,
            orientation: DiscoverListingOrientationType.landscape,
            paging: {
                id: title,
                title: title,
                items: animes,
            }
        };
    }).get();
    
    // - Decouvrez des pépites
    // - Les classiques
    // - Derniers ajouts

    return listings.reverse();
}
