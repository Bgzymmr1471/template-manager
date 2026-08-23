/**
 * pertemuan.js
 * CRUD pertemuan + pencarian/filter tanggal. Nomor pertemuan dihitung otomatis di backend.
 */
let pertemuanData = [];
let muridList = [];
let pertemuanModal;

document.addEventListener("DOMContentLoaded", function () {
  App.initLayout("pertemuan", "../");
  document.getElementById("config-warning").innerHTML = App.configWarningHtml();

  pertemuanModal = new bootstrap.Modal(
    document.getElementById("pertemuan-modal"),
  );

  document
    .getElementById("add-pertemuan-btn")
    .addEventListener("click", openCreate);
  document
    .getElementById("pertemuan-form")
    .addEventListener("submit", onSubmit);
  document.getElementById("search-pertemuan").addEventListener("input", render);
  document.getElementById("filter-tanggal").addEventListener("change", render);
  document
    .getElementById("clear-filter-btn")
    .addEventListener("click", function () {
      document.getElementById("search-pertemuan").value = "";
      document.getElementById("filter-tanggal").value = "";
      render();
    });

  loadAll();
});

async function loadAll() {
  const tbody = document.getElementById("pertemuan-tbody");
  App.renderLoading(tbody, 7);
  try {
    const results = await Promise.all([Api.getPertemuan(), Api.getMurid()]);
    pertemuanData = results[0];
    muridList = results[1];
    populateMuridSelect();
    render();
  } catch (err) {
    App.renderError(tbody, 7, err.message);
  }
}

function populateMuridSelect() {
  const sel = document.getElementById("pertemuan-murid");
  sel.innerHTML =
    '<option value="">-- Pilih Murid --</option>' +
    muridList
      .map(function (m) {
        return (
          '<option value="' +
          m.id +
          '">' +
          App.escapeHtml(m.nama) +
          " (" +
          App.escapeHtml(m.paket) +
          ")</option>"
        );
      })
      .join("");
}

function render() {
  const tbody = document.getElementById("pertemuan-tbody");
  const q = document
    .getElementById("search-pertemuan")
    .value.toLowerCase()
    .trim();
  const ft = document.getElementById("filter-tanggal").value;

  const filtered = pertemuanData.filter(function (p) {
    if (q && String(p.murid_nama).toLowerCase().indexOf(q) === -1) return false;
    if (ft && String(p.tanggal) !== ft) return false;
    return true;
  });

  if (!filtered.length) {
    App.renderEmpty(tbody, 7, "Belum ada pertemuan.");
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
        '<td><span class="badge text-bg-light">' +
        App.escapeHtml(p.pertemuan_ke) +
        "</span></td>" +
        "<td>" +
        App.escapeHtml(p.durasi) +
        " mnt</td>" +
        "<td>" +
        App.escapeHtml(p.materi || "-") +
        "</td>" +
        '<td class="text-muted small">' +
        App.escapeHtml(truncate(p.catatan, 40)) +
        "</td>" +
        '<td class="text-end text-nowrap">' +
        '<button class="btn btn-sm btn-outline-primary btn-icon" onclick="openEdit(\'' +
        p.id +
        '\')" data-testid="edit-pertemuan-btn-' +
        p.id +
        '"><i class="bi bi-pencil"></i></button> ' +
        '<button class="btn btn-sm btn-outline-danger btn-icon" onclick="onDelete(\'' +
        p.id +
        '\')" data-testid="delete-pertemuan-btn-' +
        p.id +
        '"><i class="bi bi-trash"></i></button>' +
        "</td></tr>"
      );
    })
    .join("");
}

function truncate(str, n) {
  str = String(str || "");
  return str.length > n ? str.substring(0, n) + "…" : str || "-";
}

function openCreate() {
  document.getElementById("pertemuan-form").reset();
  document.getElementById("pertemuan-id").value = "";
  document.getElementById("pertemuan-durasi").value = 90;
  document.getElementById("pertemuan-tanggal").value = new Date()
    .toISOString()
    .slice(0, 10);
  document.getElementById("pertemuan-modal-title").textContent =
    "Catat Pertemuan";
  pertemuanModal.show();
}

function openEdit(id) {
  const p = pertemuanData.find(function (x) {
    return String(x.id) === String(id);
  });
  if (!p) return;
  document.getElementById("pertemuan-id").value = p.id;
  document.getElementById("pertemuan-murid").value = p.murid_id;
  document.getElementById("pertemuan-tanggal").value = String(p.tanggal).slice(
    0,
    10,
  );
  document.getElementById("pertemuan-durasi").value = p.durasi;
  document.getElementById("pertemuan-materi").value = p.materi || "";
  document.getElementById("pertemuan-catatan").value = p.catatan || "";
  document.getElementById("pertemuan-modal-title").textContent =
    "Edit Pertemuan";
  pertemuanModal.show();
}

async function onSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById("pertemuan-submit-btn");
  const id = document.getElementById("pertemuan-id").value;
  const muridId = document.getElementById("pertemuan-murid").value;
  const tanggal = document.getElementById("pertemuan-tanggal").value;

  if (!muridId) {
    App.toast("Murid wajib dipilih.", "error");
    return;
  }
  if (!tanggal) {
    App.toast("Tanggal wajib diisi.", "error");
    return;
  }

  const payload = {
    murid_id: muridId,
    tanggal: tanggal,
    durasi:
      parseInt(document.getElementById("pertemuan-durasi").value, 10) || 0,
    materi: document.getElementById("pertemuan-materi").value.trim(),
    catatan: document.getElementById("pertemuan-catatan").value.trim(),
  };

  App.setButtonLoading(btn, true);
  try {
    if (id) {
      payload.id = id;
      await Api.updatePertemuan(payload);
    } else {
      await Api.createPertemuan(payload);
    }
    App.toast("Tindakan berhasil dilakukan.");
    pertemuanModal.hide();
    await loadAll();
  } catch (err) {
    App.toast(err.message || "Gagal menyimpan data.", "error");
  } finally {
    App.setButtonLoading(btn, false);
  }
}

async function onDelete(id) {
  const ok = await App.confirmDialog(
    "Apakah Anda yakin ingin menghapus data pertemuan ini?",
  );
  if (!ok) return;
  try {
    await Api.deletePertemuan(id);
    App.toast("Tindakan berhasil dilakukan.");
    await loadAll();
  } catch (err) {
    App.toast(err.message || "Gagal menghapus data.", "error");
  }
}
