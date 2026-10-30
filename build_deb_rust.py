#!/usr/bin/env python3
import json, os, shutil, stat, subprocess, sys

# Run from mintinstall_rust dir
os.chdir(os.path.dirname(os.path.abspath(__file__)))
VERSION = "0.1.0"
PACKAGE_NAME = "mintinstall-rust"
DEB_DIR = f"/tmp/{PACKAGE_NAME}_{VERSION}_amd64"
OUTPUT_DEB = f"{PACKAGE_NAME}_{VERSION}_amd64.deb"

# build
env = os.environ.copy()
env["RUSTUP_HOME"] = "/home/yurix/Documentos/solid_blend/.runtime/rustup"
env["CARGO_HOME"] = "/home/yurix/Documentos/solid_blend/.runtime/cargo"
env["PATH"] = "/home/yurix/Documentos/solid_blend/.runtime/rustup/toolchains/1.99.1-x86_64-unknown-linux-gnu/bin:" + env["PATH"]
subprocess.run(["cargo", "build", "--release"], check=True, env=env)

if os.path.exists(DEB_DIR):
    shutil.rmtree(DEB_DIR)
os.makedirs(f"{DEB_DIR}/DEBIAN", exist_ok=True)
os.makedirs(f"{DEB_DIR}/usr/bin", exist_ok=True)
os.makedirs(f"{DEB_DIR}/usr/share/mintinstall_rust", exist_ok=True)

shutil.copy("target/release/mintinstall_rust", f"{DEB_DIR}/usr/bin/mintinstall-rust")
os.chmod(f"{DEB_DIR}/usr/bin/mintinstall-rust", 0o755)

# copy catalog data
src_dist = "dist"
if os.path.exists(src_dist):
    shutil.copytree(src_dist, f"{DEB_DIR}/usr/share/mintinstall_rust/dist", dirs_exist_ok=True)

control = f"""Package: {PACKAGE_NAME}
Version: {VERSION}
Section: admin
Priority: optional
Architecture: amd64
Depends: libgtk-4-1, libwebkitgtk-6.0-4
Maintainer: Yuri Schmaltz <yuri.schmaltz@gmail.com>
Description: Mint Install Pro (Rust nativo)
"""
open(f"{DEB_DIR}/DEBIAN/control","w").write(control)

subprocess.run(["dpkg-deb", "--build", "--root-owner-group", DEB_DIR, OUTPUT_DEB], check=True)
shutil.rmtree(DEB_DIR)
print("Built", OUTPUT_DEB)
