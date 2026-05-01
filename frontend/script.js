// API Configuration
// Automatically use production backend URL or localhost for development
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:'
    ? 'http://127.0.0.1:8000'
    : 'https://todo-app658.up.railway.app';
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
    // Default to dark mode if not set
    const savedMode = localStorage.getItem(DARK_MODE_KEY);
    const isDark = savedMode === null ? true : savedMode === 'true';
    
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    
    const moonIcon = document.getElementById('moonIcon');
    const sunIcon = document.getElementById('sunIcon');
    
    if (moonIcon && sunIcon) {
        moonIcon.style.display = isDark ? 'none' : 'block';
        sunIcon.style.display = isDark ? 'block' : 'none';
    }
}

function toggleDarkMode() {
    const html = document.documentElement;
    const isCurrentlyDark = html.getAttribute('data-theme') === 'dark';
    const newIsDark = !isCurrentlyDark;
    
    html.setAttribute('data-theme', newIsDark ? 'dark' : 'light');
    localStorage.setItem(DARK_MODE_KEY, newIsDark);
    
    const moonIcon = document.getElementById('moonIcon');
    const sunIcon = document.getElementById('sunIcon');
    
    if (moonIcon && sunIcon) {
        moonIcon.style.display = newIsDark ? 'none' : 'block';
        sunIcon.style.display = newIsDark ? 'block' : 'none';
    }
    
    showToast(newIsDark ? 'Dark mode enabled' : 'Light mode enabled', 'info');
}

// Event Listeners
function setupEventListeners() {
    // Dark mode toggle
    const themeBtn = document.getElementById('darkModeToggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleDarkMode);
    
    // Add task form
    const addTaskForm = document.getElementById('addTaskForm');
    if (addTaskForm) addTaskForm.addEventListener('submit', handleAddTask);
    
    // Edit task form
    const editTaskForm = document.getElementById('editTaskForm');
    if (editTaskForm) editTaskForm.addEventListener('submit', handleEditTask);
    
    // Modal controls
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelEdit');
    const editModal = document.getElementById('editModal');
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (editModal) {
        editModal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) closeModal();
        });
    }
    
    // Filters and search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', debounce(loadTasks, 300));
    
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) statusFilter.addEventListener('change', loadTasks);
    
    const priorityFilter = document.getElementById('priorityFilter');
    if (priorityFilter) priorityFilter.addEventListener('change', loadTasks);
    
    const sortBy = document.getElementById('sortBy');
    if (sortBy) sortBy.addEventListener('change', loadTasks);
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
        
        const response = await fetch(`${API_BASE_URL}/tasks/?${queryParams}`);
        if (!response.ok) throw new Error('Failed to fetch tasks');
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching tasks:', error);
        // Fallback to cache if network fails
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) return JSON.parse(cached);
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
        const response = await fetch(`${API_BASE_URL}/tasks/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
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
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    const sortBy = document.getElementById('sortBy');
    
    const params = {
        status: statusFilter && statusFilter.value !== 'all' ? statusFilter.value : null,
        priority: priorityFilter && priorityFilter.value ? priorityFilter.value : null,
        search: searchInput ? searchInput.value : null,
        sort_by: sortBy ? sortBy.value : 'created_at',
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
    
    if (!tasksList || !emptyState) return;
    
    if (tasks.length === 0) {
        tasksList.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    tasksList.innerHTML = tasks.map((task, index) => createTaskHTML(task, index)).join('');
    
    // Add staggered fade-in
    const taskCards = tasksList.querySelectorAll('.task-card');
    taskCards.forEach((card, i) => {
        card.style.animationDelay = `${i * 0.05}s`;
    });
    
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

function createTaskHTML(task, index) {
    const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date';
    const completedClass = task.completed ? 'completed' : '';
    
    // Display friendly priority labels
    const priorityDisplay = {
        'LOW': 'Low',
        'MEDIUM': 'Medium',
        'HIGH': 'High'
    }[task.priority] || task.priority;
    
    return `
        <div class="task-card fade-in ${completedClass}" id="task-${task.id}">
            <label class="custom-checkbox">
                <input type="checkbox" id="checkbox-${task.id}" ${task.completed ? 'checked' : ''}>
                <span class="checkmark">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </span>
            </label>
            
            <div class="task-content">
                <div class="task-header">
                    <h3 class="task-title">${escapeHtml(task.title)}</h3>
                    <span class="badge ${task.priority.toLowerCase()}">${priorityDisplay}</span>
                </div>
                ${task.description ? `<p class="task-desc">${escapeHtml(task.description)}</p>` : ''}
                <div class="task-meta">
                    <span class="meta-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        ${dueDate}
                    </span>
                </div>
            </div>
            
            <div class="task-actions">
                <button class="action-btn" id="edit-${task.id}" title="Edit Task">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="action-btn delete" id="delete-${task.id}" title="Delete Task">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
        </div>
    `;
}

async function updateStats() {
    const stats = await fetchStats();
    
    document.getElementById('totalTasks').textContent = stats.total;
    document.getElementById('completedTasks').textContent = stats.completed;
    document.getElementById('pendingTasks').textContent = stats.pending;
    
    const rate = Math.round(stats.completion_rate || 0);
    document.getElementById('completionRate').textContent = `${rate}%`;
    document.getElementById('progressFill').style.width = `${rate}%`;
}

// Task Operations
async function handleAddTask(e) {
    e.preventDefault();
    
    const titleInput = document.getElementById('taskTitle');
    const descriptionInput = document.getElementById('taskDescription');
    const dueDateInput = document.getElementById('taskDueDate');
    
    const title = titleInput.value.trim();
    const description = descriptionInput ? descriptionInput.value.trim() : '';
    const dueDate = dueDateInput ? dueDateInput.value : '';
    
    // Get selected priority
    const priorityElement = document.querySelector('input[name="taskPriority"]:checked');
    const priority = priorityElement ? priorityElement.value : 'MEDIUM';
    
    if (!title) {
        showToast('Please enter a task title', 'error');
        return;
    }
    
    const taskData = {
        title,
        description: description || null,
        priority,
        due_date: dueDate || null,
        completed: false
    };
    
    const newTask = await createTask(taskData);
    
    if (newTask) {
        showToast('Task added successfully! 🎉', 'success');
        e.target.reset();
        
        // Reset priority to Medium visually
        const mediumRadio = document.querySelector('input[name="taskPriority"][value="MEDIUM"]');
        if (mediumRadio) mediumRadio.checked = true;
        
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
    const taskElement = document.getElementById(`task-${taskId}`);
    
    // Ask confirmation only if not completed? Or just animate out. Let's confirm for safety.
    // If the task was recently added, we might just delete. But let's keep confirm or use a soft delete toast.
    // For a premium feel, let's skip alert() and just delete it + toast, since toasts can have undo (not implemented here but common).
    // Actually, I'll keep confirm for simplicity.
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    // Animate out
    if (taskElement) {
        taskElement.classList.add('fade-out');
    }
    
    const success = await deleteTask(taskId);
    
    if (success) {
        showToast('Task deleted successfully', 'success');
        // Wait for animation
        setTimeout(async () => {
            await loadTasks();
        }, 300);
    } else if (taskElement) {
        taskElement.classList.remove('fade-out'); // Restore on fail
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
        due_date: dueDate || null,
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
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Icons based on type
    let icon = '';
    if (type === 'success') {
        icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else if (type === 'error') {
        icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else if (type === 'info') {
        icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }
    
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-message">${message}</div>
    `;
    
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remove after 3s
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 400); // Wait for transition
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return '';
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
