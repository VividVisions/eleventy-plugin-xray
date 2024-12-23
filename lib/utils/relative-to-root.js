
const slashRgx = new RegExp('/', 'g');

/**
 * Makes an absolute path relative to the root of another absolute path.
 * 
 * (This function is pretty stupid. It only counts the number of directories in
 * `originPath` and adds the relative path elements to `destinationPath` accordingly.
 * It doesn't need to be smarter since it's only used to generate relative paths
 * from generated HTML pages to the configured Xray directory.)
 * 
 * @param {String} originPath - Absolute path to make relative to `destinationPath`.
 * @param {String} destinationPath - Absolute path to which `originPath` should be relative to.
 * @returns {String} The relative path from `originPath` to `destinationPath`.
 * @since 1.0.0
 */
export default function relativeToRoot(originPath, destinationPath) {
	if (!originPath.startsWith('/') || !destinationPath.startsWith('/')) {
		throw new Error('relativeTo() requires two absolute paths.');
	}

	const count = Math.max(0, originPath.match(slashRgx).length - 1);
	return ('../'.repeat(count) || './') + destinationPath.substring(1);
}
