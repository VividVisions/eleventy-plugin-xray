
import TrayController from './tray-controller.js';
import TreeController from './tree-controller.js';
import { cache } from './cache.js';
import { render } from '../../lib/data-renderer.js';

const noop = function() {};

export default class XrayController {
	
	xrayRootElement;
	xrayElement;
	
	times = {};
	config = {};
	
	shadowRoot;
	trayController;

	constructor(xrayRootId) {

		document.addEventListener('DOMContentLoaded', async (e) => {
			// Record time of event.
			this.times.dom = this.formatMS(performance.now());

			// Get HTML elements.
			this.xrayRootElement = document.getElementById(xrayRootId);
			this.shadowRoot = this.xrayRootElement.shadowRoot;
			this.xrayElement = this.shadowRoot.getElementById('xray');

			// Get config.
			this.config.logLevel = this.xrayRootElement.dataset.loglevel || 'info';
			this.config.relativePath = this.xrayRootElement.dataset.relative;

			// Build logging functions.
			['debug', 'info', 'warn', 'error'].forEach(level => {
				this[level] = function(message, ...obj) {
					this.log(level, `[xray] ${message}`, obj);
				}
			});
			
			switch(this.config.logLevel) {
				case 'none':
					this.debug = noop;
				case 'error':
					this.warn = noop;
				case 'warn':
					this.info = noop;
				case 'info':
					this.debug = noop;
			}

			// Hide scrollbars from actual website when Xray is active.
			const style = document.createElement('style');
			style.textContent = ':root:has(#xray-plugin.active) { overflow: hidden !important; }';
			document.querySelector('head').appendChild(style);

			// Stop preventing initial transition.
			setTimeout(() => {
				this.xrayElement.classList.remove('loading');
			}, 500);

			// Initialize Xray tray.
			this.trayController = new TrayController(this.shadowRoot.querySelector('#xray-tray'), this.xrayRootElement, this.xrayElement);

			const data = await this.loadData();
			
			// Render global data.
			this.debug('Rendering global data.');
			const globalDataDiv = this.shadowRoot.querySelector('#globaldata div');
			globalDataDiv.innerHTML = render(data.globalData);

			// Render Git data.
			if (data?.git) {
				this.debug('Rendering Git info.');
				const git = data.git;
				this.shadowRoot.querySelector('#browser').insertAdjacentHTML('afterend', `<h3>Git</h3>
	<dl id="git">
		<dt>Branch</dt>
		<dd><span ${ git?.branch ? 'class="string"' : 'class="undefined"'}>${git?.branch || '-'}</span></dd>
		<dt>Revision</dt>
		<dd><span ${ git?.sha ? `class="string" title="${git.sha}"` : 'class="undefined"'}>${git?.sha ? git.sha.substr(0, 8) : '-'}</span></dd>
	</dl>`);
			}

			const 
				relToRoot = this.config.relativePath.substring(0, this.config.relativePath.lastIndexOf('/')),
				root = new URL(relToRoot, location.href),
				url = location.pathname.replace(root.pathname, '/').replace('index.html', '');

			// Render benchmarks.
			if (data.pages?.[url]?.benchmarks) {
				this.debug('Rendering benchmarks.');

				const bm = data.pages[url].benchmarks;

				// File size.
				let dt = document.createElement('dt');
				let dd = document.createElement('dd');
				dt.textContent = 'File size';
				let size = data.pages[url].size;
				if (data.pages[url]?.xraySize) {
					size -= data.pages[url].xraySize;
				}
				size = this.formatBytes(size);
				dd.innerHTML = `<span class="number">${size.value}</span>${size.unit} (excl. Xray)`;
				
				let dl = this.shadowRoot.querySelector('dl#page');
				dl.append(dt);
				dl.append(dd);

				// Compile time.
				dt = document.createElement('dt');
				dd = document.createElement('dd');
				dt.textContent = 'Compile time';
				let ms = this.formatMS(bm.compile);
				dd.innerHTML = `<span class="number">${ms.value}</span>${ms.unit}`;
				dl.append(dt);
				dl.append(dd);

				// Render time.
				dt = document.createElement('dt');
				dd = document.createElement('dd');
				dt.textContent = 'Render time';
				ms = this.formatMS(bm.render);
				dd.innerHTML = `<span class="number">${ms.value}</span>${ms.unit}${bm.paginated ? ' (All paginated pages)' : ''}`;
				dl.append(dt);
				dl.append(dd);

				if (bm.paginated) {
					dt = document.createElement('dt');
					dd = document.createElement('dd');
					dt.textContent = 'RT per page';
					ms = this.formatMS(bm.renderEach);
					dd.innerHTML = `<span class="number">${ms.value}</span>${ms.unit} avg. (<span class="number">${bm.paginated}</span> page${bm.paginated > 1 ? 's' : ''})`;
					dl.append(dt);
					dl.append(dd);
				}
			}

			// Restore UI status.
			const hide = cache.get('xray:hide', true);
			for (const name in hide) {
				const button = this.shadowRoot.querySelector(`#xray-tray .${name}`);
				const block = this.shadowRoot.querySelector(`#${name}`);

				if (hide[name] === true) {
					button.classList.remove('active');
					block.classList.remove('active');
				}
				else {
					button.classList.add('active');
					block.classList.add('active');
				}
			}

			// Initialize Xray trees.
			this.shadowRoot.querySelectorAll('ul.tree').forEach(tree => {
				new TreeController(tree);
			});

		}, { once: true });
		
		window.addEventListener('load', e => {
			this.debug('Rendering load times.');
			this.times.load = this.formatMS(performance.now());

			this.shadowRoot.querySelector('dd.dom').innerHTML = `<span class="number">${this.times.dom.value}</span>${this.times.dom.unit}`;
			this.shadowRoot.querySelector('dd.load').innerHTML = `<span class="number">${this.times.load.value}</span>${this.times.load.unit}`;
		}, { once: true });

	}

