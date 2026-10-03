<?php
// Rumus SNI 3964:2025. Tidak ada akses $_POST di sini selain sanitasi string.
defined('APP') or exit('No direct access');

function proyeksi($p0, $r, $n) {
    return (int)round($p0 * pow(1 + $r / 100, $n));
}

function getKota($pt) {
    if ($pt >= 5000000) return ['label' => 'Megapolitan',  'cd' => 1.5, 'val' => '1.5'];
    if ($pt >= 1000000) return ['label' => 'Metropolitan', 'cd' => 1.0, 'val' => '1'];
    if ($pt >= 500000)  return ['label' => 'Kota Besar',   'cd' => 1.0, 'val' => '1b'];
    if ($pt >= 100000)  return ['label' => 'Kota Sedang',  'cd' => 0.5, 'val' => '0.5'];
    return                     ['label' => 'Kota Kecil',   'cd' => 0.5, 'val' => '0.5k'];
}

function cdFromVal($v) {
    $map = ['1.5' => 1.5, '1' => 1.0, '1b' => 1.0, '0.5' => 0.5, '0.5k' => 0.5];
    return $map[$v] ?? 0;
}

function slovin($N, $e) {
    return $N / (1 + $N * $e * $e);
}

function calcSRT($pt, $cd, $method, $e, $avgKK, $snH, $snM, $snL) {
    $steps = []; $ps = 0;
    if ($method === 'alt1') {
        if ($pt <= 1000000) {
            $ps = $cd * sqrt($pt);
            $steps[] = "P<sub>t</sub> = " . numf($pt) . " ≤ 1.000.000 → <b>P<sub>s</sub> = C<sub>d</sub> × √P<sub>t</sub></b>";
            $steps[] = "P<sub>s</sub> = {$cd} × √" . numf($pt) . " = {$cd} × " . round(sqrt($pt), 4) . " = <b>" . round($ps, 2) . " ~ " . round($ps) . " orang</b>";
        } else {
            $cj = $pt / 1000000;
            $ps = $cd * $cj * sqrt($pt);
            $steps[] = "P<sub>t</sub> = " . numf($pt) . " > 1.000.000 → gunakan faktor C<sub>j</sub>";
            $steps[] = "C<sub>j</sub> = " . numf($pt) . " / 1.000.000 = " . round($cj, 4);
            $steps[] = "P<sub>s</sub> = {$cd} × " . round($cj, 4) . " × √" . numf($pt) . " = <b>" . round($ps, 2) . " ~ " . round($ps) . " orang</b>";
        }
    } else {
        $ps = slovin($pt, $e);
        $steps[] = "Metode Slovin: n = N / (1 + N × e<sup>2</sup>)";
        $steps[] = "n = " . numf($pt) . " / (1 + " . numf($pt) . " × {$e}<sup>2</sup>) = <b>" . round($ps, 2) . " ~ " . round($ps) . " orang</b>";
    }
    $psR = (int)round($ps);
    $K   = $psR / $avgKK;
    $Kr  = (int)round($K);
    $steps[] = "K = P<sub>s</sub> / N̄ = {$psR} / {$avgKK} = " . round($K, 2) . " ~ <b>{$Kr} KK</b>";

    // Alokasi sisa terbesar agar nrH+nrM+nrL == Kr.
    $qH = $snH / 100 * $Kr;
    $qM = $snM / 100 * $Kr;
    $qL = $snL / 100 * $Kr;
    $nrH = (int)floor($qH);
    $nrM = (int)floor($qM);
    $nrL = (int)floor($qL);
    $rem = $Kr - ($nrH + $nrM + $nrL);
    if ($rem > 0) {
        $fracs = ['H' => $qH - $nrH, 'M' => $qM - $nrM, 'L' => $qL - $nrL];
        arsort($fracs);
        foreach ($fracs as $k => $f) {
            if ($rem <= 0) break;
            if ($k === 'H') $nrH++;
            elseif ($k === 'M') $nrM++;
            else $nrL++;
            $rem--;
        }
    }
    $steps[] = "N<sub>r</sub> (High)   = {$snH}% × {$Kr} = <b>{$nrH} unit rumah</b>";
    $steps[] = "N<sub>r</sub> (Medium) = {$snM}% × {$Kr} = <b>{$nrM} unit rumah</b>";
    $steps[] = "N<sub>r</sub> (Low)    = {$snL}% × {$Kr} = <b>{$nrL} unit rumah</b> (total disesuaikan = {$Kr})";

    return ['ps' => $psR, 'K' => $Kr, 'nrH' => $nrH, 'nrM' => $nrM, 'nrL' => $nrL,
        'nrTotal' => $nrH + $nrM + $nrL, 'steps' => $steps, 'snH' => $snH, 'snM' => $snM, 'snL' => $snL];
}

