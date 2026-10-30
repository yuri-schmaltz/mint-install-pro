use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::process::Command;

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct CatalogApp {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub summary: String,
    #[serde(default)]
    pub category: String,
    #[serde(default)]
    pub package_type: Option<String>,
    #[serde(default)]
    pub rating: Option<f64>,
    #[serde(default)]
    pub icon: Option<String>,
}

#[derive(Deserialize)]
struct Catalog {
    apps: Vec<CatalogApp>,
}

pub fn load_catalog() -> Vec<CatalogApp> {
    let paths = [
        "dist/data/catalog.json",
        "/usr/share/mint-install-pro/data/catalog.json",
    ];
    for p in paths {
        if let Ok(content) = std::fs::read_to_string(p) {
            if let Ok(apps) = serde_json::from_str::<Vec<CatalogApp>>(&content) {
                return apps;
            }
            if let Ok(cat) = serde_json::from_str::<Catalog>(&content) {
                return cat.apps;
            }
        }
    }
    // Fallback embedded catalog
    const EMBEDDED_CATALOG: &str = include_str!("../dist/data/catalog.json");
    if let Ok(apps) = serde_json::from_str::<Vec<CatalogApp>>(EMBEDDED_CATALOG) {
        return apps;
    }
    if let Ok(cat) = serde_json::from_str::<Catalog>(EMBEDDED_CATALOG) {
        return cat.apps;
    }
    Vec::new()
}

pub fn installed_ids() -> HashSet<String> {
    let mut set = HashSet::new();
    if let Ok(o) = Command::new("dpkg-query")
        .args(["-W", "-f=${binary:Package}\n"])
        .output()
    {
        if let Ok(s) = String::from_utf8(o.stdout) {
            for line in s.lines() {
                if !line.is_empty() {
                    set.insert(line.trim().to_string());
                }
            }
        }
    }
    if let Ok(o) = Command::new("flatpak")
        .args(["list", "--app", "--columns=application"])
        .output()
    {
        if let Ok(s) = String::from_utf8(o.stdout) {
            for line in s.lines() {
                if !line.is_empty() {
                    set.insert(line.trim().to_string());
                }
            }
        }
    }
    set
}

pub fn is_flatpak(id: &str) -> bool {
    id.split('.').count() >= 3
        && !id.contains(' ')
        && id
            .chars()
            .all(|c| c.is_alphanumeric() || c == '.' || c == '_' || c == '-')
}

fn valid_apt_id(id: &str) -> bool {
    !id.is_empty()
        && id.len() <= 128
        && id
            .chars()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || "+.-".contains(c))
}

fn valid_flatpak_id(id: &str) -> bool {
    id.split('.').count() >= 3 && id.chars().all(|c| c.is_alphanumeric() || "._-".contains(c))
}

pub fn run_install(id: &str) -> bool {
    if is_flatpak(id) && !valid_flatpak_id(id) {
        return false;
    }
    if !is_flatpak(id) && !valid_apt_id(id) {
        return false;
    }
    if is_flatpak(id) {
        Command::new("flatpak")
            .args([
                "install",
                "--user",
                "-y",
                "--noninteractive",
                "flathub",
                "--",
                id,
            ])
            .status()
            .map(|s| s.success())
            .unwrap_or(false)
    } else {
        Command::new("pkexec")
            .args(["apt-get", "install", "--no-remove", "-y", "--", id])
            .status()
            .map(|s| s.success())
            .unwrap_or(false)
    }
}

pub fn run_uninstall(id: &str) -> bool {
    if is_flatpak(id) && !valid_flatpak_id(id) {
        return false;
    }
    if !is_flatpak(id) && !valid_apt_id(id) {
        return false;
    }
    if is_flatpak(id) {
        Command::new("flatpak")
            .args(["uninstall", "--user", "-y", "--noninteractive", "--", id])
            .status()
            .map(|s| s.success())
            .unwrap_or(false)
    } else {
        Command::new("pkexec")
            .args(["apt-get", "remove", "-y", "--", id])
            .status()
            .map(|s| s.success())
            .unwrap_or(false)
    }
}

pub fn run_launch(id: &str) -> bool {
    if is_flatpak(id) {
        Command::new("flatpak")
            .args(["run", "--user", id])
            .spawn()
            .is_ok()
    } else {
        // find desktop
        if let Ok(o) = Command::new("dpkg-query").args(["-L", "--", id]).output() {
            for line in String::from_utf8_lossy(&o.stdout).lines() {
                if line.starts_with("/usr/share/applications/")
                    && line.ends_with(".desktop")
                    && std::path::Path::new(line).is_file()
                {
                    return Command::new("gio").args(["launch", line]).spawn().is_ok();
                }
            }
        }
        false
    }
}

