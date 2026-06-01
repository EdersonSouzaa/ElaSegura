# ElaSegura - Execution Guide

ElaSegura is a collaborative safety mobile application designed to protect women by offering a real-time SOS alert system for trusted contacts and a crowd-sourced mapping tool to flag high-risk areas in the community. It consists of a React Native mobile application (Frontend) and an Express API server (Backend) powered by a local PostgreSQL database.

## 🚀 How to Run the Project

### 1. Prerequisites
- **Node.js** installed (version 18 or higher).
- **PostgreSQL** installed and running on your computer.
- **Database:** You must manually create a database named `elasegura` (via pgAdmin or psql).

---

### 2. Backend Configuration (API)
Open a terminal in the `server` folder:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   - Rename the `.env.example` file to `.env`.
   - Open `.env` and replace the credentials with your PostgreSQL username and password.
   - Make sure the database name is `elasegura`.

3. **Start the server:**
   ```bash
   npm run dev
   ```
   *The server will run on http://localhost:3000. Database tables will be automatically created on first access.*

---

### 3. Frontend Configuration (App)
Open another terminal in the `ElaSegura` folder:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **IP and Port Configuration (Automatic):**
   - The application has been updated to dynamically detect your computer's IP (via Metro Bundler) and the port configured in the backend (`server/.env`). It is not necessary to edit any files or create a `.env` file in the app folder.

3. **Start the App:**
   ```bash
   npm start
   ```
   *or `npx expo start`*
   *Scan the QR Code with the Expo Go app on your Android device or the native Camera app on iOS.*

---

## 🛠️ Implemented Features
- ✅ User registration with validation.
- ✅ Login with JWT authentication.
- ✅ Password recovery (Reset Password).
- ✅ Visual error feedback (red error messages).
- ✅ Premium success popup with blur effect (BlurView).
- ✅ Database structure for Occurrences, Contacts, and SOS.

## 📌 Golden Rule
For the mobile app to connect to the backend running on your computer:
1. Both devices **MUST** be connected to the **same Wi-Fi network**.
2. **Windows Firewall** (or equivalent) must allow incoming connections on port `3000`.
