import { ImageService } from '@iiif/presentation-3';
import { isLevel } from './is-level';

export function isLevel0(imageService?: ImageService) {
  return isLevel(0, imageService);
}
