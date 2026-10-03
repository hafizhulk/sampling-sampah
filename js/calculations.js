// Rumus SNI 3964:2025 — port 1:1 dari app/lib/sampling.php + app/lib/helpers.php.
// Berkas ini MURNI perhitungan, tanpa akses DOM. Guard CommonJS di bawah
// memungkinkan berkas yang sama dipakai langsung oleh tests/*.test.js via Node.
"use strict";

var ALLOWED_E = [0.1, 0.05, 0.01];

var SSSRT_OPTS = [
  "Kawasan Komersial (Pasar/Pertokoan)",
  "Kawasan Komersial (Hotel/Penginapan)",
  "Kawasan Komersial (Restoran/Rumah Makan)",
  "Kawasan Industri",
  "Kawasan Khusus",
  "Fasilitas Sosial (Rumah Ibadah)",
  "Fasilitas Sosial (Panti Asuhan)",
  "Fasilitas Umum (Terminal/Stasiun)",
  "Fasilitas Umum (Taman Kota)",
  "Fasilitas Umum (Wisata)",
  "Fasilitas Lain (Sekolah/Pendidikan)",
  "Fasilitas Lain (Rumah Sakit)",
  "Fasilitas Lain (Perkantoran)",
  "Fasilitas Lain (Pusat Olahraga)",
  "Lainnya"
];

var TPS_JENIS_OPTS = [
  "TPS (Tempat Penampungan Sementara)",
  "TPS3R",
  "TPST (Terpadu)"
];

