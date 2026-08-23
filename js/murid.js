/**
 * murid.js
 * CRUD murid + pencarian/filter + detail (progress, riwayat pertemuan & pembayaran).
 */
let muridData = [];
let muridModal, detailModal;

document.addEventListener("DOMContentLoaded", function () {
  App.initLayout("murid", "../");
  document.getElementById("config-warning").innerHTML = App.configWarningHtml();

  muridModal = new bootstrap.Modal(document.getElementById("murid-modal"));
  detailModal = new bootstrap.Modal(document.getElementById("detail-modal"));

  document
    .getElementById("add-murid-btn")
    .addEventListener("click", openCreate);
  document
    .getElementById("export-murid-btn")
    .addEventListener("click", exportMuridCsv);
  document.getElementById("murid-form").addEventListener("submit", onSubmit);
  document.getElementById("search-murid").addEventListener("input", render);
  document
    .getElementById("filter-instrumen")
    .addEventListener("change", render);
  document.getElementById("filter-status").addEventListener("change", render);

  loadMurid();
});

async function loadMurid() {
  const tbody = document.getElementById("murid-tbody");
  App.renderLoading(tbody, 7);
  try {
    muridData = await Api.getMurid();
    render();
  } catch (err) {
    App.renderError(tbody, 7, err.message);
  }
}

function render() {
  const tbody = document.getElementById("murid-tbody");
  const q = document.getElementById("search-murid").value.toLowerCase().trim();
  const fi = document.getElementById("filter-instrumen").value;
  const fs = document.getElementById("filter-status").value;

  const filtered = muridData.filter(function (m) {
    if (q && String(m.nama).toLowerCase().indexOf(q) === -1) return false;
    if (fi && m.instrumen !== fi) return false;
    if (fs && m.status !== fs) return false;
    return true;
  });

  if (!filtered.length) {
    App.renderEmpty(tbody, 7, "Tidak ada murid yang cocok.");
    return;
  }

  tbody.innerHTML = filtered
    .map(function (m) {
      const persen = m.persen_progress || 0;
      let barCls = "";
      if (m.sisa_pertemuan === 0) barCls = "danger";
      else if (m.sisa_pertemuan <= 2) barCls = "warn";
      return (
        "<tr>" +
        '<td class="text-muted small">' +
        App.escapeHtml(m.id) +
        "</td>" +
        "<td><strong>" +
        App.escapeHtml(m.nama) +
        '</strong><div class="small text-muted">' +
        App.escapeHtml(m.no_hp || "-") +
        "</div></td>" +
        "<td>" +
        App.escapeHtml(m.instrumen) +
        "</td>" +
        "<td>" +
        App.escapeHtml(m.paket) +
        "</td>" +
        '<td style="min-width:150px">' +
        '<div class="d-flex justify-content-between small mb-1"><span>' +
        m.pertemuan_terpakai +
        " / " +
        m.total_pertemuan +
        "</span>" +
        '<span class="text-muted">' +
        persen +
        "%</span></div>" +
        '<div class="progress"><div class="progress-bar ' +
        barCls +
        '" style="width:' +
        persen +
        '%"></div></div>' +
        "</td>" +
        '<td><span class="badge ' +
        App.badgeStatus(m.status) +
        '">' +
        App.escapeHtml(m.status) +
        "</span></td>" +
        '<td class="text-end text-nowrap">' +
        '<button class="btn btn-sm btn-outline-secondary btn-icon" title="Detail" onclick="openDetail(\'' +
        m.id +
        '\')" data-testid="detail-murid-btn-' +
        m.id +
        '"><i class="bi bi-eye"></i></button> ' +
        '<button class="btn btn-sm btn-outline-primary btn-icon" title="Edit" onclick="openEdit(\'' +
        m.id +
        '\')" data-testid="edit-murid-btn-' +
        m.id +
        '"><i class="bi bi-pencil"></i></button> ' +
        '<button class="btn btn-sm btn-outline-danger btn-icon" title="Hapus" onclick="onDelete(\'' +
        m.id +
        '\')" data-testid="delete-murid-btn-' +
        m.id +
        '"><i class="bi bi-trash"></i></button>' +
        "</td>" +
        "</tr>"
      );
    })
    .join("");
}

