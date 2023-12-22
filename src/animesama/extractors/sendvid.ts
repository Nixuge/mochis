import { VideoExtractor } from '../../shared/models/Iextractor';
import { IVideo } from '../../shared/models/types';
import { getM3u8Qualities } from '../../shared/utils/m3u8';

export class SendVidE extends VideoExtractor {
  protected override serverName = 'sendvid';
  protected override sources: IVideo[] = [];

  override extract = async (): Promise<IVideo[]> => {
    const url = this.htmlContent.match(/var video_source = "(.*?)";/)![1];
    return await getM3u8Qualities(url);
  }
}
