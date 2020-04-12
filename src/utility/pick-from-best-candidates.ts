import {
  FixedSizeImage,
  ImageCandidate,
  ImageCandidateRequest,
  UnknownSizeImage,
  VariableSizeImage,
} from '../types';
import { isBestMatch } from './is-best-match';
import { getImageFromTileSource } from './get-image-from-tile-source';

/**
 * Pick best from candidates
 *
 * Takes in a list of candidate lists. The order should be in preference. This algorithm will try to pick
 * from the first list, with a best fit size. If not it will fallback to the other lists. It may come back
 * around to the first list and provide a fallback.
 *
 * @param inputRequest
 * @param candidates
 */
export function pickBestFromCandidates(
  inputRequest: ImageCandidateRequest,
  candidates: Array<() => ImageCandidate[]>
): { best: ImageCandidate | null; fallback: ImageCandidate[]; log: string[] } {
  const log: string[] = [];
  const request: Required<ImageCandidateRequest> = Object.assign(
    {
      unsafeImageService: true,
      atAnyCost: true,
      fallback: true,
      minHeight: 20,
      minWidth: 20,
      maxHeight: Infinity,
      maxWidth: Infinity,
      returnAllOptions: false,
      preferFixedSize: false,
      explain: false,
    },
    inputRequest
  );
  const explain = (text: () => string) =>
    request.explain ? log.push(text().trim()) : undefined;
  const lastResorts: UnknownSizeImage[] = [];
  const fallback: Array<FixedSizeImage | VariableSizeImage> = [];
  let currentChoice: ImageCandidate | null = null;

  explain(() => `Using configuration: ${JSON.stringify(request, null, 2)}`);

  const swapChoice = (
    candidate: FixedSizeImage,
    current: FixedSizeImage | null
  ) => {
    if (isBestMatch(request, current, candidate)) {
      // If we prefer a fixed size, we'll push it onto the fallback. But a fixed size will be looked for
      // from all of the candidates.
      if (request.preferFixedSize && candidate.unsafe) {
        explain(
          () =>
            `We found an image that was marked as unsafe, but it was the best size. (${candidate.id})`
        );
        fallback.push(candidate);
        return;
      }

      if (request.returnAllOptions && current) {
        fallback.push(current);
      }
      explain(
        () => `We found a new image that was the best size. (${candidate.id})`
      );
      // We have a new candidate.
      currentChoice = candidate;
    } else if (request.returnAllOptions) {
      fallback.push(candidate);
    }
  };

  explain(
    () =>
      `The input shows we have ${candidates.length} list(s) of candidates to choose from.`
  );
  const candidateGroups = candidates.length;
  for (let x = 0; x < candidateGroups; x++) {
    const group = candidates[x]();
    const candidatesLength = group.length;
    explain(
      () =>
        `Checking candidate list number ${x} and found ${candidatesLength} potential ways of creating image(s)`
    );
    for (let y = 0; y < candidatesLength; y++) {
      const candidate = group[y];
      if (candidate.type === 'unknown' && request.atAnyCost) {
        explain(
          () =>
            `We've found an unknown image type, adding this to the "last resort" list`
        );
        lastResorts.push(candidate);
      }
      if (candidate.type === 'fixed') {
        explain(
          () =>
            `We've found a fixed size image, checking if it matches the request`
        );
        swapChoice(candidate, currentChoice);
      }
      if (candidate.type === 'fixed-service') {
        if (request.unsafeImageService) {
          explain(
            () =>
              `Checking for an image from the tile source, without calculating the right height and width (unsafeImageService)`
          );
          const choice = getImageFromTileSource(
            candidate,
            request.width,
            request.height
          );
          swapChoice(choice, currentChoice);
        } else {
          explain(() => `Checking for an image from the tile source`);
          const ratio = request.width / request.height;
          const portrait = request.width > request.height;
          const bestTileHeight = portrait
            ? candidate.width
            : Math.round(candidate.width * ratio);
          const bestTileWidth = portrait
            ? Math.round(candidate.width * ratio)
            : candidate.width;
          const choice = getImageFromTileSource(
            candidate,
            bestTileWidth,
            bestTileHeight
          );
          swapChoice(choice, currentChoice);
        }
      }
    }
    if (currentChoice && !request.returnAllOptions) {
      explain(
        () =>
          `We found a match in choice list number ${x}, no searching any more`
      );
      break;
    }
  }

  if (request.atAnyCost && fallback.length === 0) {
    explain(() =>
      currentChoice
        ? `We found an image! ${currentChoice.id} of type ${currentChoice.type}`
        : `We found no images, but "atAnyCost" is set, so returning that`
    );
    return {
      best: currentChoice || lastResorts[0],
      fallback: lastResorts.slice(1),
      log,
    };
  }

  if (request.returnAllOptions) {
    explain(() => `Returning all options that we have found`);
    return {
      best: request.atAnyCost
        ? currentChoice || fallback[0] || lastResorts[0]
        : currentChoice || fallback[0],
      fallback: [...fallback, ...lastResorts],
      log,
    };
  }

  explain(() => `Returning the best image that we found, and a fallback`);
  return {
    best: currentChoice || fallback[0] || null,
    fallback: currentChoice ? fallback : fallback.slice(1),
    log,
  };
}