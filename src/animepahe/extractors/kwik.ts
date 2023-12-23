import { VideoExtractor } from '../../shared/models/Iextractor';
import { IVideo } from '../../shared/models/types';
import { baseUrl } from '../utils/constants';

export class KwikE extends VideoExtractor {
  protected override serverName = 'kwik';
  protected override sources: IVideo[] = [];

  override extract = async (): Promise<IVideo[]> => {
    const data = await request.get(this.referer, {headers: {"Referer": baseUrl}}).then(resp => resp.text())
    
    // Avoid getting a warning from the compiler for using eval
    const dynamicEval = Function('return this')()['eval'];

    const source = dynamicEval(/(eval)(\(f.*?)(\n<\/script>)/s.exec(data)![2].replace('eval', '')).match(
      /https.*?m3u8/
    )[0];
    
    return [{url: source}];
  }
}
