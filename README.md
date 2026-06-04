# ElaSegura

ElaSegura is a university extension project developed to protect women through a collaborative safety mobile application, offering a real-time SOS alert system for trusted contacts and a crowd-sourced mapping tool to flag high-risk areas. The project consists of a React Native mobile application (Frontend) and an Express API server (Backend) powered by a local PostgreSQL database.

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
- ✅ **Secure Authentication:** User registration with input validation, JWT-based login, and password recovery.
- ✅ **Panic Button (SOS):** Instant geolocated alert dispatch to trusted contacts in emergency situations.
- ✅ **Emergency Contacts:** Dedicated manager to add and edit trusted contacts.
- ✅ **Interactive Safety Map:** Real-time collaborative mapping of occurrences and hazard zones.
- ✅ **Incident Notebook:** Built-in notepad to record and manage safety-related notes or evidence.
- ✅ **Customization:** Light and dark theme modes supported through a dedicated Theme Context.
- ✅ **Premium UI/UX:** Blur success popups (`BlurView`), dynamic form validation feedback, and clean layouts optimized for high stress.

## 📌 Golden Rule
For the mobile app to connect to the backend running on your computer:
1. Both devices **MUST** be connected to the **same Wi-Fi network**.
2. **Windows Firewall** (or equivalent) must allow incoming connections on port `3000`.
