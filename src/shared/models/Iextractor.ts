import { ISource, IVideo } from "./types";

export type AnyExtractor = typeof RawVideoExtractor | typeof VideoExtractor;

export abstract class RawVideoExtractor {
  public extractorType = "RawVideoExtractor";
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

export abstract class VideoExtractor extends RawVideoExtractor {
  public override extractorType = "VideoExtractor";
  protected htmlContent: string;
  constructor(referer: string, htmlContent: string) {
    super(referer);
    if (htmlContent == undefined || htmlContent == "")
      throw Error("Extractor requires html content, but none was provided !")
    this.htmlContent = htmlContent;
  }
}
