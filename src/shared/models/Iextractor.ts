import { ISource, IVideo } from "./types";

function isVideoArray(obj: IVideo[] | ISource): obj is IVideo[] {
  return Array.isArray(obj);
}

export abstract class RawVideoExtractor {
  protected referer: string;
  constructor(referer: string) {
    this.referer = referer;
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
  public abstract extract(...args: any): Promise<IVideo[] | ISource>;

  /**
   * takes same argument as extract
   *
   * returns ISource object with extract()'s result as video.
   * Made so that extract() can return anything we want, and not have to make compromises.
   * 
   * NOT TO BE USED IF extract() ALREADY RETURNS AN ISource
   */
  public async getSource(...args: any): Promise<ISource> {
    const res = await this.extract(args);
    if (!isVideoArray(res)) {
      throw Error("Called getSource on an object that's already a source !")
    }
    return {
      videos: res
    }
  }
}

export abstract class VideoExtractor extends RawVideoExtractor {
  protected htmlContent: string;
  constructor(referer: string, htmlContent: string) {
    super(referer);
    if (htmlContent == undefined || htmlContent == "")
      throw Error("Extractor requires html content, but none was provided !")
    this.htmlContent = htmlContent;
  }
}