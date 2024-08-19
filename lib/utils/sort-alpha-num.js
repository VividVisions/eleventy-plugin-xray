
/**
 * Compares two strings alphabetically and numerically.
 * Used for array sorting.
 * 
 * @param {String} a - String a.
 * @param {String} b - String b.
 * @returns {Number} A negative number if string a occurs before string b. 
 *  A positive number if string a occurs after string b. 
 *  0 if both strings are equivalent.
 */
export default function sortAlphNum(a, b) {
	return a.localeCompare(b, Intl.Collator.supportedLocalesOf(), { numeric: true });
}
