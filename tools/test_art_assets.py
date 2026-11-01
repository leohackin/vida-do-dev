"""Deterministic checks for review assets and the self-contained inspector."""
import hashlib
import json
from pathlib import Path
import struct
import tempfile
import unittest

from build_art_review import build

BASE = Path(__file__).resolve().parent.parent


def png_size(path):
    data = Path(path).read_bytes()[:24]
    if data[:8] != b'\x89PNG\r\n\x1a\n' or data[12:16] != b'IHDR':
        raise ValueError(f'Not a PNG: {path}')
    return struct.unpack('>II', data[16:24])


class ArtAssets(unittest.TestCase):
    def test_reference_is_intact(self):
        digest = hashlib.sha256((BASE / 'assets/reference-original.png').read_bytes()).hexdigest()
        self.assertEqual(digest, '105580ac7364b063725ad359c8b3913468e2e2aeeba04ce65ffa09c1f01ad834')

    def test_review_png_dimensions_and_frame_bounds(self):
        metadata = json.loads((BASE / 'assets/proposals/dev-directional-review.json').read_text())
        atlas = BASE / 'assets/proposals' / metadata['image']
        self.assertEqual(png_size(atlas), tuple(metadata['size']))
        self.assertEqual(png_size(BASE / 'assets/proposals/clean-plate-review.png'), (1536, 1024))
        self.assertEqual(png_size(BASE / 'assets/office-clean.png'), (1536, 1024))
        self.assertEqual(png_size(BASE / 'assets/dev-directional.png'), (1254, 1254))
        self.assertEqual(len(metadata['directions']), 4)
        self.assertEqual(len(metadata['frames']), 4)
        width, height = metadata['size']
        for row in metadata['frames']:
            self.assertEqual(len(row), 4)
            for x, y, frame_width, frame_height in row:
                self.assertGreater(frame_width, 0)
                self.assertGreater(frame_height, 0)
                self.assertGreaterEqual(x, 0)
                self.assertGreaterEqual(y, 0)
                self.assertLessEqual(x + frame_width, width)
                self.assertLessEqual(y + frame_height, height)

    def test_standalone_export_has_no_relative_runtime_assets(self):
        with tempfile.TemporaryDirectory() as directory:
            output = build(Path(directory) / 'review.html')
            document = output.read_text()
        self.assertIn('id="art-review-bundle"', document)
        self.assertEqual(document.count('src="data:image/png;base64,'), 4)
        self.assertNotIn('src="../assets/', document)


if __name__ == '__main__':
    unittest.main()
