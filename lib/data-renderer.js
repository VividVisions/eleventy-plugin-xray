
import escape from 'escape-html';


/**
 * Returns the rendered HTML of the passed data descriptor object.
 * 
 * @param {Object} dataDescriptors - The data descriptor object.
 * @returns {String} The rendered HTML.
 */
export function render(dataDescriptors) {
	return `<ul class="root">${renderObj(dataDescriptors)}</ul>`;
}


/**
 * Recursively renders parsed data descriptors into custom HTML elements.
 * 
 * @param {Object} obj - The data descriptor structure.
 * @param {Number} depth - The depth of the current descriptor item.
 */
function renderObj(obj, depth = 0) {
	const keyString = (obj?.key) ? escape(obj.key) + ': ' : '';

	switch (obj.type) {
		case 'string':
		case 'number':
		case 'boolean':
		case 'regexp':
		case 'symbol':
		case 'date':
		case 'instance':
		case 'circular':
		case 'function':
		case 'unknown':
			return `<li>${keyString}<code class="${obj.type}"><span>${(obj.content) ? escape(obj.content) : ''}</span></code></li>`;

		case 'null':
		case 'undefined':
			return `<li>${keyString}<code class="${obj.type}"></code></li>`;

		case 'object':
			if (obj.content && obj.content.length > 0) {
				return `<li>
				<ul class="tree ${ depth > 0 ? ' closed': ''}">
					<label>${keyString}<code class="${obj.type}"></code></label>
					${obj.content.map(o => renderObj(o, depth + 1)).join('')}
				</ul>
				</li>`;
			}
			else {
				return `<li>${keyString}<code class="${obj.type}"></code></li>`;
			}

		case 'set':
		case 'map':
		case 'array':
			if (obj?.content?.length > 0) {
				return `<li>
				<ul class="tree${ depth > 0 ? ' closed': ''}">
					<label>${keyString}<code class="${obj.type}"><span>${obj.length}</span></code></label>
					${obj.content.map(o => renderObj(o, depth + 1)).join('')}
				</ul>
				</li>`;
			}
			else {
				return `<li>${keyString}<code class="${obj.type}"><span>${obj.length}</span></code></li>`;
			}

		default:
			throw new Error(`[xray-plugin] Unknown data type '${obj.type}' encountered.`);
	}
}

