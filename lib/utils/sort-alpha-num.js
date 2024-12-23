
/**
 * Returns a sorting function which compares two strings alphabetically 
 * and numerically. Used to sort keys of objects and maps.
 * 
 * @param {String|Array} locale - The locale to use for the comparison. 
 *   Can be a `string` or an `array` of locales. Default is 'en-US'.
 * @returns {Function} A sorting function to be used with `Array.prototype.sort()`.
 * @since 1.0.0
 */
export default function sortAlphNum(locale = 'en-US') {
	return (a, b) => a.localeCompare(b, Intl.Collator.supportedLocalesOf(locale), { numeric: true });
}
