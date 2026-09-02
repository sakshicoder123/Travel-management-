// ====================================================================
// server.js - Main Express Server for Travel Information Management System
// ====================================================================

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const https = require('https');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// --------------------------------------------------------------------
// 1. Middlewares
// --------------------------------------------------------------------

// Allow cross-origin requests (helpful during development)
app.use(cors());

// Parse incoming JSON and URL-encoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration (for simple beginner-friendly user authentication)
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'travel_management_secret_key_123',
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 // Session valid for 24 hours
        }
    })
);

// Explicit Root Route: Always serve index.html (Home Page) first
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve static frontend files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// --------------------------------------------------------------------
// 2. Helper: Authentication Middleware
// --------------------------------------------------------------------
// Checks if the user is currently logged in before accessing private features
function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).json({
            success: false,
            message: 'Please login to perform this action.'
        });
    }
}

// --------------------------------------------------------------------
// 3. Helper: Fetch Location Details from OpenStreetMap Nominatim API
// --------------------------------------------------------------------
// OpenStreetMap Nominatim is a free, public geocoding API.
// Given a place name (e.g., "Goa"), it returns latitude, longitude, and full address.
function fetchLocationApi(query) {
    return new Promise((resolve) => {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1`;

        const options = {
            headers: {
                // Nominatim API requires a custom User-Agent identifier
                'User-Agent': 'TravelInfoManagementSystem/1.0 (CollegeProject)'
            }
        };

        https.get(url, options, (response) => {
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });
            response.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const item = parsed[0];
                        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.lat + ',' + item.lon)}`;
                        const embedMapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=12&ie=UTF8&iwloc=&output=embed`;
                        resolve({
                            found: true,
                            latitude: item.lat,
                            longitude: item.lon,
                            displayName: item.display_name,
                            type: item.type || 'geographical location',
                            googleMapsUrl: googleMapsUrl,
                            embedMapUrl: embedMapUrl
                        });
                    } else {
                        resolve({
                            found: false,
                            message: 'Location coordinates not found from OpenStreetMap.'
                        });
                    }
                } catch (e) {
                    resolve({
                        found: false,
                        message: 'Error reading location API response.'
                    });
                }
            });
        }).on('error', (err) => {
            console.error('Location API request error:', err.message);
            resolve({
                found: false,
                message: 'Location API is currently unavailable.'
            });
        });
    });
}

// ====================================================================
// 4. Authentication Routes
// ====================================================================

// [POST] /api/register - Register a new user
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // 1. Validation: check if required fields are provided
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields (name, email, password) are required.'
            });
        }

        const trimmedEmail = email.trim().toLowerCase();

        // 2. Check if the email is already registered in MySQL
        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE email = ?',
            [trimmedEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'This email is already registered. Please login.'
            });
        }

        // 3. Insert the new user into the database
        const [result] = await db.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name.trim(), trimmedEmail, password]
        );

        // 4. Respond with success
        res.status(201).json({
            success: true,
            message: 'Registration successful! You can now login.',
            userId: result.insertId
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Database error during registration. Please make sure MySQL is running.'
        });
    }
});

// [POST] /api/login - Authenticate an existing user
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both email and password.'
            });
        }

        const trimmedEmail = email.trim().toLowerCase();

        // 2. Check database for matching email and password
        const [rows] = await db.execute(
            'SELECT id, name, email, password FROM users WHERE email = ?',
            [trimmedEmail]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'No account found with this email. Please register first.'
            });
        }

        const user = rows[0];

        // 3. Simple password comparison (beginner-friendly)
        if (user.password !== password) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect password. Please try again.'
            });
        }

        // 4. Save user info in session
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email
        };

        res.json({
            success: true,
            message: 'Login successful!',
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Database error during login. Please make sure MySQL is running.'
        });
    }
});

// [GET] /api/logout - Logout the current user
app.get('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Could not log out. Please try again.'
            });
        }
        res.clearCookie('connect.sid');
        res.json({
            success: true,
            message: 'Logged out successfully.'
        });
    });
});

// [GET] /api/auth-status - Check if user is currently logged in
app.get('/api/auth-status', (req, res) => {
    if (req.session && req.session.user) {
        res.json({
            loggedIn: true,
            user: req.session.user
        });
    } else {
        res.json({
            loggedIn: false,
            user: null
        });
    }
});

// ====================================================================
// 5. Destination Routes
// ====================================================================

// [GET] /api/destinations - Get all available destinations
app.get('/api/destinations', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM destinations ORDER BY id ASC');
        res.json({
            success: true,
            count: rows.length,
            destinations: rows
        });
    } catch (error) {
        console.error('Error fetching destinations:', error);
        res.status(500).json({
            success: false,
            message: 'Could not fetch destinations from database.'
        });
    }
});

// [GET] /api/destinations/search - Search destinations by keyword
app.get('/api/destinations/search', async (req, res) => {
    try {
        const query = req.query.q ? req.query.q.trim() : '';

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a destination name to search.'
            });
        }

        // Search MySQL destinations by name or location
        const searchQuery = `%${query}%`;
        const [rows] = await db.execute(
            'SELECT * FROM destinations WHERE name LIKE ? OR location LIKE ?',
            [searchQuery, searchQuery]
        );

        // Fetch location data from OpenStreetMap API in parallel
        const locationApiData = await fetchLocationApi(query);

        res.json({
            success: true,
            query: query,
            count: rows.length,
            destinations: rows,
            locationApi: locationApiData
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while searching destinations.'
        });
    }
});

// [GET] /api/destinations/:id - Get full details for a single destination
app.get('/api/destinations/:id', async (req, res) => {
    try {
        const destinationId = parseInt(req.params.id);

        if (isNaN(destinationId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid destination ID.'
            });
        }

        const [rows] = await db.execute(
            'SELECT * FROM destinations WHERE id = ?',
            [destinationId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Sorry, we couldn't find that destination."
            });
        }

        const destination = rows[0];

        // Fetch live location API information for this destination
        const locationApiData = await fetchLocationApi(destination.location || destination.name);

        res.json({
            success: true,
            destination: destination,
            locationApi: locationApiData
        });
    } catch (error) {
        console.error('Error fetching destination details:', error);
        res.status(500).json({
            success: false,
            message: 'Could not fetch destination details.'
        });
    }
});

// [GET] /api/location-info - Standalone endpoint to get location coordinates from API
app.get('/api/location-info', async (req, res) => {
    const query = req.query.q ? req.query.q.trim() : '';
    if (!query) {
        return res.status(400).json({ success: false, message: 'Missing location query parameter "q".' });
    }
    const locationData = await fetchLocationApi(query);
    res.json({
        success: true,
        query: query,
        data: locationData
    });
});

// ====================================================================
// 6. Favourite Destinations Routes (Protected with requireAuth)
// ====================================================================

// [GET] /api/favourites - View all saved favourites for the logged-in user
app.get('/api/favourites', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;

        // Join favourites table with destinations table to get full destination info
        const query = `
            SELECT 
                f.id AS favourite_id,
                f.created_at AS saved_at,
                d.id AS destination_id,
                d.name,
                d.location,
                d.description,
                d.best_time,
                d.budget,
                d.attractions,
                d.image_url
            FROM favourites f
            INNER JOIN destinations d ON f.destination_id = d.id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC
        `;

        const [rows] = await db.execute(query, [userId]);

        res.json({
            success: true,
            count: rows.length,
            favourites: rows
        });
    } catch (error) {
        console.error('Error fetching favourites:', error);
        res.status(500).json({
            success: false,
            message: 'Could not retrieve your favourites.'
        });
    }
});

// [POST] /api/favourites - Save a destination to favourites
app.post('/api/favourites', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { destination_id } = req.body;

        if (!destination_id) {
            return res.status(400).json({
                success: false,
                message: 'Destination ID is required.'
            });
        }

        // 1. Verify that destination exists in the database
        const [destRows] = await db.execute(
            'SELECT id, name FROM destinations WHERE id = ?',
            [destination_id]
        );

        if (destRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Destination does not exist.'
            });
        }

        // 2. Check if already added to favourites
        const [existing] = await db.execute(
            'SELECT id FROM favourites WHERE user_id = ? AND destination_id = ?',
            [userId, destination_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: `${destRows[0].name} is already in your favourites!`
            });
        }

        // 3. Insert into favourites table
        await db.execute(
            'INSERT INTO favourites (user_id, destination_id) VALUES (?, ?)',
            [userId, destination_id]
        );

        res.status(201).json({
            success: true,
            message: `"${destRows[0].name}" has been saved to your favourites!`
        });
    } catch (error) {
        console.error('Error saving favourite:', error);
        res.status(500).json({
            success: false,
            message: 'Could not save destination to favourites.'
        });
    }
});

// [DELETE] /api/favourites - Clear ALL favourites for the logged-in user
app.delete('/api/favourites', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        await db.execute('DELETE FROM favourites WHERE user_id = ?', [userId]);

        res.json({
            success: true,
            message: 'All favourites cleared successfully.'
        });
    } catch (error) {
        console.error('Error clearing all favourites:', error);
        res.status(500).json({
            success: false,
            message: 'Could not clear favourites.'
        });
    }
});

// [DELETE] /api/favourites/:destinationId - Remove a single destination from favourites
app.delete('/api/favourites/:destinationId', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const destinationId = parseInt(req.params.destinationId);

        if (isNaN(destinationId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid destination ID.'
            });
        }

        await db.execute(
            'DELETE FROM favourites WHERE user_id = ? AND destination_id = ?',
            [userId, destinationId]
        );

        res.json({
            success: true,
            message: 'Destination removed from your favourites successfully.'
        });
    } catch (error) {
        console.error('Error deleting favourite:', error);
        res.status(500).json({
            success: false,
            message: 'Could not remove favourite.'
        });
    }
});

// [GET] /api/favourites/check/:destinationId - Check if a destination is already favorited by the logged in user
app.get('/api/favourites/check/:destinationId', async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.json({ isFavourite: false, loggedIn: false });
        }

        const userId = req.session.user.id;
        const destinationId = parseInt(req.params.destinationId);

        const [rows] = await db.execute(
            'SELECT id FROM favourites WHERE user_id = ? AND destination_id = ?',
            [userId, destinationId]
        );

        res.json({
            isFavourite: rows.length > 0,
            loggedIn: true
        });
    } catch (error) {
        console.error('Error checking favourite status:', error);
        res.status(500).json({ isFavourite: false });
    }
});

// --------------------------------------------------------------------
// 7. Fallback Route: Serve index.html for any undefined GET routes
// --------------------------------------------------------------------
app.get('*', (req, res) => {
    // If request has not matched any static file or API, return index.html
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --------------------------------------------------------------------
// 8. Start the Server
// --------------------------------------------------------------------
app.listen(PORT, () => {
    console.log('====================================================');
    console.log(`🚀 Travel Information System Server is running!`);
    console.log(`🌐 Open in your browser: http://localhost:${PORT}`);
    console.log('====================================================');
});
