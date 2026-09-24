// Finding maps by typed text: the dialog's box and the tab's [+] menu. See
// INTERNALS.md, The settings dialog (Find).

// a term and a map's text as they are compared: the diacritics dropped, and
// đ, which has none to drop, spelled out

/** @param {string} text @returns {string} */
export function foldText(text) {
	return text.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/đ/g, 'd');
}

/** @param {string} text @returns {string[]} */
export function findTerms(text) {
	return foldText(text).split(/\s+/).filter(Boolean);
}

// every term has to hit the map's name or its category
/** @param {import('./catalog.js').CatalogMap} map @param {string[]} terms @returns {boolean} */
export function matchesFind(map, terms) {
	const haystack = foldText(`${map.name} ${map.category}`);
	return terms.every(term => haystack.includes(term));
}
