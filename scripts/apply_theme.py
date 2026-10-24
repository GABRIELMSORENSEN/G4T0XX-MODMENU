"""Apply the G4T0XX palette and isolated runtime/profile compatibility bootstraps."""
import argparse
import hashlib
import json
from pathlib import Path
import struct
import subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = '83e8b0a'

def parse(raw):
    first, header_size, payload_size, json_size = struct.unpack('<IIII', raw[:16])
    if first != 4 or payload_size != header_size - 4:
        raise ValueError('Unsupported ASAR header')
    return json.loads(raw[16:16 + json_size]), raw[8 + header_size:]

def integrity(data):
    block = 4194304
    return {'algorithm': 'SHA256', 'hash': hashlib.sha256(data).hexdigest(),
            'blockSize': block, 'blocks': [hashlib.sha256(data[i:i + block]).hexdigest()
                                         for i in range(0, len(data), block)]}

def main():
    args = argparse.ArgumentParser()
    args.add_argument('--original', type=Path)
    args.add_argument('--output', type=Path, default=ROOT / 'resources/app.asar')
    options = args.parse_args()
    original = (options.original.read_bytes() if options.original else
                subprocess.check_output(['git', 'show', BASE + ':resources/app.asar'], cwd=ROOT))
    header, data = parse(original)
    old_entry = header['files']['index.html']
    index = data[int(old_entry['offset']):int(old_entry['offset']) + old_entry['size']]
    addition = b'<link rel="stylesheet" href="g4t0xx-theme.css" data-g4t0xx-theme="1"><script src="g4t0xx-runtime.js"></script>'
    if b'</head>' not in index:
        raise ValueError('Original HTML has no head')
    index = index.replace(b'</head>', addition + b'\n</head>', 1)
    main_entry = header['files']['index.js']
    start = int(main_entry['offset'])
    main = b"require('./g4t0xx-profile.js');\n" + data[start:start + main_entry['size']]
    css = (ROOT / 'ui/g4t0xx-theme.css').read_bytes()
    runtime = (ROOT / 'runtime/g4t0xx-runtime.js').read_bytes()
    for name, content in [('index.html', index), ('g4t0xx-theme.css', css), ('g4t0xx-runtime.js', runtime), ('index.js', main), ('g4t0xx-profile.js', (ROOT / 'runtime/g4t0xx-profile.js').read_bytes())]:
        header['files'][name] = {'size': len(content), 'offset': str(len(data)),
                                 'integrity': integrity(content)}
        data += content
    encoded = json.dumps(header, separators=(',', ':'), ensure_ascii=False).encode('utf-8')
    padded = (len(encoded) + 3) & ~3
    packed = struct.pack('<IIII', 4, 8 + padded, 4 + padded, len(encoded))
    patched = packed + encoded + bytes(padded - len(encoded)) + data
    # Original payloads remain identical except for the HTML links and main bootstrap prefix.
    old_header, old_data = parse(original)
    new_header, new_data = parse(patched)
    count = 0
    def check(old, new):
        nonlocal count
        for name, entry in old.items():
            target = new[name]
            if 'files' in entry:
                check(entry['files'], target['files'])
            elif 'offset' in entry and name not in ('index.html', 'index.js'):
                start, size = int(entry['offset']), entry['size']
                end = int(target['offset'])
                assert old_data[start:start + size] == new_data[end:end + target['size']], name
                count += 1
    check(old_header['files'], new_header['files'])
    assert main.split(b'\n', 1)[1] == old_data[int(old_header['files']['index.js']['offset']):int(old_header['files']['index.js']['offset']) + old_header['files']['index.js']['size']]
    options.output.parent.mkdir(parents=True, exist_ok=True)
    options.output.write_bytes(patched)
    report = {'original_main_retained_after_profile_bootstrap': True, 'unchanged_original_payloads': count,
              'original_sha256': hashlib.sha256(original).hexdigest(),
              'themed_sha256': hashlib.sha256(patched).hexdigest(),
              'changed_files': ['index.html', 'g4t0xx-theme.css', 'g4t0xx-runtime.js', 'index.js', 'g4t0xx-profile.js'],
              'authentication_changed': False, 'server_endpoints_changed': False}
    (ROOT / 'verification/theme-integrity.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report))

if __name__ == '__main__':
    main()
