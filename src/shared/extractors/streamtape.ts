import { VideoExtractor } from '../../shared/models/Iextractor';
import { ISource } from '../../shared/models/types';
import { dynamicEval } from '../../shared/utils/eval';

export class StreamtapeE extends VideoExtractor {
  protected override serverName = 'streamtape';

  override extract = async (): Promise<ISource> => {
    const html = this.htmlContent;
    
    // Should always be right with "botlink" as this is what the player itself gets the url from.
    let videoUrl = dynamicEval(html.match(/document\.getElementById\('botlink'\)\.innerHTML = (.*?;)/s)![1]);

    if (videoUrl.startsWith("//"))
      videoUrl = "https:" + videoUrl;
    
    return {
      videos: [{
        url: videoUrl,
        isDASH: true
      }]
    }
  };
}
