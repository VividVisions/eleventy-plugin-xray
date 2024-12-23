
import { expect } from '#test/chai.js';
import relativeToRoot from '#lib/utils/relative-to-root.js';


describe('relativeToRoot()', function() {
	
	it('handles root level correctly', function() {
		expect(relativeToRoot('/index.html', '/_xray')).to.equal('./_xray');
	});

	it('handles deeper structure correctly', function() {
		expect(relativeToRoot('/one/index.html', '/_xray')).to.equal('../_xray');
		expect(relativeToRoot('/one/two/index.html', '/_xray')).to.equal('../../_xray');
	});

	it('throws error when one or more paths are not absolute', function() {
		expect(() => {
			relativeToRoot('../rel', '/abs')
		}).to.throw();

		expect(() => {
			relativeToRoot('/abs', './rel')
		}).to.throw();
	});

});
