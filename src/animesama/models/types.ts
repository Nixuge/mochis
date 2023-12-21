import { SearchFilterOption } from "@mochiapp/js/dist";

export type Anime = {
    title: string;
    altTitle?: string;
    posterImage?: string;
    url: string;
    filters: {[id: string]: string[]}
}