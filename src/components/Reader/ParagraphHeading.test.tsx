import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { ParagraphHeading } from './ParagraphHeading';

test('shows an index filter for a numbered Latin heading line', () => {
  const html = renderToStaticMarkup(<ParagraphHeading
    paragraph={{ type: 'h2', startLine: 20, lines: [{ text: '(20)De natura mentis humanæ' }] }}
    termsByLine={new Map([[20, ['term:la:mens']]])}
  />);
  assert.match(html, /id="line-20"/);
  assert.match(html, /aria-label="Показати терміни з цього рядка"/);
});
