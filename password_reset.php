<?php
session_start();
require_once '../config/db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
    
    try {
        // Generate reset token
        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));
        
        $stmt = $pdo->prepare("UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?");
        $stmt->execute([$token, $expires, $email]);
        
        if ($stmt->rowCount() > 0) {
            // Send reset email
            $resetLink = "http://localhost/research/reset-password.php?token=" . $token;
            $to = $email;
            $subject = "Password Reset Request";
            $message = "Click this link to reset your password: " . $resetLink;
            mail($to, $subject, $message);
            
            echo json_encode(['success' => true, 'message' => 'Reset link sent to your email']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Email not found']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error occurred']);
    }
}
?>