import { VideoExtractor } from '../models/Iextractor';
import { IVideo } from '../models/types';

export class Mp4uploadE extends VideoExtractor {
  protected override serverName = 'mp4upload';
  protected override sources: IVideo[] = [];

  override extract = async (): Promise<IVideo[]> => {
    const html = this.htmlContent;
    const url = html.match(/rplayer\.src.|\n*?src: "(.*?)"/)?.[1]!;

    return [{
      url: url,
      quality: "auto",
      isDASH: true, // honestly not sure, it's just a mp4 lol
      headers: {"Referer": "https://mp4upload.com/"}
    } satisfies IVideo]
  };
}
