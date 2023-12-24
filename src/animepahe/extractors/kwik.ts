import { VideoExtractor } from '../../shared/models/Iextractor';
import { IVideo } from '../../shared/models/types';
import { dynamicEval } from '../../shared/utils/eval';
import { baseUrl } from '../utils/constants';

export class KwikE extends VideoExtractor {
  protected override serverName = 'kwik';
  protected override sources: IVideo[] = [];

  override extract = async (): Promise<IVideo[]> => {
    const data = await request.get(this.referer, {headers: {"Referer": baseUrl}}).then(resp => resp.text())
    
    const source = dynamicEval(/(eval)(\(f.*?)(\n<\/script>)/s.exec(data)![2].replace('eval', '')).match(
      /https.*?m3u8/
    )[0];
    
    return [{url: source}];
  }
}
