// Finding maps by typed text: the dialog's box and the tab's [+] menu.
//
// what a typed term and a map's text are both put through before they are
// compared, so the box answers to a keyboard without the letters: NFD splits
// a diacritic off the letter it sits on and the combining mark is dropped
// ("chmu" finds ČHMÚ). A stroke is not a combining mark and survives that —
// đ is one code point of its own — so it is spelled out

export function foldText(text) {
	return text.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/đ/g, 'd');
}

export function findTerms(text) {
	return foldText(text).split(/\s+/).filter(Boolean);
}

// the category as well as the name, so a kind of map ("satelit", "munje")
// narrows the list the way a source does; every term has to hit somewhere,
// which is what lets two words ("neverin radar") come down to one map. Shared
// by the dialog's box and the tab's [+]
export function matchesFind(map, terms) {
	const haystack = foldText(`${map.name} ${map.category}`);
	return terms.every(term => haystack.includes(term));
}
