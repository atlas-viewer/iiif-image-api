import { imageServiceProfiles } from '../profiles';
import { ImageService } from '@hyperion-framework/types';

export function isImageService(service: any): service is ImageService {
  if (!service || !service.profile) {
    return false;
  }

  if (!service.id && !service['@id']) {
    return false;
  }

  const profiles = Array.isArray(service.profile)
    ? service.profile
    : [service.profile];

  for (const profile of profiles) {
    if (
      typeof profile === 'string' &&
      imageServiceProfiles.indexOf(profile) !== -1
    ) {
      return true;
    }
  }

  return false;
}
