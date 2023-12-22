import { PlaylistEpisodeServerSubtitle, PlaylistEpisodeServerSubtitleFormat } from '@mochiapp/js/dist';
import { VideoExtractor } from '../../shared/models/Iextractor';
import { ISource, IVideo } from '../../shared/models/types';
import { getM3u8Qualities } from '../utils/m3u8';

interface IMediaInfo {
  status: number,
  result: {
    sources: Object[],
    tracks: Object[] | IRawSubtitleMeta[]
  }
}
interface IRawSubtitleMeta {
  file: string,
  label: string,
  kind: string,
  default?: boolean
}
function isSubtitle(object: any): object is IRawSubtitleMeta {
  return "kind" in object && object["kind"] == "captions";
}

// Note: this is named mycloud but works for both mycloud & vidplay
export class MyCloudE extends VideoExtractor {
  protected override serverName = 'mycloud';
  protected override sources: IVideo[] = [];

  override extract = async (): Promise<ISource> => {
    const url = this.referer;
    const domain = url.split("/")[2];
    
    const embedUrl = this.htmlContent.match(/<script type="text\/javascript" src="(assets\/mcloud\/min\/embed\.js\?v=[a-zA-Z0-9]*?)"><\/script>/)?.[1]
    const embedJs = (await request.get(`https://${domain}/${embedUrl}`, {headers: {"Referer": "https://aniwave.to/"}})).text();
    
    const mediaInfoUrl = await request.post("https://mochi.nixuge.me/thanksForTheServerRessources", {
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({"url": url, "embed.js": embedJs})}
    ).then(req => req.text())

    const mediaInfo: IMediaInfo = await request.get(mediaInfoUrl, {headers: {"Referer": "https://aniwave.to/"}}).then(req => req.json())

    const sourcesJson = mediaInfo.result.sources;
    const sources = await getM3u8Qualities(sourcesJson[0]["file"])
    
    const subtitles: PlaylistEpisodeServerSubtitle[] = []
    for (const track of mediaInfo.result.tracks) {
      if (!isSubtitle(track))
        continue;
      subtitles.push({
        url: track.file,
        name: track.label,
        format: PlaylistEpisodeServerSubtitleFormat.vtt,
        default: track.default ?? false,
        autoselect: track.default ?? false
      } satisfies PlaylistEpisodeServerSubtitle)
    }

    return {
      sources: sources,
      subtitles: subtitles
    } satisfies ISource
  };
}
