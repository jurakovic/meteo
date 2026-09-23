// Storage that fails is nothing stored, never an error
import './setup.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readJson, removeKey, writeJson } from '../../src/_assets/js/lib/storage.js';

test('values round-trip as JSON', () => {
	writeJson('k', { a: [1, 'č'] });
	assert.deepEqual(readJson('k'), { a: [1, 'č'] });
	removeKey('k');
	assert.equal(readJson('k'), null);
});

test('unreadable or failing storage reads as nothing and writes nowhere', () => {
	localStorage.setItem('bad', '{not json');
	assert.equal(readJson('bad'), null);
	const saved = globalThis.localStorage;
	globalThis.localStorage = {
		getItem() { throw new Error('denied'); },
		setItem() { throw new Error('full'); },
		removeItem() { throw new Error('denied'); }
	};
	try {
		assert.equal(readJson('k'), null);
		assert.doesNotThrow(() => writeJson('k', 1));
		assert.doesNotThrow(() => removeKey('k'));
	} finally {
		globalThis.localStorage = saved;
	}
});

test('a write storage refused is still read back for the rest of the session', () => {
	const saved = globalThis.localStorage;
	globalThis.localStorage = {
		getItem() { return '"old"'; },
		setItem() { throw new Error('full'); },
		removeItem() {}
	};
	try {
		writeJson('prefs', { preset: 'radari' });
		assert.deepEqual(readJson('prefs'), { preset: 'radari' });
		removeKey('prefs');
		assert.equal(readJson('prefs'), 'old');
	} finally {
		globalThis.localStorage = saved;
	}
});
