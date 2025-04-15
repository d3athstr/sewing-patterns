<?php
/**
 * Configuration for the Sewing Patterns project.
 * Updated to use the public domain so that the site works from the internet.
 */

$server = "garmentgallery.empire12.net";  // Updated from 192.168.14.45
$db_username = "your_username";
$db_password = "your_password";
$db_name = "sewing_patterns";

// Create connection
$conn = new mysqli($server, $db_username, $db_password, $db_name);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
