import { Service } from '@hyperion-framework/types';
import { FixedSizeImageService } from '../types';
import { isImageService } from './is-image-service';

/**
 * Get fixed sizes from service.
 *
 * Given an image service, this will extract the images from the sizes field of
 * the service. These are usually cached and great options for thumbnails.
 *
 * @param service
 */
export function getFixedSizesFromService(
  service: Service
): FixedSizeImageService[] {
  if (!isImageService(service)) {
    return [];
  }
  return (service && service.sizes ? service.sizes : []).map((size: any) => {
    return {
      id: getId(service),
      type: 'fixed-service',
      height: size.height,
      width: size.width,
    };
  });
}
