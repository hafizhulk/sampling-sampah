// app.js — init + tab switching (hanya browser).
// js/calculations.js dan js/tabs.js dimuat sebelum berkas ini.
(function () {
  "use strict";

  var TABS = ["srt", "sssrt", "tps", "tpa", "info"];

  function activate(tab) {
    if (TABS.indexOf(tab) === -1) tab = "srt";
    document.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("on"); });
    document.querySelectorAll(".tb").forEach(function (b) { b.classList.remove("on"); });
    var el = document.getElementById("tab-" + tab);
    if (el) el.classList.add("on");
    document.querySelectorAll('.tb[data-tab="' + tab + '"]').forEach(function (b) { b.classList.add("on"); });
  }

  document.addEventListener("click", function (ev) {
    var t = ev.target;
    if (t.classList && t.classList.contains("tb") && t.dataset && t.dataset.tab) {
      activate(t.dataset.tab);
    }
  });

  document.addEventListener("DOMContentLoaded", function () {
    try {
      var q = new URLSearchParams(window.location.search).get("tab");
      if (q) activate(q);
    } catch (e) { activate("srt"); }
  });
})();
