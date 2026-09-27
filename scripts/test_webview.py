"""Native WebKitGTK smoke test, skipped when no GTK display is available.
Operations use a fake executor; the real package API and built React UI are exercised.
"""
from pathlib import Path
import threading
import unittest
from unittest.mock import patch
import package_backend as backend


class NativeWebViewTests(unittest.TestCase):
    def test_native_batch_and_csrf_origin(self):
        try:
            import gi
            gi.require_version('Gtk', '3.0')
            gi.require_version('WebKit2', '4.1')
            from gi.repository import Gtk, WebKit2, GLib
        except (ImportError, ValueError):
            self.skipTest('GTK/WebKit2 unavailable')
        if not Gtk.init_check()[0]:
            self.skipTest('GTK display unavailable')
        dist = Path(__file__).resolve().parent.parent / 'dist'
        if not (dist / 'index.html').exists():
            self.skipTest('Run npm run build for native WebView test')
        installed = set()
        calls = []
        result = []
        def snapshot():
            return {'apt': sorted(installed), 'flatpaks': [], 'aptStatus': 'available', 'flatpakStatus': 'available'}
        def operate(action, data):
            calls.append((action, data))
            installed.add(data['id'])
            return {'success': True, 'output': 'native test operation'}
        script = '''
        (() => {
          const text = document.body.innerText;
          if (text.includes('Operação finalizada: 1 sucesso(s), 0 falha(s).')) return 'success';
          if (text.includes('Confirmar e executar')) {
            [...document.querySelectorAll('button')].find(b => b.textContent === 'Confirmar e executar').click();
            return 'confirming';
          }
          if (!document.querySelector('.gtk-card')) {
            const all = [...document.querySelectorAll('nav button')].find(b => b.textContent === 'Todos');
            if (all) all.click();
            return 'loading';
          }
          if (text.includes('Consultando os pacotes instalados')) return 'loading';
          const execute = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Executar Ações'));
          if (execute) { execute.click(); return 'executing'; }
          const checkbox = document.querySelector('[title="Não instalado (clique para marcar e instalar)"]');
          if (checkbox) checkbox.click();
          return 'selecting';
        })()
        '''
        with patch.object(backend, 'installed', snapshot), patch.object(backend, 'operate', operate):
            server = backend.PackageServer(('127.0.0.1', 0), directory=str(dist))
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            window = Gtk.OffscreenWindow()
            window.set_default_size(1200, 780)
            webview = WebKit2.WebView.new_with_context(WebKit2.WebContext.new_ephemeral())
            window.add(webview)
            window.show_all()
            def evaluated(view, task, _data=None):
                try:
                    value = view.evaluate_javascript_finish(task).to_string()
                    if value == 'success':
                        result.append(value)
                        Gtk.main_quit()
                except Exception as err:
                    result.append(str(err))
                    Gtk.main_quit()
            def poll():
                webview.evaluate_javascript(script, -1, None, None, None, evaluated, None)
                return True
            def timeout():
                result.append('timeout')
                Gtk.main_quit()
                return False
            timer = GLib.timeout_add(250, poll)
            deadline = GLib.timeout_add_seconds(20, timeout)
            webview.load_uri(f'http://127.0.0.1:{server.server_port}')
            try:
                Gtk.main()
            finally:
                GLib.source_remove(timer)
                if result != ['timeout']:
                    GLib.source_remove(deadline)
                window.destroy()
                server.shutdown()
                server.server_close()
                thread.join()
        self.assertEqual(result, ['success'])
        self.assertEqual(len(calls), 1)
        self.assertEqual(calls[0][0], 'install')
