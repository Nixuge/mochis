import { RawVideoExtractor } from '../models/Iextractor';
import { ISource } from '../models/types';
import { arrayBufferToString } from '../utils/arraybuffer';
import { isTesting } from '../utils/isTesting';



export class SibnetE extends RawVideoExtractor {
  protected override serverName = 'sibnet';

  override extract = async (): Promise<ISource> => {
    const html = await request.get(this.referer).then(resp => {
      return isTesting() ? resp.text() : arrayBufferToString(resp.data())
    });
    // url is a .mp4 w normal user-agent, but an m3u8 w ios' user agent
    let url = html.match(/player\.src\(\[{src: "(\/v\/.*?)",/)![1];
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
