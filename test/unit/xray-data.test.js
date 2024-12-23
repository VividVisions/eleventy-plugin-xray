
import { expect } from '#test/chai.js';
import XrayData from '#lib/xray-data.js';
import { isProxy } from 'node:util/types';

describe('XrayData', function() {
	const xrd = new XrayData();

	it('constructor returns Proxy', function() {
		expect(isProxy(xrd)).to.be.true;
	});

	it('constructor sets initial data structure', function() {
		expect('pages' in xrd.data).to.be.true;
		expect('timestamp' in xrd.data).to.be.true;
	});

	it('setting property -> data object', function() {
		xrd.foo = 'bar';
		expect(xrd.data.foo).to.equal('bar');
	});

	it('getting property -> data object', function() {
		expect(xrd.foo).to.equal('bar');
	});

	it('setting property -> XrayData object', function() {
		this.clone = structuredClone(xrd.data);
		xrd.data = 'test';
		expect(xrd.data).to.equal('test');
	});

	it('getting property -> XrayData object', function() {
		expect(xrd.data).to.equal('test');
		xrd.data = this.clone;
	});

	describe('setPageData()', function() {
		it('creates new url key if non-existent', function() {
			xrd.setPageData('https://vividvisions.com', 'testkey', 'testvalue');

			expect(xrd.data.pages).to.deep.equal({
				'https://vividvisions.com': {
					testkey: 'testvalue'
				}
			});
		});

		it('adds to url key if existent', function() {
			xrd.setPageData('https://vividvisions.com', 'testkey2', 'testvalue2');

			expect(xrd.data.pages).to.deep.equal({
				'https://vividvisions.com': {
					testkey: 'testvalue',
					testkey2: 'testvalue2'
				}
			});
		});
	});

	it('toJSON() returns JSON string', function() {
		const json = xrd.toJSON();
		const compare = JSON.stringify(xrd.data);

		expect(json).to.be.a('string');
		expect(json).to.equal(compare);
	});

});