	log(level, message, obj) {
		if (obj?.length) {
			console[level](message, ...obj);
		}
		else {
			console[level](message);
		}
	}

	formatMS(ms) {
		if (ms >= 1000) {
			return { value: (ms / 1000).toFixed(2), unit: 's' };
		}
		else if (ms < 0.01) {
			return { value: (ms * 1000).toFixed(2), unit: 'μs' };
		}
		else {
			return { value: ms.toFixed(2), unit: 'ms' };
		}
	}


	formatBytes(bytes) {
		if (bytes >= 1000000) {
			return {
				value: (bytes / 1000000).toFixed(2),
				unit: 'MB'
			}
		}
		else if (bytes >= 1000) {
			return {
				value: (bytes / 1000).toFixed(2),
				unit: 'KB'
			}
		}
		else {
			return {
				value: bytes,
				unit: 'B'
			}
		}
	}


	async loadData() {
		let data;
		let corrupted = false;
		
		try {
			data = cache.get('xray:data')
		}
		catch(err) {
			this.debug('Abandoning the cache due to corrupted data.', err);
			corrupted = true;
		}
		
		if (data && !corrupted) {
			const timestampPath = `${this.config.relativePath}/xray-timestamp.json`;
			let tsFile;

			try {
				tsFile = await fetch(timestampPath).then(f => f.json());
			}
			catch(err) {
				this.error('Error while fetching xray-timestamp.json!', err);
			}

			this.debug('Cached timestamp  %s / Latest timestamp %s', data.timestamp, tsFile.timestamp);

			if (tsFile.timestamp === data.timestamp) {
				this.debug('Returning cached data.');
				return data;
			}
		}
		
		const filePath = `${this.config.relativePath}/xray-data.json`;
		this.debug('Loading data…', filePath);
		
		try {
			const response = await fetch(filePath);
			const clonedRes = response.clone();
			
			this.debug('Caching data…');
			cache.set('xray:data', await response.text());
			data = await clonedRes.json();
		}
		catch(err) {
			this.error('Error while fetching/parsing xray-data.json!', err);
		}

		return data;
	}

}