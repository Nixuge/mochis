import { VideoExtractor } from '../models/Iextractor';
import { IVideo } from '../models/types';

export class VkE extends VideoExtractor {
  protected override serverName = 'vk';
  protected override sources: IVideo[] = [];

  override extract = async (): Promise<IVideo[]> => {
    throw Error("Not yet implemented")
  }
}
