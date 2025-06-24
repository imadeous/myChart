<?php
// db_test.php - Simple DB connection and test for ChartDataHelper

/*
Example database and table structure used:

Database: database_db
Table: transactions
Columns:
  id INT PRIMARY KEY AUTO_INCREMENT
  user_id INT
  amount DECIMAL(10,2)
  type VARCHAR(50)
  description TEXT
  created_at DATETIME

Sample query groups by month (from created_at), and by type, summing amount.
*/

$host = 'localhost';
$db   = 'database_db';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';
$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    // echo "<p>✅ Connected to database successfully.</p>";

    // Query: group by month from created_at, show sum(amount) per type
    $stmt = $pdo->query("SELECT DATE_FORMAT(created_at, '%m-%Y') as month, SUM(amount) as amount FROM transactions GROUP BY month");
    $data = $stmt->fetchAll();
    // echo "<pre>Sample data:\n" . print_r($data, true) . "</pre>";

    require_once 'ChartDataHelper.php';
    $helper = new ChartDataHelper($data);
    $json = $helper->prepareChartData([
        'x' => 'month',
        'y' => ['amount'],
        'type' => 'bar',
        'label' => 'type',
        'options' => ['yAxisLabel' => 'Amount']
    ]);
    echo $json;
} catch (PDOException $e) {
    echo "<p>❌ DB Connection failed: " . htmlspecialchars($e->getMessage()) . "</p>";
}
