import { PlaylistEpisodeServerSubtitleFormat } from '@mochiapp/js/dist';
import { VideoExtractor } from '../../shared/models/Iextractor';
import { ISource, IVideo } from '../../shared/models/types';
import { getM3u8Qualities } from '../../shared/utils/m3u8';
import { IRawTrackMedia, parseSubtitles } from '../../shared/utils/subtitles';

interface IMediaInfo {
  status: number,
  result: {
    sources: Object[],
    tracks: IRawTrackMedia[]
  }
}

// Note: this is named mycloud but works for both mycloud & vidplay
export class MyCloudE extends VideoExtractor {
  protected override serverName = 'mycloud';

  override extract = async (): Promise<ISource> => {
    const url = this.referer;
    const domain = url.split("/")[2];
    
    const embedUrl = this.htmlContent.match(/<script type="text\/javascript" src="(assets\/mcloud\/min\/embed\.js\?v=[a-zA-Z0-9]*?)"><\/script>/)?.[1]
    const embedJs = (await request.get(`https://${domain}/${embedUrl}`, {headers: {"Referer": "https://aniwave.to/"}})).text();
    
    const mediaInfoUrl = await request.post("https://mochi_back.nixuge.me/thanksForTheServerRessources", {
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({"url": url, "embed.js": embedJs})}
    ).then(req => req.text())

    const mediaInfo: IMediaInfo = await request.get(mediaInfoUrl, {headers: {"Referer": "https://aniwave.to/"}}).then(req => req.json())

    const sourcesJson = mediaInfo.result.sources;
    const videos = await getM3u8Qualities(sourcesJson[0]["file"])
    
    const subtitles = parseSubtitles(mediaInfo.result.tracks)

    return {
      videos: videos,
      subtitles: subtitles
    } satisfies ISource
  };
}
