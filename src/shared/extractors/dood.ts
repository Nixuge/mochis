import { VideoExtractor } from '../../shared/models/Iextractor';
import { IVideo } from '../../shared/models/types';

export class DoodE extends VideoExtractor {
  protected override serverName = 'dood';

  override extract = async (): Promise<IVideo[]> => {
    const html = this.htmlContent;
    const baseDomain = this.referer.split("/").slice(0, 3).join("/");

    const videoUrl = baseDomain + html!.match(/\$\.get\('(\/pass_md5\/.*?'), function\(data\)/)![1];
    
    return [{
      url: videoUrl,
      isDASH: true
    }]
  };
}
