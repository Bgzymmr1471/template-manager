/**
 * pembayaran.js
 * CRUD pembayaran + pencarian/filter tanggal & status.
 */
let pembayaranData = [];
let muridListPay = [];
let pembayaranModal;
let settingHarga = {};

document.addEventListener("DOMContentLoaded", function () {
  App.initLayout("pembayaran", "../");
  document.getElementById("config-warning").innerHTML = App.configWarningHtml();

  pembayaranModal = new bootstrap.Modal(
    document.getElementById("pembayaran-modal"),
  );

  document
    .getElementById("add-pembayaran-btn")
    .addEventListener("click", openCreate);
  document
    .getElementById("export-pembayaran-btn")
    .addEventListener("click", exportPembayaranCsv);
  document
    .getElementById("pembayaran-form")
    .addEventListener("submit", onSubmit);
  document
    .getElementById("search-pembayaran")
    .addEventListener("input", render);
  document.getElementById("filter-tanggal").addEventListener("change", render);
  document.getElementById("filter-status").addEventListener("change", render);
  document
    .getElementById("clear-filter-btn")
    .addEventListener("click", function () {
      document.getElementById("search-pembayaran").value = "";
      document.getElementById("filter-tanggal").value = "";
      document.getElementById("filter-status").value = "";
      render();
    });

  // Auto-isi jumlah saat paket dipilih (dari pengaturan harga)
  document
    .getElementById("pembayaran-paket")
    .addEventListener("change", autofillHarga);

  loadAll();
});

async function loadAll() {
  const tbody = document.getElementById("pembayaran-tbody");
  App.renderLoading(tbody, 7);
  try {
    const results = await Promise.all([
      Api.getPembayaran(),
      Api.getMurid(),
      Api.getPengaturan(),
    ]);
    pembayaranData = results[0];
    muridListPay = results[1];
    settingHarga = results[2] || {};
    populateMuridSelect();
    render();
  } catch (err) {
    App.renderError(tbody, 7, err.message);
  }
}

function populateMuridSelect() {
  const sel = document.getElementById("pembayaran-murid");
  sel.innerHTML =
    '<option value="">-- Pilih Murid --</option>' +
    muridListPay
      .map(function (m) {
        return (
          '<option value="' +
          m.id +
          '" data-paket="' +
          App.escapeHtml(m.paket) +
          '">' +
          App.escapeHtml(m.nama) +
          "</option>"
        );
      })
      .join("");
}

function autofillHarga() {
  const paket = document.getElementById("pembayaran-paket").value;
  const jumlahInput = document.getElementById("pembayaran-jumlah");
  const key = paket === "4x" ? "harga_4x" : "harga_8x";
  if (settingHarga[key] && !jumlahInput.value) {
    jumlahInput.value = settingHarga[key];
  }
}

function render() {
  const tbody = document.getElementById("pembayaran-tbody");
  const q = document
    .getElementById("search-pembayaran")
    .value.toLowerCase()
    .trim();
  const ft = document.getElementById("filter-tanggal").value;
  const fs = document.getElementById("filter-status").value;

  const filtered = pembayaranData.filter(function (p) {
    if (q && String(p.murid_nama).toLowerCase().indexOf(q) === -1) return false;
    if (ft && String(p.tanggal) !== ft) return false;
    if (fs && p.status !== fs) return false;
    return true;
  });

  if (!filtered.length) {
    App.renderEmpty(tbody, 7, "Belum ada pembayaran.");
    return;
  }

  tbody.innerHTML = filtered
    .map(function (p) {
      return (
        "<tr>" +
        "<td>" +
        App.formatDate(p.tanggal) +
        "</td>" +
        "<td><strong>" +
        App.escapeHtml(p.murid_nama) +
        "</strong></td>" +
        "<td>" +
        App.escapeHtml(p.paket || "-") +
        "</td>" +
        '<td class="fw-semibold">' +
        App.formatCurrency(p.jumlah) +
        "</td>" +
        "<td>" +
        App.escapeHtml(p.metode) +
        "</td>" +
        '<td><span class="badge ' +
        App.badgeStatus(p.status) +
        '">' +
        App.escapeHtml(p.status) +
        "</span></td>" +
        '<td class="text-end text-nowrap">' +
        '<button class="btn btn-sm btn-outline-dark btn-icon" title="Cetak Kwitansi" onclick="printReceipt(\'' +
        p.id +
        '\')" data-testid="print-pembayaran-btn-' +
        p.id +
        '"><i class="bi bi-printer"></i></button> ' +
        '<button class="btn btn-sm btn-outline-primary btn-icon" onclick="openEdit(\'' +
        p.id +
        '\')" data-testid="edit-pembayaran-btn-' +
        p.id +
        '"><i class="bi bi-pencil"></i></button> ' +
        '<button class="btn btn-sm btn-outline-danger btn-icon" onclick="onDelete(\'' +
        p.id +
        '\')" data-testid="delete-pembayaran-btn-' +
        p.id +
        '"><i class="bi bi-trash"></i></button>' +
        "</td></tr>"
      );
    })
    .join("");
}

