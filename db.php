<?php
$host = '127.0.0.1';
$dbname = 'harsh_db';
$username = 'root';
$password = 'harsh123';
$port = 3307;

try {
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
    echo "Database connection successful";
} catch(PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}
?>
