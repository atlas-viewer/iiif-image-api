import { Service } from '@hyperion-framework/types';
import { imageServiceProfiles } from '../profiles';

export function isImageService(service: Service): boolean {
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
