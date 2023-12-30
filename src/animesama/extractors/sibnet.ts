import { VideoExtractor } from '../../shared/models/Iextractor';
import { ISource, IVideo } from '../../shared/models/types';

export class SibnetE extends VideoExtractor {
  protected override serverName = 'sibnet';

  override extract = async (): Promise<ISource> => {
    // url is a .mp4 w normal user-agent, but an m3u8 w ios' user agent
    let url = this.htmlContent.match(/player\.src\(\[{src: "(\/v\/.*?)",/)![1];
    url = "https://video.sibnet.ru" + url;

    return {
      headers: { "Referer": "https://video.sibnet.ru/" },
      videos: [{
        url: url,
        isDASH: false
      }]
    }    
  };
}
