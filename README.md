# 📝 TODO List - Production-Style Web Application

A modern, feature-rich TODO list application built with FastAPI backend and vanilla JavaScript frontend, using MySQL database.

## ✨ Features

### Core Functionality
- ✅ Create, Read, Update, Delete (CRUD) tasks
- ✅ Mark tasks as completed with toggle
- ✅ Task priorities (Low, Medium, High) with color coding
- ✅ Due date tracking
- ✅ Task descriptions

### Advanced Features
- 🔍 **Search** - Find tasks by title (partial match)
- 🎯 **Filtering** - Filter by status (All/Completed/Pending) and priority
- 📊 **Sorting** - Sort by due date, priority, or created time
- 📈 **Task Insights** - Real-time statistics and progress tracking
- ✏️ **Inline Editing** - Edit tasks via modal dialog
- 🌙 **Dark Mode** - Toggle between light and dark themes
- 🔔 **Toast Notifications** - Visual feedback for all actions
- 💾 **Local Caching** - Cache tasks in localStorage
- ⌨️ **Keyboard Shortcuts** - Ctrl/Cmd+Enter to add tasks, Escape to close modals

### Smart UI Behavior
- Completed tasks automatically move to bottom
- Strikethrough text for completed tasks
- Smooth animations and transitions
- Responsive design for all screen sizes
- Real-time UI updates without page reload

## 🛠️ Tech Stack

**Backend:**
- FastAPI (Python web framework)
- SQLAlchemy ORM
- PyMySQL (MySQL connector)
- Pydantic (data validation)

**Frontend:**
- HTML5
- CSS3 (with CSS variables for theming)
- Vanilla JavaScript (ES6+)
- Fetch API for HTTP requests

**Database:**
- MySQL 8.0+ (local installation)

## 📁 Project Structure

```
.
├── backend/
│   ├── main.py           # FastAPI application entry point
│   ├── database.py       # Database configuration and session
│   ├── models.py         # SQLAlchemy models
│   ├── schemas.py        # Pydantic schemas for validation
│   ├── routers.py        # API route handlers
│   └── requirements.txt  # Python dependencies
├── frontend/
│   ├── index.html        # Main HTML file
│   ├── style.css         # Styles and themes
│   └── script.js         # Frontend logic
├── setup.sql             # Database setup script
└── README.md             # This file
```

## 🚀 Setup Instructions (macOS)

### Prerequisites
- Python 3.8+
- MySQL 8.0+
- pip (Python package manager)

### 1. Start MySQL Server

```bash
# Using Homebrew services
brew services start mysql

# OR using mysql.server
mysql.server start
```

### 2. Create Database

```bash
# Login to MySQL
mysql -u root -p
# Enter password: admin

# Run the setup script
source setup.sql

# OR manually create database
CREATE DATABASE todo_app;
exit;
```

Alternatively, run the SQL script directly:
```bash
mysql -u root -padmin < setup.sql
```

### 3. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4. Run Backend Server

```bash
# From the backend directory
uvicorn main:app --reload

# Server will start at http://127.0.0.1:8000
```

### 5. Open Frontend

```bash
# From the frontend directory
open index.html

# OR simply double-click index.html in Finder
```

### 6. Verify Installation

- Backend API: http://127.0.0.1:8000
- API Documentation: http://127.0.0.1:8000/docs (Swagger UI)
- Frontend: Open `frontend/index.html` in your browser

## 📡 API Endpoints

### Tasks
- `GET /tasks` - Get all tasks (with filtering, sorting, searching)
  - Query params: `status`, `priority`, `search`, `sort_by`, `order`
- `GET /tasks/stats` - Get task statistics
- `GET /tasks/{id}` - Get specific task
- `POST /tasks` - Create new task
- `PUT /tasks/{id}` - Update task
- `DELETE /tasks/{id}` - Delete task

### Example API Calls

```bash
# Get all tasks
curl http://127.0.0.1:8000/tasks

# Get pending tasks
curl http://127.0.0.1:8000/tasks?status=pending

# Search tasks
curl http://127.0.0.1:8000/tasks?search=project

# Get statistics
curl http://127.0.0.1:8000/tasks/stats

# Create task
curl -X POST http://127.0.0.1:8000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"New Task","priority":"High","completed":false}'
```

## 🎨 UI Features

### Priority Color Coding
- 🔴 **High** - Red
- 🟡 **Medium** - Yellow
- 🟢 **Low** - Green

### Keyboard Shortcuts
- `Ctrl/Cmd + Enter` - Submit add task form
- `Escape` - Close modal

### Dark Mode
Click the moon/sun icon in the header to toggle between light and dark themes. Your preference is saved in localStorage.

## 🗄️ Database Schema

```sql
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
    due_date DATETIME,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Configuration

### Database Connection
Edit `backend/database.py` to change database credentials:

```python
DATABASE_URL = "mysql+pymysql://root:admin@localhost:3306/todo_app"
```

### API Base URL
Edit `frontend/script.js` to change API endpoint:

```javascript
const API_BASE_URL = 'http://127.0.0.1:8000';
```

## 🐛 Troubleshooting

### MySQL Connection Error
```
sqlalchemy.exc.OperationalError: (2003, "Can't connect to MySQL server")
```
**Solution:** Ensure MySQL is running:
```bash
brew services start mysql
# OR
mysql.server start
```

### Database Access Denied
```
sqlalchemy.exc.OperationalError: (1045, "Access denied for user 'root'")
```
**Solution:** Verify MySQL credentials and update `backend/database.py`

### CORS Error in Browser
```
Access to fetch at 'http://127.0.0.1:8000/tasks' has been blocked by CORS policy
```
**Solution:** Ensure FastAPI CORS middleware is configured (already included in `main.py`)

### Port Already in Use
```
ERROR: [Errno 48] Address already in use
```
**Solution:** Kill the process using port 8000:
```bash
lsof -ti:8000 | xargs kill -9
```

## 📝 Development Notes

### Code Quality
- Clean, modular architecture
- Type hints throughout Python code
- Pydantic validation for all API inputs
- Proper error handling with HTTP status codes
- SQL injection prevention via ORM
- XSS prevention via HTML escaping

### Performance Optimizations
- Database connection pooling
- Indexed columns for faster queries
- Debounced search input
- Local caching with localStorage
- Efficient DOM updates

### Best Practices
- RESTful API design
- Separation of concerns
- Environment-based configuration
- Responsive design principles
- Accessibility considerations

## 🚀 Future Enhancements

- User authentication and authorization
- Task categories/tags
- Recurring tasks
- Task attachments
- Email notifications
- Export tasks (CSV, JSON)
- Drag-and-drop reordering
- Collaborative features
- Mobile app

## 📄 License

This project is open source and available for educational purposes.

## 👨‍💻 Author

Built with ❤️ using FastAPI and Vanilla JavaScript

---

**Happy Task Managing! 🎉**
