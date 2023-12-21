import { load } from "cheerio";
import { Anime } from "./models/types";

// Absolutely AMAZED at how this website is made:
// 3 endpoints:
// https://anime-sama.fr/catalogue/listing.php, gets the "catalogue" page data, query does nothing
// https://anime-sama.fr/catalogue/listing_all.php, gets EVERYTHING from the website (REALLY EVERYTHING)
// https://anime-sama.fr/catalogue/searchbar.php, parameter: query=, search for smth, 1 page only

const REPLACEMENTS = {
    "Super pouvoirs": "Super-pouvoirs",
    "Super Pouvoirs": "Super-pouvoirs",
    "Triangle amoureux": "Triangle-amoureux",
    "Aliens / Extra-terrestres": "Aliens/Extra-terrestres",
    "Autre monde": "Autre-monde",
    "Arts martiaux": "Arts-martiaux",
    "Voyage temporel": "Voyage-temporel",
    "Magical girl": "Magical-girl",
    "Survival game": "Survival-game",
    "Organisations secrètes": "Organisations-secrètes",
    "Science fiction": "Science-fiction",
    "Pouvoirs psychiques": "Pouvoirs-psychiques",
    "Chasseur de prime": "Chasseur-de-prime",
    "Catastrophe naturelle": "Catastrophe-naturelle",
    "Monster Girl": "Monster-Girl",
    "Dieux / Déesses": "Dieux/Déesses",
    "Univers alternatif": "Univers-alternatif",
    "Slice of Life": "Slice-of-Life",
    "Filles et pistolets": "Filles-et-pistolets",
    "Jeux vidéo": "Jeux-vidéo",
    "Monde virtuel": "Monde-virtuel",
    "Harem inversé": "Harem-inversé",
    "Contes et légendes": "Contes-et-légendes",
    "Sports mécaniques": "Sports-mécaniques",
    "Gender Bender": "Gender-bender",
    "Comédie sentimentale": "Comédie-sentimentale",
    "Vie sociale": "Vie-sociale",
    "Histoires courtes": "Histoires-courtes",
    "Vie Scolaire": "Vie-scolaire",
    "Réincarnation / transmigration": "Réincarnation",
    "School Life": "School-life",
};

export let everyFilter: Set<String> = new Set();
export let everyAnime: Anime[] = [];

export async function loadEveryAnime() {
    const url = "https://anime-sama.fr/catalogue/listing_all.php";
    const result = await request.post(url).then(resp => resp.text());
    const $ = load(result)
    $(".cardListAnime").map((i, anime) => {
        const animeRef = $(anime);

        let typesRaw = animeRef.attr("class")?.replace("cardListAnime ", "").
            replaceAll(" - ", ", ").replaceAll("\n", "")!;
        for (const replacement of Object.entries(REPLACEMENTS)) {
            typesRaw = typesRaw.replace(replacement[0], replacement[1])
        }
        const meta = typesRaw.match(/(.*?[A-zÀ-ú0-9])? (.*?[A-zÀ-ú0-9])? (.*?[A-zÀ-ú0-9])?(?: |$)/)!;

        const type = meta[2] ? meta[2].split(", ") : []
        if (!(type.includes("Anime") || type.includes("Autres") || type.includes("Animes")))
            return;

        const filters = (meta[1]) ? meta[1].split(", ") : []
        filters.forEach(filter => {
            everyFilter.add(filter)
        });
        const videoTypes = meta[3] ? meta[3].split(", ") : [] //vostfr, vf, ...

        const title = animeRef.find("div.cardListAnime div a div h1").text().toLowerCase()
        const altTitle = animeRef.find("div.cardListAnime div a div p").text().toLowerCase()
        const img = animeRef.find("a img").attr("src")!
        const url = animeRef.find("div.cardListAnime div a").attr("href")!
        const playlist = {
            title: title,
            altTitle: altTitle,
            posterImage: encodeURI(img),
            url: encodeURI(url),
            filters: filters,
            videoTypes: videoTypes
        } satisfies Anime
        everyAnime?.push(playlist)
    })
  }