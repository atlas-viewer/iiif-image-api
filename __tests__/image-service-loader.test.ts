import { describe, expect, test } from 'vitest';
import { ImageServiceLoader } from '../src/image-service-loader';
import { Service } from '../src/types';
import { ImageService } from '@iiif/presentation-3';

describe('image service loader', () => {
  describe('nlw images', () => {
    const image1: ImageService = {
      '@context': 'http://iiif.io/api/image/2/context.json',
      id: 'https://damsssl.llgc.org.uk/iiif/2.0/image/4694557',
      protocol: 'http://iiif.io/api/image',
      width: 4961,
      height: 6716,
      tiles: [
        {
          width: 256,
          height: 256,
          scaleFactors: [1, 2, 4, 8, 16, 32],
        },
      ],
      profile: [
        'http://iiif.io/api/image/2/level1.json',
        {
          formats: ['jpg'],
          qualities: ['native', 'color', 'gray'],
          supports: [
            'regionByPct',
            'sizeByForcedWh',
            'sizeByWh',
            'sizeAboveFull',
            'rotationBy90s',
            'mirroring',
            'gray',
          ],
        },
      ],
    };

    const image2: ImageService = {
      '@context': 'http://iiif.io/api/image/2/context.json',
      id: 'https://damsssl.llgc.org.uk/iiif/2.0/image/4694558',
      protocol: 'http://iiif.io/api/image',
      width: 4968,
      height: 6719,
      tiles: [
        {
          width: 256,
          height: 256,
          scaleFactors: [1, 2, 4, 8, 16, 32],
        },
      ],
      profile: [
        'http://iiif.io/api/image/2/level1.json',
        {
          formats: ['jpg'],
          qualities: ['native', 'color', 'gray'],
          supports: [
            'regionByPct',
            'sizeByForcedWh',
            'sizeByWh',
            'sizeAboveFull',
            'rotationBy90s',
            'mirroring',
            'gray',
          ],
        },
      ],
    };

    const image3: ImageService = {
      '@context': 'http://iiif.io/api/image/2/context.json',
      id: 'https://damsssl.llgc.org.uk/iiif/2.0/image/4694562',
      protocol: 'http://iiif.io/api/image',
      width: 6687,
      height: 4967,
      tiles: [
        {
          width: 256,
          height: 256,
          scaleFactors: [1, 2, 4, 8, 16, 32],
        },
      ],
      profile: [
        'http://iiif.io/api/image/2/level1.json',
        {
          formats: ['jpg'],
          qualities: ['native', 'color', 'gray'],
          supports: [
            'regionByPct',
            'sizeByForcedWh',
            'sizeByWh',
            'sizeAboveFull',
            'rotationBy90s',
            'mirroring',
            'gray',
          ],
        },
      ],
    };

    test('it can analyse an image service', () => {
      const loader = new ImageServiceLoader({ approximateServices: true });
      loader.setConfig({ enableFetching: false });

      loader.sample(image1);

      expect(Object.keys(loader.knownImageServers)).toEqual(['damsssl.llgc.org.uk']);

      expect(loader.knownImageServers['damsssl.llgc.org.uk']!.verified).toEqual(false);
      expect(loader.knownImageServers['damsssl.llgc.org.uk']!.sampledId).toEqual(
        'https://damsssl.llgc.org.uk/iiif/2.0/image/4694557'
      );
    });

    test('it can verify and predict NLW image services', async () => {
      const loader = new ImageServiceLoader({ approximateServices: true });
      loader.setConfig({ enableFetching: false });

      await loader.sample(image1);
      await loader.sample(image2);

      const image3Prediction = loader.predict({
        id: image3.id,
        width: image3.width as number,
        height: image3.height as number,
      }) as Service;

      expect(image3Prediction.tiles).toEqual(image3.tiles);
      expect(image3Prediction.profile).toEqual(image3.profile);

      expect(
        loader.loadServiceSync({
          id: 'https://damsssl.llgc.org.uk/iiif/2.0/image/4694565',
          height: 4927,
          width: 6740,
        })
      ).not.toEqual(null);

      expect(Object.keys(loader.knownImageServers)).toEqual(['damsssl.llgc.org.uk']);
      expect(loader.knownImageServers['damsssl.llgc.org.uk']!.verified).toEqual(true);
    });

    test('it wont predict if there is not enough verifications', async () => {
      const loader = new ImageServiceLoader({ approximateServices: true });
      loader.setConfig({ enableFetching: false });

      await loader.sample(image1);

      const image3Prediction = loader.predict({
        id: image3.id,
        width: image3.width as number,
        height: image3.height as number,
      }) as Service;

      expect(image3Prediction).toEqual(null);
    });

    test('after loading an image, it will not be predicted again', async () => {
      const loader = new ImageServiceLoader({ approximateServices: true });
      loader.setConfig({ enableFetching: false });

      await loader.sample(image1);
      await loader.sample(image2);

      expect(
        loader.loadServiceSync({
          id: image1.id,
          height: image1.height as number,
          width: image1.width as number,
        })
      ).not.toEqual(null);

      expect(loader.knownImageServers['damsssl.llgc.org.uk']!.verifications).toEqual(1);
    });
  });

  describe('bodleian', () => {
    const image1: ImageService = {
      '@context': 'http://iiif.io/api/image/2/context.json',
      id: 'https://iiif.bodleian.ox.ac.uk/iiif/image/2a723665-8154-45ce-a0a9-bf82063d8000',
      protocol: 'http://iiif.io/api/image',
      width: 6756,
      height: 8560,
      sizes: [
        {
          width: 105,
          height: 133,
        },
        {
          width: 211,
          height: 267,
        },
        {
          width: 422,
          height: 535,
        },
      ],
      tiles: [
        {
          width: 256,
          height: 256,
          scaleFactors: [1, 2, 4, 8, 16, 32, 64],
        },
      ],
      profile: [
        'http://iiif.io/api/image/2/level1.json',
        {
          formats: ['jpg'],
          qualities: ['native', 'color', 'gray', 'bitonal'],
          supports: [
            'regionByPct',
            'regionSquare',
            'sizeByForcedWh',
            'sizeByWh',
            'sizeAboveFull',
            'rotationBy90s',
            'mirroring',
          ],
          maxWidth: 1000,
          maxHeight: 1000,
        },
      ],
    };
    const image2: ImageService = {
      '@context': 'http://iiif.io/api/image/2/context.json',
      id: 'https://iiif.bodleian.ox.ac.uk/iiif/image/923751d3-b4d4-49e5-a44a-a1fc667ef0e2',
      protocol: 'http://iiif.io/api/image',
      width: 6756,
      height: 8560,
      sizes: [
        {
          width: 105,
          height: 133,
        },
        {
          width: 211,
          height: 267,
        },
        {
          width: 422,
          height: 535,
        },
      ],
      tiles: [
        {
          width: 256,
          height: 256,
          scaleFactors: [1, 2, 4, 8, 16, 32, 64],
        },
      ],
      profile: [
        'http://iiif.io/api/image/2/level1.json',
        {
          formats: ['jpg'],
          qualities: ['native', 'color', 'gray', 'bitonal'],
          supports: [
            'regionByPct',
            'regionSquare',
            'sizeByForcedWh',
            'sizeByWh',
            'sizeAboveFull',
            'rotationBy90s',
            'mirroring',
          ],
          maxWidth: 1000,
          maxHeight: 1000,
        },
      ],
    };
    const image3: ImageService = {
      '@context': 'http://iiif.io/api/image/2/context.json',
      id: 'https://iiif.bodleian.ox.ac.uk/iiif/image/d70fc265-3b81-4243-8297-d9b34a7062ca',
      protocol: 'http://iiif.io/api/image',
      width: 6756,
      height: 8560,
      sizes: [
        {
          width: 105,
          height: 133,
        },
        {
          width: 211,
          height: 267,
        },
        {
          width: 422,
          height: 535,
        },
      ],
      tiles: [
        {
          width: 256,
          height: 256,
          scaleFactors: [1, 2, 4, 8, 16, 32, 64],
        },
      ],
      profile: [
        'http://iiif.io/api/image/2/level1.json',
        {
          formats: ['jpg'],
          qualities: ['native', 'color', 'gray', 'bitonal'],
          supports: [
            'regionByPct',
            'regionSquare',
            'sizeByForcedWh',
            'sizeByWh',
            'sizeAboveFull',
            'rotationBy90s',
            'mirroring',
          ],
          maxWidth: 1000,
          maxHeight: 1000,
        },
      ],
    };

    test('it can predict image sizes', async () => {
      const loader = new ImageServiceLoader({ approximateServices: true });
      loader.setConfig({ enableFetching: false });

      await loader.sample(image1);
      await loader.sample(image2);
      await loader.sample(image3);

      const image3Prediction = loader.predict({
        id: image3.id,
        width: image3.width as number,
        height: image3.height as number,
      }) as Service;

      expect(image3Prediction.tiles).toEqual(image3.tiles);
      expect(image3Prediction.profile).toEqual(image3.profile);
      expect(image3Prediction.sizes).toEqual(image3.sizes);

      expect(Object.keys(loader.knownImageServers)).toEqual(['iiif.bodleian.ox.ac.uk']);
      expect(loader.knownImageServers['iiif.bodleian.ox.ac.uk']!.verified).toEqual(true);
    });
  });

  // describe('sbb', () => {
  //   const sbbInfo = {
  //     '@context': 'http://iiif.io/api/image/2/context.json',
  //     '@id': 'https://iiif-content.crossasia.org/xasia/dllm+dllm_0005978+233695',
  //     '@type': 'iiif:Image',
  //     protocol: 'http://iiif.io/api/image',
  //     width: 1741,
  //     height: 2381,
  //     sizes: [
  //       { width: 150, height: 100 },
  //       {
  //         width: 600,
  //         height: 400,
  //       },
  //       { width: 2400, height: 4000 },
  //       { width: 1722, height: 2304 },
  //     ],
  //     tiles: [
  //       { width: 256, scaleFactors: [1] },
  //       {
  //         width: 512,
  //         scaleFactors: [2, 4],
  //       },
  //       { width: 1024, scaleFactors: [8, 16] },
  //     ],
  //     logo: {
  //       '@id': 'https://iiif-content.crossasia.org/xasia/logo',
  //       service: {
  //         '@context': 'http://iiif.io/api/image/2/context.json',
  //         '@id': 'https://iiif-content.crossasia.org/xasia/logo',
  //         profile: 'http://iiif.io/api/image/2/level2.json',
  //       },
  //     },
  //     profile: [
  //       'http://iiif.io/api/image/2/level2.json',
  //       {
  //         formats: ['jpg', 'png', 'webp', 'tif'],
  //         qualities: ['color', 'gray'],
  //         supports: ['canonicalLinkHeader', 'rotationArbitrary', 'profileLinkHeader'],
  //       },
  //     ],
  //   };
  // });

  describe('getty quire example (level0)', () => {
    const infoA = {
      '@context': 'http://iiif.io/api/image/2/context.json',
      '@id': 'http:/localhost:8080/mother/tiles',
      profile: [
        'http://iiif.io/api/image/2/level0.json',
        {
          formats: ['jpg'],
          qualities: ['default'],
        },
      ],
      protocol: 'http://iiif.io/api/image',
      tiles: [
        {
          scaleFactors: [1, 2, 4, 8],
          width: 256,
        },
      ],
      width: 2345,
      height: 3000,
    };

    const infoB = {
      '@context': 'http://iiif.io/api/image/2/context.json',
      '@id': 'http:/localhost:8080/evans-legionnaire/tiles',
      profile: [
        'http://iiif.io/api/image/2/level0.json',
        {
          formats: ['jpg'],
          qualities: ['default'],
        },
      ],
      protocol: 'http://iiif.io/api/image',
      tiles: [
        {
          scaleFactors: [1, 2],
          width: 256,
        },
      ],
      width: 1024,
      height: 680,
    };

    const infoC = {
      '@context': 'http://iiif.io/api/image/2/context.json',
      '@id': 'http:/localhost:8080/evans/tiles',
      profile: [
        'http://iiif.io/api/image/2/level0.json',
        {
          formats: ['jpg'],
          qualities: ['default'],
        },
      ],
      protocol: 'http://iiif.io/api/image',
      tiles: [
        {
          scaleFactors: [1, 2],
          width: 256,
        },
      ],
      width: 600,
      height: 413,
    };

    test('A -> B -> C', async () => {
      const loader = new ImageServiceLoader({ approximateServices: true });
      loader.setConfig({ enableFetching: false });

      await loader.sample(infoA as any);
      await loader.sample(infoB as any);
      // await loader.sample();

      const prediction = loader.predict({
        id: infoC['@id'],
        width: infoC.width as number,
        height: infoC.height as number,
      }) as Service;

      expect(prediction).toEqual(null);
    });
    test('C -> B -> A', async () => {
      const loader = new ImageServiceLoader({ approximateServices: true });
      loader.setConfig({ enableFetching: false });

      await loader.sample(infoC as any);
      await loader.sample(infoB as any);
      // await loader.sample();

      const prediction = loader.predict({
        id: infoA['@id'],
        width: infoA.width as number,
        height: infoA.height as number,
      }) as Service;

      expect(prediction).toEqual(null);
    });
    test('A -> C -> B', async () => {
      const loader = new ImageServiceLoader({ approximateServices: true });
      loader.setConfig({ enableFetching: false });

      await loader.sample(infoA as any);
      await loader.sample(infoC as any);
      // await loader.sample();

      const prediction = loader.predict({
        id: infoB['@id'],
        width: infoB.width as number,
        height: infoB.height as number,
      }) as Service;

      expect(prediction).toEqual(null);
    });
  });
});
