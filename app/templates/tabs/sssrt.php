<form method="POST">
<input type="hidden" name="tab" value="sssrt">
<div class="card">
  <div class="ct">Parameter SSSRT</div>
  <div class="r3">
    <div class="fg"><label for="f-ss-met">Metode</label>
      <select id="f-ss-met" name="sssrt_met">
        <option value="alt1" <?= sel($d['sssrt_met'], 'alt1') ?>>Alt 1 — S = Cd × √Ts</option>
        <option value="alt2" <?= sel($d['sssrt_met'], 'alt2') ?>>Alt 2 — Slovin</option>
      </select>
    </div>
    <div class="fg"><label for="f-ss-kota">Klasifikasi kota (Cd)</label>
      <select id="f-ss-kota" name="sssrt_kota">
        <option value="">— Pilih —</option>
        <option value="1.5" <?= sel($d['sssrt_kota'], '1.5') ?>>Megapolitan — Cd 1,5</option>
        <option value="1" <?= sel($d['sssrt_kota'], '1') ?>>Metropolitan — Cd 1,0</option>
        <option value="1b" <?= sel($d['sssrt_kota'], '1b') ?>>Kota Besar — Cd 1,0</option>
        <option value="0.5" <?= sel($d['sssrt_kota'], '0.5') ?>>Kota Sedang — Cd 0,5</option>
        <option value="0.5k" <?= sel($d['sssrt_kota'], '0.5k') ?>>Kota Kecil — Cd 0,5</option>
      </select>
    </div>
    <div class="fg"><label for="f-ss-cd">Koefisien Cd</label>
      <input type="text" id="f-ss-cd" name="sssrt_cd" readonly value="<?= esc($d['sssrt_cd']) ?>"></div>
  </div>
  <div class="r2">
    <div class="fg"><label for="f-ss-e">Tingkat kesalahan e (Alt 2)</label>
      <select id="f-ss-e" name="sssrt_e">
        <option value="0.1" <?= sel($d['sssrt_e'], '0.1') ?>>10%</option>
        <option value="0.05" <?= sel($d['sssrt_e'], '0.05') ?>>5%</option>
        <option value="0.01" <?= sel($d['sssrt_e'], '0.01') ?>>1%</option>
      </select>
    </div>
  </div>
</div>
<div class="card">
  <div class="ct">Daftar jenis fasilitas SSSRT</div>
  <div class="note">Tambahkan setiap jenis fasilitas beserta jumlah total unit di wilayah kajian.</div>
  <div id="sssrt-rows">
  <?php
  $nm = (array)$d['sssrt_nama']; $ts = (array)$d['sssrt_ts'];
  $rowN = max(count($nm), 2);
  for ($i = 0; $i < $rowN; $i++):
    $nv = esc($nm[$i] ?? ''); $tv = esc($ts[$i] ?? '');
  ?>
  <div class="entry" id="ss<?= $i ?>">
    <?php if ($i > 0): ?><button type="button" class="del" data-rm="ss<?= $i ?>" aria-label="Hapus baris">×</button><?php endif; ?>
    <div class="r2">
      <div class="fg"><label>Jenis fasilitas</label>
        <select data-sync="ssnm<?= $i ?>">
          <option value="">— Pilih jenis —</option>
          <?php foreach ($SSSRT_OPTS as $o): ?>
          <option value="<?= esc($o) ?>" <?= ($o === ($nm[$i] ?? '')) ? 'selected' : '' ?>><?= esc($o) ?></option>
          <?php endforeach; ?>
        </select>
        <input type="text" name="sssrt_nama[]" id="ssnm<?= $i ?>" value="<?= $nv ?>" placeholder="Nama fasilitas" class="mt5">
      </div>
      <div class="fg"><label>Total unit di wilayah (Ts/N)</label>
        <input type="number" name="sssrt_ts[]" value="<?= $tv ?>" min="1" placeholder="Jumlah unit">
        <div class="hint">Total unit fasilitas sejenis</div>
      </div>
    </div>
  </div>
  <?php endfor; ?>
  </div>
  <button type="button" class="add-btn" id="btn-ss-add">+ Tambah jenis fasilitas</button>
</div>
<?php if ($err && $tab === 'sssrt'): ?><div class="ebox" role="alert"><?= esc($err) ?></div><?php endif; ?>
<div class="bgrp">
  <button type="submit" name="hitung_sssrt" class="btn bp">Hitung SSSRT</button>
  <a href="?tab=sssrt" class="btn bs">Reset</a>
</div>
</form>
<?php if ($resSSSRT): $r = $resSSSRT; $tTs = array_sum(array_column($r['rows'], 'ts')); $tNr = array_sum(array_column($r['rows'], 'nr')); ?>
<div class="rcard">
  <div class="rtitle">Hasil — jumlah contoh SSSRT (Pasal 4.2.3)</div>
  <table class="rt">
    <thead><tr><th>Jenis fasilitas</th><th>Total unit (Ts)</th><th>Jumlah contoh</th><th>Rumus</th></tr></thead>
    <tbody><?php foreach ($r['rows'] as $row): ?>
      <tr><td><?= $row['nama'] ?></td><td><?= numf($row['ts']) ?></td>
        <td><strong><?= (int)$row['nr'] ?></strong></td><td class="mut"><?= $row['desc'] ?></td></tr>
    <?php endforeach; ?></tbody>
    <tfoot><tr class="tot"><td>Total</td><td><?= numf($tTs) ?></td><td><?= (int)$tNr ?></td><td>—</td></tr></tfoot>
  </table>
  <div class="steps-wrap"><strong>Langkah perhitungan:</strong>
    <ol class="steps"><?= stepsHtml($r['steps']) ?></ol></div>
</div>
<?php endif; ?>
