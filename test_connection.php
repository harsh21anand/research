<?php
require_once 'db.php';

try {
    // Test query
    $stmt = $pdo->query("SELECT 1");
    echo "\nDatabase connection test successful!";
    
    // Test if database exists
    $stmt = $pdo->query("SHOW DATABASES LIKE 'technova_db'");
    if ($stmt->rowCount() > 0) {
        echo "\nDatabase 'technova_db' exists!";
    } else {
        echo "\nDatabase 'technova_db' does not exist. Creating...";
        // Execute the database creation script
        $sql = file_get_contents('database.sql');
        $pdo->exec($sql);
        echo "\nDatabase and tables created successfully!";
    }
} catch(PDOException $e) {
    die("\nTest failed: " . $e->getMessage());
}
?>