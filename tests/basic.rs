use mintinstall_pro::backend;

#[test]
fn catalog_loads() {
    let _ = backend::load_catalog();
}

#[test]
fn flatpak_detection() {
    assert!(backend::is_flatpak("com.example.App"));
    assert!(!backend::is_flatpak("htop"));
}

#[test]
fn updates_count() {
    let (total, _names) = backend::count_updates();
    let _ = total;
}

#[test]
fn settings_roundtrip() {
    let s = backend::Settings::default();
    backend::save_settings(&s);
    let loaded = backend::load_settings();
    assert_eq!(loaded.confirm_batch_action, s.confirm_batch_action);
}

#[test]
fn installed_ids_not_empty() {
    let ids = backend::installed_ids();
    assert!(!ids.is_empty());
}

#[test]
fn validation() {
    assert!(!backend::run_install(""));
    assert!(!backend::run_install("invalid id with spaces"));
}

#[test]
fn flathub_remote() {
    let _ = backend::flathub_user_remote_available();
}

#[test]
fn appimage_inventory() {
    let _ = backend::appimage_inventory();
}

#[test]
fn assert_safe_apt_removal_empty() {
    assert!(backend::assert_safe_apt_removal(&[]).is_ok());
}
