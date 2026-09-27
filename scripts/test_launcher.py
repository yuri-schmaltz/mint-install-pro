"""Behavioral API tests. No test invokes a real package transaction."""
import http.client
import json
from pathlib import Path
import subprocess
import threading
import unittest
from unittest.mock import patch, Mock
import package_backend as backend


class PackageApiTests(unittest.TestCase):
    def setUp(self):
        self.server = backend.PackageServer(('127.0.0.1', 0))
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.host = f'127.0.0.1:{self.server.server_port}'

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()

    def request(self, data=None, path='/api/install', method='POST', **headers):
        conn = http.client.HTTPConnection(self.host, timeout=3)
        body = json.dumps(data if data is not None else {'id': 'docker.io', 'packageType': 'apt'})
        defaults = {'Content-Type': 'application/json', 'Origin': 'http://' + self.host}
        defaults.update(headers)
        conn.request(method, path, body, defaults)
        res = conn.getresponse()
        status, payload = res.status, json.loads(res.read())
        conn.close()
        return status, payload

    @patch.object(backend, 'run')
    def test_apt_with_dot_and_real_failure(self, run):
        run.return_value = Mock(returncode=100, stdout='', stderr='not found')
        status, result = self.request()
        self.assertEqual(status, 200)
        self.assertFalse(result['success'])
        self.assertEqual(run.call_args.args[0], ['pkexec', 'apt-get', 'install', '-y', '--', 'docker.io'])

    @patch.object(backend, 'run')
    def test_rejects_invalid_inputs_before_commands(self, run):
        for data in ([1], None, {'id': '--help', 'packageType': 'apt'},
                     {'id': 'foo;id', 'packageType': 'apt'}, {'id': 'docker.io'},
                     {'id': 'org.test.App\n', 'packageType': 'flatpak'},
                     {'id': 'pkg', 'packageType': 'unknown'}):
            if data is None:
                continue
            self.assertEqual(self.request(data)[0], 400)
        run.assert_not_called()

    @patch.object(backend, 'operate')
    def test_csrf_origin_host_and_content_type(self, operate):
        for headers in ({'Origin': 'https://evil.example'}, {'Origin': ''},
                        {'Origin': 'null'}, {'Origin': 'http://localhost:9999'},
                        {'Content-Type': 'text/plain'}, {'Host': 'evil.example'},
                        {'Sec-Fetch-Site': 'cross-site'}):
            self.assertEqual(self.request(**headers)[0], 403)
        operate.assert_not_called()

    @patch.object(backend, 'operate')
    def test_payload_limit(self, operate):
        self.assertEqual(self.request({'id': 'x' * 9000, 'packageType': 'apt'})[0], 413)
        operate.assert_not_called()

    @patch.object(backend, 'operate')
    def test_busy_operation_returns_429(self, operate):
        self.server.operation_lock.acquire()
        try:
            self.assertEqual(self.request()[0], 429)
            operate.assert_not_called()
        finally:
            self.server.operation_lock.release()

    def test_concurrent_request_is_rejected_while_read_still_works(self):
        started, finish = threading.Event(), threading.Event()
        outcomes = []
        def slow_operation(action, data):
            started.set()
            finish.wait(3)
            return {'success': True}
        with patch.object(backend, 'operate', slow_operation), patch.object(backend, 'installed', return_value={'apt': []}):
            worker = threading.Thread(target=lambda: outcomes.append(self.request()))
            worker.start()
            try:
                self.assertTrue(started.wait(2))
                self.assertEqual(self.request()[0], 429)
                self.assertEqual(self.request(path='/api/installed', method='GET')[0], 200)
            finally:
                finish.set()
                worker.join()
            self.assertEqual(outcomes[0][1]['success'], True)

    @patch.object(backend, 'operate', side_effect=FileNotFoundError('pkexec missing'))
    def test_missing_command_releases_lock(self, operate):
        self.assertEqual(self.request()[0], 503)
        self.assertFalse(self.server.operation_lock.locked())

    @patch.object(backend, 'operate', side_effect=subprocess.TimeoutExpired('apt-get', 300))
    def test_timeout_is_failure(self, operate):
        status, result = self.request()
        self.assertEqual(status, 504)
        self.assertFalse(result['success'])
        self.assertFalse(self.server.operation_lock.locked())

    @patch.object(backend, 'run')
    def test_installed_apt_and_both_flatpak_scopes(self, run):
        run.side_effect = [Mock(returncode=0, stdout='docker.io\tinstalled\nfoo:amd64\tinstalled\ngone\tconfig-files\n'),
                           Mock(returncode=0, stdout='org.test.App\n'),
                           Mock(returncode=0, stdout='org.test.App\norg.test.Other\n')]
        status, data = self.request(path='/api/installed', method='GET')
        self.assertEqual(status, 200)
        self.assertEqual(data['apt'], ['docker.io', 'foo'])
        self.assertEqual(data['flatpakScopes']['org.test.App'], ['user', 'system'])
        self.assertEqual(data['flatpaks'], ['org.test.App', 'org.test.Other'])

    @patch.object(backend, 'run')
    def test_missing_flatpak_preserves_apt(self, run):
        run.side_effect = [Mock(returncode=0, stdout='vlc\tinstalled\n'), FileNotFoundError()]
        result = backend.installed()
        self.assertEqual(result['apt'], ['vlc'])
        self.assertEqual(result['flatpakStatus'], 'missing')

    @patch.object(backend, 'installed', return_value={'flatpakStatus': 'available', 'flatpakScopes': {'org.test.App': ['user', 'system']}})
    @patch.object(backend, 'run', return_value=Mock(returncode=0, stdout='', stderr=''))
    def test_uninstall_covers_both_scopes(self, run, installed):
        result = backend.operate('uninstall', {'id': 'org.test.App', 'packageType': 'flatpak'})
        self.assertTrue(result['success'])
        self.assertEqual([c.args[0][2] for c in run.call_args_list], ['--user', '--system'])

    @patch.object(backend.subprocess, 'Popen')
    @patch.object(backend, 'installed', return_value={'flatpakStatus': 'available', 'flatpakScopes': {'org.test.App': ['system']}})
    def test_launch_uses_installed_scope(self, installed, popen):
        self.assertTrue(backend.operate('launch', {'id': 'org.test.App', 'packageType': 'flatpak'})['success'])
        self.assertEqual(popen.call_args.args[0], ['flatpak', 'run', '--system', 'org.test.App'])

    def test_launcher_compiles(self):
        code = Path(__file__).with_name('launcher.py').read_text()
        compile(code, '<launcher>', 'exec')


if __name__ == '__main__':
    unittest.main()
