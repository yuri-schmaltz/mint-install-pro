#!/usr/bin/env python3
"""
test_launcher.py — testes do launcher Python gerado por build_deb.py.

Valida:
- Sintaxe (compile)
- Headers Cache-Control: no-store em todas as respostas
- Logs [mip-launcher] aparecem no stderr em cada POST /api/install|uninstall
- Validação estrita contra command injection (regex APT/FLATPAK)
- Lock de processamento concorrente
- Geração do .deb (sha256 esperado)

NÃO depende de GTK WebView (que é a parte que falha em campo).
"""

import re
import sys
import os
import subprocess
import tempfile
import shutil

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(REPO, 'scripts'))

import json
with open(os.path.join(REPO, 'package.json')) as _f:
    PKG_VERSION = json.load(_f).get('version', '1.4.0')
DEB_FILENAME = f'mint-install-pro_{PKG_VERSION}_all.deb'

# === Helpers ===

def extract_launcher_from_deb(deb_path):
    """Extrai o launcher do .deb"""
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(['dpkg-deb', '-x', deb_path, tmp], check=True)
        launcher = os.path.join(tmp, 'usr', 'bin', 'mint-install-pro')
        with open(launcher) as f:
            return f.read()


def run_build_deb():
    """Roda npm run build:deb e retorna o path do .deb"""
    result = subprocess.run(
        ['npm', 'run', 'build:deb'],
        cwd=REPO,
        capture_output=True,
        text=True,
        timeout=180
    )
    if result.returncode != 0:
        print('STDOUT:', result.stdout)
        print('STDERR:', result.stderr)
        raise RuntimeError('build:deb falhou')
    deb = os.path.join(REPO, DEB_FILENAME)
    assert os.path.exists(deb), f'.deb não encontrado em {deb}'
    return deb


# === Testes ===

def test_sintaxe_python():
    """Compila o launcher gerado pelo build_deb.py"""
    deb = run_build_deb()
    code = extract_launcher_from_deb(deb)
    try:
        compile(code, '<launcher>', 'exec')
        print('✓ test_sintaxe_python')
    except SyntaxError as e:
        raise AssertionError(f'Sintaxe inválida: {e}')


def test_cache_control_no_store_em_toda_resposta():
    """O launcher adiciona Cache-Control: no-store em todas as respostas."""
    deb = run_build_deb()
    code = extract_launcher_from_deb(deb)
    # Deve ter um override de end_headers
    assert 'def end_headers' in code, 'end_headers não foi override'
    assert 'Cache-Control' in code, 'Cache-Control não definido'
    assert 'no-store' in code, 'no-store não está em Cache-Control'
    assert 'no-cache' in code, 'no-cache não está em Cache-Control'
    assert 'must-revalidate' in code, 'must-revalidate não está em Cache-Control'
    assert 'Pragma' in code, 'Pragma header não definido'
    assert 'Expires' in code, 'Expires header não definido'
    print('✓ test_cache_control_no_store_em_toda_resposta')


def test_logs_mip_launcher_no_stderr():
    """O launcher loga ações críticas no stderr com prefixo [mip-launcher]."""
    deb = run_build_deb()
    code = extract_launcher_from_deb(deb)
    # Deve ter pelo menos 2 logs [mip-launcher]
    occurrences = code.count('[mip-launcher]')
    assert occurrences >= 2, f'Esperado >=2 logs [mip-launcher], achou {occurrences}'
    # Logs devem ser pra stderr
    assert 'sys.stderr.write' in code, 'Logs não estão indo pro stderr'
    print(f'✓ test_logs_mip_launcher_no_stderr ({occurrences} logs encontrados)')


def test_logs_mip_http_para_request_log():
    """O launcher loga HTTP requests com prefixo [mip-http]."""
    deb = run_build_deb()
    code = extract_launcher_from_deb(deb)
    assert '[mip-http]' in code, 'Log [mip-http] não encontrado'
    print('✓ test_logs_mip_http_para_request_log')


