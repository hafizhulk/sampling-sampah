<?php
// Bootstrap: state form + pemrosesan POST. Dipakai index.php sebelum layout.
defined('APP') or exit('No direct access');

$tab = $_POST['tab'] ?? ($_GET['tab'] ?? 'srt');
if (!isset($TABS[$tab])) $tab = 'srt';

$resSRT = $resSSSRT = $resTPS = $resTPA = null;
$err = '';

$d = $DEFAULTS;
foreach ($d as $k => $def) {
    if (isset($_POST[$k])) $d[$k] = is_array($def) ? (array)$_POST[$k] : $_POST[$k];
}
$d['use_proy'] = isset($_POST['use_proy']);

// ── SRT ──
if (isset($_POST['hitung_srt'])) {
    $tab = 'srt';
    $pt  = 0;
    if ($d['use_proy']) {
        $p0raw = trim((string)($d['p0'] ?? ''));
        $rgraw = trim((string)($d['rg'] ?? ''));
        $tdraw = trim((string)($d['td'] ?? ''));
        $trraw = trim((string)($d['thr_p'] ?? ''));
        if ($p0raw === '' || $rgraw === '' || $tdraw === '' || $trraw === ''
            || !is_numeric($p0raw) || !is_numeric($rgraw) || !is_numeric($tdraw) || !is_numeric($trraw)) {
            $err = 'Data proyeksi tidak lengkap: P₀, r, tahun dasar, dan tahun rencana wajib diisi angka.';
        } else {
            $p0 = floatval($p0raw); $rg = floatval($rgraw);
            $td = intval($tdraw);   $tr = intval($trraw);
            if ($p0 <= 0) { $err = 'Penduduk tahun dasar (P₀) harus > 0.'; }
            elseif ($rg < 0) { $err = 'Laju pertumbuhan (r) tidak boleh negatif.'; }
            elseif ($tr <= $td) { $err = 'Tahun rencana harus lebih besar dari tahun dasar.'; }
            else { $pt = proyeksi($p0, $rg, $tr - $td); }
        }
    } else {
        $pt = intval($d['pt']);
    }
    if (!$err) {
        if ($pt <= 0) {
            $err = 'Jumlah penduduk (Pt) wajib diisi!';
        } else {
            // Cd + label selalu dari Pt yang dipakai, bukan dari formulir.
            $kotaInfo = getKota($pt);
            $cd       = $kotaInfo['cd'];
            $method = $d['srt_met'];
            $e      = floatval($d['srt_e']);
            $avgRaw = trim((string)($d['avg_kk'] ?? ''));
            $snHraw = trim((string)($d['sn_h'] ?? ''));
            $snMraw = trim((string)($d['sn_m'] ?? ''));
            $snLraw = trim((string)($d['sn_l'] ?? ''));
            $snH = floatval($snHraw); $snM = floatval($snMraw); $snL = floatval($snLraw);
            if (!in_array($method, ['alt1', 'alt2'], true)) { $err = 'Metode SRT tidak valid.'; }
            elseif (!eValid($e)) { $err = 'Nilai error (e) tidak valid. Pilih 10%, 5%, atau 1%.'; }
            elseif ($avgRaw === '' || !is_numeric($avgRaw) || floatval($avgRaw) <= 0) { $err = 'Rata-rata anggota KK harus angka positif.'; }
            elseif ($snHraw === '' || $snMraw === '' || $snLraw === '' || !is_numeric($snHraw) || !is_numeric($snMraw) || !is_numeric($snLraw)) { $err = 'Proporsi Sn wajib diisi angka.'; }
            elseif ($snH < 0 || $snH > 100 || $snM < 0 || $snM > 100 || $snL < 0 || $snL > 100) { $err = 'Proporsi Sn harus 0–100% (tidak boleh negatif).'; }
            elseif (abs($snH + $snM + $snL - 100) > 0.1) { $err = 'Total Sn harus = 100%.'; }
            else {
                foreach (ALLOWED_E as $ae) { if (abs($e - $ae) < 1e-9) { $e = $ae; break; } }
                $res = calcSRT($pt, $cd, $method, floatval($e), floatval($avgRaw), $snH, $snM, $snL);
                $res['pt']   = $pt;
                $res['kota'] = $kotaInfo;
                $resSRT = $res;
            }
        }
    }
}

// Preview klasifikasi otomatis untuk tab SRT (ditampilkan di form).
$ptPreview = null;
if ($d['use_proy']) {
    if (is_numeric($d['p0'] ?? null) && ($d['p0'] ?? '') !== '' && is_numeric($d['rg'] ?? null) && ($d['rg'] ?? '') !== '') {
        $npPrev = intval($d['thr_p']) - intval($d['td']);
        if (floatval($d['p0']) > 0 && $npPrev > 0) $ptPreview = proyeksi(floatval($d['p0']), floatval($d['rg']), $npPrev);
    }
} elseif (intval($d['pt']) > 0) {
    $ptPreview = intval($d['pt']);
}
$kotaPreview = $ptPreview ? getKota($ptPreview) : null;

// ── SSSRT ──
if (isset($_POST['hitung_sssrt'])) {
    $tab = 'sssrt';
    $met = $d['sssrt_met']; $cd = floatval($d['sssrt_cd']); $e = floatval($d['sssrt_e']);
    if (!in_array($met, ['alt1', 'alt2'], true)) { $err = 'Metode SSSRT tidak valid.'; }
    elseif (!eValid($e)) { $err = 'Nilai error (e) tidak valid. Pilih 10%, 5%, atau 1%.'; }
    elseif ($met === 'alt1' && !$cd) { $err = 'Pilih klasifikasi kota untuk Alt 1!'; }
    else {
        $res = calcSSSRT($d['sssrt_nama'], $d['sssrt_ts'], $met, $cd, $e);
        if (empty($res['rows'])) $err = 'Pastikan nama dan jumlah unit fasilitas telah diisi!';
        else $resSSSRT = $res;
    }
}

// ── TPS (selalu otomatis per Pasal 4.2.4) ──
if (isset($_POST['hitung_tps'])) {
    $tab = 'tps';
    $e = floatval($d['tps_e']);
    if (!eValid($e)) { $err = 'Nilai error (e) tidak valid. Pilih 10%, 5%, atau 1%.'; }
    else {
        $res = calcTPS($d['tps_nama'], $d['tps_jenis'], $d['tps_kap'], $d['tps_n'], 'auto', $e);
        if (empty($res['rows'])) $err = 'Pastikan jumlah ritasi/hari telah diisi!';
        else $resTPS = $res;
    }
}

// ── TPA ──
if (isset($_POST['hitung_tpa'])) {
    $tab = 'tpa';
    $met = $d['tpa_met']; $e = floatval($d['tpa_e']);
    if (!in_array($met, ['alt1', 'alt2'], true)) { $err = 'Metode TPA tidak valid.'; }
    elseif (!eValid($e)) { $err = 'Nilai error (e) tidak valid. Pilih 10%, 5%, atau 1%.'; }
    else {
        $res = calcTPA($d['tpa_nama'], $d['tpa_kap'], $d['tpa_n'], $met, $e);
        if (empty($res['rows'])) $err = 'Pastikan jumlah ritasi/hari telah diisi!';
        else $resTPA = $res;
    }
}

// Jumlah baris dinamis untuk JS.
$sssrtStart = max(count((array)$d['sssrt_nama']), 2);
$tRowN = max(count((array)$d['tps_nama']), 1);
$aRowN = max(count((array)$d['tpa_nama']), 1);
