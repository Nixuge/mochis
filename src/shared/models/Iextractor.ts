import { ISource, IVideo } from "./types";


export abstract class VideoExtractor {
  protected referer: string;
  protected htmlContent: string;
  constructor(referer: string, htmlContent: string) {
    this.referer = referer;
    this.htmlContent = htmlContent;
  }
  /**
   * The server name of the video provider
   */
  protected abstract serverName: string;

  /**
   * list of videos available
   */
  protected abstract sources: IVideo[];

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
