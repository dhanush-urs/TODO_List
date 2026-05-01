-- TODO App Database Setup Script
-- This script creates the database and tables
-- Run with: mysql -u root < setup.sql (no password)
-- Or: mysql -u root -p < setup.sql (with password)

-- Create database
CREATE DATABASE IF NOT EXISTS todo_app;

-- Use the database
USE todo_app;

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'MEDIUM',
    due_date DATETIME,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_completed (completed),
    INDEX idx_priority (priority),
    INDEX idx_due_date (due_date),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data (optional)
INSERT INTO tasks (title, description, priority, due_date, completed) VALUES
('Welcome to TODO App', 'This is your first task. You can edit or delete it!', 'HIGH', DATE_ADD(NOW(), INTERVAL 1 DAY), FALSE),
('Complete project documentation', 'Write comprehensive documentation for the project', 'MEDIUM', DATE_ADD(NOW(), INTERVAL 3 DAY), FALSE),
('Review code changes', 'Review and merge pending pull requests', 'HIGH', DATE_ADD(NOW(), INTERVAL 2 DAY), FALSE);

-- Show created table structure
DESCRIBE tasks;

-- Show sample data
SELECT * FROM tasks;
