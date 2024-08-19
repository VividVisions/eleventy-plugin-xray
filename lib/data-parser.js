
import sortAlphaNum from './utils/sort-alpha-num.js';
import getContext from './get-context.js';
import makeDebug from 'debug';
const debug = makeDebug('xrayplugin:parse');


/**
 * Xray parser class to identify and recursively traverse data sets.
 */
export default class DataParser {

	seenGlobalObjects;
	seenObjects;
	options;
	globalKeys;

	static defaultOptions = {
		maxDepth: 8,
		cutoff: 45
	};


	/**
	 * @param {Object} options - Options for parsing.
	 */
	constructor(options = {}) {
		if (options) {
			this.options = { ...DataParser.defaultOptions, ...options };
		}

		this.seenObjects = new Map();
		this.seenGlobalObjects = new Map();
	}


	/**
	 * Returns the type of data. We try to recognize the most common types.
	 *
	 * @param {any} data - The data item.
	 * @param {String} The data type.
	 */
	determineType(data) {
		switch(typeof data) {
			case 'undefined':
			case 'boolean':
			case 'number':
			case 'string':
			case 'symbol':
				return typeof data;
			case 'function':
				if (data.constructor.name === 'Function') {
					return 'function';
				}
				else {
					return 'instance';
				}
			case 'object':
				if (data === null) {
					return 'null';
				}
				else if (Array.isArray(data)) {
					return 'array';
				}
				else if (data instanceof RegExp) {
					return 'regexp';
				}
				else if (data instanceof Date) {
					return 'date';
				}
				else if (data instanceof Map) {
					return 'map';
				}
				else if (data instanceof Set) {
					return 'set';
				}
				else {
					if (data.constructor.name === 'Object') {
						return 'object';
					}
					else {
						return 'instance';
					}
				}
			default:
				return 'unknown';
		}
	}


	/**
	 * Determines what to display as the content of a data item and
	 * adds the content and possible meta information to the parsed data descriptor.
	 * 
	 * @param {Object} parsed - The parsed data descriptor.
	 * @param {any} data - The data item.
	 */
	determineContent(parsed, data) {
		switch(parsed.type) {
			case 'boolean':
			case 'string':
			case 'number':
			case 'regexp':
				parsed.content = data.toString();
				break;

			case 'date':
				parsed.content = data.toISOString();
				break;

			case 'symbol':
				parsed.content = data.description;
				break;

			case 'function':
				parsed.content = data.name || 'anonymous';
				break;

			case 'instance':
				parsed.content = data.constructor.name;
				break;

			case 'array':
				parsed.length = data.length;
				if (parsed.length > 0) {
					parsed.content = [];
				}
				break;

			case 'object':
				parsed.length = Object.keys(data).length;
				if (parsed.length > 0) {
					parsed.content = [];
				}
				break;

			case 'set':
			case 'map':
				parsed.length = data.size;
				if (parsed.length > 0) {
					parsed.content = [];
				}
				break;

			default:
			case 'unknown':
				parsed.content = '?';
				break;
		}

		// Cut the content if it's a string exceeding the cutoff length.
		if (typeof parsed.content === 'string' && 
			parsed.content.length > this.options.cutoff) {
			parsed.content = parsed.content.substring(0, this.options.cutoff) + '…';
		}
	}


	/**
	 * Returns whether global data has already been parsed.
	 * 
	 * @returns {Boolean} True, if global data has been processed. False otherwise.
	 */
	hasGlobal() {
		return (this.seenGlobalObjects.size > 0);
	}


	/**
	 * Reset the parser.
	 */
	reset() {
		this.seenObjects.clear();
		this.seenGlobalObjects.clear();
		this.globalKeys = null;
	}


	/**
	 * Sets the global keys so that the parser can differentiate between 
	 * global and page data. 
	 * 
	 * @param {Array} globalKeys - Array of the keys of the global data.
	 */
	setGlobalKeys(globalKeys) {
		this.globalKeys = globalKeys;
	}


	/**
	 * Parses global data. `setGlobalKeys()` must be called first.
	 * 
	 * @param {Object} context - The context of the render engine. 
	 * @returns {Object} The parsed data as a hierarchy of data descriptors.
	 */
	async parseGlobalData(context) {
		this.seenGlobalObjects.clear();
		debug('parseGlobalData()');
		debug('globalKeys %O', this.globalKeys);

		const globalData = [];

		this.#crawl('global', 'root', context, globalData, this.seenGlobalObjects);

		debug('globalData %O', globalData);
		debug('seenGlobalObjects %s', this.seenGlobalObjects.size);

		return globalData.pop();
	}


