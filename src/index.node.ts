export * from './utility/canonical-service-url';
export * from './utility/combine-profiles';
export * from './utility/create-image-service-request';
export * from './utility/extract-fixed-size-scales';
export * from './utility/fixed-sizes-from-scales';
export * from './utility/get-custom-size-from-service';
export * from './utility/get-fixed-size-from-image';
export * from './utility/get-fixed-sizes-from-service';
export * from './utility/get-id';
export * from './utility/get-image-candidates';
export * from './utility/get-image-candidates-from-service';
export * from './utility/get-image-from-tile-source';
export * from '../../../iiif-commons/parser/src/image-3/parser/get-image-server-from-id';
export * from './utility/get-image-services';
export * from './utility/get-smallest-scale-factor-as-single-image';
export * from './utility/get-type';
export * from './utility/image-service-request-to-string';
export * from './utility/image-service-supports-format';
export * from './utility/image-service-supports-request';
export * from './utility/infer-size-from-url';
export * from './utility/is-best-match';
export * from './utility/is-image-service';
export * from './utility/level-to-profile';
export * from './utility/parse-image-service-request';
export * from './utility/parse-image-service-url';
export * from './utility/parse-region-parameter';
export * from './utility/parse-rotation-parameter';
export * from './utility/parse-size-parameter';
export * from './utility/pick-from-best-candidates';
export * from './utility/region-parameter-to-string';
export * from './utility/rotation-parameter-to-string';
export * from './utility/sampled-tiles-to-tiles';
export * from './utility/size-parameter-to-string';
export * from './utility/sizes-match';
export * from './utility/supports';
export * from './utility/supports-custom-sizes';
export * from './profiles';
export * from './types';

import { ImageServiceLoader as ImageServiceLoader_ } from './image-service-loader';
import fetch from 'node-fetch';

export class ImageServiceLoader extends ImageServiceLoader_ {
  async fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    return fetch(input as any, init as any) as any;
  }
}

export const imageServiceLoader = new ImageServiceLoader();
