# ElaSegura — Women's Safety App

ElaSegura is a mobile application built to help protect women. It allows users to send emergency SOS alerts to trusted contacts, report safety incidents, and view a collaborative real-time map of risk areas in their community. The project is a university extension initiative developed to promote personal safety through technology.

---

## Features

- **User Authentication** — Register, log in, and reset your password securely. Passwords are encrypted and sessions are managed with JWT tokens.
- **SOS Panic Button** — Send an instant emergency alert that shares your real-time GPS location with your trusted contacts.
- **Emergency Contacts** — Add, edit, and manage a personal list of trusted contacts who will be notified in case of an emergency.
- **Interactive Safety Map** — View a real-time map powered by Leaflet. Report incidents and visualize risk zones marked by the community.
- **Incident Reports (Ocorrências)** — Log safety incidents with a title, description, type (error or warning), and geolocation coordinates.
- **Alerts Feed** — View a timeline of recent alerts and incidents reported by you or nearby users.
- **Incident Notebook** — Write and save personal safety notes or evidence inside the app.
- **User Profile** — Update your name, email, and profile picture.
- **Settings** — Toggle location sharing and notification preferences. The app dynamically reads your backend server IP, so no manual configuration is needed.
- **Light and Dark Mode** — Full theme support across all screens.

---

## Technologies

### Frontend (Mobile App)
| Technology | Purpose |
|---|---|
| React Native | Cross-platform mobile framework |
| Expo (SDK 54) | Development toolchain and native modules |
| Expo Router | File-based navigation |
| TypeScript | Static typing |
| Leaflet (via WebView) | Interactive map rendering |
| TanStack React Query | Server state management |
| Expo Location | GPS and geolocation access |
| Expo Notifications | Local push notifications |
| AsyncStorage | Persistent local storage |
| Expo Blur | Blur effects for UI popups |

### Backend (REST API)
| Technology | Purpose |
|---|---|
| Node.js | Runtime environment |
| Express.js | HTTP server and routing |
| TypeScript | Static typing |
| PostgreSQL | Relational database |
| node-postgres (`pg`) | Database client |
| bcryptjs | Password hashing |
| JSON Web Token (JWT) | Stateless authentication |
| dotenv | Environment variable management |
| nodemon | Auto-restart during development |

---

## How to Run

### Requirements
- **Node.js** v18 or higher
- **PostgreSQL** installed and running locally
- **Expo Go** app installed on your mobile device (Android or iOS)
- Both your computer and phone must be on the **same Wi-Fi network**

---

### Step 1 — Set up the Backend

Open a terminal inside the `server` folder:

```bash
cd server
npm install
```

Rename the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Open `.env` and set your PostgreSQL connection string:

```env
DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/elasegura
JWT_SECRET=your_secret_key
PORT=3000
```

> **Note:** You must create a PostgreSQL database named `elasegura` before starting. The tables will be created automatically on the first run.

Start the backend server:

```bash
npm run dev
```

The API will be available at `http://localhost:3000`.

---

### Step 2 — Set up the Frontend

Open another terminal inside the `ElaSegura` folder:

```bash
cd ElaSegura
npm install
```

Start the app:

```bash
npm start
```

This will open the Expo Metro Bundler. Scan the QR code with the **Expo Go** app on your phone, or press `a` for Android / `i` for iOS emulator.

> **Note:** The app automatically detects your computer's local IP address. You do not need to create or edit any `.env` file in the frontend folder.

---

### Firewall Notice

If the app cannot connect to the backend, make sure your operating system's firewall allows incoming connections on **port 3000**. This is required for your phone to communicate with the server on your local network.
