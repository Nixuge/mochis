import { VideoExtractor } from '../../shared/models/Iextractor';
import { ISource } from '../../shared/models/types';

export class VidozaE extends VideoExtractor {
  protected override serverName = 'vidoza';

  override extract = async (): Promise<ISource> => {
    const html = this.htmlContent;

    // Can grab either from the html or from the script.
    // Doing from the html bc why not
    const url = html.match(/<source src=\"(.*?)\".*?>/s)![1]

    // Don't think this source has subtitles.

    return {
      videos: [{
        url: url,
        isDASH: true
      }]
    }
  };
}
