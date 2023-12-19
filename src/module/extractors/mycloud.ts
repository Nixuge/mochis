import { PlaylistEpisodeServerSubtitle, PlaylistEpisodeServerSubtitleFormat } from '@mochiapp/js/dist';
import { VideoExtractor } from '../models/Iextractor';
import { ISource, IVideo } from '../models/types';

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
    // Note: not sure if i should req this url to get the indiviual qualities, or just keep the auto
    const sources = mediaInfo.result.sources;
    console.log(sources);
    
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
      sources: [{
        url: sources[0]["file"],
        quality: "auto",
        isDASH: true, // honestly not sure, it's just a mp4 lol
      } satisfies IVideo],
      subtitles: subtitles
    } satisfies ISource
  };
}
