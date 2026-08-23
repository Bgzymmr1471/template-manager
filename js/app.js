/**
 * app.js
 * Fungsi bersama: render layout (navbar + sidebar + offcanvas), toast, loading,
 * konfirmasi, dan helper format (tanggal, mata uang, escape HTML).
 */

const App = (function () {
  // Daftar menu navigasi
  const NAV = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: "bi-speedometer2",
      href: "index.html",
    },
    {
      key: "murid",
      label: "Murid",
      icon: "bi-people",
      href: "pages/murid.html",
    },
    {
      key: "pertemuan",
      label: "Pertemuan",
      icon: "bi-calendar-check",
      href: "pages/pertemuan.html",
    },
    {
      key: "pembayaran",
      label: "Pembayaran",
      icon: "bi-cash-coin",
      href: "pages/pembayaran.html",
    },
    {
      key: "pengaturan",
      label: "Pengaturan",
      icon: "bi-gear",
      href: "pages/pengaturan.html",
    },
  ];

  /**
   * Render layout ke dalam halaman.
   * @param {string} active - key menu aktif
   * @param {string} base - prefix path relatif ('' untuk root, '../' untuk pages/)
   */
  function initLayout(active, base) {
    base = base || "";

    const navItems = NAV.map(function (item) {
      const isActive = item.key === active ? "active" : "";
      return (
        '<a class="nav-link ' +
        isActive +
        '" href="' +
        base +
        item.href +
        '" data-testid="nav-' +
        item.key +
        '">' +
        '<i class="bi ' +
        item.icon +
        '"></i><span>' +
        item.label +
        "</span></a>"
      );
    }).join("");

    const brand =
      '<span class="brand"><i class="bi bi-music-note-beamed"></i> Symphony</span>';

    // Navbar (mobile) + tombol offcanvas
    const header =
      '<nav class="navbar app-navbar d-lg-none" data-testid="top-navbar">' +
      '  <div class="container-fluid">' +
      '    <button class="btn btn-outline-light btn-sm" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebarOffcanvas" data-testid="sidebar-toggle-btn">' +
      '      <i class="bi bi-list"></i>' +
      "    </button>" +
      '    <a class="navbar-brand mb-0" href="' +
      base +
      'index.html">' +
      brand +
      "</a>" +
      '    <span style="width:38px"></span>' +
      "  </div>" +
      "</nav>";

    // Sidebar desktop
    const sidebar =
      '<aside class="app-sidebar d-none d-lg-flex" data-testid="desktop-sidebar">' +
      '  <div class="sidebar-brand">' +
      brand +
      "</div>" +
      '  <nav class="sidebar-nav">' +
      navItems +
      "</nav>" +
      '  <div class="sidebar-footer">Symphony Course Manager</div>' +
      "</aside>";

    // Offcanvas mobile
    const offcanvas =
      '<div class="offcanvas offcanvas-start app-offcanvas" tabindex="-1" id="sidebarOffcanvas" data-testid="mobile-offcanvas">' +
      '  <div class="offcanvas-header">' +
      '    <div class="sidebar-brand">' +
      brand +
      "</div>" +
      '    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>' +
      "  </div>" +
      '  <div class="offcanvas-body">' +
      '    <nav class="sidebar-nav">' +
      navItems +
      "</nav>" +
      "  </div>" +
      "</div>";

    const headerMount = document.getElementById("layout-header");
    const sidebarMount = document.getElementById("layout-sidebar");
    if (headerMount) headerMount.innerHTML = header + offcanvas;
    if (sidebarMount) sidebarMount.innerHTML = sidebar;

    ensureToastContainer();
  }

  /* ---------------- Toast ---------------- */

  function ensureToastContainer() {
    if (document.getElementById("toast-container")) return;
    const div = document.createElement("div");
    div.id = "toast-container";
    div.className = "toast-container position-fixed bottom-0 end-0 p-3";
    div.style.zIndex = "1090";
    document.body.appendChild(div);
  }

  function toast(message, type) {
    ensureToastContainer();
    type = type || "success";
    const bg =
      type === "success"
        ? "text-bg-primary"
        : type === "error"
          ? "text-bg-danger"
          : "text-bg-dark";
    const icon =
      type === "success"
        ? "bi-check-circle"
        : type === "error"
          ? "bi-exclamation-triangle"
          : "bi-info-circle";

    const el = document.createElement("div");
    el.className = "toast align-items-center " + bg + " border-0";
    el.setAttribute("role", "alert");
    el.setAttribute("data-testid", "app-toast");
    el.innerHTML =
      '<div class="d-flex">' +
      '  <div class="toast-body"><i class="bi ' +
      icon +
      ' me-2"></i>' +
      escapeHtml(message) +
      "</div>" +
      '  <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>' +
      "</div>";
    document.getElementById("toast-container").appendChild(el);
    const t = new bootstrap.Toast(el, { delay: 3200 });
    t.show();
    el.addEventListener("hidden.bs.toast", function () {
      el.remove();
    });
  }

  /* ---------------- Konfirmasi (Promise) ---------------- */

  function confirmDialog(message) {
    return new Promise(function (resolve) {
      let modalEl = document.getElementById("confirm-modal");
      if (!modalEl) {
        modalEl = document.createElement("div");
        modalEl.id = "confirm-modal";
        modalEl.className = "modal fade";
        modalEl.tabIndex = -1;
        modalEl.innerHTML =
          '<div class="modal-dialog modal-dialog-centered">' +
          '  <div class="modal-content">' +
          '    <div class="modal-header"><h5 class="modal-title"><i class="bi bi-exclamation-triangle text-danger me-2"></i>Konfirmasi</h5>' +
          '      <button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>' +
          '    <div class="modal-body" id="confirm-modal-body"></div>' +
          '    <div class="modal-footer">' +
          '      <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal" data-testid="confirm-cancel-btn">Batal</button>' +
          '      <button type="button" class="btn btn-danger" id="confirm-ok-btn" data-testid="confirm-ok-btn">Hapus</button>' +
          "    </div>" +
          "  </div>" +
          "</div>";
        document.body.appendChild(modalEl);
      }
      document.getElementById("confirm-modal-body").textContent = message;
      const modal = new bootstrap.Modal(modalEl);
      const okBtn = document.getElementById("confirm-ok-btn");

      const onOk = function () {
        cleanup();
        modal.hide();
        resolve(true);
      };
      const onHide = function () {
        cleanup();
        resolve(false);
      };
      function cleanup() {
        okBtn.removeEventListener("click", onOk);
        modalEl.removeEventListener("hidden.bs.modal", onHide);
      }
      okBtn.addEventListener("click", onOk);
      modalEl.addEventListener("hidden.bs.modal", onHide);
      modal.show();
    });
  }

  /* ---------------- Loading tombol ---------------- */

  function setButtonLoading(btn, loading, loadingText) {
    if (!btn) return;
    if (loading) {
      btn.dataset.originalHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2"></span>' +
        (loadingText || "Menyimpan...");
    } else {
      btn.disabled = false;
      if (btn.dataset.originalHtml) btn.innerHTML = btn.dataset.originalHtml;
    }
  }

  /* ---------------- Helpers ---------------- */

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatCurrency(value) {
    const num = Number(value) || 0;
    return "Rp " + num.toLocaleString("id-ID");
  }

  function formatDate(str) {
    if (!str) return "-";
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function badgeStatus(status) {
    const s = String(status || "").toLowerCase();
    if (s === "aktif" || s === "lunas") return "text-bg-success";
    if (s === "tidak aktif" || s === "belum lunas") return "text-bg-secondary";
    return "text-bg-secondary";
  }

  function renderLoading(container, cols) {
    if (!container) return;
    container.innerHTML =
      '<tr><td colspan="' +
      (cols || 6) +
      '" class="text-center py-5">' +
      '<div class="spinner-border text-primary" role="status"></div>' +
      '<div class="mt-2 text-muted">Memuat data...</div></td></tr>';
  }

  function renderEmpty(container, cols, message) {
    if (!container) return;
    container.innerHTML =
      '<tr><td colspan="' +
      (cols || 6) +
      '" class="text-center py-5 text-muted">' +
      '<i class="bi bi-inbox fs-2 d-block mb-2"></i>' +
      (message || "Belum ada data.") +
      "</td></tr>";
  }

  function renderError(container, cols, message) {
    if (!container) return;
    container.innerHTML =
      '<tr><td colspan="' +
      (cols || 6) +
      '" class="text-center py-5 text-danger">' +
      '<i class="bi bi-wifi-off fs-2 d-block mb-2"></i>' +
      escapeHtml(message || "Gagal mengambil data.") +
      "</td></tr>";
  }

  function configWarningHtml() {
    if (Api.isConfigured()) return "";
    return (
      '<div class="alert alert-warning d-flex align-items-start gap-2" role="alert" data-testid="config-warning">' +
      '<i class="bi bi-exclamation-triangle-fill fs-5"></i>' +
      "<div><strong>API belum dikonfigurasi.</strong> Buka <code>js/config.js</code> dan ganti " +
      "<code>API_URL</code> dengan URL Web App Google Apps Script Anda agar aplikasi dapat membaca data.</div>" +
      "</div>"
    );
  }

  /* ---------------- Ekspor CSV ---------------- */

  function exportCsv(filename, columns, rows) {
    // columns: [{key, label}], rows: array of object
    const escapeCell = function (val) {
      const s = val === null || val === undefined ? "" : String(val);
      if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };
    const header = columns
      .map(function (c) {
        return escapeCell(c.label);
      })
      .join(",");
    const lines = rows.map(function (r) {
      return columns
        .map(function (c) {
          return escapeCell(r[c.key]);
        })
        .join(",");
    });
    // BOM agar Excel membaca UTF-8 dengan benar
    const csv = "\uFEFF" + header + "\n" + lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return {
    initLayout: initLayout,
    toast: toast,
    confirmDialog: confirmDialog,
    setButtonLoading: setButtonLoading,
    escapeHtml: escapeHtml,
    formatCurrency: formatCurrency,
    formatDate: formatDate,
    badgeStatus: badgeStatus,
    renderLoading: renderLoading,
    renderEmpty: renderEmpty,
    renderError: renderError,
    configWarningHtml: configWarningHtml,
    exportCsv: exportCsv,
  };
})();
