
const slashRgx = new RegExp('/', 'g');

/**
 * Makes an absolute path relative to the root of another absolute path.
 * 
 * @param {String} absPath - Absolute path to make relative to `relToAbsPath`.
 * @param {String} relToAbsPath - Absolute path to which `absPath` should be relative to.
 * @returns {String} The 
 */
export default function relativeToRoot(relToAbsPath, absPath) {
	if (!relToAbsPath.startsWith('/') || !absPath.startsWith('/')) {
		throw new Error('relativeTo() requires two absolute paths.');
	}

	const count = Math.max(0, (relToAbsPath.match(slashRgx) || []).length - 1);
	return ('../'.repeat(count) || './') + absPath.substring(1);
}
