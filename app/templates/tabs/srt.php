<form method="POST">
<input type="hidden" name="tab" value="srt">

<div class="card">
  <div class="ct">Data jumlah penduduk</div>
  <div class="checkrow">
    <input type="checkbox" name="use_proy" id="chk_proy" value="1"
      <?= $d['use_proy'] ? 'checked' : '' ?>>
    <label for="chk_proy">Data penduduk tahun rencana <strong>tidak tersedia</strong> — gunakan proyeksi geometrik</label>
  </div>
  <div id="sec-dir" <?= $d['use_proy'] ? 'style="display:none"' : '' ?>>
    <div class="r2">
      <div class="fg"><label for="f-pt">Jumlah penduduk tahun rencana (Pt) *</label>
        <input type="number" id="f-pt" name="pt" value="<?= esc($d['pt']) ?>" min="1"
          placeholder="Jumlah jiwa"></div>
      <div class="fg"><label for="f-thr-d">Tahun rencana</label>
        <input type="number" id="f-thr-d" name="thr_d" value="<?= esc($d['thr_d']) ?>"></div>
    </div>
  </div>
  <div id="sec-proy" class="formula" style="<?= $d['use_proy'] ? '' : 'display:none' ?>">
    <div class="math">P<sub>t</sub> = P<sub>0</sub> × (1 + <span class="frac"><span>r</span><span>100</span></span>)<sup>n</sup></div>
    <div class="math-def" style="margin-bottom:12px">r = laju pertumbuhan (%/tahun), n = selisih tahun</div>
    <div class="r2">
      <div class="fg"><label for="f-p0">Penduduk tahun dasar (P₀) *</label>
        <input type="number" id="f-p0" name="p0" value="<?= esc($d['p0']) ?>" min="1" placeholder="Jiwa"></div>
      <div class="fg"><label for="f-td">Tahun data tersedia</label>
        <input type="number" id="f-td" name="td" value="<?= esc($d['td']) ?>"></div>
    </div>
    <div class="r2">
      <div class="fg"><label for="f-rg">Laju pertumbuhan r (%/tahun) *</label>
        <input type="number" id="f-rg" name="rg" step="0.01" value="<?= esc($d['rg']) ?>" placeholder="Contoh: 1.5"></div>
      <div class="fg"><label for="f-thr-p">Tahun rencana sampling</label>
        <input type="number" id="f-thr-p" name="thr_p" value="<?= esc($d['thr_p']) ?>"></div>
    </div>
    <?php if ($ptPreview && $d['use_proy']): ?>
      <div class="note">Proyeksi P<sub>t</sub> = <strong><?= numf($ptPreview) ?> jiwa</strong></div>
    <?php endif; ?>
  </div>
</div>

<div class="card">
  <div class="ct">Klasifikasi kota &amp; metode</div>
  <?php if ($kotaPreview): ?>
    <div class="note">Otomatis dari P<sub>t</sub> = <?= numf($ptPreview) ?> jiwa → <strong><?= esc($kotaPreview['label']) ?> — C<sub>d</sub> = <?= esc($kotaPreview['cd']) ?></strong></div>
  <?php else: ?>
    <div class="note">Klasifikasi dan Cd ditentukan otomatis dari Pt setelah Pt diisi (Tabel 3).</div>
  <?php endif; ?>
  <div class="r2">
    <div class="fg"><label for="f-srt-met">Metode</label>
      <select id="f-srt-met" name="srt_met">
        <option value="alt1" <?= sel($d['srt_met'], 'alt1') ?>>Alternatif 1 — Ps = Cd × √Pt</option>
        <option value="alt2" <?= sel($d['srt_met'], 'alt2') ?>>Alternatif 2 — Slovin</option>
      </select>
    </div>
    <div class="fg"><label for="f-srt-e">Tingkat kesalahan e (Alt 2)</label>
      <select id="f-srt-e" name="srt_e">
        <option value="0.1" <?= sel($d['srt_e'], '0.1') ?>>10%</option>
        <option value="0.05" <?= sel($d['srt_e'], '0.05') ?>>5%</option>
        <option value="0.01" <?= sel($d['srt_e'], '0.01') ?>>1%</option>
      </select>
    </div>
  </div>
  <div class="r2">
    <div class="fg"><label for="f-avg">Rata-rata orang per KK (N̄)</label>
      <input type="number" id="f-avg" name="avg_kk" value="<?= esc($d['avg_kk']) ?>" min="0.1" max="10" step="0.1">
      <div class="hint">Umumnya 4 orang/KK (BPS/survei lapangan).</div>
    </div>
  </div>
