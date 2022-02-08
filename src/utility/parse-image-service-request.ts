import { parseRegionParameter } from './parse-region-parameter';
import { parseSizeParameter } from './parse-size-parameter';
import { parseRotationParameter } from './parse-rotation-parameter';
import { ImageServiceImageRequest } from '../types';

export function parseImageServiceRequest(input: string, prefix = ''): ImageServiceImageRequest {
  const parsedUrl = input.match(/^(([a-zA-Z]+):\/\/([^\/]+))?((.*)+)/);
  if (!parsedUrl) {
    throw new Error(`Invalid or unknown input ${input}`);
  }
  const scheme = parsedUrl[2];
  const server = parsedUrl[3];
  let path = parsedUrl[4];

  if (path[0] === '/') {
    path = path.substr(1);
  }

  if (prefix.length > 0) {
    if (prefix[0] === '/') {
      prefix = prefix.substr(1);
    }
    if (prefix !== path.substr(0, prefix.length)) {
      throw new Error(`Path does not start with prefix (path: ${path}, prefix: ${prefix})`);
    }
    path = path.substr(prefix.length);
  }

  const parts = path.split('/').reverse();
  const [fileName, rotation, size, region, ...others] = parts;
  const identifier = others.reverse().filter(Boolean).join('/');

  if (parts.length === 1 || fileName === '') {
    // likely the server will want to redirect this
    return { type: 'base', scheme, server, prefix, identifier };
  }

  if (fileName === 'info.json') {
    const [, ...identifierParts] = parts;

    return {
      type: 'info',
      scheme,
      server,
      prefix,
      identifier: identifierParts.reverse().filter(Boolean).join('/'),
    };
  }

  const filenameParts = fileName.split('.');

  return {
    type: 'image',
    scheme,
    server,
    prefix,
    identifier,
    originalPath: path,
    region: parseRegionParameter(region),
    size: parseSizeParameter(size),
    rotation: parseRotationParameter(rotation),
    quality: filenameParts[0],
    format: filenameParts[1],
  };
}
