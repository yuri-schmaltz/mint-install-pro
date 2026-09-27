"""Local package API shared by Vite and the installed GTK launcher."""
import argparse
import functools
import http.server
import json
import os
from pathlib import Path
import re
import subprocess
import threading
from urllib.parse import urlsplit

APT_ID = re.compile(r'[a-z0-9][a-z0-9+.\-]{0,127}')
FLATPAK_ID = re.compile(r'[A-Za-z0-9_\-]+(?:\.[A-Za-z0-9_\-]+){2,}')
MAX_BODY = 8192


class ApiError(Exception):
    def __init__(self, status, message):
        self.status = status
        super().__init__(message)


def run(args, timeout=30):
    return subprocess.run(args, capture_output=True, text=True, timeout=timeout,
                          env={**os.environ, 'DEBIAN_FRONTEND': 'noninteractive'})


def installed():
    result = {'apt': [], 'flatpaks': [], 'flatpakScopes': {},
              'aptStatus': 'unknown', 'flatpakStatus': 'unknown'}
    try:
        proc = run(['dpkg-query', '-W', '-f=${binary:Package}\t${db:Status-Status}\n'])
        if proc.returncode == 0:
            result['apt'] = sorted({line.split('\t')[0].split(':')[0]
                                    for line in proc.stdout.splitlines()
                                    if line.endswith('\tinstalled')})
            result['aptStatus'] = 'available'
    except (OSError, subprocess.TimeoutExpired):
        pass
    try:
        for scope in ('user', 'system'):
            proc = run(['flatpak', 'list', '--' + scope, '--app', '--columns=application'])
            if proc.returncode != 0:
                raise RuntimeError(proc.stderr)
            for app_id in proc.stdout.splitlines():
                if app_id.strip():
                    result['flatpakScopes'].setdefault(app_id.strip(), []).append(scope)
        result['flatpaks'] = sorted(result['flatpakScopes'])
        result['flatpakStatus'] = 'available'
    except FileNotFoundError:
        result['flatpakStatus'] = 'missing'
    except (OSError, RuntimeError, subprocess.TimeoutExpired):
        pass
    return result


def validate_package(data):
    if not isinstance(data, dict):
        raise ApiError(400, 'Payload deve ser um objeto JSON.')
    app_id, kind = data.get('id'), data.get('packageType')
    if kind not in ('apt', 'flatpak'):
        raise ApiError(400, 'Tipo de pacote deve ser apt ou flatpak.')
    pattern = FLATPAK_ID if kind == 'flatpak' else APT_ID
    if not isinstance(app_id, str) or not pattern.fullmatch(app_id):
        raise ApiError(400, 'Identificador de pacote inválido.')
    return app_id, kind


def operate(action, data):
    app_id, kind = validate_package(data)
    if action == 'launch':
        if kind == 'flatpak':
            snapshot = installed()
            scopes = snapshot['flatpakScopes'].get(app_id, [])
            if snapshot['flatpakStatus'] != 'available' or not scopes:
                raise ApiError(409, 'Aplicativo não está instalado ou não pôde ser consultado.')
            command = ['flatpak', 'run', '--' + scopes[0], app_id]
        else:
            proc = run(['dpkg-query', '-L', '--', app_id])
            entries = sorted(p for p in proc.stdout.splitlines()
                             if p.startswith('/usr/share/applications/') and p.endswith('.desktop')
                             and Path(p).is_file())
            if proc.returncode or not entries:
                raise ApiError(409, 'Este pacote não possui um lançador gráfico instalado.')
            command = ['gio', 'launch', entries[0]]
        subprocess.Popen(command, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                         stderr=subprocess.DEVNULL, start_new_session=True)
        return {'success': True, 'output': 'Solicitação de abertura enviada ao sistema.'}
    if kind == 'apt':
        commands = [['pkexec', 'apt-get', 'install' if action == 'install' else 'remove', '-y', '--', app_id]]
    elif action == 'install':
        commands = [['flatpak', 'install', '--user', '-y', '--noninteractive', 'flathub', '--', app_id]]
    else:
        snapshot = installed()
        if snapshot['flatpakStatus'] != 'available':
            raise ApiError(503, 'Não foi possível consultar as instalações Flatpak.')
        scopes = snapshot['flatpakScopes'].get(app_id, [])
        if not scopes:
            return {'success': True, 'output': 'Aplicativo já está removido.'}
        commands = [['flatpak', 'uninstall', '--' + scope, '-y', '--noninteractive', '--', app_id]
                    for scope in scopes]
    output = []
    for command in commands:
        proc = run(command, timeout=300)
        output.append(proc.stdout + proc.stderr)
        if proc.returncode:
            return {'success': False, 'code': proc.returncode, 'output': '\n'.join(output)[-8000:]}
    return {'success': True, 'output': '\n'.join(output)[-8000:]}


