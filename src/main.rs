use gtk4::prelude::*;
use gtk4::{Application, ApplicationWindow};
use std::path::PathBuf;
use webkit6::prelude::*;
use webkit6::WebView;

fn find_dist_dir() -> PathBuf {
    let candidates = [
        PathBuf::from("dist"),
        PathBuf::from("/usr/share/mintinstall_rust/dist"),
        PathBuf::from("/usr/share/mint-install-pro/dist"),
    ];
    for p in candidates {
        if p.exists() && p.join("index.html").exists() {
            return p;
        }
    }
    PathBuf::from("dist")
}

fn main() {
    let dist_dir = find_dist_dir();

    // Start background embedded tokio runtime with Axum server
    let (tx, rx) = std::sync::mpsc::channel();
    let dist_dir_server = dist_dir.clone();

    std::thread::spawn(move || {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async move {
            let app = mintinstall_rust::web_server::create_router(dist_dir_server);
            let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
            let port = listener.local_addr().unwrap().port();
            tx.send(port).unwrap();
            axum::serve(listener, app).await.unwrap();
        });
    });

    let port = rx
        .recv()
        .expect("Failed to receive port from web server thread");
    let target_url = format!("http://127.0.0.1:{}/index.html", port);

    // Launch GTK4 Application with WebKit6 WebView
    let app = Application::new(Some("com.mintinstall.pro.rust"), Default::default());

    app.connect_activate(move |app| {
        let window = ApplicationWindow::new(app);
        window.set_title(Some("Gerenciador de Aplicativos"));
        window.set_default_size(1200, 780);
        window.set_resizable(false);

        let webview = WebView::new();
        webview.set_hexpand(true);
        webview.set_vexpand(true);

        // Load the React frontend from the local Axum web server
        webview.load_uri(&target_url);

        window.set_child(Some(&webview));
        window.present();
    });

    app.run();
}
