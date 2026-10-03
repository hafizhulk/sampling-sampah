// Interaksi tab, proyeksi, pratinjau, dan baris dinamis.
(function () {
  "use strict";
  var SAMP = window.SAMP || {};
  var ssOpts = SAMP.sssrtOpts || [];
  var tpsJenis = SAMP.tpsJenisOpts || [];
  var ssi = SAMP.sssrtStart || 2;
  var tpsi = SAMP.tpsStart || 1;
  var tpai = SAMP.tpaStart || 1;

  var cdMap = { "1.5": "1.5", "1": "1", "1b": "1", "0.5": "0.5", "0.5k": "0.5" };
  var cdNum = { "1.5": 1.5, "1": 1.0, "1b": 1.0, "0.5": 0.5, "0.5k": 0.5 };

  function onTab(btn) {
    document.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("on"); });
    document.querySelectorAll(".tb").forEach(function (b) { b.classList.remove("on"); });
    var el = document.getElementById("tab-" + btn.dataset.tab);
    if (el) el.classList.add("on");
    btn.classList.add("on");
  }

  function togProy() {
    var on = document.getElementById("chk_proy").checked;
    document.getElementById("sec-dir").style.display = on ? "none" : "";
    document.getElementById("sec-proy").style.display = on ? "" : "none";
  }

  function syncCd(sel, outId) {
    var out = document.getElementById(outId);
    if (out) out.value = cdNum[sel.value] || "";
  }

  function syncNm(sel, tid) {
    if (sel.value) document.getElementById(tid).value = sel.value;
  }

  function slovin(N, e) { return N / (1 + N * e * e); }

  function prevTPS(inp, pvId) {
    var N = parseInt(inp.value, 10) || 0;
    var el = document.getElementById(pvId);
    if (!el) return;
    if (!N) { el.textContent = ""; return; }
    var eEl = document.getElementById("f-tps-e");
    var e = eEl ? parseFloat(eEl.value) : 0.1;
    var txt = N > 30
      ? "N=" + N + ">30 → Alt 1: n≈" + Math.round(slovin(N, e))
      : "N=" + N + "≤30 → Alt 2: n=" + Math.ceil(N * 0.1);
    el.innerHTML = "";
    var s = document.createElement("span");
    s.className = "tag";
    s.textContent = "Pratinjau: " + txt;
    el.appendChild(s);
  }

  function prevTPA(inp, pvId) {
    var N = parseInt(inp.value, 10) || 0;
    var el = document.getElementById(pvId);
    if (!el) return;
    if (!N) { el.textContent = ""; return; }
    var met = document.getElementById("f-tpa-met");
    var eEl = document.getElementById("f-tpa-e");
    var e = eEl ? parseFloat(eEl.value) : 0.1;
    var txt = (met && met.value === "alt2")
      ? "Alt 2: n=" + Math.ceil(N * 0.1)
      : "Alt 1: n≈" + Math.round(slovin(N, e));
    el.innerHTML = "";
    var s = document.createElement("span");
    s.className = "tag";
    s.textContent = "Pratinjau: " + txt;
    el.appendChild(s);
  }

  function escOpt(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function addSSSRT() {
    var i = ssi++;
    var d = document.createElement("div");
    d.className = "entry";
    d.id = "ss" + i;
    var opts = ssOpts.map(function (o) { return '<option value="' + escOpt(o) + '">' + escOpt(o) + "</option>"; }).join("");
    d.innerHTML =
      '<button type="button" class="del" data-rm="ss' + i + '" aria-label="Hapus baris">×</button>' +
      '<div class="r2"><div class="fg"><label>Jenis fasilitas</label>' +
      '<select data-sync="ssnm' + i + '"><option value="">— Pilih —</option>' + opts + "</select>" +
      '<input type="text" name="sssrt_nama[]" id="ssnm' + i + '" placeholder="Nama fasilitas" class="mt5">' +
      '</div><div class="fg"><label>Total unit (Ts/N)</label>' +
      '<input type="number" name="sssrt_ts[]" min="1" placeholder="Jumlah unit">' +
      '<div class="hint">Total unit fasilitas sejenis</div></div></div>';
    document.getElementById("sssrt-rows").appendChild(d);
  }

  function addTPS() {
    var i = tpsi++;
    var d = document.createElement("div");
    d.className = "entry";
    d.id = "tp" + i;
    var jOpts = tpsJenis.map(function (o) { return '<option value="' + escOpt(o) + '">' + escOpt(o) + "</option>"; }).join("");
    d.innerHTML =
      '<button type="button" class="del" data-rm="tp' + i + '" aria-label="Hapus baris">×</button>' +
      '<div class="r3">' +
      '<div class="fg"><label>Nama lokasi</label><input type="text" name="tps_nama[]" placeholder="Nama TPS"></div>' +
      '<div class="fg"><label>Jenis</label><select name="tps_jenis[]">' + jOpts + "</select></div>" +
      '<div class="fg"><label>Kapasitas (m³)</label><input type="number" name="tps_kap[]" min="0" step="0.1" placeholder="—"></div>' +
      "</div>" +
      '<div class="r2">' +
      '<div class="fg"><label>Total ritasi/hari (N) *</label>' +
      '<input type="number" name="tps_n[]" min="1" placeholder="Contoh: 45" data-tps-n="tpspv' + i + '" id="tpsn' + i + '">' +
      '<div class="hint">Total ritasi semua alat pengumpul per hari</div></div>' +
      '<div class="fg"><label class="vh">Pratinjau</label><div id="tpspv' + i + '" class="pv"></div></div>' +
      "</div>";
    document.getElementById("tps-rows").appendChild(d);
  }

  function addTPA() {
    var i = tpai++;
    var d = document.createElement("div");
    d.className = "entry";
    d.id = "ta" + i;
    d.innerHTML =
      '<button type="button" class="del" data-rm="ta' + i + '" aria-label="Hapus baris">×</button>' +
      '<div class="r3">' +
      '<div class="fg"><label>Nama TPA</label><input type="text" name="tpa_nama[]" placeholder="Nama TPA"></div>' +
      '<div class="fg"><label>Kapasitas (ton/hari)</label><input type="number" name="tpa_kap[]" min="0" step="1" placeholder="—"></div>' +
      '<div class="fg"><label>Ritasi/hari (N) *</label>' +
      '<input type="number" name="tpa_n[]" min="1" placeholder="Contoh: 20" data-tpa-n="tapv' + i + '" id="tpan' + i + '">' +
      "</div></div>" +
      '<div id="tapv' + i + '" class="pv"></div>';
    document.getElementById("tpa-rows").appendChild(d);
  }

  // Delegasi event agar baris dinamis ikut berfungsi.
  document.addEventListener("click", function (ev) {
    var t = ev.target;
    if (t.classList && t.classList.contains("tb")) onTab(t);
    else if (t.id === "chk_proy") togProy();
    else if (t.id === "btn-ss-add") addSSSRT();
    else if (t.id === "btn-tps-add") addTPS();
    else if (t.id === "btn-tpa-add") addTPA();
    else if (t.dataset && t.dataset.rm) {
      var el = document.getElementById(t.dataset.rm);
      if (el) el.remove();
    }
  });
  document.addEventListener("change", function (ev) {
    var t = ev.target;
    if (t.id === "f-ss-kota") syncCd(t, "f-ss-cd");
    else if (t.dataset && t.dataset.sync) syncNm(t, t.dataset.sync);
    else if (t.id === "f-tps-e") {
      document.querySelectorAll("#tps-rows input[data-tps-n]").forEach(function (inp) {
        prevTPS(inp, inp.dataset.tpsN);
      });
    }
  });
  document.addEventListener("input", function (ev) {
    var t = ev.target;
    if (t.dataset && t.dataset.tpsN) prevTPS(t, t.dataset.tpsN);
    else if (t.dataset && t.dataset.tpaN) prevTPA(t, t.dataset.tpaN);
  });
})();
