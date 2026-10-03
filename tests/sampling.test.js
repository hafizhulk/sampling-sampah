// Run with Node.js: node tests/sampling.test.js
// Tanpa dependensi. Memuat js/calculations.js (guard CommonJS) dan membandingkan
// hasil fungsi murni terhadap nilai harapan yang dihitung dari kode PHP asli
// (app/lib/sampling.php + app/lib/helpers.php) — lihat /tmp/verify bila perlu.
// Toleransi numerik: 1e-9 (aturan kesetaraan PHP → JS).
"use strict";
const path = require("node:path");
const C = require(path.join(__dirname, "..", "js", "calculations.js"));

const TOL = 1e-9;
let passed = 0, failed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; }
  catch (e) { failed++; failures.push(name + ": " + e.message); }
}
function eq(actual, expected, what) {
  if (actual !== expected) throw new Error(what + " — dapat " + JSON.stringify(actual) + ", harap " + JSON.stringify(expected));
}
function near(actual, expected, what) {
  if (typeof actual !== "number" || typeof expected !== "number" || !(Math.abs(actual - expected) <= TOL * Math.max(1, Math.abs(expected))))
    throw new Error(what + " — dapat " + actual + ", harap " + expected);
}
function eqRows(actual, expected, what) {
  eq(actual.length, expected.length, what + " (jumlah baris)");
  expected.forEach(function (exp, i) {
    for (const k of Object.keys(exp)) {
      if (typeof exp[k] === "number") near(actual[i][k], exp[k], what + "[" + i + "]." + k);
      else eq(actual[i][k], exp[k], what + "[" + i + "]." + k);
    }
  });
}

// ── Konstanta & helper ────────────────────────────────────────────────────
test("ALLOWED_E berisi 10%, 5%, 1%", function () {
  eq(JSON.stringify(C.ALLOWED_E), JSON.stringify([0.1, 0.05, 0.01]), "ALLOWED_E");
});
test("eValid menerima 0.1/0.05/0.01, menolak lainnya", function () {
  eq(C.eValid(0.1), true, "0.1"); eq(C.eValid(0.05), true, "0.05"); eq(C.eValid(0.01), true, "0.01");
  eq(C.eValid(0.2), false, "0.2"); eq(C.eValid(0.10000000001), true, "0.1+1e-11 dalam toleransi");
  eq(C.eValid(0.1000001), false, "0.1+1e-7 di luar toleransi");
});
test("fmt setara number_format ID (pemisah ribuan titik)", function () {
  eq(C.fmt(0), "0", "0"); eq(C.fmt(7), "7", "7"); eq(C.fmt(1000), "1.000", "1000");
  eq(C.fmt(2500000), "2.500.000", "2,5jt"); eq(C.fmt(123456789), "123.456.789", "besar");
});
test("proyeksi geometrik Pt = P0*(1+r/100)^n + round", function () {
  eq(C.proyeksi(200000, 1.5, 5), 215457, "200k/1,5%/5th");
  eq(C.proyeksi(100000, 0, 10), 100000, "r=0");
  eq(C.proyeksi(50000, 2.25, 3), 53452, "desimal r");
});
test("getKota tepat di batas Tabel 3", function () {
  eq(C.getKota(99999).label, "Kota Kecil", "99999");
  eq(C.getKota(100000).label, "Kota Sedang", "100000");
  eq(C.getKota(499999).cd, 0.5, "499999");
  eq(C.getKota(500000).label, "Kota Besar", "500000");
  eq(C.getKota(999999).cd, 1.0, "999999");
  eq(C.getKota(1000000).label, "Metropolitan", "1jt");
  eq(C.getKota(4999999).cd, 1.0, "4999999");
  const m = C.getKota(5000000);
  eq(m.label, "Megapolitan", "5jt"); near(m.cd, 1.5, "cd megapolitan");
});
test("cdFromVal memetakan semua kode + 0 untuk kode asing", function () {
  near(C.cdFromVal("1.5"), 1.5, "1.5"); near(C.cdFromVal("1"), 1.0, "1");
  near(C.cdFromVal("1b"), 1.0, "1b"); near(C.cdFromVal("0.5"), 0.5, "0.5");
  near(C.cdFromVal("0.5k"), 0.5, "0.5k");
  eq(C.cdFromVal("bogus"), 0, "asing"); eq(C.cdFromVal(""), 0, "kosong");
});
test("toInt meniru (int) PHP; isNum meniru is_numeric", function () {
  eq(C.toInt("45"), 45, "45"); eq(C.toInt(""), 0, "kosong"); eq(C.toInt("abc"), 0, "abc");
  eq(C.toInt("12abc"), 12, "awalan angka"); eq(C.toInt("12.9"), 12, "trunc");
  eq(C.toInt("1e3"), 1000, "eksponen"); eq(C.toInt("0x10"), 0, "bukan heksa");
  eq(C.isNum("4"), true, "4"); eq(C.isNum("0.1"), true, "0.1"); eq(C.isNum(""), false, "kosong");
  eq(C.isNum("abc"), false, "abc"); eq(C.isNum("12abc"), false, "12abc");
  eq(C.isNum("1e3"), true, "1e3"); eq(C.isNum(" 12 "), true, "spasi"); eq(C.isNum(".5"), true, ".5");
});

