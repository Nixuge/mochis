import { load } from 'cheerio';
import { VideoExtractor } from '../../shared/models/Iextractor';
import { ISource } from '../../shared/models/types';
import { getM3u8Qualities } from '../../shared/utils/m3u8';
import { PlaylistEpisodeServerSubtitle, PlaylistEpisodeServerSubtitleFormat } from '@mochiapp/js/dist';
import { b64decode } from '../utils/b64';

export class VoeE extends VideoExtractor {
  protected override serverName = 'voe';

  override extract = async (): Promise<ISource> => {
    if (this.htmlContent.startsWith("<script>") && this.htmlContent.includes("window.location.href = currentUrl.toString()")) {
      console.log("Voe - redirect found.");
      this.referer = this.htmlContent.match(/window\.location\.href = '(.*?)';/)![1];
      this.htmlContent = await request.get(this.referer).then(resp => resp.text());
    }

    const html = this.htmlContent;
    const baseDomain = this.referer.split("/").slice(0, 3).join("/")
    
    const videoUrl = b64decode(html.match(/var sources = {.*?'hls': '(.*?)',/s)![1]);

    const $ = load(html);
    const subtitles: PlaylistEpisodeServerSubtitle[] = $('video#voe-player track[kind="captions"]').map((i, sub) => {
      const subRef = $(sub);
      return {
        url: baseDomain + subRef.attr("src")!,
        name: subRef.attr("label")!,
        format: PlaylistEpisodeServerSubtitleFormat.vtt,
        default: false,
        autoselect: false
      }
    }).get();
        
    const videos = await getM3u8Qualities(videoUrl);
    return {
      subtitles,
      videos,
    }
  };
}
