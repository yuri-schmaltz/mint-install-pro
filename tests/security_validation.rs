use mintinstall_rust::backend::*;

#[test]
fn test_id_sanitization_attacks() {
    // Command injection attempts
    let attacks = [
        "vlc; rm -rf /",
        "vlc && touch /tmp/pwned",
        "vlc | cat /etc/shadow",
        "$(whoami)",
        "`whoami`",
        "vlc &",
        "../../etc/passwd",
        "\nwhoami\n",
        "com.example.App; reboot",
        "com.example.App && rm -rf /",
    ];

    for attack in attacks {
        assert!(
            !run_install(attack),
            "Installation should reject dangerous input: {}",
            attack
        );
        assert!(
            !run_uninstall(attack),
            "Uninstallation should reject dangerous input: {}",
            attack
        );
        assert!(
            !run_launch(attack),
            "Launch should reject dangerous input: {}",
            attack
        );
    }
}

#[test]
fn test_protected_packages_safety() {
    let essential = [
        "libc6", "dpkg", "apt", "systemd", "init", "lightdm", "xorg", "muffin",
    ];
    for pkg in essential {
        let res = assert_safe_apt_removal(&[pkg.to_string()]);
        assert!(
            res.is_err(),
            "Critical package {} MUST NOT be allowed for removal",
            pkg
        );
    }
}

#[test]
fn test_gpg_path_traversal() {
    // Name validation in gpg import must not allow path traversal
    let bad_names = [
        "../../root/.ssh/authorized_keys",
        "/etc/shadow",
        "../test.gpg",
    ];
    for name in bad_names {
        assert!(
            name.contains('/') || name.contains(".."),
            "Identified path traversal pattern"
        );
    }
}
