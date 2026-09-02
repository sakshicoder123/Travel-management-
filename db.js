// ====================================================================
// db.js - MySQL Database Connection with Seamless Fallback
// ====================================================================
// Primary: Connects to your local MySQL database (e.g. XAMPP, Workbench).
// Fallback: If MySQL is not currently running, it automatically uses an
//           in-memory mock store with all Indian destinations!

require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'travel_db',
    port: parseInt(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool = null;
let isMysqlConnected = false;

// In-Memory Seed Destinations (Exclusively Indian Tourist Destinations)
let mockUsers = [];
let mockFavourites = [];
let mockDestinations = [
    {
        id: 1,
        name: 'Goa',
        location: 'Goa, India',
        description: 'A world-famous coastal paradise renowned for its pristine sun-kissed beaches, vibrant nightlife, Portuguese colonial architecture, and delicious seafood.',
        best_time: 'November - February',
        budget: '₹10,000 - ₹20,000',
        attractions: 'Baga Beach, Fort Aguada, Calangute Beach, Dudhsagar Falls, Basilica of Bom Jesus',
        image_url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop&q=80'
    },
    {
        id: 2,
        name: 'Manali',
        location: 'Himachal Pradesh, India',
        description: 'A high-altitude Himalayan resort town famous for snow-capped mountain peaks, pine forests, adventure sports, and scenic hill valleys.',
        best_time: 'October - June',
        budget: '₹12,000 - ₹22,000',
        attractions: 'Solang Valley, Rohtang Pass, Hadimba Temple, Old Manali, Jogini Waterfall',
        image_url: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&auto=format&fit=crop&q=80'
    },
    {
        id: 3,
        name: 'Jaipur',
        location: 'Rajasthan, India',
        description: 'The historic Pink City of India, celebrated for royal palaces, magnificent hilltop forts, heritage culture, and vibrant traditional bazaars.',
        best_time: 'October - March',
        budget: '₹8,000 - ₹18,000',
        attractions: 'Hawa Mahal, Amber Fort, City Palace, Jantar Mantar, Nahargarh Fort',
        image_url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80'
    },
    {
        id: 4,
        name: 'Kerala Backwaters',
        location: 'Kerala, India',
        description: 'Known as "Gods Own Country", featuring serene palm-fringed backwaters, tranquil houseboat cruises, lush tea gardens, and rich Ayurvedic traditions.',
        best_time: 'September - March',
        budget: '₹15,000 - ₹25,000',
        attractions: 'Alleppey Backwaters, Kumarakom Bird Sanctuary, Marari Beach, Vembanad Lake, Pathiramanal Island',
        image_url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop&q=80'
    },
    {
        id: 5,
        name: 'Agra',
        location: 'Uttar Pradesh, India',
        description: 'Home to the iconic Taj Mahal, one of the Seven Wonders of the World, along with spectacular Mughal era architecture and heritage.',
        best_time: 'October - March',
        budget: '₹6,000 - ₹14,000',
        attractions: 'Taj Mahal, Agra Fort, Fatehpur Sikri, Mehtab Bagh, Itmad-ud-Daulah',
        image_url: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&auto=format&fit=crop&q=80'
    },
    {
        id: 6,
        name: 'Ladakh',
        location: 'Ladakh, India',
        description: 'A breathtaking high-desert plateau famous for dramatic mountain landscapes, crystal-blue lakes, Tibetan monasteries, and scenic mountain passes.',
        best_time: 'May - September',
        budget: '₹20,000 - ₹35,000',
        attractions: 'Pangong Lake, Nubra Valley, Khardung La Pass, Magnetic Hill, Thiksey Monastery',
        image_url: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800&auto=format&fit=crop&q=80'
    },
    {
        id: 7,
        name: 'Varanasi',
        location: 'Uttar Pradesh, India',
        description: 'One of the oldest continuously inhabited cities in the world, famed for spiritual Ganga Ghats, sacred evening Ganga Aarti, and ancient temples.',
        best_time: 'October - March',
        budget: '₹6,000 - ₹12,000',
        attractions: 'Dashashwamedh Ghat, Kashi Vishwanath Temple, Assi Ghat, Manikarnika Ghat, Sarnath',
        image_url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&auto=format&fit=crop&q=80'
    },
    {
        id: 8,
        name: 'Rishikesh',
        location: 'Uttarakhand, India',
        description: 'The Yoga Capital of the World, situated in the Himalayan foothills along the sacred Ganges, famous for white-water rafting, yoga, and meditation.',
        best_time: 'September - November & March - May',
        budget: '₹7,000 - ₹15,000',
        attractions: 'Laxman Jhula, Ram Jhula, Triveni Ghat, Beatles Ashram, Shivpuri Rafting Point',
        image_url: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&auto=format&fit=crop&q=80'
    },
    {
        id: 9,
        name: 'Shimla',
        location: 'Himachal Pradesh, India',
        description: 'The scenic Queen of Hills, featuring colonial British heritage architecture, lush oak forests, snow-laden slopes, and the historic Kalka-Shimla Toy Train.',
        best_time: 'March - June & December - February',
        budget: '₹10,000 - ₹20,000',
        attractions: 'The Ridge, Mall Road, Jakhoo Temple, Kufri, Christ Church',
        image_url: 'https://images.unsplash.com/photo-1597074866923-dc0589150358?w=800&auto=format&fit=crop&q=80'
    },
    {
        id: 10,
        name: 'Udaipur',
        location: 'Rajasthan, India',
        description: 'The romantic City of Lakes, known for majestic marble palaces shimmering over Lake Pichola, royal courtyards, and grand havelis.',
        best_time: 'September - March',
        budget: '₹12,000 - ₹24,000',
        attractions: 'City Palace, Lake Pichola, Jag Mandir, Saheliyon-ki-Bari, Fateh Sagar Lake',
        image_url: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?w=800&auto=format&fit=crop&q=80'
    },
    {
        id: 11,
        name: 'Ooty',
        location: 'Tamil Nadu, India',
        description: 'Queen of the Nilgiris, a serene hill station surrounded by emerald tea plantations, eucalyptus groves, botanical gardens, and misty lakes.',
        best_time: 'October - June',
        budget: '₹9,000 - ₹18,000',
        attractions: 'Ooty Lake, Botanical Gardens, Doddabetta Peak, Pykara Falls, Nilgiri Mountain Railway',
        image_url: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800&auto=format&fit=crop&q=80'
    },
    {
        id: 12,
        name: 'Darjeeling',
        location: 'West Bengal, India',
        description: 'Famous worldwide for aromatic orthodox black tea, panoramic views of Mt. Kanchenjunga, and the UNESCO World Heritage Himalayan Toy Train.',
        best_time: 'April - June & October - December',
        budget: '₹10,000 - ₹20,000',
        attractions: 'Tiger Hill Sunrise, Batasia Loop, Happy Valley Tea Estate, Peace Pagoda, Rock Garden',
        image_url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80'
    },
    {
        id: 13,
        name: 'Andaman Islands',
        location: 'Andaman and Nicobar Islands, India',
        description: 'A tropical archipelago boasting turquoise waters, pristine coral reefs, exotic marine life, mangrove creeks, and historic cellular jail.',
        best_time: 'October - May',
        budget: '₹25,000 - ₹45,000',
        attractions: 'Radhanagar Beach, Cellular Jail, Havelock Island, Elephant Beach, Neil Island',
        image_url: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800&auto=format&fit=crop&q=80'
    },
    {
        id: 14,
        name: 'Amritsar',
        location: 'Punjab, India',
        description: 'The spiritual and cultural center of the Sikh religion, home to the resplendent Golden Temple and deeply moving historical memorials.',
        best_time: 'October - March',
        budget: '₹6,000 - ₹13,000',
        attractions: 'Golden Temple (Harmandir Sahib), Wagah Border Ceremony, Jallianwala Bagh, Gobindgarh Fort',
        image_url: 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=800&auto=format&fit=crop&q=80'
    },
    {
        id: 15,
        name: 'Munnar',
        location: 'Kerala, India',
        description: 'A charming hill station nestled at 1,600m altitude in the Western Ghats, famous for sprawling tea estates, mist-covered valleys, and waterfalls.',
        best_time: 'September - May',
        budget: '₹9,000 - ₹18,000',
        attractions: 'Eravikulam National Park, Mattupetty Dam, Anamudi Peak, Tea Museum, Attukad Waterfalls',
        image_url: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=800&auto=format&fit=crop&q=80'
    },
    {
        id: 16,
        name: 'Hampi',
        location: 'Karnataka, India',
        description: 'A UNESCO World Heritage Site featuring captivating ruins of the magnificent 14th-century Vijayanagara Empire amidst giant boulder landscapes.',
        best_time: 'October - February',
        budget: '₹7,000 - ₹14,000',
        attractions: 'Virupaksha Temple, Stone Chariot, Vijaya Vittala Temple, Matanga Hill, Lotus Mahal',
        image_url: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&auto=format&fit=crop&q=80'
    },
    {
        id: 17,
        name: 'Shillong',
        location: 'Meghalaya, India',
        description: 'Known as the "Scotland of the East", celebrated for cascading waterfalls, living root bridges, pine hills, and vibrant indie music culture.',
        best_time: 'September - May',
        budget: '₹10,000 - ₹20,000',
        attractions: 'Elephant Falls, Umiam Lake, Shillong Peak, Don Bosco Museum, Laitlum Canyons',
        image_url: 'https://images.unsplash.com/photo-1571536802807-30451e3955d8?w=800&auto=format&fit=crop&q=80'
    },
    {
        id: 18,
        name: 'Srinagar',
        location: 'Jammu and Kashmir, India',
        description: 'Paradise on Earth, famous for dreamy Shikara boat rides on Dal Lake, floating flower markets, traditional wooden houseboats, and Mughal gardens.',
        best_time: 'April - October (Spring/Summer) & Dec - Feb (Snow)',
        budget: '₹15,000 - ₹28,000',
        attractions: 'Dal Lake Shikara Ride, Shalimar Bagh, Nishat Bagh, Shankaracharya Temple, Tulip Garden',
        image_url: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=800&auto=format&fit=crop&q=80'
    },
    {
        id: 19,
        name: 'Mysore',
        location: 'Karnataka, India',
        description: 'The City of Palaces, renowned for the opulent illuminated Mysore Palace, aromatic sandalwood, Mysore Pak sweet, and rich silk handlooms.',
        best_time: 'October - March',
        budget: '₹7,000 - ₹15,000',
        attractions: 'Mysore Palace, Chamundi Hills, Brindavan Gardens, St. Philomena’s Church, Mysore Zoo',
        image_url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop&q=80'
    },
    {
        id: 20,
        name: 'Coorg',
        location: 'Karnataka, India',
        description: 'Known as the Scotland of India, an enchanting hill haven renowned for lush coffee plantations, spice estates, misty peaks, and Kodava hospitality.',
        best_time: 'October - April',
        budget: '₹9,000 - ₹18,000',
        attractions: 'Abbey Falls, Raja’s Seat, Dubare Elephant Camp, Talakaveri, Namdroling Monastery (Golden Temple)',
        image_url: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=800&auto=format&fit=crop&q=80'
    },
    {
        id: 21,
        name: 'Jaisalmer',
        location: 'Rajasthan, India',
        description: 'The Golden City of Thar Desert, famous for its living yellow sandstone fort, camel desert safaris on Sam sand dunes, and ornate havelis.',
        best_time: 'October - March',
        budget: '₹10,000 - ₹20,000',
        attractions: 'Jaisalmer Fort (Sonar Qila), Sam Sand Dunes Desert Safari, Patwon Ki Haveli, Gadisar Lake, Kuldhara Abandoned Village',
        image_url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80'
    },
    {
        id: 22,
        name: 'Gangtok',
        location: 'Sikkim, India',
        description: 'The charming capital of Sikkim overlooking Mt. Kanchenjunga, known for Buddhist monasteries, cable car rides, high mountain lakes, and organic culture.',
        best_time: 'March - June & September - December',
        budget: '₹12,000 - ₹24,000',
        attractions: 'Tsomgo Lake, Nathula Pass, Rumtek Monastery, MG Marg, Ban Jhakri Falls',
        image_url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80'
    },
    {
        id: 23,
        name: 'Pondicherry',
        location: 'Puducherry, India',
        description: 'A French colonial seaside town featuring colorful yellow villas, cobblestone streets, beach promenades, serene cafes, and spiritual Auroville.',
        best_time: 'October - March',
        budget: '₹8,000 - ₹16,000',
        attractions: 'Promenade Beach, French Quarter (White Town), Auroville Matrimandir, Paradise Beach, Sri Aurobindo Ashram',
        image_url: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800&auto=format&fit=crop&q=80'
    },
    {
        id: 24,
        name: 'Kanyakumari',
        location: 'Tamil Nadu, India',
        description: 'The southernmost tip of the Indian subcontinent, where the Arabian Sea, the Bay of Bengal, and the Indian Ocean unite with spectacular sunrises.',
        best_time: 'October - March',
        budget: '₹6,000 - ₹13,000',
        attractions: 'Vivekananda Rock Memorial, Thiruvalluvar Statue, Sunset View Point, Kanyakumari Beach, Padmanabhapuram Palace',
        image_url: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800&auto=format&fit=crop&q=80'
    },
    {
        id: 25,
        name: 'Nainital',
        location: 'Uttarakhand, India',
        description: 'The Lake District of India, set around the shimmering eye-shaped Naini Lake surrounded by forested pine hills and scenic viewpoints.',
        best_time: 'March - June & September - November',
        budget: '₹8,000 - ₹16,000',
        attractions: 'Naini Lake Boating, Naina Devi Temple, Snow View Point, Mall Road, Tiffin Top',
        image_url: 'https://images.unsplash.com/photo-1597074866923-dc0589150358?w=800&auto=format&fit=crop&q=80'
    }
];

// Initialize MySQL connection attempt
try {
    pool = mysql.createPool(dbConfig);
} catch (err) {
    console.warn('MySQL pool initialization skipped:', err.message);
}

// Test MySQL connectivity on startup
async function testConnection() {
    if (!pool) return;
    try {
        const connection = await pool.getConnection();
        isMysqlConnected = true;
        console.log('----------------------------------------------------');
        console.log('✅ Connected to MySQL Database successfully!');
        console.log(`📦 Database: ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`);
        console.log('----------------------------------------------------');
        connection.release();
    } catch (error) {
        isMysqlConnected = false;
        console.log('----------------------------------------------------');
        console.log('ℹ️  MySQL server not active on localhost:3306.');
        console.log('💡 Running with In-Memory Demo Storage enabled (25 Indian Destinations loaded!).');
        console.log('👉 Start XAMPP/MySQL anytime to switch to persistent MySQL storage.');
        console.log('----------------------------------------------------');
    }
}

testConnection();

// Safe wrapper for executing SQL queries
async function execute(sql, params = []) {
    if (isMysqlConnected && pool) {
        try {
            return await pool.execute(sql, params);
        } catch (err) {
            console.error('MySQL Query Error:', err.message);
            // If MySQL table doesn't exist yet, fallback gracefully
            return executeMock(sql, params);
        }
    } else {
        return executeMock(sql, params);
    }
}

// In-Memory mock query executor
function executeMock(sql, params = []) {
    const cleanSql = sql.trim().toUpperCase();

    // 1. SELECT * FROM destinations WHERE ...
    if (cleanSql.includes('FROM DESTINATIONS WHERE NAME LIKE') || cleanSql.includes('FROM DESTINATIONS WHERE LOCATION LIKE')) {
        const queryTerm = (params[0] || '').replace(/%/g, '').toLowerCase();
        const results = mockDestinations.filter(d => 
            d.name.toLowerCase().includes(queryTerm) || 
            d.location.toLowerCase().includes(queryTerm)
        );
        return [results, []];
    }

    if (cleanSql.includes('FROM DESTINATIONS WHERE ID =')) {
        const id = parseInt(params[0]);
        const dest = mockDestinations.filter(d => d.id === id);
        return [dest, []];
    }

    if (cleanSql.includes('FROM DESTINATIONS')) {
        return [mockDestinations, []];
    }

    // 2. USERS: SELECT / INSERT
    if (cleanSql.includes('FROM USERS WHERE EMAIL =')) {
        const email = (params[0] || '').toLowerCase();
        const users = mockUsers.filter(u => u.email.toLowerCase() === email);
        return [users, []];
    }

    if (cleanSql.startsWith('INSERT INTO USERS')) {
        const newUser = {
            id: mockUsers.length + 1,
            name: params[0],
            email: params[1],
            password: params[2],
            created_at: new Date()
        };
        mockUsers.push(newUser);
        return [{ insertId: newUser.id, affectedRows: 1 }, []];
    }

    // 3. FAVOURITES — DELETE must come BEFORE SELECT to avoid wrong handler catching it
    if (cleanSql.startsWith('DELETE FROM FAVOURITES')) {
        const userId = parseInt(params[0]);
        const initialLen = mockFavourites.length;
        if (params.length > 1) {
            const destId = parseInt(params[1]);
            mockFavourites = mockFavourites.filter(f => !(Number(f.user_id) === userId && Number(f.destination_id) === destId));
        } else {
            mockFavourites = mockFavourites.filter(f => Number(f.user_id) !== userId);
        }
        const affectedRows = initialLen - mockFavourites.length;
        return [{ affectedRows }, []];
    }

    if (cleanSql.startsWith('INSERT INTO FAVOURITES')) {
        const userId = parseInt(params[0]);
        const destId = parseInt(params[1]);
        const newFav = {
            id: mockFavourites.length + 1,
            user_id: userId,
            destination_id: destId,
            created_at: new Date()
        };
        mockFavourites.push(newFav);
        return [{ insertId: newFav.id, affectedRows: 1 }, []];
    }

    if (cleanSql.includes('FROM FAVOURITES F') || cleanSql.includes('FROM FAVOURITES WHERE')) {
        if (cleanSql.includes('USER_ID = ? AND DESTINATION_ID = ?')) {
            const userId = parseInt(params[0]);
            const destId = parseInt(params[1]);
            const favs = mockFavourites.filter(f => Number(f.user_id) === userId && Number(f.destination_id) === destId);
            return [favs, []];
        }

        const userId = parseInt(params[0]);
        const userFavs = mockFavourites
            .filter(f => Number(f.user_id) === userId)
            .map(f => {
                const dest = mockDestinations.find(d => Number(d.id) === Number(f.destination_id)) || {};
                return {
                    favourite_id: f.id,
                    saved_at: f.created_at,
                    destination_id: dest.id,
                    name: dest.name,
                    location: dest.location,
                    description: dest.description,
                    best_time: dest.best_time,
                    budget: dest.budget,
                    attractions: dest.attractions,
                    image_url: dest.image_url
                };
            });
        return [userFavs, []];
    }

    return [[], []];
}

module.exports = {
    execute,
    pool
};