// number_format((int)$n, 0, ',', '.') — pemisah ribuan titik, tanpa desimal.
function fmt(n) {
  var t = Math.trunc(Number(n) || 0);
  var neg = t < 0 ? "-" : "";
  var s = String(Math.abs(t));
  return neg + s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// htmlspecialchars($s, ENT_QUOTES, 'UTF-8').
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function eValid(e) {
  for (var i = 0; i < ALLOWED_E.length; i++) {
    if (Math.abs(e - ALLOWED_E[i]) < 1e-9) return true;
  }
  return false;
}

// (int)round($p0 * pow(1 + $r/100, $n)) — non-negatif: PHP round() ≡ Math.round.
function proyeksi(p0, r, n) {
  return Math.round(p0 * Math.pow(1 + r / 100, n));
}

function getKota(pt) {
  if (pt >= 5000000) return { label: "Megapolitan", cd: 1.5, val: "1.5" };
  if (pt >= 1000000) return { label: "Metropolitan", cd: 1.0, val: "1" };
  if (pt >= 500000) return { label: "Kota Besar", cd: 1.0, val: "1b" };
  if (pt >= 100000) return { label: "Kota Sedang", cd: 0.5, val: "0.5" };
  return { label: "Kota Kecil", cd: 0.5, val: "0.5k" };
}

function cdFromVal(v) {
  var map = { "1.5": 1.5, "1": 1.0, "1b": 1.0, "0.5": 0.5, "0.5k": 0.5 };
  return Object.prototype.hasOwnProperty.call(map, v) ? map[v] : 0;
}

function slovin(N, e) {
  return N / (1 + N * e * e);
}

// round($x, $p) untuk $x non-negatif ≡ pembulatan desimal via Math.round.
function rdec(x, p) {
  var f = Math.pow(10, p);
  return Math.round(x * f) / f;
}

// Echo PHP atas float mentah ($N * 0.1) memakai presisi tampilan 14 digit;
// String() JS memakai repr round-trip terpendek ("0.7000000000000001").
// clean() menyamakan tampilan tanpa mengubah nilai untuk perbandingan numerik.
function clean(x) {
  return parseFloat(Number(x).toPrecision(14));
}

function calcSRT(pt, cd, method, e, avgKK, snH, snM, snL) {
  var steps = [];
  var ps = 0;
  if (method === "alt1") {
    if (pt <= 1000000) {
      ps = cd * Math.sqrt(pt);
      steps.push("P<sub>t</sub> = " + fmt(pt) + " ≤ 1.000.000 → <b>P<sub>s</sub> = C<sub>d</sub> × √P<sub>t</sub></b>");
      steps.push("P<sub>s</sub> = " + cd + " × √" + fmt(pt) + " = " + cd + " × " + rdec(Math.sqrt(pt), 4) + " = <b>" + rdec(ps, 2) + " ~ " + Math.round(ps) + " orang</b>");
    } else {
      var cj = pt / 1000000;
      ps = cd * cj * Math.sqrt(pt);
      steps.push("P<sub>t</sub> = " + fmt(pt) + " > 1.000.000 → gunakan faktor C<sub>j</sub>");
      steps.push("C<sub>j</sub> = " + fmt(pt) + " / 1.000.000 = " + rdec(cj, 4));
      steps.push("P<sub>s</sub> = " + cd + " × " + rdec(cj, 4) + " × √" + fmt(pt) + " = <b>" + rdec(ps, 2) + " ~ " + Math.round(ps) + " orang</b>");
    }
  } else {
    ps = slovin(pt, e);
    steps.push("Metode Slovin: n = N / (1 + N × e<sup>2</sup>)");
    steps.push("n = " + fmt(pt) + " / (1 + " + fmt(pt) + " × " + e + "<sup>2</sup>) = <b>" + rdec(ps, 2) + " ~ " + Math.round(ps) + " orang</b>");
  }
  var psR = Math.round(ps);
  var K = psR / avgKK;
  var Kr = Math.round(K);
  steps.push("K = P<sub>s</sub> / N̄ = " + psR + " / " + avgKK + " = " + rdec(K, 2) + " ~ <b>" + Kr + " KK</b>");

  // Alokasi sisa terbesar agar nrH+nrM+nrL == Kr (lewat sisa terbesar;
  // seri pecahan dimenangkan H dulu, lalu M — sama seperti arsort() PHP 8 yang stabil).
  var qH = snH / 100 * Kr;
  var qM = snM / 100 * Kr;
  var qL = snL / 100 * Kr;
  var nrH = Math.floor(qH);
  var nrM = Math.floor(qM);
  var nrL = Math.floor(qL);
  var rem = Kr - (nrH + nrM + nrL);
  if (rem > 0) {
    var fracs = [
      { k: "H", f: qH - nrH },
      { k: "M", f: qM - nrM },
      { k: "L", f: qL - nrL }
    ];
    fracs.sort(function (a, b) { return b.f - a.f; }); // sort stabil: seri → H, M, L
    for (var i = 0; i < fracs.length && rem > 0; i++) {
      if (fracs[i].k === "H") nrH++;
      else if (fracs[i].k === "M") nrM++;
      else nrL++;
      rem--;
    }
  }
  steps.push("N<sub>r</sub> (High)   = " + snH + "% × " + Kr + " = <b>" + nrH + " unit rumah</b>");
  steps.push("N<sub>r</sub> (Medium) = " + snM + "% × " + Kr + " = <b>" + nrM + " unit rumah</b>");
  steps.push("N<sub>r</sub> (Low)    = " + snL + "% × " + Kr + " = <b>" + nrL + " unit rumah</b> (total disesuaikan = " + Kr + ")");

  return { ps: psR, K: Kr, nrH: nrH, nrM: nrM, nrL: nrL,
    nrTotal: nrH + nrM + nrL, steps: steps, snH: snH, snM: snM, snL: snL };
}

function calcSSSRT(namaArr, tsArr, method, cd, e) {
  var rows = [];
  var steps = [];
  for (var i = 0; i < namaArr.length; i++) {
    var nama = esc(String(namaArr[i] == null ? "" : namaArr[i]).trim());
    var ts = toInt(tsArr[i]);
    if (!nama || ts <= 0) continue;
    var n, desc;
    if (method === "alt1") {
      n = cd * Math.sqrt(ts);
      desc = "C<sub>d</sub>×√T<sub>s</sub> = " + cd + "×√" + ts + " = " + rdec(n, 2);
    } else {
      n = slovin(ts, e);
      desc = "Slovin = " + ts + "/(1+" + ts + "×" + e + "<sup>2</sup>) = " + rdec(n, 2);
    }
    // Unit berbeda tanpa pengembalian: tidak boleh melebihi populasi.
    var nrRaw = Math.round(n);
    var nr = Math.min(ts, Math.max(1, nrRaw));
    if (nr !== nrRaw) desc += " → dibatasi Ts (maks " + ts + ")";
    rows.push({ nama: nama, ts: ts, nr: nr, desc: desc });
    steps.push("<b>" + nama + "</b>: T<sub>s</sub> = " + ts + " → " + desc + " ~ <b>" + nr + " unit contoh</b>");
  }
  return { rows: rows, steps: steps };
}

function calcTPS(namaArr, jenisArr, kapArr, nArr, method, e) {
  var rows = [];
  var steps = [];
  for (var i = 0; i < nArr.length; i++) {
    // ?? di PHP hanya untuk indeks yang hilang — string kosong tetap dipakai.
    var rawNama = (namaArr[i] == null) ? ("Lokasi " + (i + 1)) : String(namaArr[i]);
    var nama = esc(rawNama.trim());
    var jenis = esc(jenisArr[i] == null ? "TPS" : String(jenisArr[i]));
    var kraw = kapArr[i] == null ? "" : String(kapArr[i]);
    var kap = (!kraw || kraw === "0") ? "—" : kraw + " m³";
    var N = toInt(nArr[i]);
    if (N <= 0) continue;

    // Pasal 4.2.4 mengikat per lokasi: N > 30 → Slovin, N ≤ 30 → 10%.
    // Nilai paksa lama yang bertentangan dikoreksi otomatis.
    var n, alt, usedMet;
    if (N > 30) {
      n = slovin(N, e); alt = "alt1";
      usedMet = "Alt 1 (N=" + N + ">30): Slovin";
      if (method === "alt2") usedMet += " [dikoreksi dari Alt 2]";
    } else {
      n = Math.ceil(N * 0.1); alt = "alt2";
      usedMet = "Alt 2 (N=" + N + "≤30): 10%";
      if (method === "alt1") usedMet += " [dikoreksi dari Alt 1]";
    }

    var nr = (alt === "alt2") ? n : Math.round(n);
    rows.push({ nama: nama, jenis: jenis, kap: kap, N: N, nr: nr, met: usedMet });
    if (alt === "alt1")
      steps.push("<b>" + nama + "</b>: N=" + N + " → n = " + N + "/(1+" + N + "×" + e + "<sup>2</sup>) = " + rdec(n, 2) + " ~ <b>" + nr + "</b>");
    else
      steps.push("<b>" + nama + "</b>: N=" + N + " → n = ⌈10%×" + N + "⌉ = ⌈" + clean(N * 0.1) + "⌉ = <b>" + nr + "</b>");
  }
  return { rows: rows, steps: steps };
}

function calcTPA(namaArr, kapArr, nArr, method, e) {
  var rows = [];
  var steps = [];
  for (var i = 0; i < nArr.length; i++) {
    var rawNama = (namaArr[i] == null) ? ("TPA " + (i + 1)) : String(namaArr[i]);
    var nama = esc(rawNama.trim());
    var kraw = kapArr[i] == null ? "" : String(kapArr[i]);
    var kap = (!kraw || kraw === "0") ? "—" : kraw + " ton/hari";
    var N = toInt(nArr[i]);
    if (N <= 0) continue;
    var n, usedMet, alt;
    if (method === "alt1") { n = slovin(N, e); usedMet = "Alt 1: Slovin"; alt = "alt1"; }
    else { n = Math.ceil(N * 0.1); usedMet = "Alt 2: 10%"; alt = "alt2"; }
    var nr = (alt === "alt2") ? n : Math.round(n);
    rows.push({ nama: nama, kap: kap, N: N, nr: nr, met: usedMet });
    if (alt === "alt1")
      steps.push("<b>" + nama + "</b>: n = " + N + "/(1+" + N + "×" + e + "<sup>2</sup>) = " + rdec(n, 2) + " ~ <b>" + nr + " ritasi contoh</b>");
    else
      steps.push("<b>" + nama + "</b>: n = ⌈10%×" + N + "⌉ = ⌈" + clean(N * 0.1) + "⌉ = <b>" + nr + " ritasi contoh</b>");
  }
  return { rows: rows, steps: steps };
}

// (int)$v — meniru pemotongan string-numerik PHP: "12abc" → 12, "" → 0,
// "1e3" → 1000, "0x10" → 0 (desimal, bukan heksa seperti Number()).
function toInt(v) {
  var s = String(v == null ? "" : v);
  if (!/^\s*0[xX]/.test(s)) {
    var n = Number(s.trim());
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  var m = s.match(/^\s*[+-]?(?:\d+(?:\.\d*)?|\.\d+)/);
  return m ? Math.trunc(Number(m[0])) : 0;
}

// is_numeric() untuk input formulir angka biasa (desimal/eksponen, tanpa heksa).
function isNum(s) {
  return /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(String(s).trim());
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { ALLOWED_E: ALLOWED_E, SSSRT_OPTS: SSSRT_OPTS, TPS_JENIS_OPTS: TPS_JENIS_OPTS,
    fmt: fmt, esc: esc, eValid: eValid, proyeksi: proyeksi, getKota: getKota,
    cdFromVal: cdFromVal, slovin: slovin, calcSRT: calcSRT, calcSSSRT: calcSSSRT,
    calcTPS: calcTPS, calcTPA: calcTPA, toInt: toInt, isNum: isNum };
}
