import { isImageService } from './is-image-service';
import { IIIFExternalWebResource, Service } from '@hyperion-framework/types';

/**
 * Given a resource, will return only the image services on that resource.
 *
 * @param resource
 */
export function getImageServices(resource: IIIFExternalWebResource): Service[] {
  const services = resource.service || [];
  const totalServices = services.length;
  const imageServices = [];
  for (let i = 0; i < totalServices; i++) {
    if (isImageService(services[i]) && resource.width && resource.height) {
      imageServices.push(services[i]);
    }
  }
  return imageServices;
}
