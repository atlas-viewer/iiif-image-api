import {
  ContentResource,
  IIIFExternalWebResource,
} from '@hyperion-framework/types';
import { ImageCandidate } from '../types';
import { inferSizeFromUrl } from './infer-size-from-url';
import { getType } from './get-type';
import { getId } from './get-id';

/**
 * Get fixed size from image
 *
 * Given a content resource, usually the body of a painting annotation, this will
 * return the URL to the image, and the height and width. The resource may also
 * be a string / direct link to the image. The height and width may be inferred from
 * a IIIF Image API endpoint, otherwise the return image candidate will have a type
 * of unknown.
 *
 * @param contentResource
 */
export function getFixedSizeFromImage(
  contentResource: ContentResource | string
): ImageCandidate | null {
  if (typeof contentResource === 'string') {
    // Might not even be an image.
    return inferSizeFromUrl(contentResource);
  }

  // @ts-ignore
  const type = getType(contentResource);
  if (type !== 'Image' && type !== 'sc:Image') {
    return null;
  }

  const image = contentResource as IIIFExternalWebResource;
  const id = getId(image);

  if (!id) {
    return null;
  }

  if (id && image.width && image.height) {
    return {
      id: id,
      type: 'fixed',
      width: image.width,
      height: image.height,
      unsafe: true,
    };
  }

  return inferSizeFromUrl(id);
}
