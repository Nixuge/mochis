import { VideoExtractor } from '../../shared/models/Iextractor';
import { ISource, IVideo } from '../../shared/models/types';

export class Mp4uploadE extends VideoExtractor {
  protected override serverName = 'mp4upload';
  protected override sources: IVideo[] = [];

  override extract = async (): Promise<ISource> => {
    const html = this.htmlContent;
    const url = html.match(/rplayer\.src.|\n*?src: "(.*?)"/)?.[1]!;

    return {
      sources: [{
        url: url,
        quality: "auto",
        isDASH: true
      } satisfies IVideo],
      headers: {"Referer": "https://mp4upload.com/"}
    } satisfies ISource
  };
}