class PackageServer(http.server.ThreadingHTTPServer):
    daemon_threads = True
    def __init__(self, address, directory=None):
        self.operation_lock = threading.Lock()
        self.serve_files = directory is not None
        super().__init__(address, functools.partial(PackageHandler, directory=directory))


class PackageHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

    def respond(self, status, data):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def authorize(self, mutation=False):
        host = self.headers.get('Host', '')
        try:
            parsed = urlsplit('http://' + host)
            if (self.client_address[0] not in ('127.0.0.1', '::1') or
                    parsed.hostname not in ('127.0.0.1', 'localhost', '::1') or
                    parsed.username or parsed.password or parsed.path or parsed.query or parsed.fragment):
                raise ValueError()
            origin = self.headers.get('Origin')
            if origin and origin != 'http://' + host:
                raise ValueError()
            # JSON requests are not simple cross-origin requests; no CORS grants.
            if mutation and (not origin or self.headers.get_content_type() != 'application/json'):
                raise ValueError()
            if self.headers.get('Sec-Fetch-Site') == 'cross-site':
                raise ValueError()
        except ValueError:
            raise ApiError(403, 'Origem não autorizada.')

    def do_GET(self):
        try:
            self.authorize()
            if self.path == '/api/installed':
                self.respond(200, installed())
            elif self.path.startswith('/api/') or not self.server.serve_files:
                self.respond(404, {'success': False, 'error': 'Recurso não encontrado.'})
            else:
                super().do_GET()
        except ApiError as err:
            self.respond(err.status, {'success': False, 'error': str(err)})

    def do_POST(self):
        locked = False
        try:
            self.authorize(mutation=True)
            if self.path not in ('/api/install', '/api/uninstall', '/api/launch'):
                raise ApiError(404, 'Recurso não encontrado.')
            try:
                length = int(self.headers.get('Content-Length', '0'))
            except ValueError:
                raise ApiError(400, 'Comprimento inválido.')
            if not 0 < length <= MAX_BODY or self.headers.get('Transfer-Encoding'):
                raise ApiError(413, 'Payload inválido ou muito grande.')
            locked = self.server.operation_lock.acquire(blocking=False)
            if not locked:
                raise ApiError(429, 'Outra operação já está em andamento.')
            self.connection.settimeout(10)
            try:
                data = json.loads(self.rfile.read(length))
            except (ValueError, UnicodeError):
                raise ApiError(400, 'JSON inválido.')
            self.respond(200, operate(self.path.rsplit('/', 1)[1], data))
        except ApiError as err:
            self.respond(err.status, {'success': False, 'error': str(err)})
        except subprocess.TimeoutExpired:
            self.respond(504, {'success': False, 'error': 'A operação excedeu o tempo limite. Consulte o estado do sistema antes de tentar novamente.'})
        except OSError as err:
            self.respond(503, {'success': False, 'error': str(err)})
        finally:
            if locked:
                self.server.operation_lock.release()

    def list_directory(self, path):
        self.send_error(404)
        return None


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=0)
    args = parser.parse_args()
    with PackageServer(('127.0.0.1', args.port)) as server:
        print(json.dumps({'port': server.server_port}), flush=True)
        server.serve_forever()
