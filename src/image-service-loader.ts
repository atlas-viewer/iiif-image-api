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
  ImageService,
} from '@iiif/presentation-3';
import { Service } from './types';
import { canonicalServiceUrl } from './utility/canonical-service-url';
import { fixedSizesFromScales } from './utility/fixed-sizes-from-scales';
import { sampledTilesToTiles } from './utility/sampled-tiles-to-tiles';
import { extractFixedSizeScales } from './utility/extract-fixed-size-scales';
import { sizesMatch } from './utility/sizes-match';
import { ImageCandidate, ImageCandidateRequest } from './types';
import { getImageServices } from './utility/get-image-services';
import { getImageCandidates } from './utility/get-image-candidates';
import { pickBestFromCandidates } from './utility/pick-from-best-candidates';
import { getId } from './utility/get-id';
import { getImageServerFromId } from './utility/get-image-server-from-id';
import { level0 } from './profiles';
import { isLevel0 } from './utility/is-level-0';

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
    resourceServiceRatio: number;
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
  source?: ImageService;
};

type LoadedImageService = Service & {
  real: boolean;
};

export type ImageServiceLoaderConfig = {
  verificationsRequired: number;
  approximateServices: boolean;
  enableFetching: boolean;
  disableThrottling: boolean;
};

export class ImageServiceLoader {
  config: ImageServiceLoaderConfig = {
    verificationsRequired: 1,
    approximateServices: true,
    enableFetching: true,
    disableThrottling: false,
  };

