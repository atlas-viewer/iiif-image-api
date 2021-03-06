import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import visualizer from 'rollup-plugin-visualizer';
import replace from '@rollup/plugin-replace';
import compiler from '@ampproject/rollup-plugin-closure-compiler';
import pkg from './package.json';

const globalName = 'IIIFImageApi';
const external = [];

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: pkg.web,
        name: globalName,
        format: 'umd',
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({ target: 'es5' }),
      replace({
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
      resolve({ browser: true }), // so Rollup can find `ms`
      commonjs({ extensions: ['.js', '.ts'] }), // the ".ts" extension is required
      terser(),
      compiler(),
    ],
    external,
  },
  {
    input: 'src/index.ts',
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: pkg.module,
        format: 'es',
        sourcemap: true,
      },
    ],
    external: ['crypto', ...external, ...Object.keys(pkg.dependencies)],
    plugins: [
      typescript(),
      replace({
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
      resolve(), // so Rollup can find `ms`
      commonjs({ extensions: ['.js', '.ts'] }), // the ".ts" extension is required
      visualizer(),
    ],
  },
];
