import { ISource, IVideo } from "./types";


export abstract class VideoExtractor {
  public requiresHtml: boolean = true;
  protected referer: string;
  protected htmlContent?: string;
  constructor(referer: string, htmlContent?: string) {
    this.referer = referer;
    if (this.requiresHtml && (htmlContent == undefined || htmlContent == ""))
      throw Error("Extractor requires html content, but none was provided !")
    this.htmlContent = htmlContent;
  }
  /**
   * The server name of the video provider
   */
  protected abstract serverName: string;

  /**
   * takes video link
   *
   * returns video sources (video links) available
   */
  protected abstract extract(videoUrl: string, ...args: any): Promise<IVideo[] | ISource>;

  /**
   * takes same argument as extract
   *
   * returns ISource object with extract()'s result as video.
   * Made so that extract() can return anything we want, and not have to make compromises.
   * 
   * NOT TO BE USED IF extract() ALREADY RETURNS AN ISource
   */
  public async getSource(...args: any): Promise<ISource> {
    return {
      videos: await this.extract(args) as IVideo[]
    }
  }
}
