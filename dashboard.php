<?php
require_once 'config/session_handler.php';
$session = new SessionHandler();

if (!$session->isLoggedIn()) {
    header('Location: auth.html');
    exit;
}
?>