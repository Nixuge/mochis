import { VideoExtractor } from '../../shared/models/Iextractor';
import { IVideo } from '../../shared/models/types';

export class VkE extends VideoExtractor {
  protected override serverName = 'vk';
  protected override sources: IVideo[] = [];

  override extract = async (): Promise<IVideo[]> => {
    throw Error("Not yet implemented")
  }
}