function openCreate() {
  document.getElementById("pembayaran-form").reset();
  document.getElementById("pembayaran-id").value = "";
  document.getElementById("pembayaran-tanggal").value = new Date()
    .toISOString()
    .slice(0, 10);
  document.getElementById("pembayaran-modal-title").textContent =
    "Catat Pembayaran";
  pembayaranModal.show();
}

function openEdit(id) {
  const p = pembayaranData.find(function (x) {
    return String(x.id) === String(id);
  });
  if (!p) return;
  document.getElementById("pembayaran-id").value = p.id;
  document.getElementById("pembayaran-murid").value = p.murid_id;
  document.getElementById("pembayaran-tanggal").value = String(p.tanggal).slice(
    0,
    10,
  );
  document.getElementById("pembayaran-paket").value = p.paket || "4x";
  document.getElementById("pembayaran-jumlah").value = p.jumlah;
  document.getElementById("pembayaran-metode").value = p.metode || "Cash";
  document.getElementById("pembayaran-status").value = p.status || "Lunas";
  document.getElementById("pembayaran-catatan").value = p.catatan || "";
  document.getElementById("pembayaran-modal-title").textContent =
    "Edit Pembayaran";
  pembayaranModal.show();
}

async function onSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById("pembayaran-submit-btn");
  const id = document.getElementById("pembayaran-id").value;
  const muridId = document.getElementById("pembayaran-murid").value;
  const tanggal = document.getElementById("pembayaran-tanggal").value;
  const jumlah = document.getElementById("pembayaran-jumlah").value;

  if (!muridId) {
    App.toast("Murid wajib dipilih.", "error");
    return;
  }
  if (!tanggal) {
    App.toast("Tanggal wajib diisi.", "error");
    return;
  }
  if (jumlah === "" || isNaN(Number(jumlah)) || Number(jumlah) < 0) {
    App.toast("Jumlah pembayaran harus angka.", "error");
    return;
  }

  const payload = {
    murid_id: muridId,
    tanggal: tanggal,
    paket: document.getElementById("pembayaran-paket").value,
    jumlah: Number(jumlah),
    metode: document.getElementById("pembayaran-metode").value,
    status: document.getElementById("pembayaran-status").value,
    catatan: document.getElementById("pembayaran-catatan").value.trim(),
  };

  App.setButtonLoading(btn, true);
  try {
    if (id) {
      payload.id = id;
      await Api.updatePembayaran(payload);
    } else {
      await Api.createPembayaran(payload);
    }
    App.toast("Tindakan berhasil dilakukan.");
    pembayaranModal.hide();
    await loadAll();
  } catch (err) {
    App.toast(err.message || "Gagal menyimpan data.", "error");
  } finally {
    App.setButtonLoading(btn, false);
  }
}

async function onDelete(id) {
  const ok = await App.confirmDialog(
    "Apakah Anda yakin ingin menghapus data pembayaran ini?",
  );
  if (!ok) return;
  try {
    await Api.deletePembayaran(id);
    App.toast("Tindakan berhasil dilakukan.");
    await loadAll();
  } catch (err) {
    App.toast(err.message || "Gagal menghapus data.", "error");
  }
}

function exportPembayaranCsv() {
  if (!pembayaranData.length) {
    App.toast("Tidak ada data untuk diekspor.", "error");
    return;
  }
  const columns = [
    { key: "id", label: "ID" },
    { key: "tanggal", label: "Tanggal" },
    { key: "murid_nama", label: "Murid" },
    { key: "paket", label: "Paket" },
    { key: "jumlah", label: "Jumlah" },
    { key: "metode", label: "Metode" },
    { key: "status", label: "Status" },
    { key: "catatan", label: "Catatan" },
  ];
  App.exportCsv(
    "pembayaran_" + new Date().toISOString().slice(0, 10) + ".csv",
    columns,
    pembayaranData,
  );
  App.toast("Data pembayaran berhasil diekspor.");
}

