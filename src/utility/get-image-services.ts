import { isImageService } from './is-image-service';
import { IIIFExternalWebResource } from '@hyperion-framework/types';
import { Service } from '../types';

/**
 * Given a resource, will return only the image services on that resource.
 *
 * @param resource
 */
export function getImageServices(resource: IIIFExternalWebResource): Service[] {
  const services = resource.service
    ? Array.isArray(resource.service)
      ? resource.service
      : [resource.service]
    : [];
  const totalServices = services.length;
  const imageServices = [];
  for (let i = 0; i < totalServices; i++) {
    if (isImageService((services as Service[])[i])) {
      imageServices.push(services[i]);
    }
  }
  return imageServices as any;
}