function calcSSSRT($namaArr, $tsArr, $method, $cd, $e) {
    $rows = []; $steps = [];
    foreach ($namaArr as $i => $nama) {
        $nama = trim(htmlspecialchars($nama));
        $ts   = (int)($tsArr[$i] ?? 0);
        if (!$nama || $ts <= 0) continue;
        if ($method === 'alt1') {
            $n    = $cd * sqrt($ts);
            $desc = "C<sub>d</sub>×√T<sub>s</sub> = {$cd}×√{$ts} = " . round($n, 2);
        } else {
            $n    = slovin($ts, $e);
            $desc = "Slovin = {$ts}/(1+{$ts}×{$e}<sup>2</sup>) = " . round($n, 2);
        }
        // Unit berbeda tanpa pengembalian: tidak boleh melebihi populasi.
        $nrRaw = (int)round($n);
        $nr = min($ts, max(1, $nrRaw));
        if ($nr !== $nrRaw) $desc .= " → dibatasi Ts (maks {$ts})";
        $rows[]  = ['nama' => $nama, 'ts' => $ts, 'nr' => $nr, 'desc' => $desc];
        $steps[] = "<b>{$nama}</b>: T<sub>s</sub> = {$ts} → {$desc} ~ <b>{$nr} unit contoh</b>";
    }
    return ['rows' => $rows, 'steps' => $steps];
}

function calcTPS($namaArr, $jenisArr, $kapArr, $nArr, $method, $e) {
    $rows = []; $steps = [];
    foreach ($nArr as $i => $Nval) {
        $nama  = trim(htmlspecialchars($namaArr[$i] ?? "Lokasi " . ($i + 1)));
        $jenis = htmlspecialchars($jenisArr[$i] ?? 'TPS');
        $kap   = ($kapArr[$i] ?? '') ? $kapArr[$i] . ' m³' : '—';
        $N     = (int)$Nval;
        if ($N <= 0) continue;

        // Pasal 4.2.4 mengikat per lokasi: N > 30 → Slovin, N ≤ 30 → 10%.
        // Nilai paksa lama yang bertentangan dikoreksi otomatis.
        if ($N > 30) {
            $n = slovin($N, $e); $alt = 'alt1';
            $usedMet = "Alt 1 (N={$N}>30): Slovin";
            if ($method === 'alt2') $usedMet .= " [dikoreksi dari Alt 2]";
        } else {
            $n = ceil($N * 0.1); $alt = 'alt2';
            $usedMet = "Alt 2 (N={$N}≤30): 10%";
            if ($method === 'alt1') $usedMet .= " [dikoreksi dari Alt 1]";
        }

        $nr = ($alt === 'alt2') ? (int)$n : (int)round($n);
        $rows[]  = ['nama' => $nama, 'jenis' => $jenis, 'kap' => $kap, 'N' => $N, 'nr' => $nr, 'met' => $usedMet];
        if ($alt === 'alt1')
            $steps[] = "<b>{$nama}</b>: N={$N} → n = {$N}/(1+{$N}×{$e}<sup>2</sup>) = " . round($n, 2) . " ~ <b>{$nr}</b>";
        else
            $steps[] = "<b>{$nama}</b>: N={$N} → n = ⌈10%×{$N}⌉ = ⌈" . ($N * 0.1) . "⌉ = <b>{$nr}</b>";
    }
    return ['rows' => $rows, 'steps' => $steps];
}

function calcTPA($namaArr, $kapArr, $nArr, $method, $e) {
    $rows = []; $steps = [];
    foreach ($nArr as $i => $Nval) {
        $nama = trim(htmlspecialchars($namaArr[$i] ?? "TPA " . ($i + 1)));
        $kap  = ($kapArr[$i] ?? '') ? $kapArr[$i] . ' ton/hari' : '—';
        $N    = (int)$Nval;
        if ($N <= 0) continue;
        if ($method === 'alt1') { $n = slovin($N, $e); $usedMet = "Alt 1: Slovin"; $alt = 'alt1'; }
        else { $n = ceil($N * 0.1); $usedMet = "Alt 2: 10%"; $alt = 'alt2'; }
        $nr = ($alt === 'alt2') ? (int)$n : (int)round($n);
        $rows[]  = ['nama' => $nama, 'kap' => $kap, 'N' => $N, 'nr' => $nr, 'met' => $usedMet];
        if ($alt === 'alt1')
            $steps[] = "<b>{$nama}</b>: n = {$N}/(1+{$N}×{$e}<sup>2</sup>) = " . round($n, 2) . " ~ <b>{$nr} ritasi contoh</b>";
        else
            $steps[] = "<b>{$nama}</b>: n = ⌈10%×{$N}⌉ = ⌈" . ($N * 0.1) . "⌉ = <b>{$nr} ritasi contoh</b>";
    }
    return ['rows' => $rows, 'steps' => $steps];
}
