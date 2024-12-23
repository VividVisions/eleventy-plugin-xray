
/**
 * Removes whitespaces between HTML tags.
 * Can be used as function with a string parameter or as tag function for template literals.
 * Used in tests to be able to ignore possible whitespace differences of HTML code.
 * 
 * @param {string|Array} strings - Either the HTML string or the strings of the template literal.
 * @param {...string} [expressions] - The expressions of the template literal.
 * @returns {string} The string without whitespaces.
 */
export function noWs(strings, ...expressions) {
	let str;

	if (typeof strings === 'string') {
		str = strings;
	}
	else {
		str = strings.flatMap((str, idx) => idx < expressions.length ? [str, expressions[idx]] : str).join('');
	}

	return str.replace(/(?<=\>)\s+(?=\<)/g, '');
}
