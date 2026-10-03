<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Kalkulator Sampling Sampah — SNI 3964:2025</title>
<link rel="stylesheet" href="assets/style.css">
</head>
<body>
<header class="site-header">
  <div class="site-header-inner">
    <div class="logo" aria-hidden="true">◈</div>
    <div>
      <h1>Kalkulator Sampling Timbulan Sampah — SNI 3964:2025</h1>
      <p>Penentuan jumlah contoh SRT · SSSRT · TPS/TPS3R/TPST · TPA</p>
    </div>
  </div>
</header>
<div class="wrap">

<nav class="tabs" aria-label="Pilih kategori">
  <?php foreach ($TABS as $k => $lbl): ?>
  <button type="button" class="tb <?= $tab === $k ? 'on' : '' ?>" data-tab="<?= esc($k) ?>"><?= esc($lbl) ?></button>
  <?php endforeach; ?>
</nav>

<?php
foreach (['srt', 'sssrt', 'tps', 'tpa', 'info'] as $t) {
    echo "<section id='tab-{$t}' class='tab" . ($tab === $t ? ' on' : '') . "'>";
    require __DIR__ . "/tabs/{$t}.php";
    echo "</section>";
}
?>

</div>
<script>
window.SAMP = {
  sssrtStart: <?= (int)$sssrtStart ?>,
  tpsStart: <?= (int)$tRowN ?>,
  tpaStart: <?= (int)$aRowN ?>,
  sssrtOpts: <?= json_encode($SSSRT_OPTS, JSON_UNESCAPED_UNICODE) ?>,
  tpsJenisOpts: <?= json_encode($TPS_JENIS_OPTS, JSON_UNESCAPED_UNICODE) ?>
};
</script>
<script src="assets/app.js" defer></script>
</body>
</html>
