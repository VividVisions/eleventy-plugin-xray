
import DataParser from './data-parser.js';
import getContext from './get-context.js';
import { render } from './data-renderer.js';
import getBenchmarks from './get-benchmarks.js';
import CopyTemplate from './copy-template.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Buffer } from 'node:buffer';
import getRepoInfo from 'git-repo-info';
import { _, _if, _elseif, _else, _endif } from 'conditional-tag';
import { createRequire } from 'node:module';
import makeDebug from 'debug';
const debug = makeDebug('xrayplugin:plugin');

// import pkg from './package.json' with { type: 'json' };
const require = createRequire(import.meta.url);
const pkg = require('../package.json'); 


// Default plugin options.
const defaultOptions = {
	benchmarks: true,
	cutoff: 45,
	dir: '_xray',
	git: true,
	logLevel: 'warn',
	maxDepth: 8,
	onlyEnvName: 'ELEVENTY_ENV'
};


/**
 * Xray plugin for Eleventy.
 * 
 * @param {Object} eleventyConfig - Config object of Eleventy.
 * @param {Object} pluginOptions - Options for this plugin.
 */
export default function XRayPlugin(eleventyConfig, pluginOptions = {}) {
	const 
		isQuiet = process.argv.includes('--quiet'),
		options = { ...defaultOptions, ...pluginOptions };

	debug('Options: %O', options);

	// Eleventy version check. Maybe throw here?
	try {
		eleventyConfig.versionCheck(">=3.0");
	} 
	catch(e) {
		console.log(`[xray-plugin] WARN Eleventy plugin compatibility: ${e.message}` );
	}

	// Don't do anything if the environment variable doesn't match.
	if (options?.onlyEnv && process.env[options.onlyEnvName] !== options.onlyEnv) {
		const msg = '[xray-plugin] onlyEnv condition not met. Not rendering.';
		debug(msg);

		if (!isQuiet) {
			console.warn(msg);
		}
		
		eleventyConfig.addShortcode('xray', () => '');
		return;
	}

	const
		parser = new DataParser({ cutoff: options.cutoff, maxDepth: options.maxDepth }),
		timestamp = Date.now(),
		xrayData = {
			timestamp,
			pages: {}
		},
		pluginDir = dirname(fileURLToPath(import.meta.url)),
		xrayOutput = join(eleventyConfig.dir.output, options.dir);
		
	let parseCount = 0;

	function setXrayPageData(url, key, value) {
		if (!(url in xrayData.pages)) {
			xrayData.pages[url] = {};
		}

		xrayData.pages[url][key] = value;
	}

	// Hot reload can't handle custom elements (yet?).
	// eleventyConfig.setServerOptions({
	// 	domDiff: false
	// });

	// Reset parser before every run.
	eleventyConfig.on('eleventy.before', async ({ dir, runMode, outputMode }) => {
		debug('eleventy.before');
		parseCount = 0;
		parser.reset();
	});

	// Add Xray asset files as virtual templates.
	eleventyConfig.addTemplate(`xray-js.11ty.js`, 
		new CopyTemplate(
			join(pluginDir, '../client-dist/xray.js'), 
			join(options.dir, 'xray.js')
		));

	eleventyConfig.addTemplate(`xray-css.11ty.js`, 
		new CopyTemplate(
			join(pluginDir, '../client-dist/xray.css'), 
			join(options.dir, 'xray.css')
		));

	eleventyConfig.addTemplate(`xray-timestamp-json.11ty.js`, {
		data: { 
			permalink: join(options.dir, 'xray-timestamp.json')
		},

		render: () => JSON.stringify({ timestamp })
	});

	// Add {% xray %} shortcode.
	eleventyConfig.addShortcode('xray', async function() {
		const 
			context = getContext(this),
			globalKeys = [...Object.keys(await context.collections.all[0].template.templateData.globalData), 'collections'];

		// Tell parser how to recognize global data keys.
		parser.setGlobalKeys(globalKeys);

		// Only parse global data, if we haven't already.
		if (!parser.hasGlobal()) {
			debug('Getting global data (%s)', this.page.url);
			const globalData = await parser.parseGlobalData(context);
			xrayData.globalData = globalData;
		}

		// Parse page data.
		const pageData = await parser.parsePageData(context);
		
		// Render local data.
		const localHtml = render(pageData);

		// Compute path of this page relative to Xray directory. 
		let relativePath = relative(this.page.url, `/${options.dir}`);
		if (!relativePath.startsWith('.') && !relativePath.startsWith('/')) {
			relativePath = './' + relativePath;
		}

		const 
			clientScript = join(relativePath, 'xray.js'),
			clientStyle = join(relativePath, 'xray.css');

		// Generate Xray HTML.
		const html = _`<script src="${clientScript}" type="module"></script>
<div id="xray-plugin" data-relative="${relativePath}"${options.logLevel ? ` data-loglevel="${options.logLevel}"` : ''} style="display:none;">
	<template shadowrootmode="open">
		<link rel="stylesheet" href="${clientStyle}" onload="document.getElementById('xray-plugin').removeAttribute('style');">
		<menu id="xray-tray">
			<li class="xray"><a href="#" title="Xray">Xray</a></li>
			<li class="buildinfo active"><a href="#" title="Build information">Build information</a></li>
			<li class="pagedata active"><a href="#" title="Page data"></a></li>
			<li class="globaldata active"><a href="#" title="Global data">Global data</a></li>
		</menu>
		<div id="xray" class="loading">
			<main>
				<header>
					<h1><span>X</span><span>ray</span> <span>v${ pkg.version }</span></h1>
				</header>
				<div id="buildinfo" class="active">
					<h2>Build information</h2>
					<div>
						<h3>Page</h3>
						<dl id="page">
							<dt>URL</dt>
							<dd class="string">${this.page.url}</dd>
							<dt>Template</dt>
							<dd class="string">${this.page.inputPath}</dd>
						</dl>
						<h3>Browser</h3>
						<dl id="browser">
							<dt>DOM ready</dt>
							<dd class="dom"></dd>
							<dt>Loaded</dt>
							<dd class="load"></dd>
						</dl>
						<h3>System</h3>
						<dl>
							<dt>Eleventy</dt>
							<dd class="string">v${process.env.ELEVENTY_VERSION} (${process.env.ELEVENTY_RUN_MODE})</dd>
							<dt>Node.js</dt>
							<dd class="string">${process.version}</dd>
							<dt>Xray</dt>
							<dd class="string">v${ pkg.version }</dd>
						</dl>
					</div>
				</div>
				<div id="pagedata" class="active">
					<h2>Page data</h2>
					<div>
					   ${localHtml}
					</div>
				</div>
				<div id="globaldata" class="active">
					<h2>Global data</h2>
					<div></div>
				</div>
			</main>
		</div>
	</template>
</div>`;
		
		// Store size of Xray HTML content to subtract from total file size.
		setXrayPageData(this.page.url, 'xraySize', Buffer.from(html).length);
		parseCount++;
		return html;
	});

	// Write data file.
	eleventyConfig.on('eleventy.after', async ({ dir, results, runMode, outputMode }) => {
		debug('eleventy.after');
		debug(`Parsed data of ${parseCount} pages.`)

		// Add Git info.
		if (options.git === true) {
			if (options.git === true) {
				const gitPath = join(process.env.ELEVENTY_ROOT, eleventyConfig.dir.input);
				debug(`Fetching Git info of ${gitPath}.`);
				const gitInfo = getRepoInfo(gitPath);
				xrayData.git = gitInfo;
			}
		}

		// Add benchmarks.
		if (options.benchmarks === true) {
			debug(`Parsing benchmarks.`);
		}

		results.forEach(r => {
			setXrayPageData(r.url, 'size', Buffer.from(r.content).length);
			
			if (options.benchmarks === true) {
				const bm = getBenchmarks(r.inputPath, eleventyConfig);
				// debug(`${r.outputPath}: %O`, bm);
				setXrayPageData(r.url, 'benchmarks', bm);
			}
		});

		// Write data file.			
		try {
			const xrayDataFile = join(xrayOutput, 'xray-data.json');
			debug('Writing data file to %s.', xrayDataFile);
			await mkdir(xrayOutput, { recursive: true });
			await writeFile(xrayDataFile, JSON.stringify(xrayData));
		}
		catch(err) {
			throw new Error(`[xray-plugin] Error while writing data file: ${err.message}`, { cause: err });
		}
	});
}
