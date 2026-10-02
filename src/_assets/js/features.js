// Switches for parts of the site that are built but not offered yet, in one
// place. Each is read as the page starts; flipping one is a code change and a
// build. (Switching a map off needs neither: remote-config.js.)

export const FEATURES = {
	// the manual (MANUAL.md): the ? button, the top footer's Upute, the H key and
	// the #upute address. Off, the class no-manual goes on the page before the
	// first paint, so nothing flashes up and away
	manual: false,
	// the changelog (CHANGELOG.hr.md): the top footer's Povijest promjena, the C
	// key and the #promjene address, switched off the same way
	changelog: true
};