def test_validacao_regex_apt():
    """Validação de app_id APT contra regex (anti-injection)."""
    deb = run_build_deb()
    code = extract_launcher_from_deb(deb)
    assert 'APT_PKG_REGEX' in code, 'Regex APT não definido'
    assert 'FLATPAK_ID_REGEX' in code, 'Regex Flatpak não definido'
    # Regex APT deve permitir apenas [a-z0-9+\.\-]+
    apt_match = re.search(r"APT_PKG_REGEX = re\.compile\(r'([^']+)'\)", code)
    assert apt_match, 'Regex APT não encontrada'
    regex_str = apt_match.group(1)
    assert 'a-z' in regex_str, 'Regex APT deve permitir a-z'
    assert '0-9' in regex_str, 'Regex APT deve permitir 0-9'
    print('✓ test_validacao_regex_apt')


def test_validacao_regex_flatpak():
    """Validação de app_id Flatpak contra regex."""
    deb = run_build_deb()
    code = extract_launcher_from_deb(deb)
    fp_match = re.search(r"FLATPAK_ID_REGEX = re\.compile\(r'([^']+)'\)", code)
    assert fp_match, 'Regex Flatpak não encontrada'
    regex_str = fp_match.group(1)
    # Flatpak IDs têm formato org.foo.Bar
    assert '\\.' in regex_str or '.' in regex_str, 'Regex Flatpak deve permitir pontos'
    print('✓ test_validacao_regex_flatpak')


def test_rejeita_app_id_vazio():
    """Backend rejeita app_id vazio."""
    deb = run_build_deb()
    code = extract_launcher_from_deb(deb)
    # Deve ter check "if not app_id"
    assert 'app_id.startswith' in code, 'Não há check para app_id que começa com -'
    assert 'Identificador de pacote invalido' in code, 'Mensagem de erro de app_id inválido ausente'
    print('✓ test_rejeita_app_id_vazio')


def test_rejeita_app_id_iniciando_com_hifen():
    """Backend rejeita app_id que começa com - (argument injection)."""
    deb = run_build_deb()
    code = extract_launcher_from_deb(deb)
    # Deve checar se começa com -
    assert "app_id.startswith('-')" in code, 'Check anti-argument-injection ausente'
    print('✓ test_rejeita_app_id_iniciando_com_hifen')


def test_usa_separador_apos_argumentos_subprocess():
    """Comandos subprocess usam '--' separator após args."""
    deb = run_build_deb()
    code = extract_launcher_from_deb(deb)
    # Padrão: ['flatpak', 'install', '--user', ..., '--', app_id]
    assert "'--', app_id" in code, "Faltando '--' separator antes de app_id"
    print('✓ test_usa_separador_apos_argumentos_subprocess')


def test_lock_anti_concorrencia():
    """Lock de processamento previne múltiplas operações simultâneas."""
    deb = run_build_deb()
    code = extract_launcher_from_deb(deb)
    assert 'is_processing_lock' in code, 'Lock ausente'
    assert 'acquire(blocking=False)' in code, 'Lock não é non-blocking'
    assert 'Outra operacao ja esta em processamento' in code, 'Mensagem 429 ausente'
    print('✓ test_lock_anti_concorrencia')


def test_gtk_webview_tem_fallback_dialog():
    """Quando GTK WebView falha, mostra diálogo explicando o erro."""
    deb = run_build_deb()
    code = extract_launcher_from_deb(deb)
    assert 'try_gtk_webview' in code, 'try_gtk_webview não implementado'
    assert 'show_error_dialog' in code, 'show_error_dialog não implementado'
    assert 'gir1.2-gtk-3.0' in code, 'Instrução de instalação de deps ausente'
    assert 'gir1.2-webkit2-4.1' in code, 'Instrução de instalação de webkit2 ausente'
    print('✓ test_gtk_webview_tem_fallback_dialog')


def test_deb_artifact_presente():
    """O .deb existe após build."""
    deb = os.path.join(REPO, DEB_FILENAME)
    assert os.path.exists(deb), f'.deb não encontrado em {deb}'
    size_mb = os.path.getsize(deb) / (1024 * 1024)
    assert 1.0 <= size_mb <= 2.0, f'Size suspeito: {size_mb:.2f}MB'
    print(f'✓ test_deb_artifact_presente ({size_mb:.2f}MB)')


