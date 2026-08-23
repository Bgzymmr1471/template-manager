/**
 * pengaturan.js
 * Membaca & menyimpan pengaturan aplikasi (sheet Pengaturan).
 */
const SETTING_KEYS = [
  "nama_aplikasi",
  "durasi_default",
  "mata_uang",
  "harga_4x",
  "harga_8x",
];

document.addEventListener("DOMContentLoaded", function () {
  App.initLayout("pengaturan", "../");
  document.getElementById("config-warning").innerHTML = App.configWarningHtml();

  document
    .getElementById("pengaturan-form")
    .addEventListener("submit", onSubmit);
  document.getElementById("seed-btn").addEventListener("click", onSeed);
  document
    .getElementById("clear-sample-btn")
    .addEventListener("click", onClearSample);
  renderApiStatus();
  loadPengaturan();
});

function renderApiStatus() {
  const el = document.getElementById("api-status");
  if (Api.isConfigured()) {
    el.innerHTML =
      '<span class="badge text-bg-success"><i class="bi bi-check-circle me-1"></i>Terhubung ke API</span>';
  } else {
    el.innerHTML =
      '<span class="badge text-bg-warning"><i class="bi bi-exclamation-triangle me-1"></i>Belum dikonfigurasi</span>';
  }
}

async function loadPengaturan() {
  const loading = document.getElementById("pengaturan-loading");
  const fields = document.getElementById("pengaturan-fields");
  try {
    const s = await Api.getPengaturan();
    SETTING_KEYS.forEach(function (k) {
      const input = document.getElementById("set-" + k);
      if (input) input.value = s[k] !== undefined ? s[k] : "";
    });
    loading.classList.add("d-none");
    fields.classList.remove("d-none");
  } catch (err) {
    loading.innerHTML =
      '<div class="alert alert-danger mb-0">' +
      App.escapeHtml(err.message) +
      "</div>";
  }
}

async function onSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById("pengaturan-submit-btn");
  const payload = {};
  SETTING_KEYS.forEach(function (k) {
    const input = document.getElementById("set-" + k);
    if (input) payload[k] = input.value.trim();
  });

  App.setButtonLoading(btn, true);
  try {
    await Api.updatePengaturan(payload);
    App.toast("Pengaturan berhasil disimpan.");
  } catch (err) {
    App.toast(err.message || "Gagal menyimpan data.", "error");
  } finally {
    App.setButtonLoading(btn, false);
  }
}

async function onSeed() {
  const ok = await App.confirmDialog(
    "Masukkan data contoh (3 murid, 5 pertemuan, 3 pembayaran)? Jika sudah pernah, data contoh lama akan diganti.",
  );
  if (!ok) return;
  const btn = document.getElementById("seed-btn");
  App.setButtonLoading(btn, true, "Memasukkan...");
  try {
    await Api.seedSampleData();
    App.toast(
      "Data contoh berhasil dimasukkan. Buka halaman Murid untuk melihatnya.",
    );
  } catch (err) {
    App.toast(err.message || "Gagal menyimpan data.", "error");
  } finally {
    App.setButtonLoading(btn, false);
  }
}

async function onClearSample() {
  const ok = await App.confirmDialog(
    "Hapus semua data contoh? Data asli (non-contoh) tidak akan terpengaruh.",
  );
  if (!ok) return;
  const btn = document.getElementById("clear-sample-btn");
  App.setButtonLoading(btn, true, "Menghapus...");
  try {
    const r = await Api.clearSampleData();
    App.toast((r && r.message) || "Data contoh berhasil dihapus.");
  } catch (err) {
    App.toast(err.message || "Gagal menghapus data.", "error");
  } finally {
    App.setButtonLoading(btn, false);
  }
}
