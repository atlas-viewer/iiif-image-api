import { ImageService } from '@iiif/presentation-3';

export function isLevel(level: 0 | 1 | 2, imageService?: ImageService) {
  if (imageService && imageService.profile) {
    const profile = imageService.profile;
    if (profile) {
      const profileArray = Array.isArray(profile) ? profile : [profile];

      return (
        profileArray.includes(`level${level}`) ||
        profileArray.includes(`http://iiif.io/api/image/2/level${level}.json`) ||
        profileArray.includes(`http://iiif.io/api/image/1/level${level}.json`) ||
        profileArray.includes(`http://iiif.io/api/image/1/profiles/level${level}.json`)
      );
    }
  }

  return false;
}
