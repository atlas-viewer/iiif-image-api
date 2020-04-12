// Image Service Loader.
// - Dereference first resource
// - Extract image server fingerprint
// - image server type
// - domain name
// - Deconstruct into template to guess values of second resource
// - optionally load second resource with same domain to verify template matches
// - Mark as safe - continue generating image service requests without making them
// - Detect image errors - mark as unsafe, load each one individually (lazy if possible).

import {
  ContentResource,
  IIIFExternalWebResource,
  ImageProfile,
  ImageSize,
  ImageTile,
  Service,
} from '@hyperion-framework/types';
import { getImageServerFromId } from './utility/get-image-server-from-id';
import { canonicalServiceUrl } from './utility/canonical-service-url';
import { fixedSizesFromScales } from './utility/fixed-sizes-from-scales';
import { sampledTilesToTiles } from './utility/sampled-tiles-to-tiles';
import { extractFixedSizeScales } from './utility/extract-fixed-size-scales';
import { sizesMatch } from './utility/sizes-match';
import { ImageCandidate, ImageCandidateRequest } from './types';
import { getImageServices } from './utility/get-image-services';
import { getImageCandidates } from './utility/get-image-candidates';
import { pickBestFromCandidates } from './utility/pick-from-best-candidates';

export type ImageServer = {
  root: string;
  server: string | null; // @todo future enhancement (e.g. iipsrv, dlcs)
  sampledId: string;
  verifications: number;
  verified: boolean;
  preLoaded: boolean;
  malformed: boolean;
  result: {
    context: string | string[];
    sampledSizes: ImageSize[];
    sizeRatios: number[];
    sampledTiles: ImageTile[];
    sampledProfile: ImageProfile | ImageProfile[];
  };
};

export type ImageServiceRequest = {
  id: string;
  width: number;
  height: number;
};

type LoadedImageService = Service & {
  real: boolean;
};

export type ImageServiceLoaderConfig = {
  verificationsRequired: number;
  approximateServices: boolean;
  enableFetching: boolean;
};

export class ImageServiceLoader {
  config: ImageServiceLoaderConfig = {
    verificationsRequired: 1,
    approximateServices: true,
    enableFetching: true,
  };

  imageServices: {
    [k: string]: LoadedImageService;
  } = {};

  knownImageServers: {
    [k: string]: ImageServer;
  } = {};

  /**
   * Preload image service
   *
   * This will preload an image service, fetching details and recording the image server that served
   * the request. Based on this it will make a template for predicting other image sources from this
   * server. You can optionally pass in other ids to verify that the prediction is accurate.
   *
   */
  // async preload(id: string, verify?: string[]): Promise<void> {}

  setConfig(config: Partial<ImageServiceLoaderConfig>) {
    Object.assign(this.config, config);
  }

  /**
   * Sample pre-fetched service
   *
   * If you have already fetched an image service, or are creating a viewer that only talks to a single
   * image server and want to avoid calls, you can sample a service up-front. This will allow you to make
   * completely synchronous calls to `loadServiceSync` and avoid any network calls for image services.
   *
   * @param service
   * @param preLoaded Mark this as being pre-loaded (default: true)
   */
  sample(service: Service, preLoaded: boolean = true) {
    const server = getImageServerFromId(service.id);
    const serviceUrl = canonicalServiceUrl(service.id);
    const existing = this.knownImageServers[server];

    this.imageServices[serviceUrl] = Object.assign(service, { real: true });
    if (existing) {
      return this.verify(service as ImageServiceRequest);
    }

    // Add new prediction.
    this.knownImageServers[server] = {
      verifications: 0,
      malformed: false,
      root: server,
      preLoaded,
      sampledId: service.id,
      verified: false,
      server: null,
      result: {
        context: service['@context'] || [],
        sampledProfile: service.profile,
        sampledSizes: service.sizes || [],
        sizeRatios: extractFixedSizeScales(
          service.width as number,
          service.height as number,
          service.sizes || []
        ),
        sampledTiles: service.tiles || [],
      },
    };

    return true;
  }

  /**
   * Preload an image server
   *
   * Similar to sample, but faster. This will bypass any checks and the logic contained in this implementation
   * allowing you to correct mistakes this implementation might have made.
   *
   * @param server
   * @param forceVerify
   */
  preLoad(server: ImageServer, forceVerify: boolean = true) {
    this.knownImageServers[server.root] = server;
    if (forceVerify) {
      this.knownImageServers[server.root].malformed = false;
      this.knownImageServers[
        server.root
      ].verifications = this.config.verificationsRequired;
    }
  }

  /**
   * Predict
   *
   * Predicts what the image service will be for a content resource.
   *
   * @param resource
   * @param verify
   * @param force
   */
  predict(
    resource: ImageServiceRequest,
    verify: boolean = false,
    force: boolean = false
  ): Service | null {
    const serverId = getImageServerFromId(resource.id);
    const imageServer = this.knownImageServers[serverId];

    // No known image server.
    if (
      !imageServer ||
      !imageServer.result ||
      (!force &&
        (imageServer.malformed ||
          imageServer.verifications < this.config.verificationsRequired))
    ) {
      return null;
    }

    const serviceUrl = canonicalServiceUrl(resource.id);

    if (!this.imageServices[serviceUrl]) {
      this.imageServices[serviceUrl] = {
        '@context': imageServer.result.context,
        id: resource.id,
        protocol: 'http://iiif.io/api/image',
        tiles: sampledTilesToTiles(
          resource.width,
          resource.height,
          imageServer.result.sampledTiles
        ),
        sizes: fixedSizesFromScales(
          resource.width,
          resource.height,
          imageServer.result.sizeRatios
        ),
        profile: imageServer.result.sampledProfile,
        height: resource.height,
        width: resource.width,
        real: false,
      };
    }

    return this.imageServices[serviceUrl];
  }

