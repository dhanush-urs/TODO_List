-- Migration Script: Fix Priority Enum Values
-- This script updates existing data and modifies the enum definition
-- Run with: mysql -u root -p todo_app < migrate_priority_enum.sql

USE todo_app;

-- Step 1: Update existing data to uppercase
UPDATE tasks SET priority = 'LOW' WHERE priority = 'Low';
UPDATE tasks SET priority = 'MEDIUM' WHERE priority = 'Medium';
UPDATE tasks SET priority = 'HIGH' WHERE priority = 'High';

-- Step 2: Modify the enum column definition
ALTER TABLE tasks MODIFY COLUMN priority ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'MEDIUM' NOT NULL;

-- Step 3: Verify the changes
SELECT 'Migration completed successfully!' AS status;
SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority;
DESCRIBE tasks;
