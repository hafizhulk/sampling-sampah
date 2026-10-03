<?php
// Konfigurasi terpusat. Dimuat oleh index.php (melalui app/bootstrap.php).
defined('APP') or exit('No direct access');

const ALLOWED_E = [0.1, 0.05, 0.01];

$TABS = [
    'srt'   => 'SRT',
    'sssrt' => 'SSSRT',
    'tps'   => 'TPS / TPS3R / TPST',
    'tpa'   => 'TPA',
    'info'  => 'Panduan',
];

$SSSRT_OPTS = [
    'Kawasan Komersial (Pasar/Pertokoan)',
    'Kawasan Komersial (Hotel/Penginapan)',
    'Kawasan Komersial (Restoran/Rumah Makan)',
    'Kawasan Industri',
    'Kawasan Khusus',
    'Fasilitas Sosial (Rumah Ibadah)',
    'Fasilitas Sosial (Panti Asuhan)',
    'Fasilitas Umum (Terminal/Stasiun)',
    'Fasilitas Umum (Taman Kota)',
    'Fasilitas Umum (Wisata)',
    'Fasilitas Lain (Sekolah/Pendidikan)',
    'Fasilitas Lain (Rumah Sakit)',
    'Fasilitas Lain (Perkantoran)',
    'Fasilitas Lain (Pusat Olahraga)',
    'Lainnya',
];

$TPS_JENIS_OPTS = [
    'TPS (Tempat Penampungan Sementara)',
    'TPS3R',
    'TPST (Terpadu)',
];

$DEFAULTS = [
    'use_proy' => false, 'p0' => '', 'rg' => '', 'td' => '2020', 'thr_p' => '2025',
    'pt' => '', 'thr_d' => '2025',
    'srt_met' => 'alt1', 'srt_e' => '0.1', 'avg_kk' => '4',
    'sn_h' => '15', 'sn_m' => '75', 'sn_l' => '10',
    'sssrt_met' => 'alt1', 'sssrt_kota' => '', 'sssrt_cd' => '', 'sssrt_e' => '0.1',
    'sssrt_nama' => ['', ''], 'sssrt_ts' => ['', ''],
    'tps_met' => 'auto', 'tps_e' => '0.1',
    'tps_nama' => [''], 'tps_jenis' => ['TPS'], 'tps_kap' => [''], 'tps_n' => [''],
    'tpa_met' => 'alt1', 'tpa_e' => '0.1',
    'tpa_nama' => [''], 'tpa_kap' => [''], 'tpa_n' => [''],
];
