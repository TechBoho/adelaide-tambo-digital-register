# Adelaide Tambo Digital Visitor Register

## Local Development Setup Guide

This guide explains how to set up and run the Adelaide Tambo Digital Visitor Register on a Windows development computer.

### 1. Prerequisites

Install the following software:

- Git
- Node.js and npm
- PostgreSQL
- Flutter SDK (compatible with the frontend project's Dart SDK requirements)
- Visual Studio Code
- A supported web browser

### 2. Clone the Backend Repository

Open PowerShell and run:

```powershell
cd C:\Dev\Projects

git clone https://github.com/TechBoho/adelaide-tambo-digital-register.git

cd adelaide-tambo-digital-register\backend
```

If the repository already exists, switch to `main` and pull the latest changes instead.

### 3. Install Backend Dependencies

```powershell
npm ci
```

### 4. Create the PostgreSQL Database

Start PostgreSQL and connect using `psql` or pgAdmin.

Create a database named:

```sql
CREATE DATABASE adelaide_tambo_register;
```

Connect to the newly created database and execute these scripts in order:

1. `backend/sql/001_initial_schema.sql`
2. `backend/sql/002_seed_activities.sql`

Using `psql` from the repository root:

```powershell
psql -U postgres -d adelaide_tambo_register -f backend/sql/001_initial_schema.sql

psql -U postgres -d adelaide_tambo_register -f backend/sql/002_seed_activities.sql
```

These scripts create the visitor registration, activity, registration activity and administrator tables, then insert the initial library activities.

### 5. Configure Environment Variables

From the `backend` directory:

```powershell
Copy-Item .env.example .env
```

Open `.env` and configure the following:

```dotenv
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/adelaide_tambo_register
DATABASE_SSL=false
JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET
JWT_EXPIRES_IN=8h
CORS_ORIGINS=http://localhost:3000,http://localhost:3002,http://localhost:8080
```

Replace the placeholders with your own values.

Generate a strong JWT secret using Node.js:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Keep `.env` private. Never commit database passwords or JWT secrets to GitHub. If the database password contains URL-special characters, encode them correctly in `DATABASE_URL`.

### 6. Create a Supervisor Account

From the `backend` directory:

```powershell
node scripts/create-admin.cjs
```

Enter a supervisor username and a password of at least 12 characters.

The script creates the account in PostgreSQL using a bcrypt password hash.

Note: Password input is currently visible in the terminal. Use a private terminal and do not record or share the credentials.

### 7. Start the Backend

```powershell
npm run dev
```

The backend should start on:

`http://localhost:5000`

Check the health endpoint:

`http://localhost:5000/api/health`

A successful response indicates that the API server is running. It does not independently verify database connectivity.

### 8. Clone and Configure the Flutter Frontend

Open another PowerShell window:

```powershell
cd C:\Dev\Projects

git clone https://github.com/AvelaSelomane/adelaide-register.git

cd adelaide-register

flutter pub get
```

Verify the API base URL in:

`lib/services/api_service.dart`

For local development, the frontend should connect to:

`http://localhost:5000/api`

If the frontend runs on a different computer from the backend, `localhost` will refer to that other computer. Configure an accessible backend address instead.

### 9. Run the Flutter Web Application

To launch Flutter Web using Chrome:

```powershell
flutter run -d chrome --web-port 3002
```

Alternatively, create a release build:

```powershell
flutter build web --release
```

A release build generates the web files in `build/web`. These files must be served using a web server rather than opened directly from the filesystem.

Ensure the frontend's actual origin is included in the backend's `CORS_ORIGINS` setting. Restart the backend after changing environment variables.

### 10. Test the Application

Verify the following:

- Visitor registration works.
- Registration data is saved to PostgreSQL.
- Supervisor authentication works.
- The daily visitor register displays records.
- Visitor totals match the submitted registrations.
- Monthly and yearly statistics load.
- PDF reports download successfully.
- Protected administrator endpoints reject unauthenticated requests.

Use test registrations during development.

### 11. Troubleshooting

**Backend cannot connect to PostgreSQL:** Confirm PostgreSQL is running, the database exists, and `DATABASE_URL` is correct.

**CORS error:** Check that the frontend's browser origin is included in `CORS_ORIGINS`.

**HTTP 401:** Confirm the supervisor has logged in successfully and the request includes a valid JWT.

**Flutter build or dependency error:** Confirm the installed Flutter and Dart SDK versions satisfy the project's requirements.

**Port already in use:** Stop the existing process or select an available port and update the corresponding configuration.

### 12. Production Deployment

The current setup is intended for local development.

Before municipal deployment, the project requires approved hosting, HTTPS, production environment configuration, database backups, security and privacy review, and testing on the library's actual devices and network.

Do not use local development credentials or test data in production.