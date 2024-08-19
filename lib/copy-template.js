
import { readFile } from 'node:fs/promises';
import makeDebug from 'debug';
const debug = makeDebug('xrayplugin:copytempl');


/**
 * A virtual template.
 */
export default class CopyTemplate {
	sourceFile;
	permalink;

	constructor(sourceFile, permalink) {
		this.sourceFile = sourceFile;
		this.permalink = permalink;

		debug('%s, %s', this.sourceFile, this.permalink);
	}

	data() {
		return {
			permalink: this.permalink
		}
	}

	async render() {		
		try {
			return await readFile(this.sourceFile,  { encoding: 'utf8' });
		}
		catch(err) {
			debug(`Error while reading Xray asset file ${this.sourceFile}: ${err.message}`);
			throw new Error(`[xray-plugin] Error while reading Xray asset file ${this.sourceFile}: ${err.message}`, { cause: err });
		}
	}
}
