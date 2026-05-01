// API Configuration
const API_BASE_URL = 'http://127.0.0.1:8000';
const CACHE_KEY = 'todo_tasks_cache';
const DARK_MODE_KEY = 'dark_mode_enabled';

// State Management
let tasks = [];
let currentEditId = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeDarkMode();
    loadTasks();
    setupEventListeners();
    setupKeyboardShortcuts();
});

// Dark Mode
function initializeDarkMode() {
    const darkModeEnabled = localStorage.getItem(DARK_MODE_KEY) === 'true';
    if (darkModeEnabled) {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').textContent = '☀️';
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem(DARK_MODE_KEY, isDark);
    document.getElementById('darkModeToggle').textContent = isDark ? '☀️' : '🌙';
    showToast(isDark ? 'Dark mode enabled' : 'Light mode enabled', 'success');
}

// Event Listeners
function setupEventListeners() {
    // Dark mode toggle
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    
    // Add task form
    document.getElementById('addTaskForm').addEventListener('submit', handleAddTask);
    
    // Edit task form
    document.getElementById('editTaskForm').addEventListener('submit', handleEditTask);
    
    // Modal controls
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelEdit').addEventListener('click', closeModal);
    document.getElementById('editModal').addEventListener('click', (e) => {
        if (e.target.id === 'editModal') closeModal();
    });
    
    // Filters and search
    document.getElementById('searchInput').addEventListener('input', debounce(loadTasks, 300));
    document.getElementById('statusFilter').addEventListener('change', loadTasks);
    document.getElementById('priorityFilter').addEventListener('change', loadTasks);
    document.getElementById('sortBy').addEventListener('change', loadTasks);
}

// Keyboard Shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to submit add task form
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const titleInput = document.getElementById('taskTitle');
            if (document.activeElement === titleInput || 
                document.activeElement === document.getElementById('taskDescription')) {
                e.preventDefault();
                document.getElementById('addTaskForm').dispatchEvent(new Event('submit'));
            }
        }
        
        // Escape to close modal
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// API Calls
async function fetchTasks(params = {}) {
    try {
        const queryParams = new URLSearchParams();
        
        if (params.status) queryParams.append('status', params.status);
        if (params.priority) queryParams.append('priority', params.priority);
        if (params.search) queryParams.append('search', params.search);
        if (params.sort_by) queryParams.append('sort_by', params.sort_by);
        if (params.order) queryParams.append('order', params.order);
        
        const response = await fetch(`${API_BASE_URL}/tasks?${queryParams}`);
        if (!response.ok) throw new Error('Failed to fetch tasks');
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching tasks:', error);
        showToast('Failed to load tasks', 'error');
        return [];
    }
}

async function fetchStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/stats`);
        if (!response.ok) throw new Error('Failed to fetch stats');
        return await response.json();
    } catch (error) {
        console.error('Error fetching stats:', error);
        return { total: 0, completed: 0, pending: 0, completion_rate: 0 };
    }
}

async function createTask(taskData) {
    try {
        console.log('Creating task with data:', taskData);
        
        const response = await fetch(`${API_BASE_URL}/tasks/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Server error:', errorData);
            throw new Error(errorData.detail || 'Failed to create task');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error creating task:', error);
        showToast(error.message || 'Failed to create task', 'error');
        return null;
    }
}

async function updateTask(taskId, taskData) {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        
        if (!response.ok) throw new Error('Failed to update task');
        return await response.json();
    } catch (error) {
        console.error('Error updating task:', error);
        showToast('Failed to update task', 'error');
        return null;
    }
}

async function deleteTask(taskId) {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete task');
        return true;
    } catch (error) {
        console.error('Error deleting task:', error);
        showToast('Failed to delete task', 'error');
        return false;
    }
}

// Load and Render Tasks
async function loadTasks() {
    const searchValue = document.getElementById('searchInput').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value;
    const sortBy = document.getElementById('sortBy').value;
    
    const params = {
        status: statusFilter !== 'all' ? statusFilter : null,
        priority: priorityFilter || null,
        search: searchValue || null,
        sort_by: sortBy,
        order: 'desc'
    };
    
    tasks = await fetchTasks(params);
    
    // Sort completed tasks to bottom
    tasks.sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
    });
    
    // Cache tasks
    localStorage.setItem(CACHE_KEY, JSON.stringify(tasks));
    
    renderTasks();
    await updateStats();
}

