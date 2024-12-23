
import { expect } from '#test/chai.js';
import Eleventy from '@11ty/eleventy';
import getBenchmarks from '#lib/get-benchmarks.js';


describe('getBenchmarks()', function() {
	
	it('returns Eleventy\'s benchmarks (single page)', async function() {
		let benchmarks;
		const 
			elev = new Eleventy('./test/fixtures/11ty-src', './test/fixtures/11ty-dest', {
				quietMode: true,
				config: function (eleventyConfig) {

					eleventyConfig.on('eleventy.after', async ({ dir, results, runMode, outputMode }) => {
						results.forEach(r => {
								benchmarks = getBenchmarks(r.inputPath, eleventyConfig);
						});
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
			json = await elev.toJSON();

		expect(benchmarks).to.have.all.keys(['render', 'compile']);
		expect(benchmarks.render).to.be.a('number');
		expect(benchmarks.compile).to.be.a('number');
	});


	it('returns Eleventy\'s benchmarks (paginated)', async function() {
		const benchmarks = [];
		const 
			elev = new Eleventy('./test/fixtures/11ty-src', './test/fixtures/11ty-dest', {
				quietMode: true,
				config: function (eleventyConfig) {

					eleventyConfig.addTemplate('virtual.njk', '{{ item }}', {
							title: 'Pagination test {{ item }}',
							pagination: {
								data: 'testdata',
								size: 1,
								alias: 'item'
							},
							testdata: ['item1', 'item2', 'item3']
						}); 

					eleventyConfig.on('eleventy.after', async ({ dir, results, runMode, outputMode }) => {
						results.forEach(r => {
								benchmarks.push(getBenchmarks(r.inputPath, eleventyConfig));
						});
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
			paginatedBM = benchmarks.pop();

		expect(paginatedBM).to.have.all.keys(['render', 'compile', 'paginated', 'renderEach']);
		expect(paginatedBM.paginated).to.be.a('number');
		expect(paginatedBM.renderEach).to.be.a('number');
	});


});