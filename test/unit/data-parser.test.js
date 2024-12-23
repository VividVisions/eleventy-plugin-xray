
import { expect } from '#test/chai.js';
import DataParser from '#lib/data-parser.js';


describe('DataParser', function() {
	
	it('sets default options', function() {
		const dp = new DataParser();
		expect(dp.options).to.deep.equal(DataParser.defaultOptions);
	});

	it('overwrites options', function() {
		const opt = { maxDepth: 1, cutoff: 2, foo: 3, locale: null };
		const dp = new DataParser(opt);
		expect(dp.options).to.deep.equal(opt);
	});

	describe('determineType()', function() {
		const dp = new DataParser();

		it('recognizes undefined', function() {
			expect(dp.determineType(undefined)).to.equal('undefined');
		});

		it('recognizes null', function() {
			expect(dp.determineType(null)).to.equal('null');
		});

		it('recognizes booleans', function() {
			expect(dp.determineType(true)).to.equal('boolean');
		});

		it('recognizes numbers', function() {
			expect(dp.determineType(1)).to.equal('number');
			expect(dp.determineType(new Number(1))).to.equal('number');
		});

		it('recognizes bigint', function() {
			expect(dp.determineType(BigInt(1))).to.equal('bigint');
		});

		it('recognizes strings', function() {
			expect(dp.determineType('str')).to.equal('string');
			expect(dp.determineType(new String('str'))).to.equal('string');
		});

		it('recognizes symbols', function() {
			expect(dp.determineType(Symbol('test'))).to.equal('symbol');
		});

		it('recognizes functions', function() {
			expect(dp.determineType(() => {})).to.equal('function');
			expect(dp.determineType(function() {})).to.equal('function');
			expect(dp.determineType(new Function())).to.equal('function');
		});

		it('recognizes instances', function() {
			class Test {}
			expect(dp.determineType(new Test())).to.equal('instance');
		});

		it('recognizes objects', function() {
			expect(dp.determineType({})).to.equal('object');
			expect(dp.determineType(new Object())).to.equal('object');
		});

		it('recognizes arrays', function() {
			expect(dp.determineType([1])).to.equal('array');
			expect(dp.determineType(new Array(1))).to.equal('array');
		});

		it('recognizes regular expressions', function() {
			expect(dp.determineType(/^$/)).to.equal('regexp');
			expect(dp.determineType(new RegExp('^$'))).to.equal('regexp');
		});

		it('recognizes dates', function() {
			expect(dp.determineType(new Date())).to.equal('date');
		});

		it('recognizes maps', function() {
			expect(dp.determineType(new Map())).to.equal('map');
		});

		it('recognizes sets', function() {
			expect(dp.determineType(new Set())).to.equal('set');
		});

	});


	describe('determineContent()', function() {
		const dp = new DataParser();

		it('handles undefined (no content)', function() {
			const data = { type: 'undefined' };
			dp.determineContent(data, undefined);
			expect(data.content).to.be.undefined;
		});

		it('handles null (no content)', function() {
			const data = { type: 'null' };
			dp.determineContent(data, null);
			expect(data.content).to.be.undefined;
		});

		it('handles booleans (string representation)', function() {
			const data = { type: 'boolean' };
			dp.determineContent(data, true);
			expect(data.content).to.equal('true');
		});

		it('handles numbers (string representation)', function() {
			const data = { type: 'number' };
			dp.determineContent(data, 1);
			expect(data.content).to.equal('1');		
		});

		it('handles bigint (string representation)', function() {
			const data = { type: 'bigint' };
			dp.determineContent(data, 1);
			expect(data.content).to.equal('1');	
		});

		it('handles strings (string representation)', function() {
			const data = { type: 'string' };
			dp.determineContent(data, 'str');
			expect(data.content).to.equal('str');	
		});

		it('handles symbols (description)', function() {
			const data = { type: 'symbol' };
			dp.determineContent(data, Symbol('test'));
			expect(data.content).to.equal('test');	
		});

		it('handles functions (name or anonymous)', function() {
			const data = { type: 'function' };
			dp.determineContent(data, function testFunc() {});
			expect(data.content).to.equal('testFunc');	

			dp.determineContent(data, function() {});
			expect(data.content).to.equal('anonymous');	
		});

		it('handles instances (class name)', function() {
			class Test {}
			const data = { type: 'instance' };
			dp.determineContent(data, new Test());
			expect(data.content).to.equal('Test');	
		});

		it('handles objects (empty array, key length)', function() {
			const data = { type: 'object' };
			dp.determineContent(data, { foo: 'bar', baz: '2' });
			expect(data.content).to.deep.equal([]);
			expect(data.length).to.equal(2);	// Number of keys.
		});

		it('handles arrays (empty array, item count)', function() {
			const data = { type: 'array' };
			dp.determineContent(data, [1, 2, 3]);
			expect(data.content).to.deep.equal([]);
			expect(data.length).to.equal(3);	// Number of items.
		});

		it('handles regular expressions (string representation)', function() {
			const data = { type: 'regexp' };
			const r = /^abc$/;
			dp.determineContent(data, r);
			expect(data.content).to.equal(r.toString());
		});

		it('handles dates (ISO string)', function() {
			const data = { type: 'date' };
			const d = new Date();
			dp.determineContent(data, d);
			expect(data.content).to.equal(d.toISOString());
		});

		it('handles maps (empty array, item count)', function() {
			const data = { type: 'map' };
			dp.determineContent(data, new Map([[1, 'one'], [2, 'two'], [3, 'three']]));
			expect(data.content).to.deep.equal([]);
			expect(data.length).to.equal(3);	// Number of items.
		});

		it('handles sets (empty array, item count)', function() {
			const data = { type: 'set' };
			dp.determineContent(data, new Set([1, 2, 3, 4]));
			expect(data.content).to.deep.equal([]);
			expect(data.length).to.equal(4);	// Number of items.
		});

		it('cuts string content with length > options.cutoff', function() {
			dp.options.cutoff = 5;
			const data = { type: 'string' };
			dp.determineContent(data, 'abcdefgh');
			expect(data.content).to.equal('abcde…');
		});
	});

});
