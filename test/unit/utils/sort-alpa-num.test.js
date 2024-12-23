
import { expect } from '#test/chai.js';
import sortAlphNum from '#lib/utils/sort-alpha-num.js';


describe('sortAlphNum()', function() {
	
	it('returns sorting functions', function() {
		expect(sortAlphNum()).to.be.a('function');
	});

	it('sorts alphanumerically', function() {
		const a = ['1', 'B', '100', '10', '2', 'A10', 'A2', 'A1', 'A'];
		expect(a.sort(sortAlphNum('de-at'))).to.deep.equal(['1', '2', '10', '100', 'A', 'A1', 'A2', 'A10', 'B']);
	});

});
