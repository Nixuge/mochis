import { VideoExtractor } from '../models/Iextractor';
import { IVideo } from '../models/types';

export class SendVidE extends VideoExtractor {
  protected override serverName = 'sendvid';
  protected override sources: IVideo[] = [];

  override extract = async (): Promise<IVideo[]> => {
    throw Error("Not yet implemented")
  }
}
