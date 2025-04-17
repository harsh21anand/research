<?php
session_start();
require_once '../config/db.php';

if (isset($_GET['token'])) {
    $token = $_GET['token'];
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE verify_token = ? AND verified = 0");
        $stmt->execute([$token]);
        $user = $stmt->fetch();
        
        if ($user) {
            $updateStmt = $pdo->prepare("UPDATE users SET verified = 1, verify_token = NULL WHERE id = ?");
            $updateStmt->execute([$user['id']]);
            
            $_SESSION['message'] = "Email verified successfully! Please login.";
            header('Location: ../login.php');
        } else {
            $_SESSION['error'] = "Invalid verification token.";
            header('Location: ../login.php');
        }
    } catch (Exception $e) {
        $_SESSION['error'] = "Error occurred during verification.";
        header('Location: ../login.php');
    }
}
?>