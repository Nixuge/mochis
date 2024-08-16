import { PlaylistEpisodeServerSkipTime, PlaylistEpisodeServerSkipType } from "@mochiapp/js/dist";

export function parseSkipData(data: string): PlaylistEpisodeServerSkipTime[] {
    return []; // Temp - broken for now
    if (data) {
        const parsedData = JSON.parse(data);        
        return [
            {
                startTime: parsedData["intro"][0],
                endTime: parsedData["intro"][1],
                type: PlaylistEpisodeServerSkipType.opening
            },
            {
                startTime: parsedData["outro"][0],
                endTime: parsedData["outro"][1],
                type: PlaylistEpisodeServerSkipType.ending
            },
        ]
    }
    return [];
}
