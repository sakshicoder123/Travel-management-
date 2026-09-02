# ✈️ Travel Information Management System

A **simple, clean, and beginner-friendly full-stack web application** where users can register, login, search for travel destinations, view detailed travel information along with **live location coordinates from a geographical API**, save places to their personal favourites list, and manage their saved destinations.

Designed specifically to be **easy to understand and confidently explained in a college viva or technical interview**.

---

## 📌 Project Objective

The goal of this project is to provide a clean and intuitive travel platform that helps users discover destination guides, estimated travel budgets, best times to visit, and real-world geographical coordinates fetched in real time, with the ability to maintain a personalized bucket list of favourite places.

---

## 🚀 Key Features

1. **User Registration**: New users can register with Name, Email, and Password stored securely in MySQL.
2. **User Login & Session Management**: Simple authentication using sessions (`express-session`) to keep users logged in.
3. **Dynamic Navigation**: Header automatically updates to show user profile and logout options when signed in.
4. **Destination Search**: Search destinations by name or location (e.g., *Goa*, *Manali*, *Jaipur*, *Paris*).
5. **Rich Destination Information**:
   - Destination Name & Location
   - Overview & Description
   - Best Time to Visit (Season)
   - Estimated Travel Budget
   - List of Popular Attractions
6. **Live Location API Integration**: Fetches real-world latitude, longitude, official address name, and direct OpenStreetMap link dynamically using the OpenStreetMap Nominatim API.
7. **Save to Favourites**: Authenticated users can save their preferred spots to their personal bucket list with one click (prevents duplicate saves).
8. **My Favourites Management**: Dedicated page where users can view all their saved destinations and remove items at any time.
9. **User Logout**: Securely clears session and returns user to guest state.
10. **Beginner-Friendly Code**: Clean, well-commented code with zero bloated frameworks.

---

## 🛠️ Technologies Used

### Frontend
- **HTML5**: Semantic page layout and structure.
- **CSS3**: Custom travel-themed styling, flexbox/grid layout, responsive design for all screen sizes.
- **JavaScript (Vanilla / ES6)**: DOM manipulation, asynchronous `fetch()` API calls, and event handling.

### Backend
- **Node.js**: JavaScript runtime environment.
- **Express.js**: Lightweight web framework for handling HTTP routing, static file serving, and REST APIs.
- **express-session**: Simple cookie-based session management for user login persistence.

### Database
- **MySQL**: Relational database management system.
- **mysql2/promise**: Node.js driver for performing SQL queries using async/await.

### External Location API
- **OpenStreetMap Nominatim API**: Free, public, no-key-required geocoding API to fetch real latitude, longitude, and map information.

---

## 🔄 Input → Processing → Output (IPO) Model

This simple model makes it very easy to explain the project in an exam or viva:

```text
┌────────────────────────┐       ┌─────────────────────────────────────┐       ┌───────────────────────────────┐
│         INPUT          │       │             PROCESSING              │       │            OUTPUT             │
├────────────────────────┤       ├─────────────────────────────────────┤       ├───────────────────────────────┤
│ 1. User registers/logs │  ───► │ 1. Backend verifies with MySQL      │  ───► │ 1. Session created, navbar    │
│    in (Email, Password)│       │    `users` table                    │       │    shows logged-in state      │
│                        │       │                                     │       │                               │
│ 2. User searches "Goa" │  ───► │ 2. Query MySQL `destinations` table │  ───► │ 2. Destination details card   │
│                        │       │    + Call OpenStreetMap Nominatim   │       │    + Latitude, Longitude, Map │
│                        │       │    API for live coordinates         │       │                               │
│                        │       │                                     │       │                               │
│ 3. User clicks "Save   │  ───► │ 3. Insert record into MySQL         │  ───► │ 3. "Saved to Favourites"      │
│    to Favourites"      │       │    `favourites` table               │       │    confirmation & badge       │
└────────────────────────┘       └─────────────────────────────────────┘       └───────────────────────────────┘
```

### Detailed Flow Example:
- **Input**: User searches for `"Goa"`.
- **Processing**: 
  1. Express server executes `SELECT * FROM destinations WHERE name LIKE '%Goa%'`.
  2. In parallel, the server queries OpenStreetMap API: `https://nominatim.openstreetmap.org/search?q=Goa&format=json&limit=1`.
