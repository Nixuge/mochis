import { VideoExtractor } from '../../shared/models/Iextractor';
import { ISource } from '../../shared/models/types';

export class DoodE extends VideoExtractor {
  protected override serverName = 'dood';

  override extract = async (): Promise<ISource> => {
    const html = this.htmlContent;        
    const baseDomain = this.referer.split("/").slice(0, 3).join("/");
    
    const md5Url = baseDomain + html.match(/\$\.get\('(\/pass_md5\/.*?)', function\(data\)/)![1];
    const token = html.match(/\+ "(\?token=.*?)&expiry/s)![1];
    
    let videoUrl = await request.get(
      md5Url, { headers: {"Referer": baseDomain} } // Referer not always used for some reason?
    ).then(resp => resp.text());

    videoUrl += token;

    return {
      headers: {"Referer": baseDomain},
      videos: [{
        url: videoUrl,
        isDASH: true
      }]
    }
  };
}
