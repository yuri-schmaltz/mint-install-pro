use gio::ListStore;
use gtk4::prelude::*;
use gtk4::{CustomFilter, FilterListModel};
use mintinstall_pro::backend;
use mintinstall_pro::list_item::AppItem;

#[test]
fn test_app_item_and_store_filtering() {
    let _ = gtk4::init();

    // 1. AppItem properties
    let item = AppItem::new("org.gimp.GIMP", "GIMP", "Image editor", "Graphics", false);

    assert_eq!(item.id(), "org.gimp.GIMP");
    assert_eq!(item.name(), "GIMP");
    assert_eq!(item.summary(), "Image editor");
    assert_eq!(item.category(), "Graphics");
    assert!(!item.installed());
    assert!(!item.selected());

    item.set_installed(true);
    assert!(item.installed());

    item.set_selected(true);
    assert!(item.selected());

    // 2. ListStore and Filtering
    let store = ListStore::new::<AppItem>();

    let app1 = AppItem::new(
        "vlc",
        "VLC media player",
        "Media player",
        "Audio & Video",
        true,
    );
    let app2 = AppItem::new(
        "gimp",
        "GNU Image Editor",
        "Photo editor",
        "Graphics",
        false,
    );
    let app3 = AppItem::new(
        "inkscape",
        "Inkscape Vector",
        "Vector illustration",
        "Graphics",
        false,
    );

    store.append(&app1);
    store.append(&app2);
    store.append(&app3);

    assert_eq!(store.n_items(), 3);

    let filter = CustomFilter::new(|obj| {
        if let Ok(it) = obj.downcast_ref::<AppItem>().ok_or(()) {
            it.name().to_lowercase().contains("vector")
                || it.summary().to_lowercase().contains("vector")
        } else {
            false
        }
    });

    let model = FilterListModel::new(Some(store.clone()), Some(filter));
    assert_eq!(model.n_items(), 1);
    let matched = model.item(0).unwrap().downcast::<AppItem>().unwrap();
    assert_eq!(matched.id(), "inkscape");
}

#[test]
fn test_safe_removal_checks() {
    // Empty list is always safe
    assert!(backend::assert_safe_apt_removal(&[]).is_ok());

    // Protected critical packages should be blocked
    let blocked_result =
        backend::assert_safe_apt_removal(&["lightdm".to_string(), "xorg".to_string()]);
    assert!(blocked_result.is_err());
    let err_msg = blocked_result.unwrap_err();
    assert!(err_msg.contains("Remoção bloqueada"));
}

#[test]
fn test_catalog_fallback_and_fields() {
    let catalog = backend::load_catalog();
    assert!(
        !catalog.is_empty(),
        "Catalog should contain items either from disk or embedded"
    );

    // Check first item fields
    let first = &catalog[0];
    assert!(!first.id.is_empty());
    assert!(!first.name.is_empty());
}