- **Output**: 
  1. Destination details (Description, Season, Budget, Attractions) are displayed.
  2. Real coordinates (`Latitude: 15.3004545`, `Longitude: 73.9142751`) and an interactive map link are shown.

---

## 🗄️ Database Structure (MySQL)

The database `travel_db` contains **3 simple, normalized relational tables**:

```
 ┌──────────────────────┐         ┌────────────────────────┐
 │        users         │         │      destinations      │
 ├──────────────────────┤         ├────────────────────────┤
 │ PK  id (INT)         │         │ PK  id (INT)           │
 │     name (VARCHAR)   │         │     name (VARCHAR)     │
 │     email (VARCHAR)  │◄──┐ ┌──►│     location (VARCHAR) │
 │     password (VARCHAR)   │ │   │     description (TEXT) │
 │     created_at (TIME)│   │ │   │     best_time (VARCHAR)│
 └──────────────────────┘   │ │   │     budget (VARCHAR)   │
                            │ │   │     attractions (TEXT) │
                            │ │   │     image_url (VARCHAR)│
                            │ │   └────────────────────────┘
                  ┌─────────┴─┴──────────┐
                  │      favourites      │
                  ├──────────────────────┤
                  │ PK  id (INT)         │
                  │ FK  user_id (INT)    │
                  │ FK  destination_id   │
                  │     created_at (TIME)│
                  └──────────────────────┘
```

### 1. `users` Table
Stores registered accounts:
- `id` (INT, Primary Key, Auto Increment)
- `name` (VARCHAR(100), NOT NULL)
- `email` (VARCHAR(100), UNIQUE, NOT NULL)
- `password` (VARCHAR(255), NOT NULL)
- `created_at` (TIMESTAMP)

### 2. `destinations` Table
Stores travel destination guides:
- `id` (INT, Primary Key, Auto Increment)
- `name` (VARCHAR(100), NOT NULL)
- `location` (VARCHAR(150), NOT NULL)
- `description` (TEXT, NOT NULL)
- `best_time` (VARCHAR(100), NOT NULL)
- `budget` (VARCHAR(100), NOT NULL)
- `attractions` (TEXT, NOT NULL)
- `image_url` (VARCHAR(255))
- `created_at` (TIMESTAMP)

### 3. `favourites` Table
Stores user-saved destination relationships:
- `id` (INT, Primary Key, Auto Increment)
- `user_id` (INT, Foreign Key referencing `users(id)`)
- `destination_id` (INT, Foreign Key referencing `destinations(id)`)
- `created_at` (TIMESTAMP)

---

## 🌐 Location & Maps Integration

### Service Used: **Google Maps (Embedded & Direct Navigation)**
- **Interactive Map Embed**: `https://maps.google.com/maps?q={place_name}&output=embed`
- **Direct Navigation URL**: `https://www.google.com/maps/search/?api=1&query={latitude},{longitude}`
- **Why Google Maps is selected**:
  1. Recognized globally with rich satellite, terrain, and road views.
  2. Embeddable directly into the destination page without requiring complicated API credit cards.
  3. Seamless one-click opening for directions and street view on desktop and mobile devices.

---

## 📁 Project Directory Structure

```text
travel-information-management/
│
├── package.json              # Project dependencies and startup script
├── server.js                 # Express server & API routes
├── db.js                     # MySQL connection pool configuration
├── .env.example              # Sample environment configuration
│
├── database/
│   └── database.sql          # SQL schema creation and sample records
│
├── public/                   # Frontend assets served by Express
│   ├── index.html            # Home page with search & featured places
│   ├── login.html            # User login page
│   ├── register.html         # User registration page
│   ├── destination.html      # Destination details & live location API card
│   ├── favourites.html       # User saved favourites list
│   │
│   ├── css/
│   │   └── style.css         # Modern, responsive travel stylesheet
│   │
│   └── js/
│       └── script.js         # Frontend JavaScript with comments
│
└── README.md                 # Complete documentation & viva guide
```

---

## ⚙️ Installation & Setup Guide

