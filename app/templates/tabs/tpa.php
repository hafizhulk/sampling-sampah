<form method="POST">
<input type="hidden" name="tab" value="tpa">
<div class="card">
  <div class="ct">Parameter TPA</div>
  <div class="note"><strong>Pasal 4.2.5</strong> — Alt 1: n = <span class="frac"><span>N</span><span>1 + N·e<sup>2</sup></span></span> · Alt 2: 10% dari N. Alat angkut harus mewakili setiap jenis kawasan.</div>
  <div class="r2">
    <div class="fg"><label for="f-tpa-met">Metode</label>
      <select id="f-tpa-met" name="tpa_met">
        <option value="alt1" <?= sel($d['tpa_met'], 'alt1') ?>>Alternatif 1 — Slovin</option>
        <option value="alt2" <?= sel($d['tpa_met'], 'alt2') ?>>Alternatif 2 — 10%</option>
      </select>
    </div>
    <div class="fg"><label for="f-tpa-e">Tingkat kesalahan e (Alt 1)</label>
      <select id="f-tpa-e" name="tpa_e">
        <option value="0.1" <?= sel($d['tpa_e'], '0.1') ?>>10%</option>
        <option value="0.05" <?= sel($d['tpa_e'], '0.05') ?>>5%</option>
        <option value="0.01" <?= sel($d['tpa_e'], '0.01') ?>>1%</option>
      </select>
    </div>
  </div>
</div>
<div class="card">
  <div class="ct">Daftar lokasi TPA</div>
  <div id="tpa-rows">
  <?php
  $anm = (array)$d['tpa_nama']; $ak = (array)$d['tpa_kap']; $an = (array)$d['tpa_n'];
  $aRowN = max(count($anm), 1);
  for ($i = 0; $i < $aRowN; $i++): ?>
  <div class="entry" id="ta<?= $i ?>">
    <?php if ($i > 0): ?><button type="button" class="del" data-rm="ta<?= $i ?>" aria-label="Hapus baris">×</button><?php endif; ?>
    <div class="r3">
      <div class="fg"><label>Nama TPA</label>
        <input type="text" name="tpa_nama[]" value="<?= esc($anm[$i] ?? '') ?>" placeholder="Nama TPA"></div>
      <div class="fg"><label>Kapasitas (ton/hari)</label>
        <input type="number" name="tpa_kap[]" value="<?= esc($ak[$i] ?? '') ?>" min="0" step="1" placeholder="—">
        <div class="hint">Kapasitas penerimaan per hari</div>
      </div>
      <div class="fg"><label>Ritasi alat angkut/hari (N) *</label>
        <input type="number" name="tpa_n[]" value="<?= esc($an[$i] ?? '') ?>"
          min="1" placeholder="Contoh: 20" data-tpa-n="tapv<?= $i ?>" id="tpan<?= $i ?>">
      </div>
    </div>
    <div id="tapv<?= $i ?>" class="pv">
      <?php
      $nv = intval($an[$i] ?? 0);
      if ($nv > 0) {
          $ev = floatval($d['tpa_e']);
          if ($d['tpa_met'] === 'alt1') { $nn = slovin($nv, $ev); echo "<span class='tag'>Alt 1: n ≈ " . round($nn) . "</span>"; }
          else { echo "<span class='tag'>Alt 2: n = " . ceil($nv * 0.1) . "</span>"; }
      }
      ?>
    </div>
  </div>
  <?php endfor; ?>
  </div>
  <button type="button" class="add-btn" id="btn-tpa-add">+ Tambah lokasi TPA</button>
</div>
<?php if ($err && $tab === 'tpa'): ?><div class="ebox" role="alert"><?= esc($err) ?></div><?php endif; ?>
<div class="bgrp">
  <button type="submit" name="hitung_tpa" class="btn bp">Hitung TPA</button>
  <a href="?tab=tpa" class="btn bs">Reset</a>
</div>
</form>
<?php if ($resTPA): $r = $resTPA; $tN = array_sum(array_column($r['rows'], 'N')); $tC = array_sum(array_column($r['rows'], 'nr')); ?>
<div class="rcard">
  <div class="rtitle">Hasil — jumlah contoh TPA (Pasal 4.2.5)</div>
  <table class="rt">
    <thead><tr><th>Nama TPA</th><th>Kapasitas</th><th>Ritasi/hari (N)</th><th>Metode</th><th>Jumlah contoh (n)</th></tr></thead>
    <tbody><?php foreach ($r['rows'] as $row): ?>
      <tr><td><?= $row['nama'] ?></td><td><?= $row['kap'] ?></td>
        <td><?= numf($row['N']) ?></td><td class="mut"><?= $row['met'] ?></td>
        <td><strong><?= (int)$row['nr'] ?></strong></td></tr>
    <?php endforeach; ?></tbody>
    <tfoot><tr class="tot"><td colspan="2">Total</td><td><?= numf($tN) ?></td><td>—</td><td><?= (int)$tC ?></td></tr></tfoot>
  </table>
  <div class="steps-wrap"><strong>Langkah perhitungan:</strong>
    <ol class="steps"><?= stepsHtml($r['steps']) ?></ol></div>
</div>
<?php endif; ?>
