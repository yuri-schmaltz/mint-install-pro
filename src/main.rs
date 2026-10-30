use gio::ListStore;
use gtk4::prelude::*;
use gtk4::{
    Application, ApplicationWindow, Box as GtkBox, Button, CheckButton, ComboBoxText, CustomFilter,
    Dialog, FilterListModel, Label, ListItem, ListView, Orientation, ScrolledWindow, SearchEntry,
    SignalListItemFactory, SingleSelection,
};
use mintinstall_rust::backend;
use mintinstall_rust::backend::*;
use mintinstall_rust::list_item::AppItem;
use std::cell::RefCell;
use std::collections::HashSet;
use std::process::Command;
use std::rc::Rc;

fn show_app_details(
    window: &ApplicationWindow,
    a: &CatalogApp,
    installed_rc: Rc<RefCell<HashSet<String>>>,
) {
    let dialog = Dialog::new();
    dialog.set_title(Some(&a.name));
    dialog.set_modal(true);
    dialog.set_transient_for(Some(window));
    let content = dialog.content_area();
    let vbox = GtkBox::new(Orientation::Vertical, 8);
    vbox.set_margin_top(12);
    vbox.set_margin_bottom(12);
    vbox.set_margin_start(12);
    vbox.set_margin_end(12);

    let lbl = Label::new(Some(&a.summary));
    lbl.set_wrap(true);
    vbox.append(&lbl);

    let cat = Label::new(Some(&format!("Categoria: {}", a.category)));
    vbox.append(&cat);

    let is_inst = installed_rc.borrow().contains(&a.id);
    let status = Label::new(Some(if is_inst {
        "Instalado"
    } else {
        "Não instalado"
    }));
    vbox.append(&status);

    let btn_box = GtkBox::new(Orientation::Horizontal, 8);
    let action_btn = Button::with_label(if is_inst { "Remover" } else { "Instalar" });
    let launch_btn = Button::with_label("Executar");
    launch_btn.set_sensitive(is_inst);
    btn_box.append(&action_btn);
    btn_box.append(&launch_btn);

    let sim_btn = Button::with_label("Simular remoção");
    let reinstall_btn = Button::with_label("Reinstalar");
    let depends_btn = Button::with_label("Dependências");
    if !is_inst {
        sim_btn.set_sensitive(false);
        reinstall_btn.set_sensitive(false);
        depends_btn.set_sensitive(false);
    }
    btn_box.append(&sim_btn);
    btn_box.append(&reinstall_btn);
    btn_box.append(&depends_btn);
    vbox.append(&btn_box);
    content.append(&vbox);

    let id = a.id.clone();
    let installed_rc3 = installed_rc.clone();
    let status_c = status.clone();
    let action_c = action_btn.clone();
    let launch_c = launch_btn.clone();
    action_btn.connect_clicked(move |_| {
        let currently = installed_rc3.borrow().contains(&id);
        let ok = if currently {
            run_uninstall(&id)
        } else {
            run_install(&id)
        };
        if ok {
            if currently {
                installed_rc3.borrow_mut().remove(&id);
                status_c.set_text("Não instalado");
                action_c.set_label("Instalar");
                launch_c.set_sensitive(false);
            } else {
                installed_rc3.borrow_mut().insert(id.clone());
                status_c.set_text("Instalado");
                action_c.set_label("Remover");
                launch_c.set_sensitive(true);
            }
        }
    });

    let id2 = a.id.clone();
    launch_btn.connect_clicked(move |_| {
        run_launch(&id2);
    });

    let id3 = a.id.clone();
    sim_btn.connect_clicked(move |_| {
        let out = Command::new("apt-get")
            .args(["--simulate", "remove", "--", &id3])
            .output();
        let text = out
            .map(|o| {
                String::from_utf8_lossy(&o.stdout).to_string() + &String::from_utf8_lossy(&o.stderr)
            })
            .unwrap_or_default();
        let d2 = Dialog::new();
        d2.set_title(Some("Simulação de remoção"));
        d2.set_modal(true);
        let c2 = d2.content_area();
        let scr = ScrolledWindow::new();
        let lbl = Label::new(Some(&text));
        lbl.set_wrap(true);
        scr.set_child(Some(&lbl));
        c2.append(&scr);
        d2.show();
    });

    let id4 = a.id.clone();
    reinstall_btn.connect_clicked(move |_| {
        if is_flatpak(&id4) {
            let _ = Command::new("flatpak")
                .args(["update", "--force", "-y", &id4])
                .status();
        } else {
            let _ = Command::new("pkexec")
                .args(["apt-get", "install", "--reinstall", "-y", "--", &id4])
                .status();
        }
    });

    let id5 = a.id.clone();
    depends_btn.connect_clicked(move |_| {
        let out = Command::new("apt-cache").args(["depends", &id5]).output();
        let text = out
            .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
            .unwrap_or_default();
        let d2 = Dialog::new();
        d2.set_title(Some("Dependências"));
        d2.set_modal(true);
        let c2 = d2.content_area();
        let scr = ScrolledWindow::new();
        let lbl = Label::new(Some(&text));
        lbl.set_wrap(true);
        scr.set_child(Some(&lbl));
        c2.append(&scr);
        d2.show();
    });

    dialog.show();
}

