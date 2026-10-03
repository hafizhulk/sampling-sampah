<?php
// Helper presentasi kecil.
defined('APP') or exit('No direct access');

function numf($n) { return number_format((int)$n, 0, ',', '.'); }
function esc($s)  { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
function sel($a, $b) { return $a === $b ? 'selected' : ''; }

function eValid($e) {
    foreach (ALLOWED_E as $ae) { if (abs($e - $ae) < 1e-9) return true; }
    return false;
}

function riCard($lbl, $val, $unit) {
    return "<div class='ri'><div class='rl'>" . esc($lbl) . "</div><div class='rv'>" . esc($val) . "</div><div class='ru'>" . esc($unit) . "</div></div>";
}

function stepsHtml($steps) {
    return implode('', array_map(fn($s) => "<li>{$s}</li>", $steps));
}
