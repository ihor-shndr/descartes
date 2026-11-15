"""Checks the import boundary: bad/incomplete output cannot change site JSON."""
import argparse
import importlib.util
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('import_pages', Path(__file__).with_name('import_pages.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


class ImportTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.folder = self.root / '020'
        self.manifest = {'pageNumber': 20, 'sourceSha256': 'source', 'pdfPages': [148, 149]}
        self.result = dict(self.manifest, texts={lang: {'pageNumber': 20, 'paragraphs': [{'lines': [' (2)Text']}]}
                                                for lang in m.LANGS},
                           review={'imagesInspected': True, 'paragraphsAndHeadingsChecked': True,
                                   'latinBodyLineCount': 1, 'issues': [], 'markerDifferences': []})
        m.write(self.folder / 'input.json', self.manifest)
        self.old_texts = m.TEXTS
        m.TEXTS = self.root / 'site'
        for lang in m.LANGS:
            m.write(m.TEXTS / f'{lang}.json', {'pages': []})

    def tearDown(self):
        m.TEXTS = self.old_texts
        self.temp.cleanup()

    def validate(self):
        m.write(self.folder / 'result.json', self.result)
        return m.validate(self.folder)[0]

    def test_missing_language_and_unresolved_problem_block(self):
        self.result['texts'].pop('fr')
        self.assertTrue(self.validate())
        self.result['texts']['fr'] = self.result['texts']['la']
        self.result['review']['issues'] = ['Unreadable word']
        self.assertTrue(self.validate())

    def test_wrong_source_and_cyrillic_suffix_block(self):
        self.result['sourceSha256'] = 'different'
        self.assertTrue(self.validate())
        self.result['sourceSha256'] = 'source'
        self.result['texts']['la']['paragraphs'][0]['lines'] = [' (2а)Text']
        self.assertTrue(self.validate())

    def test_marker_difference_needs_explanation(self):
        self.result['texts']['fr']['paragraphs'][0]['lines'] = [' (3)Texte']
        self.assertTrue(self.validate())
        self.result['review']['markerDifferences'] = [{'language': 'fr', 'reason': 'Verified different printed marker on image'}]
        self.assertEqual(self.validate(), [])

    def test_printed_line_metadata_must_progress(self):
        self.result['texts']['la']['paragraphs'] = [{'type': 'h3', 'startLine': 20, 'lines': ['(20)Title', 'Subtitle']}, {'startLine': 22, 'lines': ['(22)Body']}]
        for lang in m.LANGS[1:]:
            self.result['texts'][lang]['paragraphs'] = [{'lines': ['(20)Title (22)Body']}]
        self.assertEqual(self.validate(), [])
        self.result['texts']['la']['paragraphs'][1]['startLine'] = 21
        self.assertTrue(self.validate())

    def test_source_duplicate_needs_evidence(self):
        for lang in m.LANGS:
            self.result['texts'][lang]['paragraphs'][0]['lines'] = [' (2)One (2)Two']
        self.assertTrue(self.validate())
        self.result['review']['duplicateMarkers'] = [{'language': lang, 'marker': '2', 'reason': 'Both occurrences inspected in source image'} for lang in m.LANGS]
        self.assertEqual(self.validate(), [])

    def test_verified_source_absence_is_skipped(self):
        self.result['texts']['fr'] = None
        self.result['texts']['fr-ua'] = None
        self.assertTrue(self.validate())
        self.result['review']['unavailableLanguages'] = {'fr': 'PDF publishes Latin preface only', 'fr-ua': 'No French translation block on source page'}
        self.assertEqual(self.validate(), [])
        m.merge(argparse.Namespace(work=self.root, pages=[20]))
        self.assertEqual(m.read(m.TEXTS / 'fr.json')['pages'], [])
        self.assertEqual(len(m.read(m.TEXTS / 'la-ua.json')['pages']), 1)

    def test_merge_repeat_and_conflict_preflight(self):
        self.assertEqual(self.validate(), [])
        args = argparse.Namespace(work=self.root, pages=[20])
        m.merge(args)
        before = {p: p.read_bytes() for p in m.TEXTS.glob('*.json')}
        m.merge(args)
        self.assertEqual(before, {p: p.read_bytes() for p in before})
        self.result['texts']['fr']['paragraphs'][0]['lines'] = [' (2)Changed']
        self.validate()
        with self.assertRaises(ValueError):
            m.merge(args)
        self.assertEqual(before, {p: p.read_bytes() for p in before})
        args.pages = [20, 21]
        with self.assertRaises(ValueError):
            m.merge(args)
        self.assertEqual(before, {p: p.read_bytes() for p in before})


if __name__ == '__main__':
    unittest.main()
