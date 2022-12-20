import { Service } from '@iiif/presentation-3';
import { isImageService } from './is-image-service';
import { isLevel } from './is-level';

export function getLevelFromService(service: Service): null | number {
  if (!isImageService(service)) {
    return null;
  }
  if (isLevel(0, service)) {
    return 0;
  }
  if (isLevel(1, service)) {
    return 1;
  }
  if (isLevel(2, service)) {
    return 2;
  }
  return null;
}
