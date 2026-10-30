use crate::backend::*;
use axum::{
    body::Body,
    extract::{Query, State},
    http::{header, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::{Arc, Mutex};
use tower_http::services::ServeDir;

#[derive(Clone)]
pub struct ServerState {
    pub lock: Arc<Mutex<()>>,
    pub dist_dir: PathBuf,
}

#[derive(Deserialize)]
pub struct QueryParams {
    pub q: Option<String>,
    pub id: Option<String>,
    pub r#type: Option<String>,
}

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct OperationItem {
    pub id: String,
    #[serde(rename = "packageType")]
    pub package_type: String,
    pub action: Option<String>,
}

#[derive(Deserialize)]
pub struct BatchRequest {
    pub operations: Vec<OperationItem>,
}

#[derive(Deserialize)]
pub struct RepoAddRequest {
    pub r#type: Option<String>,
    pub value: Option<String>,
    pub name: Option<String>,
    pub url: Option<String>,
}

#[derive(Deserialize)]
pub struct RepoRemoveRequest {
    pub r#type: Option<String>,
    pub value: Option<String>,
    pub name: Option<String>,
}

#[derive(Deserialize)]
pub struct InstallDebRequest {
    pub path: Option<String>,
}

#[derive(Deserialize)]
pub struct GpgImportRequest {
    pub url: Option<String>,
    pub name: Option<String>,
}

#[derive(Deserialize)]
pub struct GpgRemoveRequest {
    pub path: Option<String>,
}

pub fn create_router(dist_dir: PathBuf) -> Router {
    let state = ServerState {
        lock: Arc::new(Mutex::new(())),
        dist_dir: dist_dir.clone(),
    };

    Router::new()
        // API GET
        .route("/api/installed", get(handle_installed))
        .route("/api/updates", get(handle_updates))
        .route("/api/history", get(handle_history))
        .route("/api/repositories", get(handle_repositories))
        .route("/api/gpg-keys", get(handle_gpg_keys))
        .route("/api/depends", get(handle_depends))
        .route("/api/search", get(handle_search))
        // API POST
        .route("/api/install", post(handle_install))
        .route("/api/uninstall", post(handle_uninstall))
        .route("/api/launch", post(handle_launch))
        .route("/api/batch", post(handle_batch))
        .route("/api/update-all", post(handle_update_all))
        .route("/api/cleanup", post(handle_cleanup))
        .route("/api/repository-add", post(handle_repository_add))
        .route("/api/repository-remove", post(handle_repository_remove))
        .route("/api/install-deb", post(handle_install_deb))
        .route("/api/reinstall", post(handle_reinstall))
        .route("/api/simulate-remove", post(handle_simulate_remove))
        .route("/api/gpg-import", post(handle_gpg_import))
        .route("/api/gpg-remove", post(handle_gpg_remove))
        .route("/api/snapshot", post(handle_snapshot))
        // Static files fallback
        .fallback_service(ServeDir::new(dist_dir))
        .with_state(state)
}

async fn handle_installed() -> impl IntoResponse {
    let (apt, protections) = apt_inventory();
    let flathub_user = flathub_user_remote_available();
    let appimages = appimage_inventory();

    let mut flatpaks = Vec::new();
    let mut flatpak_scopes: HashMap<String, Vec<String>> = HashMap::new();
    let mut flatpak_names: HashMap<String, String> = HashMap::new();

    for scope in ["user", "system"] {
        if let Ok(o) = Command::new("flatpak")
            .args([
                "list",
                &format!("--{}", scope),
                "--app",
                "--columns=application",
            ])
            .output()
        {
            if o.status.success() {
                for line in String::from_utf8_lossy(&o.stdout).lines() {
                    let id = line.trim();
                    if !id.is_empty() {
                        flatpak_scopes
                            .entry(id.to_string())
                            .or_default()
                            .push(scope.to_string());
                    }
                }
            }
        }
    }
    for id in flatpak_scopes.keys() {
        flatpaks.push(id.clone());
    }
    flatpaks.sort();

    if let Ok(o) = Command::new("flatpak")
        .args(["list", "--app", "--columns=application,name"])
        .output()
    {
        if o.status.success() {
            for line in String::from_utf8_lossy(&o.stdout).lines() {
                let parts: Vec<&str> = line.split('\t').collect();
                if parts.len() >= 2 {
                    flatpak_names.insert(parts[0].trim().to_string(), parts[1].trim().to_string());
                }
            }
        }
    }

    let mut apt_names: HashMap<String, String> = HashMap::new();
    if let Ok(o) = Command::new("/usr/bin/dpkg-query")
        .args(["-W", "-f=${binary:Package}\t${binary:Summary}\n"])
        .output()
    {
        if o.status.success() {
            for line in String::from_utf8_lossy(&o.stdout).lines() {
                let parts: Vec<&str> = line.split('\t').collect();
                if parts.len() >= 2 {
                    let pkg = parts[0].split(':').next().unwrap_or("").trim().to_string();
                    let sum = parts[1].trim().to_string();
                    apt_names.insert(pkg, sum);
                }
            }
        }
    }

    Json(serde_json::json!({
        "apt": apt,
        "flatpaks": flatpaks,
        "flatpakScopes": flatpak_scopes,
        "protectedPackages": protections,
        "aptStatus": "available",
        "flatpakStatus": "available",
        "flathubUserRemote": flathub_user,
        "aptNames": apt_names,
        "flatpakNames": flatpak_names,
        "appImages": appimages,
    }))
}

async fn handle_updates() -> impl IntoResponse {
    let mut apt_updates = Vec::new();
    let mut flatpak_updates = Vec::new();

    if let Ok(o) = Command::new("apt").args(["list", "--upgradable"]).output() {
        if o.status.success() {
            for line in String::from_utf8_lossy(&o.stdout).lines() {
                if line.contains('/') && line.contains("upgradable") {
                    let name = line.split('/').next().unwrap_or("").trim();
                    if !name.is_empty() && !apt_updates.contains(&name.to_string()) {
                        apt_updates.push(name.to_string());
                    }
                }
            }
        }
    }

    if let Ok(o) = Command::new("flatpak")
        .args(["remote-ls", "--updates", "--columns=application"])
        .output()
    {
        if o.status.success() {
            for line in String::from_utf8_lossy(&o.stdout).lines() {
                let id = line.trim();
                if !id.is_empty() && !flatpak_updates.contains(&id.to_string()) {
                    flatpak_updates.push(id.to_string());
                }
            }
        }
    }

    Json(serde_json::json!({
        "apt": apt_updates,
        "flatpak": flatpak_updates,
        "aptStatus": "available",
        "flatpakStatus": "available",
    }))
}

async fn handle_history() -> impl IntoResponse {
    let path = PathBuf::from(std::env::var("HOME").unwrap_or_default())
        .join(".local/share/mint-install-pro/history.log");

    let mut entries = Vec::new();
    if let Ok(content) = std::fs::read_to_string(&path) {
        for line in content.lines() {
            let l = line.trim();
            if !l.is_empty() {
                if let Ok(v) = serde_json::from_str::<serde_json::Value>(l) {
                    entries.push(v);
                } else {
                    entries.push(serde_json::json!({ "record": l }));
                }
            }
        }
    }
    entries.reverse();
    if entries.len() > 200 {
        entries.truncate(200);
    }
    Json(serde_json::json!({ "entries": entries }))
}

async fn handle_repositories() -> impl IntoResponse {
    let mut apt_sources = Vec::new();
    let main = Path::new("/etc/apt/sources.list");
    if main.exists() {
        apt_sources.push(main.to_string_lossy().to_string());
    }
    if let Ok(entries) = std::fs::read_dir("/etc/apt/sources.list.d") {
        for e in entries.flatten() {
            if e.path().is_file() {
                apt_sources.push(e.path().to_string_lossy().to_string());
            }
        }
    }

    let mut flatpak_remotes = Vec::new();
    if let Ok(o) = Command::new("flatpak")
        .args(["remotes", "--columns=name,url"])
        .output()
    {
        if o.status.success() {
            for line in String::from_utf8_lossy(&o.stdout).lines() {
                let parts: Vec<&str> = line.split('\t').collect();
                if !parts.is_empty() && !parts[0].trim().is_empty() {
                    flatpak_remotes.push(serde_json::json!({
                        "name": parts[0].trim(),
                        "url": if parts.len() > 1 { parts[1].trim() } else { "" }
                    }));
                }
            }
        }
    }

    Json(serde_json::json!({
        "aptSources": apt_sources,
        "flatpakRemotes": flatpak_remotes,
    }))
}

async fn handle_gpg_keys() -> impl IntoResponse {
    let mut keys = Vec::new();
    for dir in [
        "/etc/apt/trusted.gpg.d",
        "/usr/share/keyrings",
        "/etc/apt/keyrings",
    ] {
        if let Ok(entries) = std::fs::read_dir(dir) {
            for e in entries.flatten() {
                if e.path().is_file() {
                    keys.push(serde_json::json!({
                        "path": e.path().to_string_lossy().to_string(),
                        "name": e.file_name().to_string_lossy().to_string(),
                        "dir": dir,
                    }));
                }
            }
        }
    }
    Json(serde_json::json!({ "keys": keys }))
}

async fn handle_depends(Query(params): Query<QueryParams>) -> impl IntoResponse {
    let app_id = params.id.unwrap_or_default();
    let kind = params.r#type.unwrap_or_else(|| "apt".to_string());

    if kind != "apt" || app_id.is_empty() {
        return Json(serde_json::json!({ "depends": "", "rdepends": "" }));
    }

    let dep_out = Command::new("apt-cache")
        .args(["depends", &app_id])
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
        .unwrap_or_default();

    let rdep_out = Command::new("apt-cache")
        .args(["rdepends", &app_id])
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
        .unwrap_or_default();

    Json(serde_json::json!({
        "depends": dep_out,
        "rdepends": rdep_out,
    }))
}

async fn handle_search(Query(params): Query<QueryParams>) -> impl IntoResponse {
    let q = params.q.unwrap_or_default().trim().to_string();
    let kind = params.r#type.unwrap_or_else(|| "apt".to_string());

    if q.is_empty() {
        return Json(serde_json::json!({ "results": [] }));
    }

    let mut results = Vec::new();
    if kind == "flatpak" {
        if let Ok(o) = Command::new("flatpak").args(["search", &q]).output() {
            for line in String::from_utf8_lossy(&o.stdout).lines() {
                let parts: Vec<&str> = line.split('\t').collect();
                if parts.len() >= 2 && !parts[0].trim().is_empty() {
                    results.push(serde_json::json!({
                        "id": parts[0].trim(),
                        "name": parts[1].trim(),
                        "summary": if parts.len() > 2 { parts[2].trim() } else { "" }
                    }));
                }
            }
        }
    } else {
        if let Ok(o) = Command::new("apt-cache").args(["search", &q]).output() {
            for line in String::from_utf8_lossy(&o.stdout).lines() {
                if let Some((name, desc)) = line.split_once(" - ") {
                    results.push(serde_json::json!({
                        "id": name.trim(),
                        "name": name.trim(),
                        "summary": desc.trim()
                    }));
                } else if !line.trim().is_empty() {
                    results.push(serde_json::json!({
                        "id": line.trim(),
                        "name": line.trim(),
                        "summary": ""
                    }));
                }
                if results.len() >= 50 {
                    break;
                }
            }
        }
    }

    Json(serde_json::json!({ "results": results }))
}

async fn handle_install(
    State(state): State<ServerState>,
    Json(payload): Json<OperationItem>,
) -> impl IntoResponse {
    let _guard = state.lock.lock().unwrap();
    let id = payload.id;
    let ok = run_install(&id);
    let record = serde_json::json!({
        "timestamp": std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs(),
        "action": "install",
        "id": id,
        "type": payload.package_type,
        "success": ok
    });
    log_history(&serde_json::to_string(&record).unwrap());
    if ok {
        desktop_notify("Mint Install Pro", &format!("Instalação concluída: {}", id));
        Json(serde_json::json!({ "success": true, "output": "Instalação concluída." }))
    } else {
        Json(serde_json::json!({ "success": false, "error": "Falha na instalação." }))
    }
}

async fn handle_uninstall(
    State(state): State<ServerState>,
    Json(payload): Json<OperationItem>,
) -> impl IntoResponse {
    let _guard = state.lock.lock().unwrap();
    let id = payload.id;
    if payload.package_type == "apt" {
        if let Err(msg) = assert_safe_apt_removal(std::slice::from_ref(&id)) {
            return (
                StatusCode::FORBIDDEN,
                Json(serde_json::json!({ "success": false, "error": msg })),
            );
        }
    }
    let ok = run_uninstall(&id);
    let record = serde_json::json!({
        "timestamp": std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs(),
        "action": "uninstall",
        "id": id,
        "type": payload.package_type,
        "success": ok
    });
    log_history(&serde_json::to_string(&record).unwrap());
    if ok {
        desktop_notify("Mint Install Pro", &format!("Remoção concluída: {}", id));
        (
            StatusCode::OK,
            Json(serde_json::json!({ "success": true, "output": "Remoção concluída." })),
        )
    } else {
        (
            StatusCode::OK,
            Json(serde_json::json!({ "success": false, "error": "Falha na remoção." })),
        )
    }
}

async fn handle_launch(Json(payload): Json<OperationItem>) -> impl IntoResponse {
    let id = payload.id;
    if payload.package_type == "appimage" {
        let _ = Command::new(&id).spawn();
        return Json(serde_json::json!({ "success": true, "output": "Lançando AppImage..." }));
    }
    let ok = run_launch(&id);
    if ok {
        Json(serde_json::json!({ "success": true, "output": "Aplicativo iniciado." }))
    } else {
        Json(serde_json::json!({ "success": false, "error": "Falha ao iniciar aplicativo." }))
    }
}

async fn handle_batch(State(state): State<ServerState>, Json(req): Json<BatchRequest>) -> Response {
    let _guard = state.lock.lock().unwrap();

    let apt_to_remove: Vec<String> = req
        .operations
        .iter()
        .filter(|op| op.package_type == "apt" && op.action.as_deref() == Some("uninstall"))
        .map(|op| op.id.clone())
        .collect();

    if let Err(msg) = assert_safe_apt_removal(&apt_to_remove) {
        return (
            StatusCode::FORBIDDEN,
            Json(serde_json::json!({ "success": false, "error": msg })),
        )
            .into_response();
    }

    let mut lines = Vec::new();
    for (idx, op) in req.operations.iter().enumerate() {
        lines.push(serde_json::json!({ "index": idx, "status": "processing" }).to_string());

        let action = op.action.as_deref().unwrap_or("install");
        let ok = if action == "uninstall" {
            run_uninstall(&op.id)
        } else {
            run_install(&op.id)
        };

        lines.push(
            serde_json::json!({
                "index": idx,
                "result": {
                    "success": ok,
                    "output": if ok { "Operação concluída com sucesso." } else { "Falha na operação." }
                }
            })
            .to_string(),
        );
    }

    let record = serde_json::json!({
        "timestamp": std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs(),
        "action": "batch",
        "operations": req.operations,
        "success": true
    });
    log_history(&serde_json::to_string(&record).unwrap());
    desktop_notify(
        "Mint Install Pro",
        &format!("Lote concluído: {} operações.", req.operations.len()),
    );

    let body_text = lines.join("\n") + "\n";
    Response::builder()
        .header(header::CONTENT_TYPE, "application/x-ndjson")
        .header(header::CONNECTION, "close")
        .body(Body::from(body_text))
        .unwrap()
}

async fn handle_update_all() -> impl IntoResponse {
    let mut outputs = Vec::new();
    if let Ok(o) = Command::new("pkexec")
        .args(["apt-get", "upgrade", "-y"])
        .output()
    {
        outputs.push(format!("APT:\n{}", String::from_utf8_lossy(&o.stdout)));
    }
    if let Ok(o) = Command::new("flatpak").args(["update", "-y"]).output() {
        outputs.push(format!("Flatpak:\n{}", String::from_utf8_lossy(&o.stdout)));
    }
    desktop_notify("Mint Install Pro", "Atualização do sistema concluída.");
    Json(serde_json::json!({ "success": true, "output": outputs.join("\n\n") }))
}

async fn handle_cleanup() -> impl IntoResponse {
    let mut outputs = Vec::new();
    if let Ok(o) = Command::new("pkexec")
        .args(["apt-get", "autoremove", "-y"])
        .output()
    {
        outputs.push(format!(
            "APT Autoremove:\n{}",
            String::from_utf8_lossy(&o.stdout)
        ));
    }
    for scope in ["user", "system"] {
        if let Ok(o) = Command::new("flatpak")
            .args([
                "uninstall",
                &format!("--{}", scope),
                "--unused",
                "-y",
                "--noninteractive",
            ])
            .output()
        {
            outputs.push(format!(
                "Flatpak unused ({}):\n{}",
                scope,
                String::from_utf8_lossy(&o.stdout)
            ));
        }
    }
    desktop_notify("Mint Install Pro", "Limpeza do sistema concluída.");
    Json(serde_json::json!({ "success": true, "output": outputs.join("\n\n") }))
}

async fn handle_repository_add(Json(req): Json<RepoAddRequest>) -> impl IntoResponse {
    let r_type = req.r#type.unwrap_or_default();
    let mut outputs = Vec::new();
    if r_type == "ppa" {
        let val = req.value.unwrap_or_default();
        let _ = Command::new("pkexec")
            .args(["add-apt-repository", "-y", &val])
            .output();
        let _ = Command::new("pkexec").args(["apt-get", "update"]).output();
        outputs.push("PPA adicionado e repositórios atualizados.".to_string());
    } else if r_type == "flatpak" {
        let name = req.name.unwrap_or_default();
        let url = req.url.unwrap_or_default();
        let _ = Command::new("flatpak")
            .args(["remote-add", "--if-not-exists", &name, &url])
            .output();
        outputs.push("Remoto Flatpak adicionado.".to_string());
    } else {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "success": false, "error": "Tipo inválido." })),
        );
    }
    (
        StatusCode::OK,
        Json(serde_json::json!({ "success": true, "output": outputs.join("\n") })),
    )
}

