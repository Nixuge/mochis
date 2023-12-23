import { PlaylistItem } from "@mochiapp/js/dist";
import { PaheEpisode, PaheRelease } from "../models/types";
import { baseUrl } from "../utils/constants";

export async function fetchScrapeEpisodes(session: string, page: number): Promise<PaheRelease> {
    const jsonData: PaheRelease = await request.get(
        `${baseUrl}/api?m=release&id=${session}&sort=episode_asc&page=${page}`
      ).then(resp => resp.json());

      return jsonData;
}

export function paheToPlaylistItem(playlistItem: PaheEpisode): PlaylistItem {
    return {
        id: playlistItem.session,
        title: playlistItem.title == "" ? undefined : playlistItem.title,
        description: playlistItem.disc, //I think that's the thing?
        thumbnail: playlistItem.snapshot,
        number: playlistItem.episode,
        timestamp: playlistItem.created_at as unknown as Date, // Create date instead of release date?
        tags: []
    } satisfies PlaylistItem
}