pub fn count_updates() -> (usize, Vec<String>) {
    let mut total = 0;
    let mut names = Vec::new();
    if let Ok(o) = Command::new("apt").args(["list", "--upgradable"]).output() {
        if let Ok(s) = String::from_utf8(o.stdout) {
            for line in s.lines() {
                if line.contains('/') && line.contains("upgradable") {
                    let name = line.split('/').next().unwrap_or("").trim();
                    if !name.is_empty() {
                        total += 1;
                        names.push(name.to_string());
                    }
                }
            }
        }
    }
    if let Ok(o) = Command::new("flatpak")
        .args(["remote-ls", "--updates", "--columns=application"])
        .output()
    {
        if let Ok(s) = String::from_utf8(o.stdout) {
            for line in s.lines() {
                let id = line.trim();
                if !id.is_empty() {
                    total += 1;
                    names.push(id.to_string());
                }
            }
        }
    }
    (total, names)
}

use std::path::PathBuf;

#[derive(Serialize, Deserialize, Clone, Default)]
pub struct Settings {
    #[serde(default)]
    pub search_in_summary: bool,
    #[serde(default)]
    pub search_in_description: bool,
    #[serde(default)]
    pub search_category_only: bool,
    #[serde(default = "default_true")]
    pub enable_flathub_live: bool,
    #[serde(default)]
    pub allow_unverified_flatpaks: bool,
    #[serde(default = "default_pref")]
    pub package_type_preference: String,
    #[serde(default = "default_true")]
    pub confirm_batch_action: bool,
}

fn default_true() -> bool {
    true
}
fn default_pref() -> String {
    "all".to_string()
}

fn settings_path() -> PathBuf {
    PathBuf::from(std::env::var("HOME").unwrap_or_default())
        .join(".config/mintinstall-pro/settings.json")
}

pub fn load_settings() -> Settings {
    let path = settings_path();
    if let Ok(content) = std::fs::read_to_string(&path) {
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        Settings {
            search_in_summary: true,
            search_in_description: true,
            search_category_only: false,
            enable_flathub_live: true,
            allow_unverified_flatpaks: false,
            package_type_preference: "all".to_string(),
            confirm_batch_action: true,
        }
    }
}

pub fn save_settings(settings: &Settings) {
    let path = settings_path();
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    if let Ok(json) = serde_json::to_string_pretty(settings) {
        let _ = std::fs::write(&path, json);
    }
}

pub fn flathub_user_remote_available() -> bool {
    if let Ok(o) = Command::new("flatpak")
        .args(["remotes", "--user", "--columns=name"])
        .output()
    {
        if o.status.success() {
            let s = String::from_utf8_lossy(&o.stdout);
            return s.split_whitespace().any(|w| w == "flathub");
        }
    }
    false
}

pub fn apt_inventory() -> (Vec<String>, std::collections::HashMap<String, String>) {
    let mut packages = Vec::new();
    let mut protections = std::collections::HashMap::new();
    let fmt = "${binary:Package}\t${db:Status-Status}\t${Essential}\t${Protected}\t${Priority}\n";
    if let Ok(o) = Command::new("/usr/bin/dpkg-query")
        .args(["-W", &format!("-f={}", fmt)])
        .output()
    {
        if o.status.success() {
            for line in String::from_utf8_lossy(&o.stdout).lines() {
                let fields: Vec<&str> = line.split('\t').collect();
                if fields.len() != 5 {
                    continue;
                }
                let app_id = fields[0].split(':').next().unwrap_or("").to_string();
                let status = fields[1];
                let essential = fields[2];
                let protected = fields[3];
                let priority = fields[4];
                if status == "installed" {
                    packages.push(app_id.clone());
                }
                if status != "not-installed" && status != "config-files" {
                    let reason = protection_reason(&app_id, essential, protected, priority);
                    if let Some(r) = reason {
                        protections.insert(app_id, r);
                    }
                }
            }
        }
    }
    (packages, protections)
}

