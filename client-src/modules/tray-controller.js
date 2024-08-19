
import { cache } from './cache.js';

export default class TrayController {
	element;
	xrayElement;
	xrayRootElement;

	boundClickHandler;

	constructor(element, xrayRootElement, xrayElement) {
		this.element = element;
		this.xrayRootElement = xrayRootElement;
		this.xrayElement = xrayElement;

		this.boundClickHandler = this.clickHandler.bind(this);

 		this.element.querySelectorAll('a').forEach(a => {
			a.addEventListener('click', this.boundClickHandler);
		});
	}

	clickHandler(event) {
		const li = event.target.closest('li'); 
		li.classList.toggle('active');

		// It's the Xray button.
		if (li.classList.contains('xray')) {
			this.xrayElement.classList.toggle('active');
			this.xrayRootElement.classList.toggle('active');
		}
		// It's one of the others.
		else {
			const 
				hide = cache.get('xray:hide', true),
				name = li.classList.values().next().value,
				block = this.xrayRootElement.shadowRoot.getElementById(name);

			if (block) {
				block.classList.toggle('active');
			}
							
			if (!li.classList.contains('active')) {
				hide[name] = true;
			}
			else {
				delete hide[name];
			}
							
			cache.set('xray:hide', hide);
		}

		event.preventDefault();
	}

}

