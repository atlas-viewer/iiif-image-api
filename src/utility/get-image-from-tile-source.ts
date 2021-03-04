import { FixedSizeImage, FixedSizeImageService } from '../types';
import { canonicalServiceUrl } from './canonical-service-url';
import { getId } from './get-id';

export function getImageFromTileSource(
  image: FixedSizeImageService,
  targetWidth: number,
  targetHeight?: number
): FixedSizeImage {
  const id = canonicalServiceUrl(getId(image)).slice(0, -10);
  const url = [
    id,
    'full',
    [targetWidth, targetHeight || ''].join(','), // @todo profile check for supports
    0,
    'default.jpg', // @todo format against available.
  ].join('/');

  return {
    id: url,
    type: 'fixed',
    width: targetWidth,
    height: targetHeight || (image.height / image.width) * targetWidth,
    unsafe: image.width > targetWidth,
  };
}