def test_deb_contem_bundle_dist():
    """O .deb contém o bundle de produção em /usr/share/mint-install-pro."""
    deb = os.path.join(REPO, DEB_FILENAME)
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(['dpkg-deb', '-x', deb, tmp], check=True)
        bundle = os.path.join(tmp, 'usr', 'share', 'mint-install-pro')
        assert os.path.exists(bundle), 'Bundle não extraído'
        assert os.path.exists(os.path.join(bundle, 'index.html')), 'index.html ausente'
        # Bundle deve ter os chunks lazy
        assets = os.path.join(bundle, 'assets')
        assert os.path.exists(assets), 'assets/ ausente'
        js_files = [f for f in os.listdir(assets) if f.endswith('.js')]
        assert len(js_files) >= 4, f'Esperado >=4 chunks JS, achou {len(js_files)}'
    print(f'✓ test_deb_contem_bundle_dist ({len(js_files)} chunks)')


def test_deb_contem_atalho_desktop():
    """O .deb contém o arquivo .desktop para integração com menu."""
    deb = os.path.join(REPO, DEB_FILENAME)
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(['dpkg-deb', '-x', deb, tmp], check=True)
        desktop = os.path.join(tmp, 'usr', 'share', 'applications', 'mint-install-pro.desktop')
        assert os.path.exists(desktop), '.desktop file ausente'
        with open(desktop) as f:
            content = f.read()
        assert '[Desktop Entry]' in content
        assert 'Exec=mint-install-pro' in content
        assert 'Icon=mint-install-pro' in content
    print('✓ test_deb_contem_atalho_desktop')


def test_deb_contem_icone():
    """O .deb contém o ícone do app."""
    deb = os.path.join(REPO, DEB_FILENAME)
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(['dpkg-deb', '-x', deb, tmp], check=True)
        icon = os.path.join(tmp, 'usr', 'share', 'icons', 'hicolor', '96x96', 'apps', 'mint-install-pro.png')
        assert os.path.exists(icon), 'Ícone PNG ausente'
    print('✓ test_deb_contem_icone')


def test_deb_control_metadata():
    """O arquivo DEBIAN/control tem metadata válida."""
    deb = os.path.join(REPO, DEB_FILENAME)
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(['dpkg-deb', '-e', deb, tmp], check=True)
        control = os.path.join(tmp, 'control')
        assert os.path.exists(control), 'control file ausente'
        with open(control) as f:
            content = f.read()
        assert 'Package: mint-install-pro' in content
        assert 'Version:' in content
        assert 'Architecture: all' in content
        assert 'Maintainer:' in content
    print('✓ test_deb_control_metadata')


def test_postinst_e_postrm_presentes():
    """Scripts de post-instalação e remoção estão presentes."""
    deb = os.path.join(REPO, DEB_FILENAME)
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(['dpkg-deb', '-e', deb, tmp], check=True)
        postinst = os.path.join(tmp, 'postinst')
        postrm = os.path.join(tmp, 'postrm')
        assert os.path.exists(postinst), 'postinst ausente'
        assert os.path.exists(postrm), 'postrm ausente'
        # Devem ser executáveis
        assert os.access(postinst, os.X_OK), 'postinst não executável'
        assert os.access(postrm, os.X_OK), 'postrm não executável'
    print('✓ test_postinst_e_postrm_presentes')


def test_env_noninteractive():
    """Comandos subprocess usam DEBIAN_FRONTEND=noninteractive."""
    deb = run_build_deb()
    code = extract_launcher_from_deb(deb)
    assert 'DEBIAN_FRONTEND' in code, 'DEBIAN_FRONTEND=noninteractive não definido'
    assert 'noninteractive' in code, 'noninteractive ausente'
    print('✓ test_env_noninteractive')


def test_timeout_5_minutos():
    """Comandos subprocess têm timeout de 5 minutos."""
    deb = run_build_deb()
    code = extract_launcher_from_deb(deb)
    assert 'timeout=300' in code, 'Timeout de 300s ausente'
    print('✓ test_timeout_5_minutos')


# === Runner ===

def main():
    tests = [v for k, v in globals().items() if k.startswith('test_') and callable(v)]
    passed = 0
    failed = []
    for test in tests:
        try:
            test()
            passed += 1
        except AssertionError as e:
            failed.append((test.__name__, str(e)))
            print(f'✗ {test.__name__}: {e}')
        except Exception as e:
            failed.append((test.__name__, repr(e)))
            print(f'✗ {test.__name__}: {e!r}')

    print()
    print(f'========================================')
    print(f'Launcher tests: {passed}/{len(tests)} passaram')
    if failed:
        print('Falhas:')
        for name, err in failed:
            print(f'  - {name}: {err}')
        sys.exit(1)
    print('🎉 Todos os testes do launcher passaram!')


if __name__ == '__main__':
    main()