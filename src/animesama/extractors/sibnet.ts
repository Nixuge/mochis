import { VideoExtractor } from '../models/Iextractor';
import { IVideo } from '../models/types';

export class SibnetE extends VideoExtractor {
  protected override serverName = 'mp4upload';
  protected override sources: IVideo[] = [];

  override extract = async (): Promise<IVideo[]> => {
    throw Error("Not yet implemented")
  }
}