</div>

<div class="card">
  <div class="ct">Distribusi tingkat ekonomi (Sn)</div>
  <div class="note">Total Sn tinggi + menengah + rendah = 100%. Sumber: BPS/BKKBN/survei lapangan.</div>
  <div class="r3">
    <div class="fg"><label for="f-snh">Tinggi (%)</label>
      <input type="number" id="f-snh" name="sn_h" value="<?= esc($d['sn_h']) ?>" min="0" max="100" step="0.1"></div>
    <div class="fg"><label for="f-snm">Menengah (%)</label>
      <input type="number" id="f-snm" name="sn_m" value="<?= esc($d['sn_m']) ?>" min="0" max="100" step="0.1"></div>
    <div class="fg"><label for="f-snl">Rendah (%)</label>
      <input type="number" id="f-snl" name="sn_l" value="<?= esc($d['sn_l']) ?>" min="0" max="100" step="0.1"></div>
  </div>
</div>

<?php if ($err && $tab === 'srt'): ?><div class="ebox" role="alert"><?= esc($err) ?></div><?php endif; ?>
<div class="bgrp">
  <button type="submit" name="hitung_srt" class="btn bp">Hitung SRT</button>
  <a href="?tab=srt" class="btn bs">Reset</a>
</div>
</form>

<?php if ($resSRT): $r = $resSRT; ?>
<div class="rcard">
  <div class="rtitle">Hasil — jumlah contoh SRT (Pasal 4.2.2)</div>
  <div class="rgrid">
    <?= riCard('Penduduk (Pt)', numf($r['pt']), 'jiwa') ?>
    <?= riCard('Klasifikasi', $r['kota']['label'], 'Cd = ' . $r['kota']['cd']) ?>
    <?= riCard('Contoh (Ps/n)', numf($r['ps']), 'orang') ?>
    <?= riCard('Jumlah KK', numf($r['K']), 'KK') ?>
    <?= riCard('Total rumah', numf($r['nrTotal']), 'unit') ?>
  </div>
  <table class="rt">
    <thead><tr><th>Tingkat ekonomi</th><th>Proporsi (Sn)</th><th>Jumlah KK</th><th>Jumlah rumah (Nr)</th></tr></thead>
    <tbody>
      <tr><td>Tinggi (H)</td><td><?= esc($r['snH']) ?>%</td><td><?= (int)$r['nrH'] ?> KK</td><td><strong><?= (int)$r['nrH'] ?></strong></td></tr>
      <tr><td>Menengah (M)</td><td><?= esc($r['snM']) ?>%</td><td><?= (int)$r['nrM'] ?> KK</td><td><strong><?= (int)$r['nrM'] ?></strong></td></tr>
      <tr><td>Rendah (L)</td><td><?= esc($r['snL']) ?>%</td><td><?= (int)$r['nrL'] ?> KK</td><td><strong><?= (int)$r['nrL'] ?></strong></td></tr>
    </tbody>
    <tfoot><tr class="tot"><td>Total</td><td>100%</td><td><?= (int)$r['K'] ?> KK</td><td><?= (int)$r['nrTotal'] ?> unit</td></tr></tfoot>
  </table>
  <div class="steps-wrap"><strong>Langkah perhitungan:</strong>
    <ol class="steps"><?= stepsHtml($r['steps']) ?></ol></div>
</div>
<?php endif; ?>
