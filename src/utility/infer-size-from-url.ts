import { ImageCandidate } from '../types';

/**
 * Extracts the height and width from an image URL
 *
 * @param image
 */
export function inferSizeFromUrl(image: string): ImageCandidate {
  const regex = /^.*\/(full)\/(((\d+),(\d+)?)|max)\/(\d+)\/default\.(jpg|png|jpeg)$/;
  const match = image.match(regex);

  if (match) {
    const region = match[1];
    const width = parseInt(match[4], 10);
    const height = parseInt(match[5], 10);
    // const rotation = parseInt(match[6], 10);
    const format = match[7];

    if ((region === 'max' || region === 'full') && width && height && format) {
      return {
        type: 'fixed',
        id: image,
        height,
        width,
        unsafe: true,
      };
    }
  }

  return { type: 'unknown', id: image };
}
