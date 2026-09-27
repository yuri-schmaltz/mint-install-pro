"""Verify the built artifact without installing it or running maintainer scripts."""
import json
from pathlib import Path
import subprocess
import tempfile

root = Path(__file__).resolve().parent.parent
version = json.loads((root / 'package.json').read_text())['version']
deb = root / f'mint-install-pro_{version}_all.deb'
with tempfile.TemporaryDirectory(prefix='mip-deb-check-') as tmp:
    subprocess.run(['dpkg-deb', '-x', str(deb), tmp], check=True)
    extracted = Path(tmp)
    for source, destination in [
        ('scripts/launcher.py', 'usr/bin/mint-install-pro'),
        ('scripts/package_backend.py', 'usr/share/mint-install-pro/package_backend.py'),
        ('app_manager.desktop', 'usr/share/applications/mint-install-pro.desktop'),
        ('dist/index.html', 'usr/share/mint-install-pro/index.html')
    ]:
        assert (root / source).read_bytes() == (extracted / destination).read_bytes(), destination
    compile((extracted / 'usr/bin/mint-install-pro').read_text(), '<launcher>', 'exec')
    compile((extracted / 'usr/share/mint-install-pro/package_backend.py').read_text(), '<backend>', 'exec')
    metadata = subprocess.check_output(['dpkg-deb', '-f', str(deb), 'Version'], text=True).strip()
    assert metadata == version
print(f'Pacote {deb.name}: conteúdo, versão e sintaxe verificados.')