  fetchingCount = 0;

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
  sample(service: Service, imageServiceRequest?: ImageServiceRequest, preLoaded = true) {
    const server = getImageServerFromId(getId(service));
    const serviceUrl = canonicalServiceUrl(getId(service));
    const existing = this.knownImageServers[server];

    this.imageServices[serviceUrl] = Object.assign(service, { real: true });

    if (!existing && service.tiles && !isLevel0(service)) {
      // Add new prediction.
      this.knownImageServers[server] = {
        verifications: 0,
        malformed: false,
        root: server,
        preLoaded,
        sampledId: getId(service),
        verified: false,
        server: null,
        result: {
          context: service['@context'] || [],
          sampledProfile: service.profile,
          resourceServiceRatio: imageServiceRequest && service.height ? imageServiceRequest.height / service.height : 1,
          sampledSizes: service.sizes || [],
          sizeRatios: extractFixedSizeScales(service.width as number, service.height as number, service.sizes || []),
          sampledTiles: service.tiles || [],
        },
      };
      return true;
    }

    return this.verify(service as ImageServiceRequest);
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
  preLoad(server: ImageServer, forceVerify = true) {
    this.knownImageServers[server.root] = server;
    if (forceVerify) {
      this.knownImageServers[server.root].malformed = false;
      this.knownImageServers[server.root].verifications = this.config.verificationsRequired;
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
  predict(resource: ImageServiceRequest, verify = false, force = false): Service | null {
    const source = resource?.source;
    const serverId = getImageServerFromId(getId(resource));
    const imageServer = this.knownImageServers[serverId];

    // No known image server.
    if (
      !imageServer ||
      !imageServer.result ||
      !(source?.height || resource.height) ||
      !(source?.width || resource.width) ||
      (!force && (imageServer.malformed || imageServer.verifications < this.config.verificationsRequired)) ||
      isLevel0(resource.source)
    ) {
      return null;
    }

    const serviceUrl = canonicalServiceUrl(getId(resource));

    if (!this.imageServices[serviceUrl]) {
      this.imageServices[serviceUrl] = {
        '@context': imageServer.result.context,
        '@id': getId(resource),
        id: getId(resource),
        protocol: 'http://iiif.io/api/image',
        tiles: source?.tiles || sampledTilesToTiles(resource.width, resource.height, imageServer.result.sampledTiles),
        sizes:
          source?.sizes ||
          fixedSizesFromScales(
            Math.round(resource.width / imageServer.result.resourceServiceRatio),
            Math.round(resource.height / imageServer.result.resourceServiceRatio),
            imageServer.result.sizeRatios
          ),
        profile: source?.profile || imageServer.result.sampledProfile,
        height: source?.height || resource.height,
        width: source?.width || resource.width,
        real: false,
      } as any;
    }

    return this.imageServices[serviceUrl];
  }

  async getThumbnailFromResource(
    unknownResource: ContentResource | undefined,
    request: ImageCandidateRequest,
    dereference = true,
    otherCandidates: ImageCandidate[] = []
  ) {
    const candidates = unknownResource ? await this.getImageCandidates(unknownResource, dereference) : [];

    return pickBestFromCandidates(request, [() => otherCandidates, () => candidates]);
  }

  async getImageCandidates(unknownResource: ContentResource, dereference = true): Promise<ImageCandidate[]> {
    const resource = unknownResource as IIIFExternalWebResource;

    if (dereference && resource.height && resource.width) {
      const imageServices = getImageServices(resource);
      for (const service of imageServices) {
        const request: ImageServiceRequest = {
          id: getId(service),
          width: service.width ? service.width : resource.width,
          height: service.height ? service.height : resource.height,
          source: service,
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
    const imageService = await this.fetchService(getId(resource));

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
      const serverId = getImageServerFromId(getId(resource));
      this.knownImageServers[serverId].verifications += 1;
      if (this.knownImageServers[serverId].verifications >= this.config.verificationsRequired) {
        this.knownImageServers[serverId].verified = true;
      }
    }

    return isValid;
  }

  canLoadSync(service: ImageServiceRequest | Service | string): boolean {
    const serviceId = typeof service === 'string' ? service : getId(service);
    const canonical = canonicalServiceUrl(serviceId);
    if (this.imageServices[canonical]) {
      return true;
    }
    const server = this.knownImageServers[getImageServerFromId(serviceId)];
    return server && !server.malformed && server.verifications >= this.config.verificationsRequired;
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
    this.knownImageServers[getImageServerFromId(getId(resource))].malformed = true;
    return this.loadService(resource, true);
  }

  /**
   * Fetch an image service (use loadService instead)
   *
   * @param serviceId
   * @param forceFresh
   */
  async fetchService(serviceId: string, forceFresh = false): Promise<Service & { real: boolean }> {
    const serviceUrl = canonicalServiceUrl(serviceId);

    if (this.imageServices[serviceUrl] && (!forceFresh || this.imageServices[serviceUrl].real)) {
      return this.imageServices[serviceUrl];
    }

    if (!this.config.enableFetching) {
      throw new Error('Fetching is not enabled');
    }

    const json = (await this.fetch(serviceUrl).then((service) => service.json())) as Service;

    if (!json.id && (json as any)['@id']) {
      json.id = (json as any)['@id'];
    }

    if (json.id !== serviceId) {
      json.id = serviceId;
      if (json['@id']) {
        json['@id'] = serviceId;
      }
    }

    this.imageServices[serviceUrl] = Object.assign(json, { real: true });

    return this.imageServices[serviceUrl];
  }

  async fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    return fetch(input, init);
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
  async loadService(resource: ImageServiceRequest, forceFresh = false): Promise<Service> {
    if (!this.config.disableThrottling) {
      let running = true;
      while (running) {
        if (this.fetchingCount >= this.config.verificationsRequired) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        } else {
          running = false;
          break;
        }
      }
    }

    const imageServer = this.knownImageServers[getImageServerFromId(getId(resource))];
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

    this.fetchingCount++;
    // Fetch a real copy of the image service.
    const serviceJson = await this.fetchService(getId(resource), forceFresh);
    this.fetchingCount--;

    if (serviceJson.real) {
      this.sample(serviceJson, resource);
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
    const serviceId = canonicalServiceUrl(getId(resource));

    if (this.imageServices[serviceId]) {
      return this.imageServices[serviceId];
    }

    // Other-wise we do the magic.
    return this.predict(resource);
  }
}

export const imageServiceLoader = new ImageServiceLoader();
