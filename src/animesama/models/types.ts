import { MochiResponse, PlaylistEpisodeServerSubtitle, PlaylistGroup } from "@mochiapp/js/dist";

export type Anime = {
    title: string;
    altTitle?: string;
    posterImage?: string;
    url: string;
    filters: {[id: string]: string[]}
}

export type RequestingPlaylistGroup = {
    playlistGroup: PlaylistGroup;
    promises: Map<string, Promise<MochiResponse>>;
}