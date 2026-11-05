"""Acquire a pinned publisher dataset for audit only; no model fitting."""
import hashlib
import json
import time
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
REVISION = '2424920019e49d52d72c13ac1143ec5d53af276b'
EXPECTED = '2716e1bf0fd157a93b5bf86924d9088419dfbac2022c6cd90030220634f616dc'
URL = f'https://huggingface.co/datasets/criteo/criteo-uplift/resolve/{REVISION}/criteo-research-uplift-v2.1.csv.gz'


def main():
    path = HERE / 'raw/criteo-research-uplift-v2.1.csv.gz'
    report = {'url': URL, 'revision': REVISION, 'expected_sha256': EXPECTED,
              'expected_bytes': 311422618, 'purpose': 'Schema/count/power audit only',
              'license': 'CC BY-NC-SA 4.0; publisher terms and pinned dataset card',
              'license_url': 'https://ailab.criteo.com/criteo-uplift-prediction-dataset/'}
    started = time.perf_counter()
    try:
        if not path.exists():
            temp = path.with_suffix('.partial')
            with urllib.request.urlopen(URL, timeout=40) as response, temp.open('wb') as stream:
                report['http_status'] = response.status
                report['resolved_url_host'] = urllib.request.urlparse(response.url).hostname if hasattr(urllib.request, 'urlparse') else response.url.split('/')[2]
                report['content_length'] = response.headers.get('Content-Length')
                total = 0
                while block := response.read(8 * 1024 * 1024):
                    stream.write(block)
                    total += len(block)
                    if total % (64 * 1024 * 1024) == 0:
                        print(f'Downloaded {total} bytes', flush=True)
            temp.replace(path)
        with path.open('rb') as stream:
            actual = hashlib.file_digest(stream, 'sha256').hexdigest()
        report.update(actual_sha256=actual, actual_bytes=path.stat().st_size)
        assert actual == EXPECTED and path.stat().st_size == 311422618
        report['status'] = 'PASS'
    except Exception as exc:
        report.update(status='FAIL', error_type=type(exc).__name__, error=str(exc))
    report['elapsed_seconds'] = time.perf_counter() - started
    (HERE / 'evidence/download_manifest.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report, indent=2), flush=True)
    assert report['status'] == 'PASS'


if __name__ == '__main__':
    main()
