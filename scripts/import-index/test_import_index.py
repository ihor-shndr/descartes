import unittest
from pathlib import Path

from import_index import import_index, plain


class BookIndexTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = import_index(Path(__file__).resolve().parents[2] / 'public/original-index.pdf')

    def article(self, language, name):
        return next(e for e in self.data[language] if e['term'] == name)

    def targets(self, entry):
        return [s['target'] for row in entry['bookLines'] for s in row['spans'] if s.get('target')]

    def test_complete_article_inventory(self):
        self.assertEqual([len(self.data[x]) for x in ['la', 'fr']], [29, 20])
        self.assertTrue(all(e['occurrences'] for entries in self.data.values() for e in entries))
        self.assertTrue(all(e['term'] not in ['GT', 'TL', 'intellectus', 'praeconcepta'] for e in self.data['fr']))

    def test_superscript_is_not_part_of_latin_line_number(self):
        e = self.article('la', 'perspectus, perspicuus')
        self.assertIn({'page': 13, 'line': 8}, self.targets(e))
        self.assertNotIn({'page': 13, 'line': 38}, self.targets(e))
        self.assertTrue(any(t.get('position') == 'sup' and t['text'] == '3'
                            for r in e['bookLines'] for t in r['spans']))

    def test_french_missing_references_and_special_block(self):
        e = self.article('fr', 'perception')
        targets = self.targets(e)
        for target in [{'page': 31, 'line': 0, 'segment': '22'},
                       {'page': 81, 'line': 0, 'segment': '22a'},
                       {'page': 83, 'line': 0, 'segment': '15'}]:
            self.assertIn(target, targets)
        self.assertTrue(any('ces sentiments ou perceptions des sens' in plain(r) for r in e['bookLines']))
        self.assertEqual(sum(len(p['lines']) for o in e['occurrences'] for p in o['pages']), 9)

    def test_page_397_special_blocks_and_blank_counts_are_preserved(self):
        e = self.article('fr', 'faculté (puissance) de concevoir')
        self.assertIsNone(e['count'])
        self.assertIn({'page': 58, 'line': 0, 'segment': '17a'}, self.targets(e))
        self.assertTrue(any('puissance d’entendre ou de concevoir' in plain(r) for r in e['bookLines']))
        self.assertTrue(any(t.get('italic') for r in e['bookLines'] for t in r['spans']))
        self.assertTrue(any(t.get('position') == 'sup' and 'TL' in t['text']
                            for r in e['bookLines'] for t in r['spans']))

    def test_continuations_across_pages(self):
        e = self.article('fr', 'pensée')
        self.assertEqual({r['sourcePage'] for r in e['bookLines']}, {397, 398})
        self.assertTrue(any('meditatio' in plain(r) for r in e['bookLines']))
        self.assertIn({'page': 86, 'line': 0, 'segment': '11'}, self.targets(e))

    def test_french_page_numbers_with_labels_and_wrapped_references(self):
        for term, page, segment in [
            ('âme', 14, '9'), ('âme', 26, '7'), ('âme', 27, '2'),
            ('concevoir', 30, '29a'), ('esprit', 55, '22'),
            ('esprit', 62, '3'), ('pensée', 41, '19'),
        ]:
            with self.subTest(term=term, page=page, segment=segment):
                self.assertIn({'page': page, 'line': 0, 'segment': segment}, self.targets(self.article('fr', term)))

    def test_printed_latin_semicolon_between_page_and_line(self):
        targets = self.targets(self.article('la', 'evidentissimus(-me)'))
        self.assertIn({'page': 70, 'line': 7}, targets)
        self.assertNotIn({'page': 69, 'line': 70}, targets)

    def test_book_anomalies_are_not_silently_corrected(self):
        e = self.article('la', 'anima')
        self.assertEqual(e['count'], 11)
        self.assertEqual(sum(o['count'] for o in e['occurrences']), 12)
        self.assertEqual(sum(len(p['lines']) for o in e['occurrences'] for p in o['pages']), 11)
        self.assertIn({'page': 17, 'line': 0}, self.targets(e))

    def test_anima_link_preserves_the_printed_reference_but_targets_the_word(self):
        entry = self.article('la', 'anima')
        link = next(s for row in entry['bookLines'] for s in row['spans']
                    if s.get('target', {}).get('printedLine') == 7)
        self.assertEqual(link['text'], '7')
        self.assertEqual(link['target'], {'page': 1, 'line': 8, 'printedLine': 7, 'alignedSegment': '6a'})
        self.assertEqual(entry['occurrences'][0]['pages'][0]['lines'], [{'line': 8}, {'line': 10}])


if __name__ == '__main__':
    unittest.main()