function renderTasks() {
    const tasksList = document.getElementById('tasksList');
    const emptyState = document.getElementById('emptyState');
    
    if (tasks.length === 0) {
        tasksList.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    tasksList.innerHTML = tasks.map(task => createTaskHTML(task)).join('');
    
    // Attach event listeners
    tasks.forEach(task => {
        const checkbox = document.getElementById(`checkbox-${task.id}`);
        const editBtn = document.getElementById(`edit-${task.id}`);
        const deleteBtn = document.getElementById(`delete-${task.id}`);
        
        if (checkbox) checkbox.addEventListener('change', () => toggleTaskComplete(task.id));
        if (editBtn) editBtn.addEventListener('click', () => openEditModal(task));
        if (deleteBtn) deleteBtn.addEventListener('click', () => handleDeleteTask(task.id));
    });
}

function createTaskHTML(task) {
    const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date';
    const createdDate = new Date(task.created_at).toLocaleDateString();
    const completedClass = task.completed ? 'completed' : '';
    
    // Display friendly priority labels
    const priorityDisplay = {
        'LOW': 'Low',
        'MEDIUM': 'Medium',
        'HIGH': 'High'
    }[task.priority] || task.priority;
    
    return `
        <div class="task-item ${completedClass}">
            <input type="checkbox" 
                   class="task-checkbox" 
                   id="checkbox-${task.id}" 
                   ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <div class="task-header">
                    <h3 class="task-title">${escapeHtml(task.title)}</h3>
                    <span class="priority-badge priority-${task.priority.toLowerCase()}">${priorityDisplay}</span>
                </div>
                ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
                <div class="task-meta">
                    <span>📅 Due: ${dueDate}</span>
                    <span>🕒 Created: ${createdDate}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="action-btn edit-btn" id="edit-${task.id}">Edit</button>
                <button class="action-btn delete-btn" id="delete-${task.id}">Delete</button>
            </div>
        </div>
    `;
}

async function updateStats() {
    const stats = await fetchStats();
    
    document.getElementById('totalTasks').textContent = stats.total;
    document.getElementById('completedTasks').textContent = stats.completed;
    document.getElementById('pendingTasks').textContent = stats.pending;
    document.getElementById('completionRate').textContent = `${stats.completion_rate}% Complete`;
    document.getElementById('progressFill').style.width = `${stats.completion_rate}%`;
}

// Task Operations
async function handleAddTask(e) {
    e.preventDefault();
    
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const dueDate = document.getElementById('taskDueDate').value;
    
    if (!title) {
        showToast('Please enter a task title', 'error');
        return;
    }
    
    const taskData = {
        title,
        description: description || null,
        priority,
        due_date: dueDate || null,  // Send as YYYY-MM-DD or null
        completed: false
    };
    
    console.log('Submitting task:', taskData);
    
    const newTask = await createTask(taskData);
    
    if (newTask) {
        showToast('Task added successfully! 🎉', 'success');
        document.getElementById('addTaskForm').reset();
        await loadTasks();
    }
}

async function toggleTaskComplete(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const updated = await updateTask(taskId, { completed: !task.completed });
    
    if (updated) {
        showToast(updated.completed ? 'Task completed! ✅' : 'Task reopened', 'success');
        await loadTasks();
    }
}

async function handleDeleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    const success = await deleteTask(taskId);
    
    if (success) {
        showToast('Task deleted successfully', 'success');
        await loadTasks();
    }
}

// Edit Modal
function openEditModal(task) {
    currentEditId = task.id;
    
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskDescription').value = task.description || '';
    document.getElementById('editTaskPriority').value = task.priority;
    document.getElementById('editTaskDueDate').value = task.due_date ? 
        new Date(task.due_date).toISOString().split('T')[0] : '';
    document.getElementById('editTaskCompleted').checked = task.completed;
    
    document.getElementById('editModal').classList.add('active');
}

function closeModal() {
    document.getElementById('editModal').classList.remove('active');
    currentEditId = null;
}

async function handleEditTask(e) {
    e.preventDefault();
    
    const taskId = parseInt(document.getElementById('editTaskId').value);
    const title = document.getElementById('editTaskTitle').value.trim();
    const description = document.getElementById('editTaskDescription').value.trim();
    const priority = document.getElementById('editTaskPriority').value;
    const dueDate = document.getElementById('editTaskDueDate').value;
    const completed = document.getElementById('editTaskCompleted').checked;
    
    if (!title) {
        showToast('Please enter a task title', 'error');
        return;
    }
    
    const taskData = {
        title,
        description: description || null,
        priority,
        due_date: dueDate || null,  // Send as YYYY-MM-DD or null
        completed
    };
    
    const updated = await updateTask(taskId, taskData);
    
    if (updated) {
        showToast('Task updated successfully! ✨', 'success');
        closeModal();
        await loadTasks();
    }
}

// Utility Functions
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
