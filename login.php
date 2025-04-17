<?php
session_start();
require_once '../config/db.php';
require_once '../config/session_handler.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $sessionHandler = new SessionHandler();
    $email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
    $password = $_POST['password'];
    
    try {
        // Check login attempts
        if (!$sessionHandler->checkLoginAttempts($email)) {
            echo json_encode([
                'success' => false,
                'message' => 'Too many failed attempts. Please reset your password.',
                'locked' => true
            ]);
            exit;
        }

        // Prepare and execute the statement to fetch user data
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password'])) {
            // Successful login
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['email'] = $user['email'];
            $_SESSION['fullname'] = $user['fullname'];
            $_SESSION['role'] = $user['role'];
            
            // Reset login attempts
            $sessionHandler->resetLoginAttempts($email);
            
            // Update last login time
            $updateStmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
            $updateStmt->execute([$user['id']]);
            
            // Log successful login
            $logStmt = $pdo->prepare("INSERT INTO login_history (user_id, ip_address, user_agent, status) VALUES (?, ?, ?, 'success')");
            $logStmt->execute([
                $user['id'],
                $_SERVER['REMOTE_ADDR'],
                $_SERVER['HTTP_USER_AGENT']
            ]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Login successful',
                'user' => [
                    'fullname' => $user['fullname'],
                    'email' => $user['email'],
                    'role' => $user['role']
                ]
            ]);
        } else {
            // Failed login
            $sessionHandler->incrementLoginAttempts($email);
            $remainingAttempts = $sessionHandler->getRemainingAttempts($email);
            
            // Log failed attempt
            if ($user) {
                $logStmt = $pdo->prepare("INSERT INTO login_history (user_id, ip_address, user_agent, status) VALUES (?, ?, ?, 'failed')");
                $logStmt->execute([
                    $user['id'],
                    $_SERVER['REMOTE_ADDR'],
                    $_SERVER['HTTP_USER_AGENT']
                ]);
            }
            
            echo json_encode([
                'success' => false,
                'message' => "Invalid credentials. {$remainingAttempts} attempts remaining.",
                'remainingAttempts' => $remainingAttempts
            ]);
        }
    } catch (PDOException $e) {
        error_log("Login error: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'An error occurred during login'
        ]);
    }
}
?>