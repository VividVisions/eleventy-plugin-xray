
import { inspect } from 'node:util';
import makeDebug from 'debug';
const debug = makeDebug('xrayplugin:context');


/**
 * Returns the context object of the current render engine.
 * Currently Nunjucks and Liquid are supported. Markdown as well if 
 * preprocessed by one of the former engines. 
 * 
 * @param {Object} filterOrShortcode - A filter or shortcode object.
 * @returns {Object} The context.
 */
export default function getContext(filterOrShortcode) {
	const ctx = filterOrShortcode?.ctx?.environments || filterOrShortcode?.ctx || undefined;
	debug('Context: %O', Object.keys(ctx)); //inspect(ctx, { depth: 1, colors: true, breakLength: Infinity }));

	return ctx;
}