// ── SRT ───────────────────────────────────────────────────────────────────
test("SRT Alt 1 Pt ≤ 1 jt (Kota Sedang, Cd 0,5)", function () {
  const r = C.calcSRT(250000, 0.5, "alt1", 0.1, 4, 15, 75, 10);
  eq(r.ps, 250, "ps"); eq(r.K, 63, "K");
  eq(r.nrH, 10, "H"); eq(r.nrM, 47, "M"); eq(r.nrL, 6, "L"); eq(r.nrTotal, 63, "total");
  eq(r.steps[1], "P<sub>s</sub> = 0.5 × √250.000 = 0.5 × 500 = <b>250 ~ 250 orang</b>", "langkah");
});
test("SRT Alt 1 Pt > 1 jt memakai faktor Cj", function () {
  const r = C.calcSRT(2500000, 1.0, "alt1", 0.1, 4, 15, 75, 10);
  eq(r.ps, 3953, "ps"); eq(r.K, 988, "K");
  eq(r.nrH, 148, "H"); eq(r.nrM, 741, "M"); eq(r.nrL, 99, "L"); eq(r.nrTotal, 988, "total");
  eq(r.steps[2], "P<sub>s</sub> = 1 × 2.5 × √2.500.000 = <b>3952.85 ~ 3953 orang</b>", "langkah");
});
test("SRT Alt 2 Slovin + proyeksi penduduk", function () {
  const pt = C.proyeksi(200000, 1.5, 5);
  eq(pt, 215457, "pt proyeksi");
  const r = C.calcSRT(pt, 0.5, "alt1", 0.1, 4, 15, 75, 10);
  eq(r.ps, 232, "ps"); eq(r.K, 58, "K");
  eq(r.nrH, 9, "H"); eq(r.nrM, 43, "M"); eq(r.nrL, 6, "L"); eq(r.nrTotal, 58, "total");
  const s = C.calcSRT(80000, 0.5, "alt2", 0.05, 3.5, 20, 60, 20);
  eq(s.ps, 398, "slovin ps"); eq(s.K, 114, "K");
  eq(s.nrH, 23, "H"); eq(s.nrM, 68, "M"); eq(s.nrL, 23, "L"); eq(s.nrTotal, 114, "total");
});
test("SRT sisa terbesar: seri pecahan dimenangkan H (largest remainder)", function () {
  // Megapolitan, Sn 33.3/33.3/33.4 → pecahan H dan M seri → H didahulukan.
  const r = C.calcSRT(8000000, 1.5, "alt1", 0.1, 4, 33.3, 33.3, 33.4);
  eq(r.ps, 33941, "ps"); eq(r.K, 8485, "K");
  eq(r.nrH, 2826, "H"); eq(r.nrM, 2825, "M"); eq(r.nrL, 2834, "L");
  eq(r.nrTotal, 8485, "total tepat = K");
});

// ── SSSRT ─────────────────────────────────────────────────────────────────
test("SSSRT Alt 1 Cd×√Ts per fasilitas", function () {
  const r = C.calcSSSRT(["Pasar Induk", "Terminal Kota"], [120, 8], "alt1", 1.0, 0.1);
  eqRows(r.rows, [
    { ts: 120, nr: 11 },
    { ts: 8, nr: 3 }
  ], "baris");
  eq(r.steps.length, 2, "langkah");
});
test("SSSRT Alt 2 Slovin multi-baris termasuk Ts=1", function () {
  const r = C.calcSSSRT(["RSUD", "Sekolah", "Klinik"], [50, 200, 1], "alt2", 0, 0.1);
  eqRows(r.rows, [{ ts: 50, nr: 33 }, { ts: 200, nr: 67 }, { ts: 1, nr: 1 }], "baris");
});
test("SSSRT hasil dibatasi Ts + keterangan pemotongan", function () {
  const r = C.calcSSSRT(["Kios", "Los"], [1, 2], "alt1", 1.5, 0.1);
  eqRows(r.rows, [{ ts: 1, nr: 1 }, { ts: 2, nr: 2 }], "baris");
  eq(r.rows[0].desc, "C<sub>d</sub>×√T<sub>s</sub> = 1.5×√1 = 1.5 → dibatasi Ts (maks 1)", "desc cap");
  eq(r.steps[0], "<b>Kios</b>: T<sub>s</sub> = 1 → C<sub>d</sub>×√T<sub>s</sub> = 1.5×√1 = 1.5 → dibatasi Ts (maks 1) ~ <b>1 unit contoh</b>", "langkah");
});
test("SSSRT baris kosong/nol dilewati; nama di-escape", function () {
  const r = C.calcSSSRT(["", "  ", "Ada"], ["", 0, ""], "alt1", 1.0, 0.1);
  eq(r.rows.length, 0, "semua dilewati → pemicu 'Pastikan nama dan jumlah unit fasilitas telah diisi!'");
  const e = C.calcSSSRT(['Pasar <A> & "B"', "X"], [30, 5], "alt1", 0.5, 0.1);
  eq(e.rows[0].nama, "Pasar &lt;A&gt; &amp; &quot;B&quot;", "escape");
  eq(e.rows[0].nr, 3, "nr"); eq(e.rows[1].nr, 1, "nr kecil");
});

