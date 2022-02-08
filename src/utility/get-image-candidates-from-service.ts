import { Service } from '../types';
import { ImageCandidate } from '../types';
import { getFixedSizesFromService } from './get-fixed-sizes-from-service';
import { getCustomSizeFromService } from './get-custom-size-from-service';

export function getImageCandidatesFromService(service: Service[]): ImageCandidate[] {
  const candidates: ImageCandidate[] = [];

  const totalServices = service.length;
  for (let s = 0; s < totalServices; s++) {
    // - x.2 embedded service - fixed sizes
    const fixedSizes = getFixedSizesFromService(service[s]);
    if (fixedSizes.length) {
      candidates.push(...fixedSizes);
    }
    // - x.3 embedded service - profile 1 / 2 (custom size)
    const customSizes = getCustomSizeFromService(service[s]);
    if (customSizes.length) {
      candidates.push(...customSizes);
    }
  }

  return candidates;
}
