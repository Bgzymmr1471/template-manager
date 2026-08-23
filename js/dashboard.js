/**
 * dashboard.js
 * Mengambil data dashboard REAL dari Google Sheets via API dan menampilkannya.
 */
document.addEventListener("DOMContentLoaded", function () {
  App.initLayout("dashboard", "");
  document.getElementById("config-warning").innerHTML = App.configWarningHtml();

  document
    .getElementById("refresh-btn")
    .addEventListener("click", loadDashboard);
  loadDashboard();
});

async function loadDashboard() {
  const recentBody = document.getElementById("recent-pertemuan");
  const hampirList = document.getElementById("hampir-habis-list");
  App.renderLoading(recentBody, 4);
  hampirList.innerHTML =
    '<li class="list-group-item text-center text-muted py-4"><div class="spinner-border spinner-border-sm"></div></li>';

  try {
    const d = await Api.getDashboard();

    document.getElementById("stat-murid").textContent = d.total_murid;
    document.getElementById("stat-murid-aktif").textContent =
      "(" + d.total_murid_aktif + " aktif)";
    document.getElementById("stat-pertemuan").textContent =
      d.total_pertemuan_bulan_ini;
    document.getElementById("stat-pembayaran").textContent = App.formatCurrency(
      d.total_pembayaran_bulan_ini,
    );
    document.getElementById("stat-hampir-habis").textContent = (
      d.paket_hampir_habis || []
    ).length;

    renderIncomeChart(d.pendapatan_bulanan || []);

    // Pertemuan terbaru
    const recent = d.pertemuan_terbaru || [];
    if (!recent.length) {
      App.renderEmpty(recentBody, 4, "Belum ada pertemuan.");
    } else {
      recentBody.innerHTML = recent
        .map(function (p) {
          return (
            "<tr>" +
            "<td>" +
            App.formatDate(p.tanggal) +
            "</td>" +
            "<td>" +
            App.escapeHtml(p.murid_nama) +
            "</td>" +
            '<td><span class="badge text-bg-light">' +
            App.escapeHtml(p.pertemuan_ke) +
            "</span></td>" +
            "<td>" +
            App.escapeHtml(p.materi || "-") +
            "</td>" +
            "</tr>"
          );
        })
        .join("");
    }

    // Paket hampir habis
    const hampir = d.paket_hampir_habis || [];
    if (!hampir.length) {
      hampirList.innerHTML =
        '<li class="list-group-item text-center text-muted py-4"><i class="bi bi-check-circle me-1"></i>Semua paket masih aman.</li>';
    } else {
      hampirList.innerHTML = hampir
        .map(function (m) {
          const label =
            m.sisa_pertemuan === 0 ? "Paket Habis" : "Sisa " + m.sisa_pertemuan;
          const cls =
            m.sisa_pertemuan === 0 ? "text-bg-danger" : "text-bg-warning";
          return (
            '<li class="list-group-item d-flex justify-content-between align-items-center">' +
            "<div><strong>" +
            App.escapeHtml(m.nama) +
            '</strong><div class="small text-muted">' +
            App.escapeHtml(m.instrumen) +
            " · " +
            App.escapeHtml(m.paket) +
            "</div></div>" +
            '<span class="badge ' +
            cls +
            '">' +
            label +
            "</span></li>"
          );
        })
        .join("");
    }
  } catch (err) {
    App.renderError(recentBody, 4, err.message);
    hampirList.innerHTML =
      '<li class="list-group-item text-center text-danger py-4">' +
      App.escapeHtml(err.message) +
      "</li>";
    [
      "stat-murid",
      "stat-pertemuan",
      "stat-pembayaran",
      "stat-hampir-habis",
    ].forEach(function (id) {
      document.getElementById(id).textContent = "–";
    });
  }
}

let incomeChart = null;

function renderIncomeChart(data) {
  const canvas = document.getElementById("income-chart");
  if (!canvas || typeof Chart === "undefined") return;

  const labels = data.map(function (d) {
    return d.label;
  });
  const values = data.map(function (d) {
    return d.total;
  });
  const total = values.reduce(function (a, b) {
    return a + b;
  }, 0);
  document.getElementById("chart-total").textContent =
    "Total: " + App.formatCurrency(total);

  if (incomeChart) incomeChart.destroy();
  incomeChart = new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Pendapatan",
          data: values,
          backgroundColor: "#2563eb",
          borderRadius: 6,
          maxBarThickness: 56,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              return App.formatCurrency(ctx.parsed.y);
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (v) {
              if (v >= 1000000) return "Rp " + v / 1000000 + "jt";
              if (v >= 1000) return "Rp " + v / 1000 + "rb";
              return "Rp " + v;
            },
          },
          grid: { color: "#eef0f3" },
        },
        x: { grid: { display: false } },
      },
    },
  });
}
