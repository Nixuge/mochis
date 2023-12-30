import { VideoExtractor } from '../../shared/models/Iextractor';
import { IVideo } from '../../shared/models/types';
import { getM3u8Qualities } from '../../shared/utils/m3u8';

export class VkE extends VideoExtractor {
  protected override serverName = 'vk';

  override extract = async (): Promise<IVideo[]> => {
    let url = this.htmlContent.match(/,("hls":".*?\.m3u8\?.*?")/)![1];
    url = JSON.parse(`{${url}}`)["hls"]; //lmao

    return getM3u8Qualities(url);
  }
}
