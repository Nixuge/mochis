import { VideoExtractor } from '../models/Iextractor';
import { IVideo } from '../models/types';
import { getM3u8Qualities } from '../utils/m3u8';

export class SendVidE extends VideoExtractor {
  protected override serverName = 'sendvid';

  override extract = async (): Promise<IVideo[]> => {
    const url = this.htmlContent.match(/var video_source = "(.*?)";/)![1];
    return await getM3u8Qualities(url);
  }
}