function openCreate() {
  document.getElementById("murid-form").reset();
  document.getElementById("murid-id").value = "";
  document.getElementById("murid-modal-title").textContent = "Tambah Murid";
  document.getElementById("murid-total").value = 8;
  muridModal.show();
}

function openEdit(id) {
  const m = muridData.find(function (x) {
    return String(x.id) === String(id);
  });
  if (!m) return;
  document.getElementById("murid-id").value = m.id;
  document.getElementById("murid-nama").value = m.nama;
  document.getElementById("murid-hp").value = m.no_hp || "";
  document.getElementById("murid-instrumen").value = m.instrumen || "Lainnya";
  document.getElementById("murid-paket").value = m.paket || "4x";
  document.getElementById("murid-total").value = m.total_pertemuan;
  document.getElementById("murid-status").value = m.status || "Aktif";
  document.getElementById("murid-modal-title").textContent = "Edit Murid";
  muridModal.show();
}

async function onSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById("murid-submit-btn");
  const id = document.getElementById("murid-id").value;
  const nama = document.getElementById("murid-nama").value.trim();
  const total = parseInt(document.getElementById("murid-total").value, 10);

  // Validasi frontend
  if (!nama) {
    App.toast("Nama wajib diisi.", "error");
    return;
  }
  if (isNaN(total) || total <= 0) {
    App.toast("Total pertemuan harus angka positif.", "error");
    return;
  }

  const payload = {
    nama: nama,
    no_hp: document.getElementById("murid-hp").value.trim(),
    instrumen: document.getElementById("murid-instrumen").value,
    paket: document.getElementById("murid-paket").value,
    total_pertemuan: total,
    status: document.getElementById("murid-status").value,
  };

  App.setButtonLoading(btn, true);
  try {
    if (id) {
      payload.id = id;
      await Api.updateMurid(payload);
    } else {
      await Api.createMurid(payload);
    }
    App.toast("Tindakan berhasil dilakukan.");
    muridModal.hide();
    await loadMurid();
  } catch (err) {
    App.toast(err.message || "Gagal menyimpan data.", "error");
  } finally {
    App.setButtonLoading(btn, false);
  }
}

async function onDelete(id) {
  const ok = await App.confirmDialog(
    "Apakah Anda yakin ingin menghapus data murid ini? Semua pertemuan & pembayaran terkait juga akan dihapus.",
  );
  if (!ok) return;
  try {
    await Api.deleteMurid(id);
    App.toast("Tindakan berhasil dilakukan.");
    await loadMurid();
  } catch (err) {
    App.toast(err.message || "Gagal menghapus data.", "error");
  }
}

async function openDetail(id) {
  const body = document.getElementById("detail-body");
  body.innerHTML =
    '<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>';
  detailModal.show();
  try {
    const m = await Api.getMuridDetail(id);
    body.innerHTML = renderDetail(m);
  } catch (err) {
    body.innerHTML =
      '<div class="alert alert-danger">' +
      App.escapeHtml(err.message) +
      "</div>";
  }
}