  async getThumbnailFromResource(
    unknownResource: ContentResource,
    request: ImageCandidateRequest,
    dereference: boolean = true
  ) {
    const candidates = await this.getImageCandidates(
      unknownResource,
      dereference
    );

    return pickBestFromCandidates(request, [() => candidates]);
  }

  async getImageCandidates(
    unknownResource: ContentResource,
    dereference: boolean = true
  ): Promise<ImageCandidate[]> {
    const resource = unknownResource as IIIFExternalWebResource;

    if (dereference && resource.height && resource.width) {
      const imageServices = getImageServices(resource);
      for (const service of imageServices) {
        const request: ImageServiceRequest = {
          id: service.id,
          width: resource.width,
          height: resource.height,
        };
        await this.loadService(request);
      }
    }

    return getImageCandidates(unknownResource, dereference, this);
  }

  /**
   * Verify approximation
   *
   * Given an image service, it will dereference that image service and compare the result with what
   * would have been generated if we used internal guessing.
   *
   * @param resource
   * @return Promise<boolean>
   */
  async verify(resource: ImageServiceRequest): Promise<boolean> {
    const prediction = this.predict(resource, false, true);
    const imageService = await this.fetchService(resource.id);

    if (!prediction) {
      return false;
    }

    const isValid =
      prediction.height === imageService.height &&
      prediction.width === imageService.width &&
      prediction['@context'] === imageService['@context'] &&
      sizesMatch(prediction.sizes || [], imageService.sizes || []);
    // @todo profiles match.

    if (isValid) {
      const serverId = getImageServerFromId(resource.id);
      this.knownImageServers[serverId].verifications += 1;
      if (
        this.knownImageServers[serverId].verifications >=
        this.config.verificationsRequired
      ) {
        this.knownImageServers[serverId].verified = true;
      }
    }

    return isValid;
  }

  canLoadSync(service: ImageServiceRequest | Service | string): boolean {
    const serviceId = typeof service === 'string' ? service : service.id;
    const canonical = canonicalServiceUrl(serviceId);
    if (this.imageServices[canonical]) {
      return true;
    }
    const server = this.knownImageServers[getImageServerFromId(serviceId)];
    return (
      server &&
      !server.malformed &&
      server.verifications >= this.config.verificationsRequired
    );
  }

  /**
   * Mark image service as malformed
   *
   * If you run into issues requesting images, you can mark an image service as malformed, and it will
   * return you a new one. Future image services will also be requested fresh, and the system will have
   * failed. Report a bug if this happens.
   *
   * @param resource
   */
  async markAsMalformed(resource: ImageServiceRequest): Promise<Service> {
    this.knownImageServers[getImageServerFromId(resource.id)].malformed = true;
    return this.loadService(resource, true);
  }

  /**
   * Fetch an image service (use loadService instead)
   *
   * @param serviceId
   * @param forceFresh
   */
  async fetchService(
    serviceId: string,
    forceFresh: boolean = false
  ): Promise<Service & { real: boolean }> {
    const serviceUrl = canonicalServiceUrl(serviceId);

    if (
      this.imageServices[serviceUrl] &&
      (!forceFresh || this.imageServices[serviceUrl].real)
    ) {
      return this.imageServices[serviceUrl];
    }

    if (!this.config.enableFetching) {
      throw new Error('Fetching is not enabled');
    }

    const json = (await fetch(serviceUrl).then(service =>
      service.json()
    )) as Service;

    if (!json.id && (json as any)['@id']) {
      json.id = (json as any)['@id'];
    }

    this.imageServices[serviceUrl] = Object.assign(json, { real: true });

    return this.imageServices[serviceUrl];
  }

  /**
   * Load an image service
   *
   * @param resource
   * @param forceFresh
   *
   * @todo make this batched, so only the maximum required can be done at once, to allow
   *       for the prediction engine to kick in.
   */
  async loadService(
    resource: ImageServiceRequest,
    forceFresh: boolean = false
  ): Promise<Service> {
    const imageServer = this.knownImageServers[
      getImageServerFromId(resource.id)
    ];
    if (imageServer && !imageServer.malformed && !forceFresh) {
      // We have a known image server, let wait for it.
      await imageServer.result;
      // We should have a result at this point.
      const service = this.loadServiceSync(resource);
      if (service) {
        return service;
      }
      // Unlikely path, but we will fall through to just load it again.
    }

    // Fetch a real copy of the image service.
    const serviceJson = await this.fetchService(resource.id, forceFresh);

    if (serviceJson.real) {
      this.sample(serviceJson);
    }

    return serviceJson;
  }

  /**
   * Load service synchronously
   *
   * If you know that the image service you are
   * @param resource
   */
  loadServiceSync(resource: ImageServiceRequest): Service | null {
    const serviceId = canonicalServiceUrl(resource.id);

    if (this.imageServices[serviceId]) {
      return this.imageServices[serviceId];
    }

    // Other-wise we do the magic.
    return this.predict(resource);
  }
}

export const imageServiceLoader = new ImageServiceLoader();