async fn handle_repository_remove(Json(req): Json<RepoRemoveRequest>) -> impl IntoResponse {
    let r_type = req.r#type.unwrap_or_default();
    let mut outputs = Vec::new();
    if r_type == "ppa" {
        let val = req.value.unwrap_or_default();
        let _ = Command::new("pkexec")
            .args(["add-apt-repository", "-r", "-y", &val])
            .output();
        outputs.push("PPA removido.".to_string());
    } else if r_type == "flatpak" {
        let name = req.name.or(req.value).unwrap_or_default();
        let _ = Command::new("flatpak")
            .args(["remote-delete", &name])
            .output();
        outputs.push("Remoto Flatpak removido.".to_string());
    } else {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "success": false, "error": "Tipo inválido." })),
        );
    }
    (
        StatusCode::OK,
        Json(serde_json::json!({ "success": true, "output": outputs.join("\n") })),
    )
}

async fn handle_install_deb(Json(req): Json<InstallDebRequest>) -> impl IntoResponse {
    let path = req.path.unwrap_or_default();
    if !path.ends_with(".deb") {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "success": false, "error": "Caminho de .deb inválido." })),
        );
    }
    let out = Command::new("pkexec")
        .args(["apt-get", "install", "-y", &path])
        .output();
    let text = out
        .map(|o| {
            String::from_utf8_lossy(&o.stdout).to_string() + &String::from_utf8_lossy(&o.stderr)
        })
        .unwrap_or_default();
    (
        StatusCode::OK,
        Json(serde_json::json!({ "success": true, "output": text })),
    )
}

