import { FixedSizeImage, FixedSizeImageService } from '../types';
import { canonicalServiceUrl } from './canonical-service-url';
import { getId } from './get-id';
import { createImageServiceRequest } from './create-image-service-request';
import { imageServiceRequestToString } from './image-service-request-to-string';

export function getImageFromTileSource(
  image: FixedSizeImageService,
  targetWidth: number,
  targetHeight?: number
): FixedSizeImage {
  // @todo this needs to determine levels 0, 1 + 2.
  const req = createImageServiceRequest({
    id: canonicalServiceUrl(getId(image)),
    profile: image.level === null || typeof image.level === 'undefined' ? 'level0' : `level${image.level}}`,
    type: 'ImageService2',
  });

  if (req.type !== 'image') {
    throw new Error('Invalid service');
  }

  req.size.max = false;
  req.size.width = targetWidth;
  req.size.height = targetHeight;

  const url = imageServiceRequestToString(req);

  return {
    id: url,
    type: 'fixed',
    width: targetWidth,
    height: targetHeight || (image.height / (image.width || 1)) * targetWidth,
    unsafe: image.width > targetWidth,
  };
}
