<?php
class SessionHandler {
    private $timeout = 1800; // 30 minutes
    private $maxAttempts = 3;

    public function __construct() {
        session_start();
        $this->checkSessionTimeout();
    }

    private function checkSessionTimeout() {
        if (isset($_SESSION['last_activity'])) {
            $inactive = time() - $_SESSION['last_activity'];
            if ($inactive >= $this->timeout) {
                $this->logout();
            }
        }
        $_SESSION['last_activity'] = time();
    }

    public function isLoggedIn() {
        return isset($_SESSION['user_id']);
    }

    public function checkLoginAttempts($email) {
        if (!isset($_SESSION['login_attempts'][$email])) {
            $_SESSION['login_attempts'][$email] = 0;
        }
        return $_SESSION['login_attempts'][$email] < $this->maxAttempts;
    }

    public function incrementLoginAttempts($email) {
        if (!isset($_SESSION['login_attempts'][$email])) {
            $_SESSION['login_attempts'][$email] = 1;
        } else {
            $_SESSION['login_attempts'][$email]++;
        }
    }

    public function resetLoginAttempts($email) {
        $_SESSION['login_attempts'][$email] = 0;
    }

    public function getRemainingAttempts($email) {
        if (!isset($_SESSION['login_attempts'][$email])) {
            return $this->maxAttempts;
        }
        return $this->maxAttempts - $_SESSION['login_attempts'][$email];
    }

    public function logout() {
        session_unset();
        session_destroy();
    }
}
?>