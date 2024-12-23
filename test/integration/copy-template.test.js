
import { expect } from '#test/chai.js';
import Eleventy from '@11ty/eleventy';
import CopyTemplate from '#lib/copy-template.js';


describe('CopyTemplate (integration)', function() {
	
	it('renders template using another file\'s content', async function() {
		const copyTempl = new CopyTemplate('./test/fixtures/11ty-src/_includes/copy.html', '/copy.html');
		const elev = new Eleventy('./test/fixtures/11ty-src', './test/fixtures/11ty-dest', {
			quietMode: true,
			config: function (eleventyConfig) {
				eleventyConfig.addTemplate('virtual.11ty.js', copyTempl);

				return {
					dir: {
						// input:    './test/fixtures/11ty-src',
						// output:   './test/fixtures/11ty-dest',
						includes: '_includes',
						data:     '_data',
						layouts:  '_includes/layouts'
					},
					templateFormats: ['njk', 'md', '11ty.js'],
					markdownTemplateEngine: 'njk',
					htmlTemplateEngine: 'njk'
				};
			},
		});

		const json = await elev.toJSON();
		const copiedPage = json.find(el => el.url === '/copy.html');

		expect(copiedPage.content).to.equal('<p>copy</p>');
	});

});