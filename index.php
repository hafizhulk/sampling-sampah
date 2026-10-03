<?php
// Entry point. Satu-satunya file PHP yang diakses browser langsung.
define('APP', true);

require __DIR__ . '/app/config.php';
require __DIR__ . '/app/lib/helpers.php';
require __DIR__ . '/app/lib/sampling.php';
require __DIR__ . '/app/bootstrap.php';
require __DIR__ . '/app/templates/layout.php';
