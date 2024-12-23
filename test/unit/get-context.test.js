
import { expect } from '#test/chai.js';
import getContext from '#lib/get-context.js';

const mockNunjucksCtx = { 
	ctx: {
		nunjucks: true
	}
};

const mockLiquidCtx = { 
	ctx: {
		environments: {
			liquid: true
		}
	}
};


describe('getContext()', function() {
	
	it('returns Liquid context', function() {
		expect(getContext(mockLiquidCtx)).to.deep.equal({ liquid: true });
	});


	it('returns Nunjucks context', function() {
		expect(getContext(mockNunjucksCtx)).to.deep.equal({ nunjucks: true })
	});

	it('returns undefined when structure unknown', function() {
		expect(getContext({ foo: 'bar' })).to.be.undefined;
	});

});
