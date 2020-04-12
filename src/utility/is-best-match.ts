import { FixedSizeImage, ImageCandidateRequest } from '../types';

export function isBestMatch(
  request: Required<ImageCandidateRequest>,
  current: FixedSizeImage | null,
  candidate: FixedSizeImage
) {
  return (
    candidate.height <= request.maxHeight &&
    candidate.width <= request.maxWidth &&
    candidate.height >= request.minHeight &&
    candidate.width >= request.minWidth &&
    (!current ||
      Math.abs(candidate.width - request.width) <
        Math.abs(current.width - request.width))
  );
}