async fn handle_reinstall(Json(payload): Json<OperationItem>) -> impl IntoResponse {
    let id = payload.id;
    let out = if payload.package_type == "flatpak" {
        Command::new("flatpak")
            .args(["update", "--force", "-y", &id])
            .output()
    } else {
        Command::new("pkexec")
            .args(["apt-get", "install", "--reinstall", "-y", "--", &id])
            .output()
    };
    let text = out
        .map(|o| {
            String::from_utf8_lossy(&o.stdout).to_string() + &String::from_utf8_lossy(&o.stderr)
        })
        .unwrap_or_default();
    Json(serde_json::json!({ "success": true, "output": text }))
}

async fn handle_simulate_remove(Json(payload): Json<OperationItem>) -> impl IntoResponse {
    let id = payload.id;
    if payload.package_type != "apt" {
        return Json(
            serde_json::json!({ "success": true, "output": "Simulação disponível apenas para APT." }),
        );
    }
    let out = Command::new("apt-get")
        .args(["--simulate", "remove", "--", &id])
        .output();
    let text = out
        .map(|o| {
            String::from_utf8_lossy(&o.stdout).to_string() + &String::from_utf8_lossy(&o.stderr)
        })
        .unwrap_or_default();
    Json(serde_json::json!({ "success": true, "output": text }))
}

