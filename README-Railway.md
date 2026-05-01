# Deploying TODO Application on Railway

Follow these steps to seamlessly deploy your FastAPI + MySQL application to Railway.

## 1. Create a Railway Project & Database

1. Log in to [Railway](https://railway.app/).
2. Click **New Project** -> **Provision PostgreSQL / MySQL / Redis** -> Select **MySQL**.
3. Wait for the database to provision.

## 2. Deploy the Application Code

1. In your new Railway Project, click **New** -> **GitHub Repo**.
2. Select your `TODO_List` repository.
3. Railway will begin building your project.

## 3. Link the Database (Crucial Step)

1. Click on your **web service** (the one built from your GitHub repo) in the Railway dashboard.
2. Go to the **Variables** tab.
3. Click **Add Variable** or **Reference Variable**.
4. Railway automatically injects variables into services in the same environment. You can click **"Link a database"** or add references to the MySQL variables. 
5. Railway provides `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, and `MYSQLDATABASE` automatically. Our backend code is pre-configured to detect these!

## 4. Verify Configuration

1. The `Procfile` is in the root directory and contains: `web: uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
2. Railway will automatically detect the Procfile and use it to start the Uvicorn server on the correct port.

## 5. Expose the Service to the Public

1. Go to your **web service** -> **Settings**.
2. Under **Networking**, click **Generate Domain**.
3. Railway will give you a public URL (e.g., `todo-list-production.up.railway.app`).

## 6. Access your Application

- **Frontend:** Visit `https://your-railway-url.up.railway.app/` (The FastAPI server will serve the frontend UI statically from the `/frontend` directory!)
- **API Docs:** Visit `https://your-railway-url.up.railway.app/docs`
- **Health Check:** Visit `https://your-railway-url.up.railway.app/health`

## Environment Setup
- **Port Handling:** Railway passes a dynamic `$PORT` variable which the `Procfile` listens to.
- **Database Connection:** `database.py` seamlessly falls back from Railway's native `MYSQL*` variables to your local `.env` variables when running locally.
- **CORS:** Allowed for `*` by default to support any potential separated frontend deployment.
