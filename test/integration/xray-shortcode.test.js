
import { expect } from '#test/chai.js';
import Eleventy from '@11ty/eleventy';
import getShortcode from '#lib/xray-shortcode.js';
import DataParser from '#lib/data-parser.js';
import XrayData from '#lib/xray-data.js';
import { defaultOptions } from '#lib/plugin.js';

describe('getShortcode()', function() {
	
	it('returns shortcode function', function() {
		const 
			parser = new DataParser(),
			xrayData = new XrayData(),
			shortcodeFunc = getShortcode(defaultOptions, xrayData, parser);

		expect(shortcodeFunc).to.be.a('function');
		// No parameters.
		expect(shortcodeFunc.length).to.equal(0);
	});

	it('shortcode renders Xray html', async function() {
		const 
			parser = new DataParser(),
			xrayData = new XrayData(),
			elev = new Eleventy('./test/fixtures/11ty-src', './test/fixtures/11ty-dest', {
				quietMode: true,
				config: function (eleventyConfig) {

					// Add <% xray %> shortcode.
					eleventyConfig.addShortcode('xray', getShortcode(defaultOptions, xrayData, parser));

					// Add virtual template.
					eleventyConfig.addTemplate('virtual.njk', '{% xray %}', {
						title: 'Xray Shortcode Test',
						permalink: '/xray-shortcode.html'
					}); 

					return {
						dir: {
							includes: '_includes',
							data:     '_data',
							layouts:  '_includes/layouts'
						},
						templateFormats: ['njk', 'md', '11ty.js'],
						markdownTemplateEngine: 'njk',
						htmlTemplateEngine: 'njk'
					};
				},
			}),
			json = await elev.toJSON(),
			page = json.find(el => el.url === '/xray-shortcode.html');

		// We only check if the shortcode has been rendered by
		// comparing the raw input with the rendered content.		
		expect(page.content).to.not.equal(page.rawInput);
	});
});
