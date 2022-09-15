import { ImageService } from '@iiif/presentation-3';

export function isLevel0(imageService?: ImageService) {
  if (imageService && imageService.profile) {
    const profile = imageService.profile;
    if (profile) {
      const profileArray = Array.isArray(profile) ? profile : [profile];

      return (
        profileArray.includes('level0') ||
        profileArray.includes('http://iiif.io/api/image/2/level0.json') ||
        profileArray.includes('http://iiif.io/api/image/1/level0.json') ||
        profileArray.includes('http://iiif.io/api/image/1/profiles/level0.json')
      );
    }
  }

  return false;
}