async fn handle_gpg_import(Json(req): Json<GpgImportRequest>) -> impl IntoResponse {
    let url = req.url.unwrap_or_default().trim().to_string();
    let name = req.name.unwrap_or_default().trim().to_string();
    if url.is_empty() || name.is_empty() || name.contains('/') || name.contains("..") {
        return (
            StatusCode::BAD_REQUEST,
            Json(
                serde_json::json!({ "success": false, "error": "URL e nome válidos são obrigatórios." }),
            ),
        );
    }
    if !url.starts_with("https://") && !url.starts_with("http://") {
        return (
            StatusCode::BAD_REQUEST,
            Json(
                serde_json::json!({ "success": false, "error": "URL deve usar protocolo HTTP ou HTTPS." }),
            ),
        );
    }
    let target = format!(
        "/etc/apt/keyrings/{}",
        if name.ends_with(".gpg") || name.ends_with(".asc") {
            name
        } else {
            format!("{}.gpg", name)
        }
    );
    // Use curl and gpg securely via piped stdin rather than building an unescaped shell string
    let curl_res = Command::new("curl").args(["-fsSL", "--", &url]).output();
    match curl_res {
        Ok(curl_out) if curl_out.status.success() => {
            let _ = Command::new("pkexec")
                .args(["mkdir", "-p", "/etc/apt/keyrings"])
                .output();
            let mut gpg_child = match Command::new("pkexec")
                .args(["gpg", "--dearmor", "-o", &target])
                .stdin(std::process::Stdio::piped())
                .stdout(std::process::Stdio::null())
                .stderr(std::process::Stdio::piped())
                .spawn()
            {
                Ok(c) => c,
                Err(e) => {
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(
                            serde_json::json!({ "success": false, "error": format!("Falha ao invocar GPG: {}", e) }),
                        ),
                    );
                }
            };
            if let Some(mut stdin) = gpg_child.stdin.take() {
                use std::io::Write;
                let _ = stdin.write_all(&curl_out.stdout);
            }
            let res = gpg_child.wait_with_output();
            if res.map(|o| o.status.success()).unwrap_or(false) {
                (
                    StatusCode::OK,
                    Json(
                        serde_json::json!({ "success": true, "output": "Chave GPG importada com sucesso." }),
                    ),
                )
            } else {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(
                        serde_json::json!({ "success": false, "error": "Falha ao desarmar chave GPG." }),
                    ),
                )
            }
        }
        _ => (
            StatusCode::BAD_REQUEST,
            Json(
                serde_json::json!({ "success": false, "error": "Falha ao baixar chave da URL especificada." }),
            ),
        ),
    }
}

async fn handle_gpg_remove(Json(req): Json<GpgRemoveRequest>) -> impl IntoResponse {
    let path = req.path.unwrap_or_default().trim().to_string();
    if path.contains("..")
        || (!path.starts_with("/etc/apt/trusted.gpg.d/")
            && !path.starts_with("/usr/share/keyrings/")
            && !path.starts_with("/etc/apt/keyrings/"))
    {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "success": false, "error": "Caminho inválido." })),
        );
    }
    let _ = Command::new("pkexec")
        .args(["rm", "-f", "--", &path])
        .output();
    (
        StatusCode::OK,
        Json(serde_json::json!({ "success": true, "output": "Chave GPG removida com sucesso." })),
    )
}

async fn handle_snapshot() -> impl IntoResponse {
    let out = Command::new("pkexec")
        .args([
            "timeshift",
            "--create",
            "--comments",
            "Mint Install Pro snapshot",
        ])
        .output();
    let text = out
        .map(|o| {
            String::from_utf8_lossy(&o.stdout).to_string() + &String::from_utf8_lossy(&o.stderr)
        })
        .unwrap_or_default();
    Json(serde_json::json!({ "success": true, "output": text }))
}
