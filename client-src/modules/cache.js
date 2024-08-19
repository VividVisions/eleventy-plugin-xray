

export default class Cache {
	storage;

	constructor(storageEngine) {
		this.storage = storageEngine || window.sessionStorage;
	}

	get(key, force = false) {
		const result = this.storage.getItem(key);

		if (result === null && force === true) {
			return {};
		}
		else if (result === null) {
			return null;
		}
		else {
			return JSON.parse(result);
		}
	}


	set(key, value) {
		this.storage.setItem(key, (typeof value === 'string') ? value : JSON.stringify(value));
	}
}

const cache = new Cache();

export { cache };
