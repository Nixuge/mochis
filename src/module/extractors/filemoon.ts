import { VideoExtractor } from '../models/Iextractor';
import { ISource, IVideo } from '../models/types';

// filemoon's extract function
function packed(p,a,c,k){while(c--)if(k[c])p=p.replace(new RegExp('\\b'+c.toString(a)+'\\b','g'),k[c]);return p}

export class FilemoonE extends VideoExtractor {
  protected override serverName = 'filemoon';
  protected override sources: IVideo[] = [];

  private dirtyArrayExtract(rawData: string): any[] {
    // lmao
    let parts = rawData.split(")});',");
    const part1 = parts[0] + ")});'";
    const newParts = parts[1].split(",");
    const part2 = newParts[0];
    const part3 = newParts[1];
    const part4 = newParts[2].replace("'|||", "|||").replace("'.split('|'))", "").split("|")

    // TODO: TEST THIS
    // NO REGEX LESS GOOOOO

    return [part1, part2, part3, part4];
  }

  override extract = async (): Promise<ISource> => {
    const html = this.htmlContent;
    const match = html.match(/return p}\('(.*?\))\)\)/)?.[1]!;

    const rawData = this.dirtyArrayExtract(match);    
    const playerData = packed(rawData[0], rawData[1], rawData[2], rawData[3]);

    const m3u8Url = playerData.match(/{sources:\[{file:"(.*?)"}/)[1];

    return {
      sources: [{
        url: m3u8Url,
        quality: "auto", // Note: not sure how we're supposed to handle quality selectors (the quality is inside the m3u8), for now just keeping it auto.
        isM3U8: true,
      } satisfies IVideo],
      headers: {"User-Agent": "Chrome trust not a phone I promise"} // "Android" and "iPhone" are flagging lol
    } satisfies ISource
  };
}
