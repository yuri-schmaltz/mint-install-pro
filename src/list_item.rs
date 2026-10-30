use glib::subclass::prelude::*;
use gtk4::glib;
use std::cell::RefCell;

#[derive(Default)]
pub struct AppItemImp {
    pub id: RefCell<String>,
    pub name: RefCell<String>,
    pub summary: RefCell<String>,
    pub category: RefCell<String>,
    pub installed: RefCell<bool>,
    pub selected: RefCell<bool>,
}

#[glib::object_subclass]
impl ObjectSubclass for AppItemImp {
    const NAME: &'static str = "AppItem";
    type Type = AppItem;
    type ParentType = glib::Object;
}

impl ObjectImpl for AppItemImp {}

glib::wrapper! {
    pub struct AppItem(ObjectSubclass<AppItemImp>);
}

impl AppItem {
    pub fn new(id: &str, name: &str, summary: &str, category: &str, installed: bool) -> Self {
        let obj: Self = glib::Object::new();
        *obj.imp().id.borrow_mut() = id.to_string();
        *obj.imp().name.borrow_mut() = name.to_string();
        *obj.imp().summary.borrow_mut() = summary.to_string();
        *obj.imp().category.borrow_mut() = category.to_string();
        *obj.imp().installed.borrow_mut() = installed;
        *obj.imp().selected.borrow_mut() = false;
        obj
    }
    pub fn id(&self) -> String {
        self.imp().id.borrow().clone()
    }
    pub fn name(&self) -> String {
        self.imp().name.borrow().clone()
    }
    pub fn summary(&self) -> String {
        self.imp().summary.borrow().clone()
    }
    pub fn category(&self) -> String {
        self.imp().category.borrow().clone()
    }
    pub fn installed(&self) -> bool {
        *self.imp().installed.borrow()
    }
    pub fn set_installed(&self, v: bool) {
        *self.imp().installed.borrow_mut() = v;
    }
    pub fn selected(&self) -> bool {
        *self.imp().selected.borrow()
    }
    pub fn set_selected(&self, v: bool) {
        *self.imp().selected.borrow_mut() = v;
    }
}
