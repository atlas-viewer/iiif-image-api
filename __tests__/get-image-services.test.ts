import { describe, expect, test } from 'vitest';

import { getImageServices } from '../src';

describe('getImageServices', () => {
  test('It can work when a resource has no height/width', () => {
    expect(
      getImageServices({
        id: 'https://api.bl.uk/image/iiif/ark:/81055/vdc_100113995491.0x000001/full/max/0/default.jpg',
        type: 'Image',
        format: 'image/jpg',
        service: [
          {
            protocol: 'http://iiif.io/api/image',
            width: 2294,
            height: 3004,
            tiles: [
              {
                scaleFactors: [1, 2, 4, 8],
                width: 256,
              },
            ],
            id: 'https://api.bl.uk/image/iiif/ark:/81055/vdc_100113995491.0x000001',
            type: 'ImageService2',
            profile: 'level2',
          },
        ],
      })
    ).toHaveLength(1);
  });
});