function renderDetail(m) {
  const persen = m.persen_progress || 0;
  let barCls = "";
  if (m.sisa_pertemuan === 0) barCls = "danger";
  else if (m.sisa_pertemuan <= 2) barCls = "warn";

  const info =
    '<div class="row g-4"><div class="col-md-6">' +
    detailRow("Nama", m.nama) +
    detailRow("Nomor HP", m.no_hp || "-") +
    detailRow("Instrumen", m.instrumen) +
    detailRow("Status", m.status) +
    '</div><div class="col-md-6">' +
    detailRow("Paket", m.paket) +
    detailRow("Total Pertemuan", m.total_pertemuan) +
    detailRow("Terpakai", m.pertemuan_terpakai) +
    detailRow("Sisa", m.sisa_pertemuan + " pertemuan") +
    "</div></div>";

  const progress =
    '<div class="mt-4"><div class="d-flex justify-content-between mb-1">' +
    '<span class="fw-semibold">Progress Paket — ' +
    App.escapeHtml(m.status_progress) +
    "</span>" +
    "<span>" +
    m.pertemuan_terpakai +
    " / " +
    m.total_pertemuan +
    " (" +
    persen +
    "%)</span></div>" +
    '<div class="progress" style="height:12px"><div class="progress-bar ' +
    barCls +
    '" style="width:' +
    persen +
    '%"></div></div></div>';

  const pertRows =
    (m.riwayat_pertemuan || [])
      .map(function (p) {
        return (
          "<tr><td>" +
          App.escapeHtml(p.pertemuan_ke) +
          "</td><td>" +
          App.formatDate(p.tanggal) +
          "</td><td>" +
          App.escapeHtml(p.materi || "-") +
          "</td><td>" +
          App.escapeHtml(p.catatan || "-") +
          "</td></tr>"
        );
      })
      .join("") ||
    '<tr><td colspan="4" class="text-center text-muted py-3">Belum ada pertemuan.</td></tr>';

  const bayarRows =
    (m.riwayat_pembayaran || [])
      .map(function (p) {
        return (
          "<tr><td>" +
          App.formatDate(p.tanggal) +
          "</td><td>" +
          App.escapeHtml(p.paket || "-") +
          "</td><td>" +
          App.formatCurrency(p.jumlah) +
          '</td><td><span class="badge ' +
          App.badgeStatus(p.status) +
          '">' +
          App.escapeHtml(p.status) +
          "</span></td></tr>"
        );
      })
      .join("") ||
    '<tr><td colspan="4" class="text-center text-muted py-3">Belum ada pembayaran.</td></tr>';

  return (
    info +
    progress +
    '<h6 class="mt-4 mb-2"><i class="bi bi-calendar-check me-1"></i>Riwayat Pertemuan</h6>' +
    '<div class="table-responsive"><table class="table table-sm"><thead><tr><th>Ke-</th><th>Tanggal</th><th>Materi</th><th>Catatan</th></tr></thead><tbody>' +
    pertRows +
    "</tbody></table></div>" +
    '<h6 class="mt-3 mb-2"><i class="bi bi-cash-coin me-1"></i>Riwayat Pembayaran</h6>' +
    '<div class="table-responsive"><table class="table table-sm"><thead><tr><th>Tanggal</th><th>Paket</th><th>Jumlah</th><th>Status</th></tr></thead><tbody>' +
    bayarRows +
    "</tbody></table></div>"
  );
}

function detailRow(label, value) {
  return (
    '<div class="detail-row"><span class="detail-label">' +
    App.escapeHtml(label) +
    '</span><span class="detail-value">' +
    App.escapeHtml(value) +
    "</span></div>"
  );
}

function exportMuridCsv() {
  if (!muridData.length) {
    App.toast("Tidak ada data untuk diekspor.", "error");
    return;
  }
  const columns = [
    { key: "id", label: "ID" },
    { key: "nama", label: "Nama" },
    { key: "no_hp", label: "No HP" },
    { key: "instrumen", label: "Instrumen" },
    { key: "paket", label: "Paket" },
    { key: "total_pertemuan", label: "Total Pertemuan" },
    { key: "pertemuan_terpakai", label: "Terpakai" },
    { key: "sisa_pertemuan", label: "Sisa" },
    { key: "status", label: "Status" },
  ];
  App.exportCsv(
    "murid_" + new Date().toISOString().slice(0, 10) + ".csv",
    columns,
    muridData,
  );
  App.toast("Data murid berhasil diekspor.");
}
