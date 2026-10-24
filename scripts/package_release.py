"""Package the original runtime with the palette patch, without development files or profiles."""
import argparse
import hashlib
from pathlib import Path, PurePosixPath
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('original_zip', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    additions = ['resources/app.asar', 'Start-G4T0XX.cmd', 'Start-G4T0XX.ps1',
                 'README.md', 'VALIDACAO.md', 'RELEASE_NOTES.md', 'LICENSE',
                 'DESIGN.md', 'ui/g4t0xx-theme.css', 'runtime/g4t0xx-runtime.js', 'verification/theme-integrity.json']
    additions += [p.relative_to(ROOT).as_posix() for p in (ROOT / 'THIRD_PARTY_LICENSES').rglob('*') if p.is_file()]
    allowed_dirs = {'resources', 'locales', 'swiftshader'}
    allowed_root = {'.exe', '.dll', '.pak', '.bin', '.dat', '.json'}
    with zipfile.ZipFile(args.original_zip) as source, zipfile.ZipFile(args.output, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as dest:
        for entry in source.infolist():
            path = PurePosixPath(entry.filename)
            if '..' in path.parts or path.is_absolute():
                raise ValueError('Unsafe archive path')
            if entry.is_dir() or entry.filename in additions or entry.filename.endswith(('.bak', '.log')):
                continue
            if len(path.parts) == 1:
                if path.suffix.lower() not in allowed_root:
                    continue
            elif path.parts[0] not in allowed_dirs:
                continue
            with source.open(entry) as input_file, dest.open(entry.filename, 'w', force_zip64=True) as output_file:
                shutil.copyfileobj(input_file, output_file)
        for name in additions:
            dest.write(ROOT / name, name)
    with zipfile.ZipFile(args.output) as archive:
        assert archive.testzip() is None
        assert not any(n.startswith(('.git/', 'releases/')) or n.endswith(('.bak', '.log')) for n in archive.namelist())
        assert archive.read('resources/app.asar') == (ROOT / 'resources/app.asar').read_bytes()
    with args.output.open('rb') as file:
        digest = hashlib.file_digest(file, 'sha256').hexdigest()
    (args.output.parent / 'SHA256SUMS.txt').write_text(digest + '  ' + args.output.name + '\n')
    print(args.output.name, args.output.stat().st_size, digest)

if __name__ == '__main__':
    main()