Follow these simple step-by-step instructions to run the project on your computer:

### Step 1: Install Node.js
If you haven't installed Node.js yet:
1. Download and install Node.js (LTS version) from [https://nodejs.org/](https://nodejs.org/).
2. Verify installation in your terminal:
   ```bash
   node -v
   npm -v
   ```

---

### Step 2: Start MySQL Database (e.g., Using XAMPP)
1. Open **XAMPP Control Panel** (or your local MySQL server).
2. Click **Start** next to **MySQL** (and Apache if using phpMyAdmin).
3. Open your browser and go to `http://localhost/phpmyadmin/`.

---

### Step 3: Import the Database Schema
#### Option A: Using phpMyAdmin
1. In phpMyAdmin, click on the **SQL** tab at the top.
2. Open the file `database/database.sql` from this project in any text editor (Notepad / VS Code).
3. Copy the entire contents of `database/database.sql`, paste it into the phpMyAdmin SQL text box, and click **Go**.
4. The `travel_db` database with sample destinations (Goa, Manali, Jaipur, Kerala, Paris, Bali, Tokyo, etc.) will be created automatically!

#### Option B: Using MySQL Command Line
```bash
mysql -u root -p < database/database.sql
```

---

### Step 4: Install Dependencies & Configure Environment

1. Open a terminal / command prompt inside the project folder:
   ```bash
   cd "c:\Users\hp\Desktop\travel information management"
   ```

2. Install the required Node packages:
   ```bash
   npm install
   ```

3. Create your `.env` configuration file (copy from `.env.example`):
   ```bash
   copy .env.example .env
   ```
   *(Default `.env` settings connect to `localhost`, user `root`, no password, database `travel_db`)*.

---

### Step 5: Start the Server

Run:
```bash
npm start
```
or
```bash
node server.js
```

You will see:
```text
====================================================
🚀 Travel Information System Server is running!
🌐 Open in your browser: http://localhost:3000
====================================================
✅ Connected to MySQL Database successfully!
📦 Database: travel_db on localhost:3306
```

Open your browser and navigate to:
👉 **`http://localhost:3000`**

---

## 🎓 College Viva / Technical Interview Questions & Answers

Here are common questions asked by examiners during project evaluations:

### Q1: What is the architecture of this project?
**Answer**: It follows a **3-Tier Client-Server Architecture**:
1. **Presentation Layer (Frontend)**: HTML5, CSS3, and Vanilla JavaScript.
2. **Application Layer (Backend)**: Node.js with Express.js managing RESTful API endpoints and business logic.
3. **Data Layer (Database)**: MySQL storing users, destinations, and user favourites.

### Q2: Why did you choose MySQL over MongoDB for this project?
**Answer**: Our data is structured and relational. The `favourites` table references `users` via `user_id` and `destinations` via `destination_id`. MySQL enforces referential integrity through **Foreign Keys** and **CASCADE deletes**, ensuring that if a user or destination is deleted, related favourite records are cleanly removed.

### Q3: How does user authentication work without complex JWT libraries?
**Answer**: We use **session-based authentication** (`express-session`). When a user logs in with valid credentials, the server creates a session containing the user ID and name in memory, and sends a secure session cookie (`connect.sid`) to the client browser. Subsequent requests automatically include this cookie to verify authentication.

### Q4: How is the external API integrated?
**Answer**: When a user views or searches a destination, the backend / client calls the **OpenStreetMap Nominatim Geocoding API**. The API receives the place name and returns geographical metadata (latitude, longitude, formatted address). This prevents hardcoding static coordinates in the database.

### Q5: How do you prevent duplicate favorite entries for a user?
**Answer**: 
1. In MySQL, we added a unique compound key constraint: `UNIQUE KEY unique_user_destination (user_id, destination_id)`.
2. In the Express route `POST /api/favourites`, we perform a verification query first to check if the record already exists before attempting an insert.

---

## 🔮 Future Improvements

- Add user reviews and destination ratings (1-5 stars).
- Add travel photo upload functionality for community travelers.
- Add password encryption using `bcryptjs` for production security.

---

### 👩‍💻 Author & Credits
**Developed and Designed by Sakshi Thorat**  
*Travel Information Management System (College Project)*