	/**
	 * Parses page data. `parseGlobalData()` must be called first.
	 * 
	 * @param {Object} context - The context of the render engine. 
	 * @returns {Object} The parsed data as a hierarchy of data descriptors.
	 */
	async parsePageData(context) {
		this.seenObjects = new Map(this.seenGlobalObjects);
		debug('parsePageData()');
		debug('globalKeys %O', this.globalKeys);

		const pageData = [];
		
		this.#crawl('page', 'root', context, pageData, this.seenObjects);

		debug('pageData %O', pageData);
		debug('seenObjects %s', this.seenObjects.size);
		
		this.seenObjects.clear();

		return pageData.pop();
	}


	/**
	 * Recursively traverses data sets and creates data descriptor objects to 
	 * be rendered. Has a primitive mechanism to identify circular references.
	 * 
	 * @TODO I'm sure this could be done more efficiently.
	 * @param {String} mode - The parsing mode 'global' or 'page'.
	 * @param {String} key - The key the current data item exists in its parent.
	 * @param {Object} object - The data to examine.
	 * @param {Object} addTo - The descriptor object to add new information.
	 * @param {Map} seenMap - A map of seen objects identify circular references.
	 * @param {Number} depth - The current depth of the data structure.
	 * @param {String} path - A string representation of the current data item and its path within the structure.
	 * @returns {Object} The data descriptor object for rendering.
	 */
	#crawl(mode, key, object, addTo, seenMap, depth = 0, path = key) {

		// Maximum depth has been exceeded. We go no further.
		if (depth === this.options.maxDepth) {
			return;
		}

		// The descriptor object.
		const data = {};

		if (key) {
			data.key = key;	
		}

		// Check if we even have to look at the object.
		if (depth === 1 && mode === 'global' && key && !this.globalKeys.includes(key)) {
			return;	
		}
		else if (depth === 1 && mode === 'page' && key && this.globalKeys.includes(key)) {
			return;
		}

		// Check if there's a circular reference.
		let isCircular = false;
		if (depth > 0 && object instanceof Object) {
			// Circular!
			if (seenMap.has(object)) {
				isCircular = true;
				data.type = 'circular';
				data.content = seenMap.get(object);
			}
			// Not circular.
			else {
				seenMap.set(object, path);
			}
		}

		if (!isCircular) {
			// Determine type and content of the data.
			data.type = this.determineType(object);
			this.determineContent(data, object);

			// Array.
			if (data.type === 'array' && data.length > 0) {
				object.forEach((item, idx) => this.#crawl(mode, String(idx), item, data.content, seenMap, depth + 1, path + '.' + idx));
			}
			// Map.
			else if (data.type === 'map') {
				const sortedKeys = Array.from(object.keys()).sort(sortAlphaNum);

				if (sortedKeys.length > 0) {
					sortedKeys.forEach(k => this.#crawl(mode, k, object.get(k), data.content, seenMap, depth + 1, path + '.' + k));
				}
			}
			// Set.
			else if (data.type === 'set') {
				let idx = 0;
				object.forEach((item) => {
					this.#crawl(mode, null, item, data.content, seenMap, depth + 1, path + '.' + idx);
					idx++;
				});
			}
			// Object.
			else if (data.type === 'object') {
				const sortedKeys = Object.keys(object).sort(sortAlphaNum);

				// Collections get special treament. 
				// We really don't want to traverse all collections every time.
				// @TODO Maybe do it at least once? Would it be helpful at all?
				// @TODO And we probably should use a more generalized approach for iterables here to
				//  support more data types. Which ones does Eleventy support?
				if (key === 'collections' /* && depth === 1*/ ) {
					if (sortedKeys.length > 0) {
						sortedKeys.forEach(key => {
							if (Array.isArray(object[key])) {
								data.content.push({
									key: key,
									type: 'array',
									length: object[key].length
								});
							}
							else {
								data.content.push({
									key: key,
									type: 'object'
								});
							}
						});
					}
				}
				else {
					if (sortedKeys.length > 0) {
						sortedKeys.forEach(k => this.#crawl(mode, k, object[k], data.content, seenMap, depth + 1, path + '.' + k));
					}
				}
			}
		}

		// Add the descriptor object to its parent.
		if (Array.isArray(addTo)) {
			addTo.push(data);
		}
		else {
			addTo[key] = data;
		}

	}
}