// ── TPS ───────────────────────────────────────────────────────────────────
test("TPS otomatis: N>30 Slovin, N≤30 10%", function () {
  const r = C.calcTPS(["TPS A", "TPS B"], ["TPS", "TPS3R"], ["5", ""], [45, 20], "auto", 0.1);
  eqRows(r.rows, [
    { N: 45, nr: 31, met: "Alt 1 (N=45>30): Slovin" },
    { N: 20, nr: 2, met: "Alt 2 (N=20≤30): 10%" }
  ], "baris");
  eq(r.rows[0].kap, "5 m³", "kap"); eq(r.rows[1].kap, "—", "kap kosong");
  eq(r.steps[1], "<b>TPS B</b>: N=20 → n = ⌈10%×20⌉ = ⌈2⌉ = <b>2</b>", "langkah");
});
test("TPS tepat di batas N=30 / N=31 + koreksi metode bertentangan", function () {
  const b = C.calcTPS(["X", "Y"], ["TPS", "TPS"], ["", ""], [30, 31], "auto", 0.05);
  eqRows(b.rows, [
    { N: 30, nr: 3, met: "Alt 2 (N=30≤30): 10%" },
    { N: 31, nr: 29, met: "Alt 1 (N=31>30): Slovin" }
  ], "batas");
  const c1 = C.calcTPS(["Z"], ["TPST (Terpadu)"], ["10"], [20], "alt1", 0.1);
  eq(c1.rows[0].met, "Alt 2 (N=20≤30): 10% [dikoreksi dari Alt 1]", "koreksi alt1");
  const c2 = C.calcTPS(["W"], ["TPS"], [""], [45], "alt2", 0.1);
  eq(c2.rows[0].met, "Alt 1 (N=45>30): Slovin [dikoreksi dari Alt 2]", "koreksi alt2");
});
test("TPS baris kosong dilewati; nama bawaan & kap 0", function () {
  const e = C.calcTPS([""], ["TPS"], [""], [""], "auto", 0.1);
  eq(e.rows.length, 0, "kosong → pemicu 'Pastikan jumlah ritasi/hari telah diisi!'");
  const d = C.calcTPS([], [], [], [45], "auto", 0.1);
  eq(d.rows[0].nama, "Lokasi 1", "nama bawaan"); eq(d.rows[0].nr, 31, "nr");
  const g = C.calcTPS(["Q"], ["TPS"], ["0"], [12], "auto", 0.1);
  eq(g.rows[0].kap, "—", "kap 0 → —"); eq(g.rows[0].nr, 2, "nr");
});

// ── TPA ───────────────────────────────────────────────────────────────────
test("TPA Alt 1 Slovin e=5%", function () {
  const r = C.calcTPA(["TPA A", "TPA B"], ["500", ""], [100, 25], "alt1", 0.05);
  eqRows(r.rows, [
    { N: 100, nr: 80, met: "Alt 1: Slovin" },
    { N: 25, nr: 24, met: "Alt 1: Slovin" }
  ], "baris");
  eq(r.rows[0].kap, "500 ton/hari", "kap");
});
test("TPA Alt 2 10% (ceil) termasuk N kecil", function () {
  const r = C.calcTPA(["TPA C", "TPA D"], ["100", "50"], [25, 7], "alt2", 0.1);
  eqRows(r.rows, [
    { N: 25, nr: 3, met: "Alt 2: 10%" },
    { N: 7, nr: 1, met: "Alt 2: 10%" }
  ], "baris");
});
test("TPA baris kosong dilewati; nama bawaan", function () {
  const e = C.calcTPA([""], [""], [""], "alt1", 0.1);
  eq(e.rows.length, 0, "kosong → pemicu 'Pastikan jumlah ritasi/hari telah diisi!'");
  const d = C.calcTPA([], [], [60], "alt1", 0.1);
  eq(d.rows[0].nama, "TPA 1", "nama bawaan"); eq(d.rows[0].nr, 38, "nr");
});

console.log("passed=" + passed + " failed=" + failed);
if (failures.length) { for (const f of failures) console.log("FAIL " + f); process.exitCode = 1; }
