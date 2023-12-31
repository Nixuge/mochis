import { VideoExtractor } from '../models/Iextractor';
import { IVideo } from '../models/types';
import { dynamicEval } from '../utils/eval';
import { baseUrl } from '../../animepahe/utils/constants';

export class KwikE extends VideoExtractor {
  protected override serverName = 'kwik';

  override extract = async (): Promise<IVideo[]> => {
    const data = await request.get(this.referer, {headers: {"Referer": baseUrl}}).then(resp => resp.text())
    
    const source = dynamicEval(/(eval)(\(f.*?)(\n<\/script>)/s.exec(data)![2].replace('eval', '')).match(
      /https.*?m3u8/
    )[0];
    
    return [{url: source}];
  }
}
