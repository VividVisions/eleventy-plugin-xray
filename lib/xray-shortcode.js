
import getContext from './get-context.js';
import { render } from './data-renderer.js';
import relativeToRoot from './utils/relative-to-root.js';
import { join } from 'node:path';
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
		const context = getContext(this);
		
		let 
			globalData = {},
			globalKeys = [];

		// At the moment, we find out a lot of stuff by fetching the current page
		// from collections.all. So, we check if we will even find this page there.
		if (!('eleventyExcludeFromCollections' in context) || context.eleventyExcludeFromCollections === false) {

			let findUrl = this.page.url;

			// Then we check if this page is part of a collection, which could be missing from
			// collections.all[].
			if ('pagination' in context && 
				(!('addAllPagesToCollections' in context.pagination) || context.pagination.addAllPagesToCollections === false)) {

				findUrl = context.pagination.firstPageHref;
			}

			const colPage = context.collections.all.find(page => {
				const result = (findUrl === page.url);

				if (result) {
					debug(`Page ${this.page.url} (${findUrl}) found in collections.all[].`);
				}

				return result;
			});

			// We found the page in collections.all.
			if (colPage) {
				const
					dirData = await colPage.template.templateData.getTemplateDirectoryData(this.page.inputPath),
					dirKeys = Object.keys(dirData);
				
				if (!parser.hasGlobal()) {
					globalData = await colPage.template.templateData.getGlobalData(this.page.inputPath);
				}
					
				let 
					layoutData = {},
					layoutKeys = [];
				
				if (context.layout) {
					layoutData = await colPage.template.getLayout(context.layout).getData();
					layoutKeys = Object.keys(layoutData);
				}

				debug('%s dirKeys    %o', this.page.url, dirKeys);	
				debug('%s layoutKeys %o', this.page.url, layoutKeys);	
				
				parser.setDirKeys(dirKeys);
				parser.setLayoutKeys(layoutKeys);
			}
			// We didn't find the page.
			else {
				const msg = `Page ${this.page.url} not found in collections.all[]!`;
				debug(msg);
				console.warn(`[xray-plugin] WARN ${msg}`);
			}
		}

		// Only parse global data, if we haven't already.
		if (!parser.hasGlobal()) {
			// Tell parser how to recognize global data keys.
			if (globalData === {}) {
				debug('%s Still no globalData. Fetching from collections.all[0]…', this.page.url);
				globalData = await collections.all[0].template.templateData.getGlobalData(this.page.inputPath);
			}
			globalKeys = [...Object.keys(globalData), 'collections'];
			debug('%s globalKeys %o', this.page.url, globalKeys);
			parser.setGlobalKeys(globalKeys);
			debug('%s Parsing global data…', this.page.url);
			xrayData.globalData = await parser.parseGlobalData(context);
		}

		// Parse page data.
		const pageData = await parser.parsePageData(context);
		// debug('pageData: %O', pageData);

		// Render local data.
		const localHtml = render(pageData);

		// Compute relative path of Xray directory relative to the root of this page.
		const 
			relativePath = relativeToRoot(this.page.url, `/${options.dir}`),
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
