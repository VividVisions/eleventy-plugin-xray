
/**
 * This represents the Xray data structure used throughout the plugin. 
 * new XrayData() returns a Proxy so we can directly
 * set and get properties of xrayData.data and also have helper functions
 * like toJSON().
 * 
 * xrayData.foo = 'bar' is actually xrayData.data.foo = 'bar'.
 * xrayData.foo returns xrayData.data.foo (if there is no property named foo in xrayData).
 */
export default class XrayData {
	data;

	constructor() {
		this.data = {
			timestamp: Date.now(),
			pages: {}
		};

		return new Proxy(this, {
			get(target, name, receiver) {
				if (Reflect.has(target, name)) {
					return Reflect.get(target, name, receiver);
				}

				return Reflect.get(target.data, name);
			},
			set(target, name, value) {
				if (Reflect.has(target, name)) {
					return Reflect.set(target, name, value);
				}

				return Reflect.set(target.data, name, value);
			}
		});
	}


	/**
	 * Sets a key/value pair for a certain page URL.
	 * 
	 * @param {String} url - The URL of the page.
	 * @param {String} key - The key of the data.
	 * @param {String} value - The value of the data.
	 * @returns {Object} The XrayData instance for chaining.
	 */
	setPageData(url, key, value) {
		if (!(url in this.data.pages)) {
			this.data.pages[url] = {};
		}

		this.data.pages[url][key] = value;

		return this;
	}


	/**
	 * Returns the JSON representation of the data.
	 * 
	 * @returns {String} The JSON representation of the data.
	 */
	toJSON() {
		return JSON.stringify(this.data);
	}
}
