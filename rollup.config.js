
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
// import strip from '@rollup/plugin-strip';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkg = require('./package.json'); 

const 
	isProd = (process.env?.NODE_ENV === 'production'),
	outputPlugins = [];

if (isProd) {
	outputPlugins.push(terser({
		format: {
			preamble: `/* ${pkg.name} v${pkg.version}\n${pkg?.homepage || ''} */`
		}
	}));
}

export default {	
	// treeshake: 'smallest',
	// treeshake: {
	// 	moduleSideEffects: false
	// },
	input: './client-src/xray.js',
	plugins: [
		commonjs(),
		resolve()
	],
	output: {
		file: `./client-dist/xray.js`,
		format: 'es',
		plugins: outputPlugins,
		sourcemap: isProd ? false : 'inline'
	}
};