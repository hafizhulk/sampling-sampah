// tabs.js — handler hitung per tab, baris dinamis, pratinjau, dan render hasil.
// Rumus murni dipakai dari js/calculations.js (tanpa DOM). Berkas ini lapisan DOM.
(function () {
  "use strict";

  var ssi = 2, tpsi = 1, tpai = 1;

  function $(id) { return document.getElementById(id); }
  function val(id) { var el = $(id); return el ? el.value : ""; }

  function showErr(tab, msg) {
    var box = $("err-" + tab);
    if (!box) return;
    if (msg) { box.textContent = msg; box.hidden = false; }
    else { box.textContent = ""; box.hidden = true; }
  }

  function stepsHtml(steps) {
    return steps.map(function (s) { return "<li>" + s + "</li>"; }).join("");
  }

  function riCard(lbl, v, unit) {
    return "<div class='ri'><div class='rl'>" + esc(lbl) + "</div><div class='rv'>" + esc(v) + "</div><div class='ru'>" + esc(unit) + "</div></div>";
  }

  function escOpt(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // floatval(): "" / non-numerik → 0, seperti PHP.
  function fnum(v) {
    var n = Number(String(v == null ? "" : v).trim());
    return Number.isFinite(n) ? n : 0;
  }

  // ── Baris dinamis (adaptasi assets/app.js) ──────────────────────────────

  function sssrtOptions() {
    return SSSRT_OPTS.map(function (o) {
      return '<option value="' + escOpt(o) + '">' + escOpt(o) + "</option>";
    }).join("");
  }

  function addSSSRT() {
    var i = ssi++;
    var d = document.createElement("div");
    d.className = "entry";
    d.id = "ss" + i;
    d.innerHTML =
      '<button type="button" class="del" data-rm="ss' + i + '" aria-label="Hapus baris">×</button>' +
      '<div class="r2"><div class="fg"><label>Jenis fasilitas</label>' +
      '<select data-sync="ssnm' + i + '"><option value="">— Pilih jenis —</option>' + sssrtOptions() + "</select>" +
      '<input type="text" id="ssnm' + i + '" placeholder="Nama fasilitas" class="mt5">' +
      '</div><div class="fg"><label>Total unit di wilayah (Ts/N)</label>' +
      '<input type="number" min="1" placeholder="Jumlah unit">' +
      '<div class="hint">Total unit fasilitas sejenis</div></div></div>';
    $("sssrt-rows").appendChild(d);
  }

  function addTPS() {
    var i = tpsi++;
    var d = document.createElement("div");
    d.className = "entry";
    d.id = "tp" + i;
    var jOpts = TPS_JENIS_OPTS.map(function (o) {
      return '<option value="' + escOpt(o) + '">' + escOpt(o) + "</option>";
    }).join("");
    d.innerHTML =
      '<button type="button" class="del" data-rm="tp' + i + '" aria-label="Hapus baris">×</button>' +
      '<div class="r3">' +
      '<div class="fg"><label>Nama lokasi</label><input type="text" placeholder="Nama TPS/TPS3R/TPST"></div>' +
      '<div class="fg"><label>Jenis</label><select>' + jOpts + "</select></div>" +
      '<div class="fg"><label>Kapasitas alat (m³)</label><input type="number" min="0" step="0.1" placeholder="—"></div>' +
      "</div>" +
      '<div class="r2">' +
      '<div class="fg"><label>Total ritasi/hari (N) *</label>' +
      '<input type="number" min="1" placeholder="Contoh: 45" data-tps-n="tpspv' + i + '" id="tpsn' + i + '">' +
      '<div class="hint">Total ritasi semua alat pengumpul per hari</div></div>' +
      '<div class="fg"><label class="vh">Pratinjau</label><div id="tpspv' + i + '" class="pv"></div></div>' +
      "</div>";
    $("tps-rows").appendChild(d);
  }

  function addTPA() {
    var i = tpai++;
    var d = document.createElement("div");
    d.className = "entry";
    d.id = "ta" + i;
    d.innerHTML =
      '<button type="button" class="del" data-rm="ta' + i + '" aria-label="Hapus baris">×</button>' +
      '<div class="r3">' +
      '<div class="fg"><label>Nama TPA</label><input type="text" placeholder="Nama TPA"></div>' +
      '<div class="fg"><label>Kapasitas (ton/hari)</label><input type="number" min="0" step="1" placeholder="—">' +
      '<div class="hint">Kapasitas penerimaan per hari</div></div>' +
      '<div class="fg"><label>Ritasi alat angkut/hari (N) *</label>' +
      '<input type="number" min="1" placeholder="Contoh: 20" data-tpa-n="tapv' + i + '" id="tpan' + i + '">' +
      "</div></div>" +
      '<div id="tapv' + i + '" class="pv"></div>';
    $("tpa-rows").appendChild(d);
  }

  // ── Pratinjau ───────────────────────────────────────────────────────────

  function slovin(N, e) { return N / (1 + N * e * e); }

  function refreshSRTNote() {
    var pt = currentPt();
    var note = $("kota-note");
    if (note) {
      if (pt && pt > 0) {
        var k = getKota(pt);
        note.innerHTML = "Otomatis dari P<sub>t</sub> = " + fmt(pt) + " jiwa → <strong>" +
          esc(k.label) + " — C<sub>d</sub> = " + esc(String(k.cd)) + "</strong>";
      } else {
        note.textContent = "Klasifikasi dan Cd ditentukan otomatis dari Pt setelah Pt diisi (Tabel 3).";
      }
    }
    var pn = $("proy-note");
    if (pn) {
      if ($("chk_proy") && $("chk_proy").checked && pt && pt > 0) {
        pn.innerHTML = "Proyeksi P<sub>t</sub> = <strong>" + fmt(pt) + " jiwa</strong>";
        pn.hidden = false;
      } else {
        pn.innerHTML = "";
        pn.hidden = true;
      }
    }
  }

  function currentPt() {
    if ($("chk_proy") && $("chk_proy").checked) {
      var p0 = val("f-p0"), rg = val("f-rg");
      if (p0 !== "" && isNum(p0) && rg !== "" && isNum(rg)) {
        var np = toInt(val("f-thr-p")) - toInt(val("f-td"));
        if (fnum(p0) > 0 && np > 0) return proyeksi(fnum(p0), fnum(rg), np);
      }
      return null;
    }
    var pt = toInt(val("f-pt"));
    return pt > 0 ? pt : null;
  }

  function prevTPS(inp, pvId) {
    var N = toInt(inp.value);
    var el = $(pvId);
    if (!el) return;
    if (!N) { el.textContent = ""; return; }
    var e = fnum(val("f-tps-e")) || 0.1;
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
    var N = toInt(inp.value);
    var el = $(pvId);
    if (!el) return;
    if (!N) { el.textContent = ""; return; }
    var e = fnum(val("f-tpa-e")) || 0.1;
    var met = val("f-tpa-met");
    var txt = (met === "alt2")
      ? "Alt 2: n=" + Math.ceil(N * 0.1)
      : "Alt 1: n≈" + Math.round(slovin(N, e));
    el.innerHTML = "";
    var s = document.createElement("span");
    s.className = "tag";
    s.textContent = "Pratinjau: " + txt;
    el.appendChild(s);
  }

  function refreshPreviews() {
    refreshSRTNote();
    document.querySelectorAll("#tps-rows input[data-tps-n]").forEach(function (inp) {
      prevTPS(inp, inp.getAttribute("data-tps-n"));
    });
    document.querySelectorAll("#tpa-rows input[data-tpa-n]").forEach(function (inp) {
      prevTPA(inp, inp.getAttribute("data-tpa-n"));
    });
  }

  // ── Submit: SRT (urutan validasi sama persis dengan app/bootstrap.php) ──

  function submitSRT(ev) {
    ev.preventDefault();
    var err = "", pt = 0;
    var useProy = $("chk_proy").checked;
    if (useProy) {
      var p0raw = val("f-p0").trim(), rgraw = val("f-rg").trim();
      var tdraw = val("f-td").trim(), trraw = val("f-thr-p").trim();
      if (p0raw === "" || rgraw === "" || tdraw === "" || trraw === "" ||
          !isNum(p0raw) || !isNum(rgraw) || !isNum(tdraw) || !isNum(trraw)) {
        err = "Data proyeksi tidak lengkap: P₀, r, tahun dasar, dan tahun rencana wajib diisi angka.";
      } else {
        var p0 = fnum(p0raw), rg = fnum(rgraw);
        var td = toInt(tdraw), tr = toInt(trraw);
        if (p0 <= 0) { err = "Penduduk tahun dasar (P₀) harus > 0."; }
        else if (rg < 0) { err = "Laju pertumbuhan (r) tidak boleh negatif."; }
        else if (tr <= td) { err = "Tahun rencana harus lebih besar dari tahun dasar."; }
        else { pt = proyeksi(p0, rg, tr - td); }
      }
    } else {
      pt = toInt(val("f-pt"));
    }
    var html = "";
    if (!err) {
      if (pt <= 0) {
        err = "Jumlah penduduk (Pt) wajib diisi!";
      } else {
        var kotaInfo = getKota(pt);
        var cd = kotaInfo.cd;
        var method = val("f-srt-met");
        var e = fnum(val("f-srt-e"));
        var avgRaw = val("f-avg").trim();
        var snHraw = val("f-snh").trim(), snMraw = val("f-snm").trim(), snLraw = val("f-snl").trim();
        var snH = fnum(snHraw), snM = fnum(snMraw), snL = fnum(snLraw);
        if (method !== "alt1" && method !== "alt2") { err = "Metode SRT tidak valid."; }
        else if (!eValid(e)) { err = "Nilai error (e) tidak valid. Pilih 10%, 5%, atau 1%."; }
        else if (avgRaw === "" || !isNum(avgRaw) || fnum(avgRaw) <= 0) { err = "Rata-rata anggota KK harus angka positif."; }
        else if (snHraw === "" || snMraw === "" || snLraw === "" || !isNum(snHraw) || !isNum(snMraw) || !isNum(snLraw)) { err = "Proporsi Sn wajib diisi angka."; }
        else if (snH < 0 || snH > 100 || snM < 0 || snM > 100 || snL < 0 || snL > 100) { err = "Proporsi Sn harus 0–100% (tidak boleh negatif)."; }
        else if (Math.abs(snH + snM + snL - 100) > 0.1) { err = "Total Sn harus = 100%."; }
        else {
          for (var i = 0; i < ALLOWED_E.length; i++) {
            if (Math.abs(e - ALLOWED_E[i]) < 1e-9) { e = ALLOWED_E[i]; break; }
          }
          var r = calcSRT(pt, cd, method, e, fnum(avgRaw), snH, snM, snL);
          html = "<div class='rcard'>" +
            "<div class='rtitle'>Hasil — jumlah contoh SRT (Pasal 4.2.2)</div>" +
            "<div class='rgrid'>" +
            riCard("Penduduk (Pt)", fmt(pt), "jiwa") +
            riCard("Klasifikasi", kotaInfo.label, "Cd = " + kotaInfo.cd) +
            riCard("Contoh (Ps/n)", fmt(r.ps), "orang") +
            riCard("Jumlah KK", fmt(r.K), "KK") +
            riCard("Total rumah", fmt(r.nrTotal), "unit") +
            "</div>" +
            "<table class='rt'><thead><tr><th>Tingkat ekonomi</th><th>Proporsi (Sn)</th><th>Jumlah KK</th><th>Jumlah rumah (Nr)</th></tr></thead><tbody>" +
            "<tr><td>Tinggi (H)</td><td>" + esc(String(r.snH)) + "%</td><td>" + r.nrH + " KK</td><td><strong>" + r.nrH + "</strong></td></tr>" +
            "<tr><td>Menengah (M)</td><td>" + esc(String(r.snM)) + "%</td><td>" + r.nrM + " KK</td><td><strong>" + r.nrM + "</strong></td></tr>" +
            "<tr><td>Rendah (L)</td><td>" + esc(String(r.snL)) + "%</td><td>" + r.nrL + " KK</td><td><strong>" + r.nrL + "</strong></td></tr>" +
            "</tbody><tfoot><tr class='tot'><td>Total</td><td>100%</td><td>" + r.K + " KK</td><td>" + r.nrTotal + " unit</td></tr></tfoot></table>" +
            "<div class='steps-wrap'><strong>Langkah perhitungan:</strong>" +
            "<ol class='steps'>" + stepsHtml(r.steps) + "</ol></div></div>";
        }
      }
    }
    showErr("srt", err);
    $("res-srt").innerHTML = err ? "" : html;
  }

  // ── Submit: SSSRT ───────────────────────────────────────────────────────

  function submitSSSRT(ev) {
    ev.preventDefault();
    var err = "", html = "";
    var met = val("f-ss-met"), cd = fnum(val("f-ss-cd")), e = fnum(val("f-ss-e"));
    if (met !== "alt1" && met !== "alt2") { err = "Metode SSSRT tidak valid."; }
    else if (!eValid(e)) { err = "Nilai error (e) tidak valid. Pilih 10%, 5%, atau 1%."; }
    else if (met === "alt1" && !cd) { err = "Pilih klasifikasi kota untuk Alt 1!"; }
    else {
      var nama = [], ts = [];
      document.querySelectorAll("#sssrt-rows .entry").forEach(function (row) {
        var inputs = row.querySelectorAll("input");
        nama.push(inputs[0] ? inputs[0].value : "");
        ts.push(inputs[1] ? inputs[1].value : "");
      });
      var r = calcSSSRT(nama, ts, met, cd, e);
      if (!r.rows.length) { err = "Pastikan nama dan jumlah unit fasilitas telah diisi!"; }
      else {
        var tTs = r.rows.reduce(function (s, x) { return s + x.ts; }, 0);
        var tNr = r.rows.reduce(function (s, x) { return s + x.nr; }, 0);
        html = "<div class='rcard'>" +
          "<div class='rtitle'>Hasil — jumlah contoh SSSRT (Pasal 4.2.3)</div>" +
          "<table class='rt'><thead><tr><th>Jenis fasilitas</th><th>Total unit (Ts)</th><th>Jumlah contoh</th><th>Rumus</th></tr></thead><tbody>" +
          r.rows.map(function (row) {
            return "<tr><td>" + row.nama + "</td><td>" + fmt(row.ts) + "</td>" +
              "<td><strong>" + row.nr + "</strong></td><td class='mut'>" + row.desc + "</td></tr>";
          }).join("") +
          "</tbody><tfoot><tr class='tot'><td>Total</td><td>" + fmt(tTs) + "</td><td>" + tNr + "</td><td>—</td></tr></tfoot></table>" +
          "<div class='steps-wrap'><strong>Langkah perhitungan:</strong>" +
          "<ol class='steps'>" + stepsHtml(r.steps) + "</ol></div></div>";
      }
    }
    showErr("sssrt", err);
    $("res-sssrt").innerHTML = err ? "" : html;
  }

  // ── Submit: TPS (metode selalu otomatis per Pasal 4.2.4) ────────────────

  function submitTPS(ev) {
    ev.preventDefault();
    var err = "", html = "";
    var e = fnum(val("f-tps-e"));
    if (!eValid(e)) { err = "Nilai error (e) tidak valid. Pilih 10%, 5%, atau 1%."; }
    else {
      var nama = [], jenis = [], kap = [], n = [];
      document.querySelectorAll("#tps-rows .entry").forEach(function (row) {
        var inputs = row.querySelectorAll("input");
        var sel = row.querySelector("select");
        nama.push(inputs[0] ? inputs[0].value : "");
        jenis.push(sel ? sel.value : "TPS");
        kap.push(inputs[1] ? inputs[1].value : "");
        n.push(inputs[2] ? inputs[2].value : "");
      });
      var r = calcTPS(nama, jenis, kap, n, "auto", e);
      if (!r.rows.length) { err = "Pastikan jumlah ritasi/hari telah diisi!"; }
      else {
        var tN = r.rows.reduce(function (s, x) { return s + x.N; }, 0);
        var tC = r.rows.reduce(function (s, x) { return s + x.nr; }, 0);
        html = "<div class='rcard'>" +
          "<div class='rtitle'>Hasil — jumlah contoh TPS/TPS3R/TPST (Pasal 4.2.4)</div>" +
          "<table class='rt'><thead><tr><th>Nama lokasi</th><th>Jenis</th><th>Kapasitas</th><th>Ritasi/hari (N)</th><th>Metode</th><th>Jumlah contoh (n)</th></tr></thead><tbody>" +
          r.rows.map(function (row) {
            return "<tr><td>" + row.nama + "</td><td><span class='tag'>" + row.jenis + "</span></td>" +
              "<td>" + row.kap + "</td><td>" + fmt(row.N) + "</td>" +
              "<td class='mut'>" + esc(row.met) + "</td><td><strong>" + row.nr + "</strong></td></tr>";
          }).join("") +
          "</tbody><tfoot><tr class='tot'><td colspan='3'>Total</td><td>" + fmt(tN) + "</td><td>—</td><td>" + tC + "</td></tr></tfoot></table>" +
          "<div class='steps-wrap'><strong>Langkah perhitungan:</strong>" +
          "<ol class='steps'>" + stepsHtml(r.steps) + "</ol></div></div>";
      }
    }
    showErr("tps", err);
    $("res-tps").innerHTML = err ? "" : html;
  }

  // ── Submit: TPA ─────────────────────────────────────────────────────────

  function submitTPA(ev) {
    ev.preventDefault();
    var err = "", html = "";
    var met = val("f-tpa-met"), e = fnum(val("f-tpa-e"));
    if (met !== "alt1" && met !== "alt2") { err = "Metode TPA tidak valid."; }
    else if (!eValid(e)) { err = "Nilai error (e) tidak valid. Pilih 10%, 5%, atau 1%."; }
    else {
      var nama = [], kap = [], n = [];
      document.querySelectorAll("#tpa-rows .entry").forEach(function (row) {
        var inputs = row.querySelectorAll("input");
        nama.push(inputs[0] ? inputs[0].value : "");
        kap.push(inputs[1] ? inputs[1].value : "");
        n.push(inputs[2] ? inputs[2].value : "");
      });
      var r = calcTPA(nama, kap, n, met, e);
      if (!r.rows.length) { err = "Pastikan jumlah ritasi/hari telah diisi!"; }
      else {
        var tN = r.rows.reduce(function (s, x) { return s + x.N; }, 0);
        var tC = r.rows.reduce(function (s, x) { return s + x.nr; }, 0);
        html = "<div class='rcard'>" +
          "<div class='rtitle'>Hasil — jumlah contoh TPA (Pasal 4.2.5)</div>" +
          "<table class='rt'><thead><tr><th>Nama TPA</th><th>Kapasitas</th><th>Ritasi/hari (N)</th><th>Metode</th><th>Jumlah contoh (n)</th></tr></thead><tbody>" +
          r.rows.map(function (row) {
            return "<tr><td>" + row.nama + "</td><td>" + row.kap + "</td>" +
              "<td>" + fmt(row.N) + "</td><td class='mut'>" + esc(row.met) + "</td>" +
              "<td><strong>" + row.nr + "</strong></td></tr>";
          }).join("") +
          "</tbody><tfoot><tr class='tot'><td colspan='2'>Total</td><td>" + fmt(tN) + "</td><td>—</td><td>" + tC + "</td></tr></tfoot></table>" +
          "<div class='steps-wrap'><strong>Langkah perhitungan:</strong>" +
          "<ol class='steps'>" + stepsHtml(r.steps) + "</ol></div></div>";
      }
    }
    showErr("tpa", err);
    $("res-tpa").innerHTML = err ? "" : html;
  }

  // ── Reset per tab ───────────────────────────────────────────────────────

  var ROW_MIN = { sssrt: 2, tps: 1, tpa: 1 };

  function resetTab(tab) {
    var form = $("form-" + tab);
    if (form) form.reset();
    // Sinkron ulang tampilan proyeksi + baris dinamis ke kondisi awal.
    if (tab === "srt") {
      $("sec-dir").style.display = "";
      $("sec-proy").style.display = "none";
    }
    var rowsId = tab === "sssrt" ? "sssrt-rows" : tab === "tps" ? "tps-rows" : tab === "tpa" ? "tpa-rows" : null;
    if (rowsId) {
      var rows = document.querySelectorAll("#" + rowsId + " .entry");
      rows.forEach(function (row, idx) {
        if (idx >= ROW_MIN[tab]) row.remove();
      });
    }
    showErr(tab, "");
    var res = $("res-" + tab);
    if (res) res.innerHTML = "";
    refreshPreviews();
  }

  // ── Wiring ──────────────────────────────────────────────────────────────

  function togProy() {
    var on = $("chk_proy").checked;
    $("sec-dir").style.display = on ? "none" : "";
    $("sec-proy").style.display = on ? "" : "none";
    refreshSRTNote();
  }

  function syncCd() {
    var out = $("f-ss-cd");
    if (out) out.value = cdFromVal($("f-ss-kota").value) || "";
  }

  function fillSSSRTSelects() {
    document.querySelectorAll("#sssrt-rows select[data-sync]").forEach(function (sel) {
      if (sel.options.length <= 1) {
        sel.innerHTML = '<option value="">— Pilih jenis —</option>' + sssrtOptions();
      }
    });
  }

  document.addEventListener("click", function (ev) {
    var t = ev.target;
    if (t.id === "chk_proy") togProy();
    else if (t.id === "btn-ss-add") addSSSRT();
    else if (t.id === "btn-tps-add") addTPS();
    else if (t.id === "btn-tpa-add") addTPA();
    else if (t.dataset && t.dataset.rm) {
      var el = $(t.dataset.rm);
      if (el) el.remove();
    } else if (t.dataset && t.dataset.reset) {
      resetTab(t.dataset.reset);
    }
  });

  document.addEventListener("change", function (ev) {
    var t = ev.target;
    if (t.id === "f-ss-kota") syncCd();
    else if (t.dataset && t.dataset.sync) {
      if (t.value) $(t.dataset.sync).value = t.value;
    } else if (t.id === "f-tps-e") {
      document.querySelectorAll("#tps-rows input[data-tps-n]").forEach(function (inp) {
        prevTPS(inp, inp.getAttribute("data-tps-n"));
      });
    }
  });

  document.addEventListener("input", function (ev) {
    var t = ev.target;
    if (t.dataset && t.dataset.tpsN) prevTPS(t, t.dataset.tpsN);
    else if (t.dataset && t.dataset.tpaN) prevTPA(t, t.dataset.tpaN);
    else if (["f-pt", "f-p0", "f-rg", "f-td", "f-thr-p"].indexOf(t.id) !== -1) refreshSRTNote();
  });

  document.addEventListener("DOMContentLoaded", function () {
    fillSSSRTSelects();
    if ($("form-srt")) $("form-srt").addEventListener("submit", submitSRT);
    if ($("form-sssrt")) $("form-sssrt").addEventListener("submit", submitSSSRT);
    if ($("form-tps")) $("form-tps").addEventListener("submit", submitTPS);
    if ($("form-tpa")) $("form-tpa").addEventListener("submit", submitTPA);
    refreshPreviews();
  });
})();
