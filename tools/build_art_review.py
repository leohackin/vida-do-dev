"""Export the art inspector with its metadata and original PNG bytes embedded."""
import argparse
import base64
import html
import json
from pathlib import Path
import re

BASE = Path(__file__).resolve().parent.parent


def build(output=None):
    output = Path(output) if output else BASE / 'artifacts' / 'art-review-standalone.html'
    source = (BASE / 'tools' / 'art_review.html').read_text()
    # Embed bytes without regenerating or editing any artwork.
    for asset in set(re.findall(r'src="(\.\./assets/[^"]+)"', source)):
        path = (BASE / 'tools' / asset).resolve()
        encoded = base64.b64encode(path.read_bytes()).decode('ascii')
        source = source.replace(f'src="{asset}"', f'src="data:image/png;base64,{encoded}"')
    metadata = json.loads((BASE / 'assets/proposals/dev-directional-review.json').read_text())
    payload = json.dumps(metadata, ensure_ascii=False).replace('<', '\\u003c')
    source = source.replace('<script>', f'<script id="art-review-bundle" type="application/json">{payload}</script>\n<script>', 1)
    source = source.replace('href="../index.html"', 'href="https://github.com/leohackin/vida-do-dev/tree/main"')
    source = source.replace('Abrir o jogo com os sprites atuais', 'Código do jogo na main')
    source = source.replace('href="../assets/proposals/README.md"', 'href="#criteria"')
    criteria = html.escape((BASE / 'assets/proposals/README.md').read_text())
    source = source.replace('</html>', f'<details id="criteria"><summary>Critérios e limitações</summary><pre style="white-space:pre-wrap">{criteria}</pre></details>\n</html>')
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(source)
    return output


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    print(build(args.output))