fn protection_reason(
    app_id: &str,
    essential: &str,
    protected: &str,
    priority: &str,
) -> Option<String> {
    if essential == "yes" {
        return Some("Pacote essencial para o funcionamento do sistema.".to_string());
    }
    if protected == "yes" {
        return Some("Componente protegido pelo gerenciador de pacotes.".to_string());
    }
    if priority == "required" {
        return Some("Pacote obrigatório da base do sistema.".to_string());
    }
    let base_packages = [
        "apt",
        "dpkg",
        "libc6",
        "init",
        "systemd",
        "systemd-sysv",
        "udev",
        "dbus",
        "dbus-user-session",
        "sudo",
        "policykit-1",
        "polkitd",
        "pkexec",
        "network-manager",
        "linux-firmware",
        "linux-generic",
        "linux-image-generic",
        "initramfs-tools",
        "initramfs-tools-core",
        "mintsystem",
        "ubuntu-system-adjustments",
        "mint-install-pro",
        "python3",
        "python3-minimal",
    ];
    if base_packages.contains(&app_id)
        || app_id.starts_with("mint-meta-")
        || app_id.starts_with("grub-")
        || app_id.starts_with("shim-")
    {
        return Some(
            "Componente de base necessário para manter o sistema funcionando.".to_string(),
        );
    }
    let base_packages = [
        "apt", "dpkg", "libc6", "init", "systemd", "systemd-sysv", "udev",
        "dbus", "dbus-user-session", "sudo", "policykit-1", "polkitd", "pkexec",
        "network-manager", "linux-firmware", "linux-generic", "linux-image-generic",
        "initramfs-tools", "initramfs-tools-core", "mintsystem",
        "ubuntu-system-adjustments", "mint-install-pro", "python3", "python3-minimal",
    ];
    if base_packages.contains(&app_id) || app_id.starts_with("mint-meta-") || app_id.starts_with("grub-") || app_id.starts_with("shim-") {
        return Some("Componente de base necessário para manter o sistema funcionando.".to_string());
    }
    let desktop = [
        "cinnamon",
        "cinnamon-core",
        "cinnamon-session",
        "cinnamon-settings-daemon",
        "cinnamon", "cinnamon-core", "cinnamon-session", "cinnamon-settings-daemon",
        "muffin", "lightdm", "slick-greeter", "xorg", "xserver-xorg", "xserver-xorg-core",
        "mate-desktop", "mate-session-manager", "mate-panel", "marco",
        "xfce4", "xfce4-session", "xfwm4", "xfce4-panel",
        "mate-desktop",
        "mate-session-manager",
        "mate-panel",
        "marco",
        "xfce4",
        "xfce4-session",
        "xfwm4",
        "xfce4-panel",
    ];
    if desktop.contains(&app_id) {
        return Some("Componente da interface gráfica e da sessão do sistema.".to_string());
    }
    None
}

pub fn assert_safe_apt_removal(app_ids: &[String]) -> Result<(), String> {
    if app_ids.is_empty() {
        return Ok(());
    }
    let (_packages, protections) = apt_inventory();
    let blocked: Vec<&String> = app_ids
        .iter()
        .filter(|id| protections.contains_key(*id))
        .collect();
    if !blocked.is_empty() {
        return Err(format!(
            "Remoção bloqueada: {}. Esses pacotes são componentes protegidos do sistema.",
            blocked
                .iter()
                .map(|s| s.as_str())
                .collect::<Vec<_>>()
                .join(", ")
        ));
    }
    Ok(())
}

pub fn log_history(record: &str) {
    let path = std::path::PathBuf::from(std::env::var("HOME").unwrap_or_default())
        .join(".local/share/mint-install-pro/history.log");
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    use std::io::Write;
    if let Ok(mut f) = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
    {
        let _ = writeln!(f, "{}", record);
    }
}

pub fn desktop_notify(title: &str, body: &str) {
    let _ = Command::new("notify-send")
        .args(["--action=open=Abrir Mint Install Pro", title, body])
        .output();
}

pub fn appimage_inventory() -> Vec<serde_json::Value> {
    let mut result = Vec::new();
    let mut seen = std::collections::HashSet::new();
    let dirs = [
        std::path::PathBuf::from(std::env::var("HOME").unwrap_or_default()).join("Applications"),
        std::path::PathBuf::from(std::env::var("HOME").unwrap_or_default()).join(".local/bin"),
        std::path::PathBuf::from("/opt"),
    ];
    for dir in dirs {
        if !dir.exists() {
            continue;
        }
        // simple non-recursive scan
        if let Ok(entries) = std::fs::read_dir(&dir) {
            for e in entries.flatten() {
                let p = e.path();
                if p.is_file() {
                    let ext = p.extension().and_then(|e| e.to_str()).unwrap_or("");
                    if ext.eq_ignore_ascii_case("AppImage") || ext.eq_ignore_ascii_case("appimage")
                    {
                        let key = p.to_string_lossy().to_string();
                        if seen.insert(key.clone()) {
                            let name = p
                                .file_stem()
                                .unwrap_or_default()
                                .to_string_lossy()
                                .to_string();
                            result.push(serde_json::json!({"id": key, "name": name, "path": key}));
                        }
                    }
                }
            }
        }
    }
    result
}
