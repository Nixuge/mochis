import { VideoExtractor } from '../../shared/models/Iextractor';
import { IVideo } from '../../shared/models/types';
import { dynamicEval } from '../../shared/utils/eval';

export class StreamtapeE extends VideoExtractor {
  protected override serverName = 'streamtape';

  override extract = async (): Promise<IVideo[]> => {
    const html = this.htmlContent!;
    const baseDomain = this.referer.split("/").slice(0, 3).join("/");
        
    let videoUrl = dynamicEval(html.match(/document\.getElementById\('ideoooolink'\)\.innerHTML = (.*?)document/s)![1]);
    videoUrl = `${baseDomain}/get_video?id=${videoUrl.split("?id=")[1]}`;

    return [{
      url: videoUrl,
      isDASH: true
    }]
  };
}
