import assert from 'node:assert/strict';
import React, { createElement } from 'react';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { findSegmentsForLine } from '../../src/utils/text-lookup';
import { ParagraphText } from '../../src/components/Reader/ParagraphText';
import type { Page, TextData } from '../../src/types/text';

Object.assign(globalThis, { React });

// A title and two subtitle rows interrupt the body at the actual printed row numbers.
const page: Page = { pageNumber: 23, paragraphs: [
    { lines: Array.from({ length: 18 }, (_, i) => ({ text: `(${i + 1})Body ${i + 1}` })) },
    { type: 'h2', startLine: 19, lines: [{ text: 'Meditatio II' }] },
    { type: 'h3', startLine: 20, lines: [{ text: '(20)De natura mentis humanæ: quod ipsa sit' }, { text: 'notior quam corpus' }] },
    { startLine: 22, lines: [{ text: ' (22)In tantas dubitationes' }, { text: '(23)nequeam (23a)nec' }, { text: '(24)sed, tanquam' }] }
] };
const data = { pages: [page] };
assert.deepEqual(findSegmentsForLine(data, 23, 20), ['20']);
assert.deepEqual(findSegmentsForLine(data, 23, 21), ['20']);
assert.deepEqual(findSegmentsForLine(data, 23, 22), ['22']);
assert.deepEqual(findSegmentsForLine(data, 23, 23), ['23', '23a']);
assert.deepEqual(findSegmentsForLine(data, 23, 24), ['24']);
const html = renderToStaticMarkup(createElement(ParagraphText, { paragraphs: page.paragraphs, language: 'la', verbatim: true }));
for (let n = 1; n <= 24; n++) assert.ok(html.includes(`id="line-${n}"`), `Printed line ${n} must be addressable`);
assert.ok(html.includes('data-segment-id="20"'), 'Subtitle marker must render as an interactive segment');
const legacy = { pageNumber: 1, paragraphs: [{type: 'h1', lines: [{text: 'Title'}]}, {lines: [{text: '(1)Body'}]}] } satisfies Page;
assert.deepEqual(findSegmentsForLine({pages: [legacy]}, 1, 1), ['1']);
const starred = { pages: [{ pageNumber: 1, paragraphs: [{ lines: [{text: '(5)Earlier'}, {text: ' *(6)Next (6a)More'}] }] }] };
assert.deepEqual(findSegmentsForLine(starred, 1, 2), ['6', '6a'], 'A leading asterisk must not include the previous segment');
const latinText: TextData = JSON.parse(readFileSync('public/meditations/text/la.json', 'utf8'));
assert.deepEqual(new Set(findSegmentsForLine(latinText, 17, 13)), new Set(['12', '13']), 'Page 17 line 13 must include the passage containing mentem');
console.log('Printed heading rows, subsequent body lookup, subtitle segments and legacy numbering verified.');
