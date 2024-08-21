
import getContext from './get-context.js';
import { render } from './data-renderer.js';
import { join, relative } from 'node:path';
import makeDebug from 'debug';
const debug = makeDebug('xrayplugin:shortcode');

// import pkg from './package.json' with { type: 'json' };
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pkg = require('../package.json'); 


/**
 * Returns the Xray scoped shortcode function.
 * 
 * @param {Object} options - The plugin options.
 * @param {XrayData} xrayData - The XrayData instance.
 * @param {DataParser} parser - The DataParser instance.
 * @returns {Function} The shortcode function.
 */
export default function getShortcode(options, xrayData, parser) {

	return async function xrayShortcode() {
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
		const html = `<script src="${clientScript}" type="module"></script>
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
						<h1><span>X</span><span>ray</span> <span>v${pkg.version}</span></h1>
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
								<dd class="string">v${pkg.version}</dd>
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
		xrayData.setPageData(this.page.url, 'xraySize', Buffer.from(html).length);
		return html;
	};
}
