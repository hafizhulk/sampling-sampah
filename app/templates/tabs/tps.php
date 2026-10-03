<form method="POST">
<input type="hidden" name="tab" value="tps">
<input type="hidden" name="tps_met" value="auto">
<div class="card">
  <div class="ct">Parameter TPS / TPS3R / TPST</div>
  <div class="note"><strong>Pasal 4.2.4</strong> — N &gt; 30/hari → Alt 1: n = <span class="frac"><span>N</span><span>1 + N·e<sup>2</sup></span></span> · N ≤ 30/hari → Alt 2: 10% dari N. Metode dipilih otomatis per lokasi.</div>
  <div class="r2">
    <div class="fg"><label for="f-tps-e">Tingkat kesalahan e (Alt 1)</label>
      <select id="f-tps-e" name="tps_e">
        <option value="0.1" <?= sel($d['tps_e'], '0.1') ?>>10%</option>
        <option value="0.05" <?= sel($d['tps_e'], '0.05') ?>>5%</option>
        <option value="0.01" <?= sel($d['tps_e'], '0.01') ?>>1%</option>
      </select>
    </div>
  </div>
</div>
<div class="card">
  <div class="ct">Daftar lokasi TPS / TPS3R / TPST</div>
  <div id="tps-rows">
  <?php
  $tnm = (array)$d['tps_nama']; $tj = (array)$d['tps_jenis']; $tk = (array)$d['tps_kap']; $tn = (array)$d['tps_n'];
  $tRowN = max(count($tnm), 1);
  for ($i = 0; $i < $tRowN; $i++):
  ?>
  <div class="entry" id="tp<?= $i ?>">
    <?php if ($i > 0): ?><button type="button" class="del" data-rm="tp<?= $i ?>" aria-label="Hapus baris">×</button><?php endif; ?>
    <div class="r3">
      <div class="fg"><label>Nama lokasi</label>
        <input type="text" name="tps_nama[]" value="<?= esc($tnm[$i] ?? '') ?>" placeholder="Nama TPS/TPS3R/TPST"></div>
      <div class="fg"><label>Jenis</label>
        <select name="tps_jenis[]">
          <?php foreach ($TPS_JENIS_OPTS as $jo): ?>
          <option value="<?= esc($jo) ?>" <?= (($jo === ($tj[$i] ?? '')) ? 'selected' : '') ?>><?= esc($jo) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="fg"><label>Kapasitas alat (m³)</label>
        <input type="number" name="tps_kap[]" value="<?= esc($tk[$i] ?? '') ?>" min="0" step="0.1" placeholder="—"></div>
    </div>
    <div class="r2">
      <div class="fg"><label>Total ritasi/hari (N) *</label>
        <input type="number" name="tps_n[]" value="<?= esc($tn[$i] ?? '') ?>"
          min="1" placeholder="Contoh: 45" data-tps-n="tpspv<?= $i ?>" id="tpsn<?= $i ?>">
        <div class="hint">Total ritasi semua alat pengumpul per hari</div>
      </div>
      <div class="fg"><label class="vh">Pratinjau</label>
        <div id="tpspv<?= $i ?>" class="pv">
          <?php
          $nv = intval($tn[$i] ?? 0);
          if ($nv > 0) {
              $ev = floatval($d['tps_e']);
              if ($nv > 30) { $nn = slovin($nv, $ev); echo "<span class='tag'>N={$nv} &gt; 30 → Alt 1: n ≈ " . round($nn) . "</span>"; }
              else { echo "<span class='tag'>N={$nv} ≤ 30 → Alt 2: n = " . ceil($nv * 0.1) . "</span>"; }
          }
          ?>
        </div>
      </div>
    </div>
  </div>
  <?php endfor; ?>
  </div>
  <button type="button" class="add-btn" id="btn-tps-add">+ Tambah lokasi TPS</button>
</div>
<?php if ($err && $tab === 'tps'): ?><div class="ebox" role="alert"><?= esc($err) ?></div><?php endif; ?>
<div class="bgrp">
  <button type="submit" name="hitung_tps" class="btn bp">Hitung TPS/TPS3R/TPST</button>
  <a href="?tab=tps" class="btn bs">Reset</a>
</div>
</form>
<?php if ($resTPS): $r = $resTPS; $tN = array_sum(array_column($r['rows'], 'N')); $tC = array_sum(array_column($r['rows'], 'nr')); ?>
<div class="rcard">
  <div class="rtitle">Hasil — jumlah contoh TPS/TPS3R/TPST (Pasal 4.2.4)</div>
  <table class="rt">
    <thead><tr><th>Nama lokasi</th><th>Jenis</th><th>Kapasitas</th><th>Ritasi/hari (N)</th><th>Metode</th><th>Jumlah contoh (n)</th></tr></thead>
    <tbody><?php foreach ($r['rows'] as $row): ?>
      <tr><td><?= $row['nama'] ?></td><td><span class="tag"><?= $row['jenis'] ?></span></td>
        <td><?= $row['kap'] ?></td><td><?= numf($row['N']) ?></td>
        <td class="mut"><?= $row['met'] ?></td><td><strong><?= (int)$row['nr'] ?></strong></td></tr>
    <?php endforeach; ?></tbody>
    <tfoot><tr class="tot"><td colspan="3">Total</td><td><?= numf($tN) ?></td><td>—</td><td><?= (int)$tC ?></td></tr></tfoot>
  </table>
  <div class="steps-wrap"><strong>Langkah perhitungan:</strong>
    <ol class="steps"><?= stepsHtml($r['steps']) ?></ol></div>
</div>
<?php endif; ?>
