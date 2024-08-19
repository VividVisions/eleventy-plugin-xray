
import makeDebug from 'debug';
const debug = makeDebug('xrayplugin:benchmarks');
import { inspect } from 'node:util';

/**
 * Parses Eleventy's internal benchmarks and returns them as an object.
 * This feels very hacky.
 * 
 * @param {String} inputPath - The input path of a rendered page.
 * @param {Object} eleventyConfig - The Eleventy configuration object.
 * @returns {Object} The parsed values as an object.
 * @see https://github.com/11ty/eleventy-plugin-directory-output/blob/main/.eleventy.js#L231
 */
export default function getBenchmarks(inputPath, eleventyConfig) {
	const 
		benchmarks = {
			render: 0,
			compile: 0
		},
		keys = {
			compile: `> Compile > ${inputPath}`,
			render: `> Render > ${inputPath}`
		},
		paginatedRgx = new RegExp(`^${keys.render.replace(/([^a-z0-9\s])/gi, '\\$1')} \\(\\d+ pages\\)$`);

	debug('paginated RegEx: %s', paginatedRgx);

	if (eleventyConfig.benchmarkManager) {
		const benchmarkGroup = eleventyConfig.benchmarkManager.get('Aggregate');
		// debug(Object.keys(benchmarkGroup.benchmarks).filter(key => key.startsWith('>')).map(key => `${key}: ${inspect(benchmarkGroup.benchmarks[key], { compact: true })}`));

		if (benchmarkGroup?.has(keys.compile)) {
			benchmarks.compile = benchmarkGroup.get(keys.compile).getTotal();
		}

		if (benchmarkGroup?.has(keys.render)) {
			benchmarks.render = benchmarkGroup.get(keys.render).getTotal();
		}

		const paginatedKey = Object.keys(benchmarkGroup.benchmarks).filter(key => paginatedRgx.test(key));
		
		debug('paginatedKey: %s', paginatedKey.length ? paginatedKey[0] : 'None');

		if (paginatedKey.length === 1) {
			const bm = benchmarkGroup.get(paginatedKey.pop());
			benchmarks.paginated = bm.getTimesCalled();
			benchmarks.render = bm.getTotal();
			benchmarks.renderEach = bm.getTotal() / bm.getTimesCalled();
		}
	}

	return benchmarks;
}
