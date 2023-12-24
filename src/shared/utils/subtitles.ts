import { PlaylistEpisodeServerSubtitle, PlaylistEpisodeServerSubtitleFormat } from "@mochiapp/js/dist";

export interface IRawTrackMedia {
    file: string,
    label: string,
    kind: string,
    default?: boolean
}
function isSubtitle(object: any): object is IRawTrackMedia {
    return "kind" in object && object["kind"] == "captions";
}

export function parseSubtitles(tracks: IRawTrackMedia[], format: PlaylistEpisodeServerSubtitleFormat = PlaylistEpisodeServerSubtitleFormat.vtt) {
    const subtitles: PlaylistEpisodeServerSubtitle[] = []
    for (const track of tracks) {
      if (!isSubtitle(track))
        continue;
      subtitles.push({
        url: track.file,
        name: track.label,
        format: format,
        default: track.default ?? false,
        autoselect: track.default ?? false
      } satisfies PlaylistEpisodeServerSubtitle)
    }
    return subtitles
}