fn main() {
    let app = Application::new(Some("com.mintinstall.rust"), Default::default());
    app.connect_activate(|app| {
        // Apply CSS theme
        let provider = gtk4::CssProvider::new();
        provider.load_from_path("style.css");
        if let Some(display) = gtk4::gdk::Display::default() {
            gtk4::style_context_add_provider_for_display(
                &display,
                &provider,
                gtk4::STYLE_PROVIDER_PRIORITY_APPLICATION,
            );
        }

        let window = ApplicationWindow::new(app);
        window.set_title(Some("Mint Install Pro (Rust)"));
        window.set_default_size(1280, 800);

        let vbox = GtkBox::new(Orientation::Vertical, 0);

        // Header
        let header = GtkBox::new(Orientation::Horizontal, 8);
        header.set_margin_top(8);
        header.set_margin_bottom(8);
        header.set_margin_start(8);
        header.set_margin_end(8);

        let title = Label::new(Some("Mint Install Pro (Rust)"));
        title.set_halign(gtk4::Align::Start);

        let search = SearchEntry::new();
        search.set_hexpand(true);
        search.set_placeholder_text(Some("Pesquisar aplicativos..."));

        let updates_btn = Button::with_label("Atualizações");
        let history_btn = Button::with_label("Histórico");
        let cleanup_btn = Button::with_label("Limpeza");
        let install_name_btn = Button::with_label("Instalar por nome");
        let repos_btn = Button::with_label("Repos");
        let gpg_btn = Button::with_label("GPG");
        let snapshot_btn = Button::with_label("Snapshot");
        let appimages_btn = Button::with_label("AppImages");
        let localdeb_btn = Button::with_label(".deb local");
        let prefs_btn = Button::with_label("Preferências");
        let export_btn = Button::with_label("Exportar");
        let import_btn = Button::with_label("Importar");

        let category_combo = ComboBoxText::new();
        category_combo.append(Some("all"), "Todas");

        header.append(&title);
        header.append(&search);
        header.append(&updates_btn);
        header.append(&history_btn);
        header.append(&cleanup_btn);
        header.append(&install_name_btn);
        header.append(&repos_btn);
        header.append(&gpg_btn);
        header.append(&snapshot_btn);
        header.append(&appimages_btn);
        header.append(&localdeb_btn);
        header.append(&prefs_btn);
        header.append(&export_btn);
        header.append(&import_btn);
        header.append(&category_combo);
        vbox.append(&header);

        // Bottom action bar
        let bottom_bar = GtkBox::new(Orientation::Horizontal, 8);
        bottom_bar.set_margin_top(8);
        bottom_bar.set_margin_bottom(8);
        bottom_bar.set_margin_start(8);
        bottom_bar.set_margin_end(8);
        let bottom_label = Label::new(Some("0 selecionados"));
        bottom_label.set_hexpand(true);
        bottom_label.set_halign(gtk4::Align::Start);
        let exec_btn = Button::with_label("Executar Ações");
        exec_btn.set_sensitive(false);
        bottom_bar.append(&bottom_label);
        bottom_bar.append(&exec_btn);

        // Data setup
        let catalog = load_catalog();
        let installed = Rc::new(RefCell::new(installed_ids()));
        let selected: Rc<RefCell<HashSet<String>>> = Rc::new(RefCell::new(HashSet::new()));

        // Fill categories
        let mut cats: Vec<String> = catalog.iter().map(|a| a.category.clone()).collect();
        cats.sort();
        cats.dedup();
        for c in &cats {
            if !c.is_empty() {
                category_combo.append(Some(c), c);
            }
        }
        category_combo.set_active_id(Some("all"));

        // Setup ListStore
        let store = ListStore::new::<AppItem>();
        for a in &catalog {
            let is_inst = installed.borrow().contains(&a.id);
            let item = AppItem::new(&a.id, &a.name, &a.summary, &a.category, is_inst);
            store.append(&item);
        }

        // Search & Category Filter
        let search_text = Rc::new(RefCell::new(String::new()));
        let cat_filter = Rc::new(RefCell::new("all".to_string()));

        let search_text_filter = search_text.clone();
        let cat_filter_pred = cat_filter.clone();
        let filter = CustomFilter::new(move |obj| {
            if let Ok(item) = obj.downcast_ref::<AppItem>().ok_or(()) {
                let q = search_text_filter.borrow().to_lowercase();
                let cat = cat_filter_pred.borrow().clone();

                let matches_q = if q.is_empty() {
                    true
                } else {
                    item.name().to_lowercase().contains(&q) || item.summary().to_lowercase().contains(&q)
                };

                let matches_cat = if cat == "all" {
                    true
                } else {
                    item.category() == cat
                };

                matches_q && matches_cat
            } else {
                false
            }
        });

        let filter_model = FilterListModel::new(Some(store.clone()), Some(filter.clone()));
        let selection_model = SingleSelection::new(Some(filter_model.clone()));

        // Factory for virtualized ListView
        let factory = SignalListItemFactory::new();

        factory.connect_setup(|_, list_item| {
            let list_item = list_item.downcast_ref::<ListItem>().unwrap();

            let row_box = GtkBox::new(Orientation::Horizontal, 8);
            row_box.set_margin_top(4);
            row_box.set_margin_bottom(4);
            row_box.set_margin_start(8);
            row_box.set_margin_end(8);

            let icon_label = Label::new(None);
            icon_label.set_width_chars(2);
            icon_label.set_halign(gtk4::Align::Center);

            let checkbox = CheckButton::new();
            checkbox.set_halign(gtk4::Align::Center);

            let name_label = Label::new(None);
            name_label.set_halign(gtk4::Align::Start);
            name_label.set_width_chars(20);

            let summary_label = Label::new(None);
            summary_label.set_halign(gtk4::Align::Start);
            summary_label.set_ellipsize(gtk4::pango::EllipsizeMode::End);
            summary_label.set_hexpand(true);

            let status_label = Label::new(None);
            status_label.set_width_chars(12);

            let action_button = Button::new();

            row_box.append(&icon_label);
            row_box.append(&checkbox);
            row_box.append(&name_label);
            row_box.append(&summary_label);
            row_box.append(&status_label);
            row_box.append(&action_button);

            list_item.set_child(Some(&row_box));
        });

        let installed_bind = installed.clone();
        let selected_bind = selected.clone();
        let bottom_label_bind = bottom_label.clone();
        let exec_btn_bind = exec_btn.clone();

        factory.connect_bind(move |_, list_item| {
            let list_item = list_item.downcast_ref::<ListItem>().unwrap();
            let item = list_item.item().and_downcast::<AppItem>().unwrap();
            let row_box = list_item.child().and_downcast::<GtkBox>().unwrap();

            let icon_label = row_box.first_child().and_downcast::<Label>().unwrap();
            let mut next = icon_label.next_sibling();

            let checkbox = next.clone().and_downcast::<CheckButton>().unwrap();
            next = checkbox.next_sibling();

            let name_label = next.clone().and_downcast::<Label>().unwrap();
            next = name_label.next_sibling();

            let summary_label = next.clone().and_downcast::<Label>().unwrap();
            next = summary_label.next_sibling();

            let status_label = next.clone().and_downcast::<Label>().unwrap();
            next = status_label.next_sibling();

            let action_btn = next.clone().and_downcast::<Button>().unwrap();

            // Set content
            let name = item.name();
            let first_char = name.chars().next().unwrap_or('?').to_string().to_uppercase();
            icon_label.set_text(&first_char);
            name_label.set_text(&name);
            summary_label.set_text(&item.summary());

            let is_inst = installed_bind.borrow().contains(&item.id());
            status_label.set_text(if is_inst { "Instalado" } else { "" });
            action_btn.set_label(if is_inst { "Remover" } else { "Instalar" });

            let is_sel = selected_bind.borrow().contains(&item.id());
            checkbox.set_active(is_sel);

            // Button click
            let item_id = item.id();
            let installed_rc_click = installed_bind.clone();
            let status_lbl_click = status_label.clone();
            let action_btn_click = action_btn.clone();
            let item_clone = item.clone();

            action_btn.connect_clicked(move |_| {
                let currently = installed_rc_click.borrow().contains(&item_id);
                let ok = if currently { run_uninstall(&item_id) } else { run_install(&item_id) };
                if ok {
                    if currently {
                        installed_rc_click.borrow_mut().remove(&item_id);
                        item_clone.set_installed(false);
                        status_lbl_click.set_text("");
                        action_btn_click.set_label("Instalar");
                    } else {
                        installed_rc_click.borrow_mut().insert(item_id.clone());
                        item_clone.set_installed(true);
                        status_lbl_click.set_text("Instalado");
                        action_btn_click.set_label("Remover");
                    }
                }
            });

            // Checkbox click
            let item_id_cb = item.id();
            let selected_rc_cb = selected_bind.clone();
            let bottom_lbl_cb = bottom_label_bind.clone();
            let exec_btn_cb = exec_btn_bind.clone();
            let item_clone_cb = item.clone();

            checkbox.connect_toggled(move |cb| {
                if cb.is_active() {
                    selected_rc_cb.borrow_mut().insert(item_id_cb.clone());
                    item_clone_cb.set_selected(true);
                } else {
                    selected_rc_cb.borrow_mut().remove(&item_id_cb);
                    item_clone_cb.set_selected(false);
                }
                let count = selected_rc_cb.borrow().len();
                bottom_lbl_cb.set_text(&format!("{} selecionados", count));
                exec_btn_cb.set_sensitive(count > 0);
            });
        });

        let list_view = ListView::new(Some(selection_model.clone()), Some(factory));
        list_view.set_show_separators(true);

        let scrolled = ScrolledWindow::new();
        scrolled.set_vexpand(true);
        scrolled.set_child(Some(&list_view));
        vbox.append(&scrolled);
        vbox.append(&bottom_bar);
        window.set_child(Some(&vbox));

        // Connect Search
        let filter_c1 = filter.clone();
        let search_text_c = search_text.clone();
        search.connect_search_changed(move |s| {
            *search_text_c.borrow_mut() = s.text().to_string();
            filter_c1.changed(gtk4::FilterChange::Different);
        });

        // Connect Category
        let filter_c2 = filter.clone();
        let cat_filter_c = cat_filter.clone();
        category_combo.connect_changed(move |combo| {
            let cat = combo.active_id().map(|s| s.to_string()).unwrap_or_else(|| "all".to_string());
            *cat_filter_c.borrow_mut() = cat;
            filter_c2.changed(gtk4::FilterChange::Different);
        });

        // Connect Selection activation (Double click or Enter on row opens details)
        let catalog_detail = Rc::new(catalog.clone());
        let installed_detail = installed.clone();
        let window_detail = window.clone();
        let selection_model_detail = selection_model.clone();

        list_view.connect_activate(move |_, position| {
            if let Some(obj) = selection_model_detail.item(position) {
                if let Ok(item) = obj.downcast::<AppItem>() {
                    let id = item.id();
                    if let Some(app) = catalog_detail.iter().find(|a| a.id == id) {
                        show_app_details(&window_detail, app, installed_detail.clone());
                    }
                }
            }
        });

        // Batch execution action
        let selected_exec = selected.clone();
        let installed_exec = installed.clone();
        let bottom_label_exec = bottom_label.clone();
        let exec_btn_exec = exec_btn.clone();
        let catalog_exec = Rc::new(catalog.clone());
        let store_exec = store.clone();

        exec_btn.connect_clicked(move |_| {
            let ids: Vec<String> = selected_exec.borrow().iter().cloned().collect();
            if ids.is_empty() { return; }

            // Safe removal check for APT packages
            let apt_to_remove: Vec<String> = ids.iter().filter(|id| {
                installed_exec.borrow().contains(*id) && !is_flatpak(id)
            }).cloned().collect();

            if let Err(msg) = assert_safe_apt_removal(&apt_to_remove) {
                let err_dialog = Dialog::new();
                err_dialog.set_title(Some("Operação Bloqueada"));
                err_dialog.set_modal(true);
                let content = err_dialog.content_area();
                let lbl = Label::new(Some(&msg));
                lbl.set_wrap(true);
                content.append(&lbl);
                err_dialog.show();
                return;
            }

            let dialog = Dialog::new();
            dialog.set_title(Some("Confirmar lote"));
            dialog.set_modal(true);
            let content = dialog.content_area();
            let vbox = GtkBox::new(Orientation::Vertical, 8);
            vbox.set_margin_top(12);
            vbox.set_margin_bottom(12);
            vbox.set_margin_start(12);
            vbox.set_margin_end(12);

            let mut names = Vec::new();
            for id in &ids {
                let name = catalog_exec.iter().find(|a| a.id == *id).map(|a| a.name.clone()).unwrap_or_else(|| id.clone());
                let action = if installed_exec.borrow().contains(id) { "Desinstalar" } else { "Instalar" };
                names.push(format!("{} - {}", action, name));
            }
            let lbl = Label::new(Some(&names.join("\n")));
            lbl.set_wrap(true);
            lbl.set_halign(gtk4::Align::Start);
            vbox.append(&lbl);

            let confirm_btn = Button::with_label("Confirmar e executar");
            vbox.append(&confirm_btn);
            content.append(&vbox);

            let ids_c = ids.clone();
            let installed_c = installed_exec.clone();
            let bottom_label_c = bottom_label_exec.clone();
            let exec_btn_c2 = exec_btn_exec.clone();
            let selected_c = selected_exec.clone();
            let store_c = store_exec.clone();

            confirm_btn.connect_clicked(move |_| {
                let prog_dialog = Dialog::new();
                prog_dialog.set_title(Some("Executando lote"));
                prog_dialog.set_modal(true);
                let content = prog_dialog.content_area();
                let vbox = GtkBox::new(Orientation::Vertical, 8);
                vbox.set_margin_top(12); vbox.set_margin_bottom(12); vbox.set_margin_start(12); vbox.set_margin_end(12);
                let status_lbl = Label::new(Some("Iniciando..."));
                let progress = gtk4::ProgressBar::new();
                progress.set_fraction(0.0);
                vbox.append(&status_lbl);
                vbox.append(&progress);
                content.append(&vbox);
                prog_dialog.show();

                let idx_state = Rc::new(RefCell::new(0usize));
                let ids_state = Rc::new(ids_c.clone());
                let installed_state = installed_c.clone();
                let status_state = status_lbl.clone();
                let progress_state = progress.clone();
                let bottom_state = bottom_label_c.clone();
                let exec_state = exec_btn_c2.clone();
                let selected_state = selected_c.clone();
                let prog_dialog_state = prog_dialog.clone();
                let store_tick = store_c.clone();

                let tick = move || {
                    let mut idx = idx_state.borrow_mut();
                    if *idx >= ids_state.len() {
                        selected_state.borrow_mut().clear();
                        bottom_state.set_text("0 selecionados");
                        exec_state.set_sensitive(false);
                        prog_dialog_state.close();
                        log_history(&format!("Lote concluído: {} itens processados.", ids_state.len()));
                        desktop_notify("Mint Install Pro", "Operação em lote concluída com sucesso.");
                        return glib::ControlFlow::Break;
                    }
                    let id = ids_state[*idx].clone();
                    *idx += 1;
                    drop(idx);
                    let currently = installed_state.borrow().contains(&id);
                    let ok = if currently { run_uninstall(&id) } else { run_install(&id) };
                    if ok {
                        if currently {
                            installed_state.borrow_mut().remove(&id);
                        } else {
                            installed_state.borrow_mut().insert(id.clone());
                        }
                        // update item in store if found
                        for i in 0..store_tick.n_items() {
                            if let Some(obj) = store_tick.item(i) {
                                if let Ok(it) = obj.downcast::<AppItem>() {
                                    if it.id() == id {
                                        it.set_installed(!currently);
                                        it.set_selected(false);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    let done = *idx_state.borrow();
                    let total = ids_state.len();
                    progress_state.set_fraction(done as f64 / total as f64);
                    status_state.set_text(&format!("Processado {}/{}", done, total));
                    glib::ControlFlow::Continue
                };
                glib::timeout_add_local(std::time::Duration::from_millis(100), tick);
            });
            dialog.show();
        });

        // Dialogs: Updates
        updates_btn.connect_clicked(move |_| {
            let (total, names) = count_updates();
            let msg = if total == 0 {
                "Nenhuma atualização disponível.".to_string()
            } else {
                format!("{} atualização(ões): {}", total, names.join(", "))
            };
            let dialog = Dialog::new();
            dialog.set_title(Some("Atualizações"));
            dialog.set_modal(true);
            let content = dialog.content_area();
            let lbl = Label::new(Some(&msg));
            lbl.set_wrap(true);
            content.append(&lbl);
            dialog.show();
        });

        // Dialogs: History
        history_btn.connect_clicked(move |_| {
            let path = std::path::PathBuf::from(std::env::var("HOME").unwrap_or_default())
                .join(".local/share/mint-install-pro/history.log");
            let content = std::fs::read_to_string(&path)
                .unwrap_or_else(|_| "Nenhuma operação registrada.".to_string());
            let dialog = Dialog::new();
            dialog.set_title(Some("Histórico"));
            dialog.set_modal(true);
            let area = dialog.content_area();
            let scrolled = ScrolledWindow::new();
            scrolled.set_min_content_height(300);
            let label = Label::new(Some(&content));
            label.set_wrap(true);
            label.set_halign(gtk4::Align::Start);
            scrolled.set_child(Some(&label));
            area.append(&scrolled);
            dialog.show();
        });

        // Dialogs: Cleanup
        cleanup_btn.connect_clicked(move |_| {
            let _ = Command::new("pkexec").args(["apt-get", "autoremove", "-y"]).status();
            let _ = Command::new("flatpak").args(["uninstall", "--user", "--unused", "-y", "--noninteractive"]).status();
            let _ = Command::new("flatpak").args(["uninstall", "--system", "--unused", "-y", "--noninteractive"]).status();
            desktop_notify("Mint Install Pro", "Limpeza de pacotes concluída.");
        });

        // Dialogs: Install by name
        install_name_btn.connect_clicked(move |_| {
            let dialog = Dialog::new();
            dialog.set_title(Some("Instalar por nome/ID"));
            dialog.set_modal(true);
            let content = dialog.content_area();
            let vbox = GtkBox::new(Orientation::Vertical, 8);
            vbox.set_margin_top(12); vbox.set_margin_bottom(12); vbox.set_margin_start(12); vbox.set_margin_end(12);

            let type_combo = ComboBoxText::new();
            type_combo.append(Some("apt"), "APT");
            type_combo.append(Some("flatpak"), "Flatpak");
            type_combo.set_active_id(Some("apt"));

            let entry = gtk4::Entry::new();
            entry.set_placeholder_text(Some("ID do pacote"));
            let install_btn = Button::with_label("Instalar");

            vbox.append(&type_combo);
            vbox.append(&entry);
            vbox.append(&install_btn);
            content.append(&vbox);

            let entry_c = entry.clone();
            let type_c = type_combo.clone();
            install_btn.connect_clicked(move |_| {
                let id = entry_c.text().to_string();
                let kind = type_c.active_id().map(|s| s.to_string()).unwrap_or_else(|| "apt".to_string());
                let ok = if kind == "flatpak" {
                    Command::new("flatpak").args(["install", "--user", "-y", "--noninteractive", "flathub", "--", &id]).status().map(|s| s.success()).unwrap_or(false)
                } else {
                    Command::new("pkexec").args(["apt-get", "install", "--no-remove", "-y", "--", &id]).status().map(|s| s.success()).unwrap_or(false)
                };
                let msg = if ok { "Instalação concluída." } else { "Falha na instalação." };
                let d2 = Dialog::new();
                d2.set_title(Some("Resultado"));
                d2.set_modal(true);
                let c2 = d2.content_area();
                c2.append(&Label::new(Some(msg)));
                d2.show();
            });

            dialog.show();
        });

        // Dialogs: Repositories
        repos_btn.connect_clicked(move |_| {
            let dialog = Dialog::new();
            dialog.set_title(Some("Repositórios"));
            dialog.set_modal(true);
            let content = dialog.content_area();
            let vbox = GtkBox::new(Orientation::Vertical, 8);
            vbox.set_margin_top(12); vbox.set_margin_bottom(12); vbox.set_margin_start(12); vbox.set_margin_end(12);
            let mut apt_text = String::new();
            if let Ok(entries) = std::fs::read_dir("/etc/apt/sources.list.d") {
                for e in entries.flatten() {
                    apt_text.push_str(&format!("{}\n", e.path().display()));
                }
            }
            if apt_text.is_empty() { apt_text = "Nenhuma fonte APT.".to_string(); }
            let lbl = Label::new(Some(&format!("Fontes APT:\n{}", apt_text)));
            lbl.set_wrap(true);
            lbl.set_halign(gtk4::Align::Start);
            vbox.append(&lbl);

            let ppa_entry = gtk4::Entry::new();
            ppa_entry.set_placeholder_text(Some("ppa:usuario/repo"));
            let ppa_btn = Button::with_label("Adicionar PPA");
            vbox.append(&ppa_entry);
            vbox.append(&ppa_btn);
            let ppa_e = ppa_entry.clone();
            ppa_btn.connect_clicked(move |_| {
                let val = ppa_e.text().to_string();
                let _ = Command::new("pkexec").args(["add-apt-repository", "-y", &val]).status();
                let _ = Command::new("pkexec").args(["apt-get", "update"]).status();
            });

            let flathub_status = if backend::flathub_user_remote_available() {
                "Flathub (--user): Configurado"
            } else {
                "Flathub (--user): Não configurado"
            };
            let flathub_lbl = Label::new(Some(flathub_status));
            flathub_lbl.set_halign(gtk4::Align::Start);
            vbox.append(&flathub_lbl);

            let name_e = gtk4::Entry::new(); name_e.set_placeholder_text(Some("nome"));
            let url_e = gtk4::Entry::new(); url_e.set_placeholder_text(Some("https://..."));
            let fr_btn = Button::with_label("Adicionar remoto Flatpak");
            vbox.append(&name_e);
            vbox.append(&url_e);
            vbox.append(&fr_btn);
            let ne = name_e.clone(); let ue = url_e.clone();
            fr_btn.connect_clicked(move |_| {
                let n = ne.text().to_string();
                let u = ue.text().to_string();
                let _ = Command::new("flatpak").args(["remote-add", "--if-not-exists", &n, &u]).status();
            });
            content.append(&vbox);
            dialog.show();
        });

        // Dialogs: GPG
        gpg_btn.connect_clicked(move |_| {
            let dialog = Dialog::new();
            dialog.set_title(Some("Chaves GPG"));
            dialog.set_modal(true);
            let content = dialog.content_area();
            let vbox = GtkBox::new(Orientation::Vertical, 8);
            vbox.set_margin_top(12); vbox.set_margin_bottom(12); vbox.set_margin_start(12); vbox.set_margin_end(12);
            let url_e = gtk4::Entry::new(); url_e.set_placeholder_text(Some("https://..."));
            let name_e = gtk4::Entry::new(); name_e.set_placeholder_text(Some("nome.gpg"));
            let imp_btn = Button::with_label("Importar");
            vbox.append(&url_e);
            vbox.append(&name_e);
            vbox.append(&imp_btn);
            let ue = url_e.clone(); let ne = name_e.clone();
            imp_btn.connect_clicked(move |_| {
                let url = ue.text().to_string();
                let name = ne.text().to_string();
                let target = format!("/etc/apt/keyrings/{}", if name.ends_with(".gpg") || name.ends_with(".asc") { name.clone() } else { format!("{}.gpg", name) });
                let cmd = format!("mkdir -p /etc/apt/keyrings && (wget -qO- {} || curl -fsSL {}) | gpg --dearmor -o {}", url, url, target);
                let _ = Command::new("pkexec").args(["sh", "-c", &cmd]).status();
            });
            content.append(&vbox);
            dialog.show();
        });

        // Dialogs: Snapshot
        snapshot_btn.connect_clicked(move |_| {
            let _ = Command::new("pkexec").args(["timeshift", "--create", "--comments", "Mint Install Pro snapshot"]).status();
        });

        // Dialogs: AppImages
        appimages_btn.connect_clicked(move |_| {
            let items = backend::appimage_inventory();
            let dialog = Dialog::new();
            dialog.set_title(Some("AppImages Detectados"));
            dialog.set_modal(true);
            let content = dialog.content_area();
            let vbox = GtkBox::new(Orientation::Vertical, 8);
            vbox.set_margin_top(12); vbox.set_margin_bottom(12); vbox.set_margin_start(12); vbox.set_margin_end(12);

            if items.is_empty() {
                let lbl = Label::new(Some("Nenhum AppImage encontrado em ~/Applications, ~/.local/bin ou /opt."));
                lbl.set_wrap(true);
                vbox.append(&lbl);
            } else {
                for it in items {
                    let name = it.get("name").and_then(|v| v.as_str()).unwrap_or("AppImage");
                    let path = it.get("path").and_then(|v| v.as_str()).unwrap_or("");
                    let row = GtkBox::new(Orientation::Horizontal, 8);
                    let lbl = Label::new(Some(&format!("{} ({})", name, path)));
                    lbl.set_hexpand(true);
                    lbl.set_halign(gtk4::Align::Start);
                    lbl.set_ellipsize(gtk4::pango::EllipsizeMode::End);
                    let exec_btn = Button::with_label("Executar");
                    let path_owned = path.to_string();
                    exec_btn.connect_clicked(move |_| {
                        let _ = Command::new(&path_owned).spawn();
                    });
                    row.append(&lbl);
                    row.append(&exec_btn);
                    vbox.append(&row);
                }
            }
            let scr = ScrolledWindow::new();
            scr.set_min_content_height(250);
            scr.set_child(Some(&vbox));
            content.append(&scr);
            dialog.show();
        });

        // Dialogs: Local deb
        localdeb_btn.connect_clicked(move |_| {
            let dialog = Dialog::new();
            dialog.set_title(Some("Instalar .deb local"));
            dialog.set_modal(true);
            let content = dialog.content_area();
            let vbox = GtkBox::new(Orientation::Vertical, 8);
            vbox.set_margin_top(12); vbox.set_margin_bottom(12); vbox.set_margin_start(12); vbox.set_margin_end(12);
            let entry = gtk4::Entry::new();
            entry.set_placeholder_text(Some("/caminho/pacote.deb"));
            let btn = Button::with_label("Instalar");
            vbox.append(&entry);
            vbox.append(&btn);
            content.append(&vbox);
            let entry_c = entry.clone();
            btn.connect_clicked(move |_| {
                let path = entry_c.text().to_string();
                let _ = Command::new("pkexec").args(["apt-get", "install", "-y", &path]).status();
            });
            dialog.show();
        });

        // Dialogs: Preferences
        prefs_btn.connect_clicked(move |_| {
            let settings = backend::load_settings();
            let dialog = Dialog::new();
            dialog.set_title(Some("Preferências"));
            dialog.set_modal(true);
            let content = dialog.content_area();
            let notebook = gtk4::Notebook::new();

            // Tab 1: Pesquisa
            let page1 = GtkBox::new(Orientation::Vertical, 8);
            page1.set_margin_top(12); page1.set_margin_bottom(12); page1.set_margin_start(12); page1.set_margin_end(12);
            let cb1 = CheckButton::with_label("Buscar no resumo");
            cb1.set_active(settings.search_in_summary);
            let cb2 = CheckButton::with_label("Buscar na descrição");
            cb2.set_active(settings.search_in_description);
            let cb3 = CheckButton::with_label("Limitar à categoria selecionada");
            cb3.set_active(settings.search_category_only);
            page1.append(&cb1);
            page1.append(&cb2);
            page1.append(&cb3);
            notebook.append_page(&page1, Some(&Label::new(Some("Pesquisa"))));

            // Tab 2: Flatpaks
            let page2 = GtkBox::new(Orientation::Vertical, 8);
            page2.set_margin_top(12); page2.set_margin_bottom(12); page2.set_margin_start(12); page2.set_margin_end(12);
            let cb4 = CheckButton::with_label("Habilitar busca online no Flathub");
            cb4.set_active(settings.enable_flathub_live);
            let cb5 = CheckButton::with_label("Incluir resultados não verificados");
            cb5.set_active(settings.allow_unverified_flatpaks);
            page2.append(&cb4);
            page2.append(&cb5);
            notebook.append_page(&page2, Some(&Label::new(Some("Flatpaks"))));

            // Tab 3: Operações & Lote
            let page3 = GtkBox::new(Orientation::Vertical, 8);
            page3.set_margin_top(12); page3.set_margin_bottom(12); page3.set_margin_start(12); page3.set_margin_end(12);
            let cb6 = CheckButton::with_label("Confirmar operações em lote");
            cb6.set_active(settings.confirm_batch_action);
            page3.append(&cb6);
            notebook.append_page(&page3, Some(&Label::new(Some("Operações & Lote"))));

            content.append(&notebook);

            let save_btn = Button::with_label("Salvar");
            content.append(&save_btn);
            let cb1c=cb1.clone(); let cb2c=cb2.clone(); let cb3c=cb3.clone();
            let cb4c=cb4.clone(); let cb5c=cb5.clone(); let cb6c=cb6.clone();
            save_btn.connect_clicked(move |_| {
                let new_settings = backend::Settings {
                    search_in_summary: cb1c.is_active(),
                    search_in_description: cb2c.is_active(),
                    search_category_only: cb3c.is_active(),
                    enable_flathub_live: cb4c.is_active(),
                    allow_unverified_flatpaks: cb5c.is_active(),
                    package_type_preference: "all".to_string(),
                    confirm_batch_action: cb6c.is_active(),
                };
                backend::save_settings(&new_settings);
            });

            dialog.show();
        });

        // Export
        let installed_exp = installed.clone();
        let catalog_exp = Rc::new(catalog.clone());
        export_btn.connect_clicked(move |_| {
            let path = std::path::PathBuf::from(std::env::var("HOME").unwrap_or_default()).join("mint-install-backup.txt");
            let mut ids = Vec::new();
            for a in catalog_exp.iter() {
                if installed_exp.borrow().contains(&a.id) {
                    ids.push(a.id.clone());
                }
            }
            let _ = std::fs::write(&path, ids.join("\n"));
            desktop_notify("Mint Install Pro", "Backup exportado para ~/mint-install-backup.txt");
        });

        // Import
        let store_imp = store.clone();
        let selected_imp = selected.clone();
        let bottom_label_imp = bottom_label.clone();
        let exec_btn_imp = exec_btn.clone();
        import_btn.connect_clicked(move |_| {
            let path = std::path::PathBuf::from(std::env::var("HOME").unwrap_or_default()).join("mint-install-backup.txt");
            if let Ok(content) = std::fs::read_to_string(&path) {
                let ids: HashSet<String> = content.lines().map(|l| l.trim().to_string()).filter(|l| !l.is_empty()).collect();
                for i in 0..store_imp.n_items() {
                    if let Some(obj) = store_imp.item(i) {
                        if let Ok(item) = obj.downcast::<AppItem>() {
                            if ids.contains(&item.id()) {
                                item.set_selected(true);
                                selected_imp.borrow_mut().insert(item.id());
                            }
                        }
                    }
                }
                let count = selected_imp.borrow().len();
                bottom_label_imp.set_text(&format!("{} selecionados", count));
                exec_btn_imp.set_sensitive(count > 0);
                desktop_notify("Mint Install Pro", &format!("{} aplicativos selecionados do backup.", count));
            }
        });

        window.present();
    });
    app.run();
}
