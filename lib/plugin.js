
import DataParser from './data-parser.js';
import getBenchmarks from './get-benchmarks.js';
import CopyTemplate from './copy-template.js';
import getXrayShortcode from './xray-shortcode.js';
import XrayData from './xray-data.js';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Buffer } from 'node:buffer';
import getRepoInfo from 'git-repo-info';
import makeDebug from 'debug';
const debug = makeDebug('xrayplugin:plugin');

import { inspect } from 'node:util';

// Default plugin options.
const defaultOptions = {
	benchmarks: true,
	cutoff: 45,
	dir: '_xray',
	git: true,
	logLevel: 'warn',
	maxDepth: 8,
	mode: 'auto',
	onlyEnvName: 'ELEVENTY_ENV'
};


/**
 * Xray plugin for Eleventy.
 * 
 * @param {Object} eleventyConfig - Config object of Eleventy.
 * @param {Object} pluginOptions - Options for this plugin.
 */
export default async function XRayPlugin(eleventyConfig, pluginOptions = {}) {
	const 
		isQuiet = process.argv.includes('--quiet'),
		options = { ...defaultOptions, ...pluginOptions },
		eleventyRunMode = process.env.ELEVENTY_RUN_MODE;

	debug('Options: %O', options);

	// Eleventy version check. Maybe throw here?
	try {
		eleventyConfig.versionCheck(">=3.0");
	} 
	catch(e) {
		console.warn(`[xray-plugin] WARN Eleventy plugin compatibility: ${e.message}` );
	}

	// Do nothing if one of the two conditions is met:
	// 1) options.onlyEnv exists but doesn't match process.env[options.onlyEnvName]
	// 2) mode = 'serve' but ELEVENTY_RUN_MODE != 'serve'
	try {
		if (options?.onlyEnv && process.env[options.onlyEnvName] !== options.onlyEnv) {
			throw new Error(`onlyEnv condition not met (${process.env[options.onlyEnvName]} != ${options.onlyEnv}). Xray disabled.`);
		}
		else if ((eleventyRunMode === 'build' || eleventyRunMode === 'watch') && options.mode === 'serve') {
			throw new Error(`ELEVENTY_RUN_MODE = '${eleventyRunMode}' but Xray mode = 'serve'. Xray disabled.`);
		}
	}
	catch(err) {
		debug(err.message);

		if (!isQuiet) {
			console.warn(`[xray-plugin] ${err.message}`);
		}

		eleventyConfig.addShortcode('xray', () => '');
		return;
	}

	// Initialize everything.
	const
		parser = new DataParser({ cutoff: options.cutoff, maxDepth: options.maxDepth }),
		xrayData = new XrayData(),
		pluginDir = dirname(fileURLToPath(import.meta.url));

	// Reset parser before every run.
	eleventyConfig.on('eleventy.before', async ({ dir, runMode, outputMode }) => {
		debug('eleventy.before');
		parser.reset();
	});

	// Handle asset files.
	const 
		assetJsIn = join(pluginDir, '../client-dist/xray.js'),
		assetJsUrl = join('/', options.dir, 'xray.js'),
		assetCssIn = join(pluginDir, '../client-dist/xray.css'),
		assetCssUrl = join('/', options.dir, 'xray.css'),
		assetTsContent = `{"timestamp":${xrayData.timestamp}}`,
		assetTsUrl = join('/', options.dir, 'xray-timestamp.json'),
		xrayDataUrl = join('/', options.dir, 'xray-data.json');

	// In serve mode, we'll serve all assets virtually.
	if (eleventyRunMode === 'serve' &&
		(options.mode === 'serve' || options.mode === 'auto')) {
		debug('Virtual assets.');
		const 
			assetJsContent  = await readFile(assetJsIn,  { encoding: 'utf8' }),
			assetCssContent = await readFile(assetCssIn,  { encoding: 'utf8' }),
			requestHandler = {
				[assetJsUrl]: () => ({
					status: 200,
					headers: {
						'Content-Type': 'text/javascript'
					},
					body: assetJsContent
				}),
				[assetCssUrl]: () => ({
					status: 200,
					headers: {
						'Content-Type': 'text/css'
					},
					body: assetCssContent
				}),
				[assetTsUrl]: () => ({
					status: 200,
					headers: {
						'Content-Type': 'application/json'
					},
					body: assetTsContent
				}),
				[xrayDataUrl]: () => ({
						status: 200,
						headers: {
							'Content-Type': 'application/json'
						},
						body: xrayData.toJSON()
				})
			};

			eleventyConfig.setServerOptions({
				onRequest: requestHandler
			});

	}
	// In build mode, we write actual files.
	else if (options.mode === 'build' || 
		(eleventyRunMode === 'build' && options.mode === 'auto')) {
		debug('Actual assets.');

		// Add Xray asset files as virtual templates.
		eleventyConfig.addTemplate(`xray-js.11ty.js`, new CopyTemplate(assetJsIn, assetJsUrl));
		eleventyConfig.addTemplate(`xray-css.11ty.js`, new CopyTemplate(assetCssIn, assetCssUrl));
		eleventyConfig.addTemplate(`xray-timestamp-json.11ty.js`, {
			data: { 
				permalink: assetTsUrl 
			},
			render: () => assetTsContent
		});
	}

	// Add {% xray %} shortcode.
	eleventyConfig.addShortcode('xray', getXrayShortcode(options, xrayData, parser));

	// Write data file.
	eleventyConfig.on('eleventy.after', async ({ dir, results, runMode, outputMode }) => {
		debug('eleventy.after');

		// Add Git info.
		if (options.git === true) {
			if (options.git === true) {
				const gitPath = join(process.env.ELEVENTY_ROOT, eleventyConfig.dir.input);
				debug(`Fetching Git info of ${gitPath}.`);
				const gitInfo = getRepoInfo(gitPath);
				xrayData.git = { sha: gitInfo.sha, branch: gitInfo.branch };
			}
		}

		// Gather benchmarks.
		if (options.benchmarks === true) {
			debug(`Parsing benchmarks.`);
		}

		results.forEach(r => {
			xrayData.setPageData(r.url, 'size', Buffer.from(r.content).length);
			
			if (options.benchmarks === true) {
				const bm = getBenchmarks(r.inputPath, eleventyConfig);
				// debug(`${r.outputPath}: %O`, bm);
				xrayData.setPageData(r.url, 'benchmarks', bm);
			}
		});

		if (options.mode === 'build' || 
			(eleventyRunMode === 'build' && options.mode === 'auto')) {
			// Write data file.
			try {
				const 
					xrayOutput = join(eleventyConfig.dir.output, options.dir),
					xrayDataFile = join(xrayOutput, 'xray-data.json');
				
				debug('Writing data file to %s.', xrayDataFile);
				await mkdir(xrayOutput, { recursive: true });
				await writeFile(xrayDataFile, xrayData.toJSON());
			}
			catch(err) {
				throw new Error(`[xray-plugin] Error while writing data file: ${err.message}`, { cause: err });
			}
		}
	});
}
