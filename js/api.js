/**
 * api.js
 * Lapisan komunikasi dengan Google Apps Script Web App menggunakan Fetch API.
 *
 * Catatan CORS:
 * - Google Apps Script Web App yang di-deploy dengan akses "Anyone" mengizinkan
 *   permintaan lintas origin (termasuk dari GitHub Pages) untuk GET & POST sederhana.
 * - Untuk POST, kita menggunakan Content-Type "text/plain;charset=utf-8" agar
 *   browser TIDAK mengirim preflight OPTIONS (yang tidak didukung Apps Script).
 *   Body tetap berupa string JSON dan diparse di backend via e.postData.contents.
 * - Tidak diperlukan server proxy tambahan.
 */

const Api = (function () {
  function isConfigured() {
    return CONFIG.API_URL && CONFIG.API_URL.indexOf("YOUR_GOOGLE") === -1;
  }

  function buildUrl(action, params) {
    const url = new URL(CONFIG.API_URL);
    url.searchParams.set("action", action);
    if (params) {
      Object.keys(params).forEach(function (k) {
        if (params[k] !== undefined && params[k] !== null) {
          url.searchParams.set(k, params[k]);
        }
      });
    }
    return url.toString();
  }

  async function handleResponse(res) {
    let json;
    try {
      json = await res.json();
    } catch (e) {
      throw new Error("Gagal mengambil data.");
    }
    if (!json || json.success !== true) {
      throw new Error(
        (json && json.message) || "Terjadi kesalahan pada server.",
      );
    }
    return json.data !== undefined ? json.data : json;
  }

  /**
   * GET request. Mengembalikan data (json.data).
   */
  async function get(action, params) {
    if (!isConfigured()) {
      throw new Error(
        "API_URL belum dikonfigurasi. Silakan atur di js/config.js.",
      );
    }
    let res;
    try {
      res = await fetch(buildUrl(action, params), {
        method: "GET",
        redirect: "follow",
      });
    } catch (e) {
      throw new Error("Gagal terhubung ke server.");
    }
    return handleResponse(res);
  }

  /**
   * POST request. Mengirim body JSON sebagai text/plain untuk menghindari preflight.
   */
  async function post(action, data) {
    if (!isConfigured()) {
      throw new Error(
        "API_URL belum dikonfigurasi. Silakan atur di js/config.js.",
      );
    }
    let res;
    try {
      res = await fetch(buildUrl(action), {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data || {}),
      });
    } catch (e) {
      throw new Error("Gagal terhubung ke server.");
    }
    return handleResponse(res);
  }

  return {
    isConfigured: isConfigured,
    get: get,
    post: post,
    // Endpoint helpers
    getMurid: function () {
      return get("getMurid");
    },
    getMuridDetail: function (id) {
      return get("getMurid", { id: id });
    },
    createMurid: function (d) {
      return post("createMurid", d);
    },
    updateMurid: function (d) {
      return post("updateMurid", d);
    },
    deleteMurid: function (id) {
      return post("deleteMurid", { id: id });
    },
    getPertemuan: function () {
      return get("getPertemuan");
    },
    createPertemuan: function (d) {
      return post("createPertemuan", d);
    },
    updatePertemuan: function (d) {
      return post("updatePertemuan", d);
    },
    deletePertemuan: function (id) {
      return post("deletePertemuan", { id: id });
    },
    getPembayaran: function () {
      return get("getPembayaran");
    },
    createPembayaran: function (d) {
      return post("createPembayaran", d);
    },
    updatePembayaran: function (d) {
      return post("updatePembayaran", d);
    },
    deletePembayaran: function (id) {
      return post("deletePembayaran", { id: id });
    },
    getDashboard: function () {
      return get("getDashboard");
    },
    getPengaturan: function () {
      return get("getPengaturan");
    },
    updatePengaturan: function (d) {
      return post("updatePengaturan", d);
    },
    seedSampleData: function () {
      return post("seedSampleData", {});
    },
    clearSampleData: function () {
      return post("clearSampleData", {});
    },
  };
})();
