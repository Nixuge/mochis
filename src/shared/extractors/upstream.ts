import { VideoExtractor } from '../../shared/models/Iextractor';
import { IVideo } from '../../shared/models/types';
import { getM3u8Qualities } from '../../shared/utils/m3u8';

function packed(p,a,c,k){while(c--)if(k[c])p=p.replace(new RegExp('\\b'+c.toString(a)+'\\b','g'),k[c]);return p}


export class UpstreamE extends VideoExtractor {
  protected override serverName = 'upstream';

//   Note: SAME AS FILEMOON, SEE IF MERGE POSSIBLE !
  private dirtyArrayExtract(rawData: string): any[] {
    let parts = rawData.split(");',");
    const part1 = parts[0] + ")});'";
    const newParts = parts[1].split(",");
    const part2 = newParts[0];
    const part3 = newParts[1];
    const part4 = newParts[2].replace("'|||", "|||").replace("'.split('|'))", "").split("|")

    return [part1, part2, part3, part4];
  }

  override extract = async (): Promise<IVideo[]> => {
    const html = this.htmlContent;
    const match = html.match(/return p}\('(.*?\))\)\)/)?.[1]!;
    
    const rawData = this.dirtyArrayExtract(match);    
    
    const playerData = packed(rawData[0], rawData[1], rawData[2], rawData[3]);
    
    let m3u8Url = playerData.match(/{sources:\[{file:"(.*?)"}/)[1];
    if (m3u8Url[0] == "/") {
        const baseDomain = playerData.match(/,image:"(.*?\/.*?\/.*?)\//)[1];
        m3u8Url = baseDomain + m3u8Url;
    }

    const videos = await getM3u8Qualities(m3u8Url);
    return videos;
  }
}
