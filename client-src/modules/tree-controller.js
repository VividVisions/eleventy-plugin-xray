/*
customElements.define('xray-tree', class XRayTree extends HTMLElement {
	
	#boundClickHandler;
	#label;

	constructor() {
		super();
		this.#boundClickHandler = this.#clickHandler.bind(this);
	}

	connectedCallback() {
		this.#label = this.querySelector('label');
		this.#label.addEventListener('click', this.#boundClickHandler);
	}

	disconnectedCallback() {
		this.#label.removeEventListener('click', this.#boundClickHandler);	
	}

	#clickHandler(event) {
		const tree = event.target.closest('xray-tree');
		tree.toggleAttribute('closed');

		if (event.altKey) {
			tree.querySelectorAll('xray-tree').forEach(subTree => {
				subTree.toggleAttribute('closed', tree.hasAttribute('closed'));
			});
		}
	}

});
*/

export default class TreeController {
	element;
	label;
	boundClickHandler;

	constructor(element) {
		this.element = element;
		this.label = this.element.querySelector('label');

		this.boundClickHandler = this.clickHandler.bind(this);
		this.label.addEventListener('click', this.boundClickHandler);
	}


	clickHandler(event) {
		const tree = event.target.closest('ul.tree');
		tree.classList.toggle('closed');

		if (event.altKey) {
			tree.querySelectorAll('ul.tree').forEach(subTree => {
				subTree.classList.toggle('closed', tree.classList.contains('closed'));
			});
		}
	}

}
