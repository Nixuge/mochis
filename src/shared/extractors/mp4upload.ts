import { VideoExtractor } from '../models/Iextractor';
import { ISource, IVideo } from '../models/types';

export class Mp4uploadE extends VideoExtractor {
  protected override serverName = 'mp4upload';

  override extract = async (): Promise<ISource> => {
    const html = this.htmlContent!;
    const url = html.match(/rplayer\.src.|\n*?src: "(.*?)"/)?.[1]!;

    return {
      videos: [{
        url: url,
        quality: "auto",
        isDASH: true
      } satisfies IVideo],
      headers: {"Referer": "https://mp4upload.com/"}
    } satisfies ISource
  };
}
