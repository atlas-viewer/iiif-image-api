import { createRollupConfig, createTypeConfig } from 'rollup-library-template';
import replace from '@rollup/plugin-replace';

const nodeExternal = ['node-fetch'];
const nodeCjsExternal = [
  'node-domexception',
  'node:https',
  'node:buffer',
  'node:stream',
  'node:zlib',
  'node:http',
  'node:util',
  'node:url',
  'node:net',
  'node:path',
  'node:fs',
  'node:worker_threads',
];
const baseConfig = {
  filesize: true,
  minify: true,
  extra: {
    treeshake: true,
  },
  esbuildOptions: {
    define: {
      'process.env.NODE_ENV': '"production"',
    },
  },
  postProcess: (config) => {
    config.plugins = [
      replace({
        values: {
          'process.env.NODE_ENV': '"production"',
        },
        preventAssignment: false,
      }),
      ...config.plugins,
    ];

    return config;
  },
};

// Roll up configs
export default [
  createTypeConfig({
    source: './.build/types/index.d.ts',
  }),

  // UMD bundle will have everything.
  createRollupConfig({
    ...baseConfig,
    inlineDynamicImports: true,
    input: './src/index.ts',
    output: {
      name: 'IIIFImageApi',
      file: `dist/index.umd.js`,
      format: 'umd',
    },
    nodeResolve: {
      browser: false,
    },
  }),

  createRollupConfig({
    ...baseConfig,
    input: './src/index.ts',
    distPreset: 'esm',
  }),
  createRollupConfig({
    ...baseConfig,
    input: './src/index.ts',
    distPreset: 'cjs',
  }),
  createRollupConfig({
    ...baseConfig,
    input: './src/index.node.ts',
    distPreset: 'esm',
    node: true,
    esmExtension: true,
    external: nodeExternal,
  }),
  createRollupConfig({
    ...baseConfig,
    input: './src/index.node.ts',
    distPreset: 'cjs',
    node: true,
    external: nodeCjsExternal,
  }),
];
