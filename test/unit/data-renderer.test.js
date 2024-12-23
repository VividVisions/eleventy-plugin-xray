
import { expect } from '#test/chai.js';
import { noWs } from '#test/helpers.js';
import { render, renderObj } from '#lib/data-renderer.js';


function getHtml(mockObj) {
	return `<li><code class="${mockObj.type}"></code></li>`;
}

function getHtmlWithContent(mockObj) {
	return `<li><code class="${mockObj.type}"><span>${mockObj?.content || ''}</span></code></li>`;
}

describe('DataRenderer', function() {
	
	it('throws unknown data type', function() {
		const mockObj = { key: 'test', type: 'my name is jeff' };
		expect(() => render(mockObj)).to.throw();
	});

	it('renders <ul>', function() {
		const mockObj = { key: 'test', type: 'undefined' };
		expect(noWs(render(mockObj))).to.equal(noWs`<ul class="root"><li>${mockObj.key}: <code class="${mockObj.type}"></code></li></ul>`);
	});

	it('renders data with key', function() {
		const mockObj = { key: 'test', type: 'undefined' };
		expect(renderObj(mockObj)).to.equal(`<li>${mockObj.key}: <code class="${mockObj.type}"></code></li>`);
	});

	it('renders data without key', function() {
		const mockObj = { type: 'undefined' };
		expect(renderObj(mockObj)).to.equal(getHtml(mockObj));
	});

	it('renders primitive data without content', function() {
		const mockObj = { type: 'string' };
		expect(renderObj(mockObj)).to.equal(getHtmlWithContent(mockObj));
	});

	it('renders data source tooltips', function() {
		let mockObj = { key: 'test', type: 'undefined', where: 'f' };
		expect(renderObj(mockObj)).to.equal(`<li><span class="where" title="Front matter">${mockObj.key}: </span><code class="${mockObj.type}"></code></li>`);

		mockObj = { key: 'test', type: 'undefined', where: 'd' };
		expect(renderObj(mockObj)).to.equal(`<li><span class="where" title="Directory">${mockObj.key}: </span><code class="${mockObj.type}"></code></li>`);

		mockObj = { key: 'test', type: 'undefined', where: 't' };
		expect(renderObj(mockObj)).to.equal(`<li><span class="where" title="Template/Layout">${mockObj.key}: </span><code class="${mockObj.type}"></code></li>`);
	});

	describe('data types', function() {
	
		it('renders undefined', function() {
			const mockObj = { type: 'undefined' };
			expect(renderObj(mockObj)).to.equal(getHtml(mockObj));
		});

		it('renders null', function() {
			const mockObj = { type: 'null' };
			expect(renderObj(mockObj)).to.equal(getHtml(mockObj));
		});

		it('renders boolean', function() {
			const mockObj = { type: 'boolean', content: 'true' };
			expect(renderObj(mockObj)).to.equal(getHtmlWithContent(mockObj));
		});

		it('renders numbers', function() {
			const mockObj = { type: 'number', content: '1' };
			expect(renderObj(mockObj)).to.equal(getHtmlWithContent(mockObj));
		});

		it('renders bigint', function() {
			const mockObj = { type: 'bigint', content: '1' };
			expect(renderObj(mockObj)).to.equal(getHtmlWithContent(mockObj));
		});

		it('renders strings', function() {
			const mockObj = { type: 'bigint', content: '1' };
			expect(renderObj(mockObj)).to.equal(getHtmlWithContent(mockObj));
		});

		it('renders symbols', function() {
			const mockObj = { type: 'symbol', content: 'xraySym' };
			expect(renderObj(mockObj)).to.equal(getHtmlWithContent(mockObj));
		});

		it('renders functions', function() {
			const mockObj = { type: 'function', content: 'xrayFunc' };
			expect(renderObj(mockObj)).to.equal(getHtmlWithContent(mockObj));
		});

		it('renders instances', function() {
			const mockObj = { type: 'instance', content: 'xrayInst' };
			expect(renderObj(mockObj)).to.equal(getHtmlWithContent(mockObj));
		});

		it('renders objects (empty)', function() {
			const mockObj = { type: 'object' };
			expect(renderObj(mockObj)).to.equal(getHtml(mockObj));
		});

		it('renders objects (with content)', function() {
			const mockObj = { key: 'test', type: 'object', length: 1, content: [{ key: 'c', type: 'string', content: 'xrayStr' }] };
			expect(noWs(renderObj(mockObj))).to.equal(noWs`<li>
					<ul class="tree">
						<label>${mockObj.key}: <code class="${mockObj.type}"><span>${mockObj.content.length}</span></code></label>
						<li>${mockObj.content[0].key}: <code class="${mockObj.content[0].type}"><span>${mockObj.content[0].content}</span></code></li>
					</ul>
				</li>`);
		});

		it('renders objects (with content, depth > 0)', function() {
			const mockObj = { key: 'test', type: 'object', length: 1, content: [{ key: 'c', type: 'string', content: 'xrayStr' }] };
			expect(noWs(renderObj(mockObj, 1))).to.equal(noWs`<li>
					<ul class="tree closed">
						<label>${mockObj.key}: <code class="${mockObj.type}"><span>${mockObj.content.length}</span></code></label>
						<li>${mockObj.content[0].key}: <code class="${mockObj.content[0].type}"><span>${mockObj.content[0].content}</span></code></li>
					</ul>
				</li>`);
		});

		it('renders arrays (empty)', function() {
			const mockObj = { type: 'array', length: '0', content: [] };
			expect(renderObj(mockObj)).to.equal(`<li><code class="${mockObj.type}"><span>${mockObj.length}</span></code></li>`);
		});

		it('renders arrays (with content)', function() {
			const mockObj = { key: 'test', type: 'array', length: 1, content: [{ type: 'string', content: 'xrayStr' }] };
			expect(noWs(renderObj(mockObj))).to.equal(noWs`<li>
					<ul class="tree">
						<label>${mockObj.key}: <code class="${mockObj.type}"><span>${mockObj.content.length}</span></code></label>
						<li><code class="${mockObj.content[0].type}"><span>${mockObj.content[0].content}</span></code></li>
					</ul>
				</li>`);
		});

		it('renders arrays (with content, depth > 0)', function() {
			const mockObj = { key: 'test', type: 'array', length: 1, content: [{ type: 'string', content: 'xrayStr' }] };
			expect(noWs(renderObj(mockObj, 1))).to.equal(noWs`<li>
					<ul class="tree closed">
						<label>${mockObj.key}: <code class="${mockObj.type}"><span>${mockObj.content.length}</span></code></label>
						<li><code class="${mockObj.content[0].type}"><span>${mockObj.content[0].content}</span></code></li>
					</ul>
				</li>`);
		});

		it('renders regular expressions', function() {
			const mockObj = { type: 'regexp', content: '/xrayRegex/' };
			expect(renderObj(mockObj)).to.equal(getHtmlWithContent(mockObj));
		});

		it('renders dates', function() {
			const date = new Date();
			const mockObj = { type: 'date', content: date.toISOString() };
			expect(renderObj(mockObj)).to.equal(getHtmlWithContent(mockObj));
		});

		it('renders maps (empty)', function() {
			const  mockObj = { type: 'map', content: new Map(), length: '0' };
			expect(renderObj(mockObj)).to.equal(`<li><code class="${mockObj.type}"><span>${mockObj.length}</span></code></li>`);
		});

		it('renders maps (with content)', function() {
			const mockObj = { key: 'test', type: 'map', length: 1, content: [{ key: 'key', type: 'string', content: 'xrayStr' }] };
			expect(noWs(renderObj(mockObj))).to.equal(noWs`<li>
					<ul class="tree">
						<label>${mockObj.key}: <code class="${mockObj.type}"><span>${mockObj.content.length}</span></code></label>
						<li>${mockObj.content[0].key}: <code class="${mockObj.content[0].type}"><span>${mockObj.content[0].content}</span></code></li>
					</ul>
				</li>`);
		});

		it('renders maps (with content, depth > 0)', function() {
			const mockObj = { key: 'test', type: 'map', length: 1, content: [{ key: 'key', type: 'string', content: 'xrayStr' }] };
			expect(noWs(renderObj(mockObj, 1))).to.equal(noWs`<li>
					<ul class="tree closed">
						<label>${mockObj.key}: <code class="${mockObj.type}"><span>${mockObj.content.length}</span></code></label>
						<li>${mockObj.content[0].key}: <code class="${mockObj.content[0].type}"><span>${mockObj.content[0].content}</span></code></li>
					</ul>
				</li>`);
		});

		it('renders sets (empty)', function() {
			let mockObj = { type: 'array', length: '0', content: new Set() };
			expect(renderObj(mockObj)).to.equal(`<li><code class="${mockObj.type}"><span>${mockObj.length}</span></code></li>`);
		});

		it('renders sets (with content)', function() {
			const mockObj = { key: 'test', type: 'set', length: 1, content: [{ type: 'string', content: 'xrayStr' }] };
			expect(noWs(renderObj(mockObj))).to.equal(noWs`<li>
					<ul class="tree">
						<label>${mockObj.key}: <code class="${mockObj.type}"><span>${mockObj.content.length}</span></code></label>
						<li><code class="${mockObj.content[0].type}"><span>${mockObj.content[0].content}</span></code></li>
					</ul>
				</li>`);
		});

		it('renders sets (with content, depth > 0)', function() {
			const mockObj = { key: 'test', type: 'set', length: 1, content: [{ type: 'string', content: 'xrayStr' }] };
			expect(noWs(renderObj(mockObj, 1))).to.equal(noWs`<li>
					<ul class="tree closed">
						<label>${mockObj.key}: <code class="${mockObj.type}"><span>${mockObj.content.length}</span></code></label>
						<li><code class="${mockObj.content[0].type}"><span>${mockObj.content[0].content}</span></code></li>
					</ul>
				</li>`);
		});

		it('renders circular references', function() {
			const mockObj = { type: 'circular', content: 'xrayCirc' };
			expect(renderObj(mockObj)).to.equal(getHtmlWithContent(mockObj));
		});
	});

});