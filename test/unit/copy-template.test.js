 
import { expect } from '#test/chai.js';
import CopyTemplate from '#lib/copy-template.js';


describe('CopyTemplate (unit)', function() {

	before(function() {
		this.ctmpl = new CopyTemplate('./test/fixtures/11ty-src/_includes/copy.html', '/copy.html');
	});

	it('data() returns Eleventy data structure', function() {
		expect(this.ctmpl.data()).to.deep.equal({ permalink: this.ctmpl.permalink });
	});

	it('render() returns file contents', async function() {
		expect(await this.ctmpl.render()).to.equal('<p>copy</p>');
	});

	it('render() throws on read errors', async function() {
		const ctmpl = new CopyTemplate('___non-existent___.nogo', '/ignore.html');
		await expect(ctmpl.render()).to.be.rejectedWith(Error);
	});

});