function printReceipt(id) {
  const p = pembayaranData.find(function (x) {
    return String(x.id) === String(id);
  });
  if (!p) return;
  const appName =
    settingHarga.nama_aplikasi || CONFIG.APP_NAME || "Symphony Course Manager";
  const esc = App.escapeHtml;
  const statusColor = p.status === "Lunas" ? "#15803d" : "#b45309";

  const html =
    '<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Kwitansi ' +
    esc(p.id) +
    "</title>" +
    "<style>" +
    "body{font-family:Arial,Helvetica,sans-serif;color:#111;max-width:520px;margin:32px auto;padding:0 20px;}" +
    ".head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #111;padding-bottom:14px;}" +
    ".brand{font-size:20px;font-weight:700;} .brand small{display:block;font-weight:400;color:#666;font-size:12px;margin-top:2px;}" +
    ".title{text-align:right;} .title h2{margin:0;font-size:16px;letter-spacing:2px;color:#2563eb;} .title small{color:#666;}" +
    ".rows{margin:22px 0;} .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #ddd;}" +
    ".label{color:#666;} .val{font-weight:600;text-align:right;}" +
    ".amount{margin-top:18px;background:#f4f6fb;border-radius:10px;padding:16px 18px;display:flex;justify-content:space-between;align-items:center;}" +
    ".amount .big{font-size:24px;font-weight:700;color:#2563eb;}" +
    ".badge{padding:4px 10px;border-radius:6px;color:#fff;font-size:12px;font-weight:700;}" +
    ".foot{margin-top:36px;display:flex;justify-content:space-between;font-size:13px;color:#444;}" +
    ".sign{text-align:center;} .sign .line{margin-top:52px;border-top:1px solid #111;padding-top:4px;width:160px;}" +
    ".note{margin-top:22px;font-size:12px;color:#888;text-align:center;}" +
    "@media print{body{margin:0;} .noprint{display:none;}}" +
    ".noprint{text-align:center;margin-top:24px;} .btn{background:#2563eb;color:#fff;border:none;padding:10px 22px;border-radius:8px;font-size:14px;cursor:pointer;}" +
    "</style></head><body>" +
    '<div class="head"><div class="brand">🎵 ' +
    esc(appName) +
    "<small>Kwitansi Pembayaran Les Musik</small></div>" +
    '<div class="title"><h2>KWITANSI</h2><small>No: ' +
    esc(p.id) +
    "</small><br><small>" +
    App.formatDate(p.tanggal) +
    "</small></div></div>" +
    '<div class="rows">' +
    '<div class="row"><span class="label">Nama Murid</span><span class="val">' +
    esc(p.murid_nama) +
    "</span></div>" +
    '<div class="row"><span class="label">Paket</span><span class="val">' +
    esc(p.paket || "-") +
    "</span></div>" +
    '<div class="row"><span class="label">Metode Pembayaran</span><span class="val">' +
    esc(p.metode) +
    "</span></div>" +
    '<div class="row"><span class="label">Status</span><span class="val"><span class="badge" style="background:' +
    statusColor +
    '">' +
    esc(p.status) +
    "</span></span></div>" +
    (p.catatan
      ? '<div class="row"><span class="label">Catatan</span><span class="val">' +
        esc(p.catatan) +
        "</span></div>"
      : "") +
    "</div>" +
    '<div class="amount"><span class="label">Total Dibayar</span><span class="big">' +
    App.formatCurrency(p.jumlah) +
    "</span></div>" +
    '<div class="foot"><div>Terima kasih atas kepercayaan Anda.</div>' +
    '<div class="sign">Hormat kami,<div class="line">Pengajar</div></div></div>' +
    '<div class="note">Kwitansi ini sah dan dicetak melalui ' +
    esc(appName) +
    ".</div>" +
    '<div class="noprint"><button class="btn" onclick="window.print()">Cetak / Simpan PDF</button></div>' +
    "</body></html>";

  const w = window.open("", "_blank", "width=640,height=760");
  if (!w) {
    App.toast("Popup diblokir browser. Izinkan popup untuk mencetak.", "error");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
