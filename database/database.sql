-- ====================================================================
-- Travel Information Management System - Database Setup Script
-- Database Name: travel_db
-- Includes 25 top famous Indian travel destinations
-- ====================================================================

-- 1. Create the database if it doesn't already exist
CREATE DATABASE IF NOT EXISTS travel_db;
USE travel_db;

-- 2. Drop existing tables if re-importing (ordered to respect foreign keys)
DROP TABLE IF EXISTS favourites;
DROP TABLE IF EXISTS destinations;
DROP TABLE IF EXISTS users;

-- ====================================================================
-- Table 1: users
-- Stores registered user accounts
-- ====================================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- Table 2: destinations
-- Stores information about travel destinations
-- ====================================================================
CREATE TABLE destinations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    best_time VARCHAR(100) NOT NULL,
    budget VARCHAR(100) NOT NULL,
    attractions TEXT NOT NULL,
    image_url VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- Table 3: favourites
-- Stores relationship between users and their saved favorite destinations
-- ====================================================================
CREATE TABLE favourites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    destination_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_destination (user_id, destination_id)
);

-- ====================================================================
-- Insert 25 Famous Indian Travel Destinations
-- ====================================================================

INSERT INTO destinations (name, location, description, best_time, budget, attractions, image_url) VALUES
(
    'Goa',
    'Goa, India',
    'A world-famous coastal paradise renowned for its pristine sun-kissed beaches, vibrant nightlife, Portuguese colonial architecture, and delicious seafood.',
    'November - February',
    '₹10,000 - ₹20,000',
    'Baga Beach, Fort Aguada, Calangute Beach, Dudhsagar Falls, Basilica of Bom Jesus',
    'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop&q=80'
),
(
    'Manali',
    'Himachal Pradesh, India',
    'A high-altitude Himalayan resort town famous for snow-capped mountain peaks, pine forests, adventure sports, and scenic hill valleys.',
    'October - June',
    '₹12,000 - ₹22,000',
    'Solang Valley, Rohtang Pass, Hadimba Temple, Old Manali, Jogini Waterfall',
    'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&auto=format&fit=crop&q=80'
),
(
    'Jaipur',
    'Rajasthan, India',
    'The historic Pink City of India, celebrated for royal palaces, magnificent hilltop forts, heritage culture, and vibrant traditional bazaars.',
    'October - March',
    '₹8,000 - ₹18,000',
    'Hawa Mahal, Amber Fort, City Palace, Jantar Mantar, Nahargarh Fort',
    'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80'
),
(
    'Kerala Backwaters',
    'Kerala, India',
    'Known as "Gods Own Country", featuring serene palm-fringed backwaters, tranquil houseboat cruises, lush tea gardens, and rich Ayurvedic traditions.',
    'September - March',
    '₹15,000 - ₹25,000',
    'Alleppey Backwaters, Kumarakom Bird Sanctuary, Marari Beach, Vembanad Lake, Pathiramanal Island',
    'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop&q=80'
),
(
    'Agra',
    'Uttar Pradesh, India',
    'Home to the iconic Taj Mahal, one of the Seven Wonders of the World, along with spectacular Mughal era architecture and heritage.',
    'October - March',
    '₹6,000 - ₹14,000',
    'Taj Mahal, Agra Fort, Fatehpur Sikri, Mehtab Bagh, Itmad-ud-Daulah',
    'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&auto=format&fit=crop&q=80'
),
(
    'Ladakh',
    'Ladakh, India',
    'A breathtaking high-desert plateau famous for dramatic mountain landscapes, crystal-blue lakes, Tibetan monasteries, and scenic mountain passes.',
    'May - September',
    '₹20,000 - ₹35,000',
    'Pangong Lake, Nubra Valley, Khardung La Pass, Magnetic Hill, Thiksey Monastery',
    'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800&auto=format&fit=crop&q=80'
),
(
    'Varanasi',
    'Uttar Pradesh, India',
    'One of the oldest continuously inhabited cities in the world, famed for spiritual Ganga Ghats, sacred evening Ganga Aarti, and ancient temples.',
    'October - March',
    '₹6,000 - ₹12,000',
    'Dashashwamedh Ghat, Kashi Vishwanath Temple, Assi Ghat, Manikarnika Ghat, Sarnath',
    'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&auto=format&fit=crop&q=80'
),
(
    'Rishikesh',
    'Uttarakhand, India',
    'The Yoga Capital of the World, situated in the Himalayan foothills along the sacred Ganges, famous for white-water rafting, yoga, and meditation.',
    'September - November & March - May',
    '₹7,000 - ₹15,000',
    'Laxman Jhula, Ram Jhula, Triveni Ghat, Beatles Ashram, Shivpuri Rafting Point',
    'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&auto=format&fit=crop&q=80'
),
(
    'Shimla',
    'Himachal Pradesh, India',
    'The scenic Queen of Hills, featuring colonial British heritage architecture, lush oak forests, snow-laden slopes, and the historic Kalka-Shimla Toy Train.',
    'March - June & December - February',
    '₹10,000 - ₹20,000',
    'The Ridge, Mall Road, Jakhoo Temple, Kufri, Christ Church',
    'https://images.unsplash.com/photo-1597074866923-dc0589150358?w=800&auto=format&fit=crop&q=80'
),
(
    'Udaipur',
    'Rajasthan, India',
    'The romantic City of Lakes, known for majestic marble palaces shimmering over Lake Pichola, royal courtyards, and grand havelis.',
    'September - March',
    '₹12,000 - ₹24,000',
    'City Palace, Lake Pichola, Jag Mandir, Saheliyon-ki-Bari, Fateh Sagar Lake',
    'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?w=800&auto=format&fit=crop&q=80'
),
(
    'Ooty',
    'Tamil Nadu, India',
    'Queen of the Nilgiris, a serene hill station surrounded by emerald tea plantations, eucalyptus groves, botanical gardens, and misty lakes.',
    'October - June',
    '₹9,000 - ₹18,000',
    'Ooty Lake, Botanical Gardens, Doddabetta Peak, Pykara Falls, Nilgiri Mountain Railway',
    'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800&auto=format&fit=crop&q=80'
),
(
    'Darjeeling',
    'West Bengal, India',
    'Famous worldwide for aromatic orthodox black tea, panoramic views of Mt. Kanchenjunga, and the UNESCO World Heritage Himalayan Toy Train.',
    'April - June & October - December',
    '₹10,000 - ₹20,000',
    'Tiger Hill Sunrise, Batasia Loop, Happy Valley Tea Estate, Peace Pagoda, Rock Garden',
    'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80'
),
(
    'Andaman Islands',
    'Andaman and Nicobar Islands, India',
    'A tropical archipelago boasting turquoise waters, pristine coral reefs, exotic marine life, mangrove creeks, and historic cellular jail.',
    'October - May',
    '₹25,000 - ₹45,000',
    'Radhanagar Beach, Cellular Jail, Havelock Island, Elephant Beach, Neil Island',
    'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800&auto=format&fit=crop&q=80'
),
(
    'Amritsar',
    'Punjab, India',
    'The spiritual and cultural center of the Sikh religion, home to the resplendent Golden Temple and deeply moving historical memorials.',
    'October - March',
    '₹6,000 - ₹13,000',
    'Golden Temple (Harmandir Sahib), Wagah Border Ceremony, Jallianwala Bagh, Gobindgarh Fort',
    'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=800&auto=format&fit=crop&q=80'
),
(
    'Munnar',
    'Kerala, India',
    'A charming hill station nestled at 1,600m altitude in the Western Ghats, famous for sprawling tea estates, mist-covered valleys, and waterfalls.',
    'September - May',
    '₹9,000 - ₹18,000',
    'Eravikulam National Park, Mattupetty Dam, Anamudi Peak, Tea Museum, Attukad Waterfalls',
    'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=800&auto=format&fit=crop&q=80'
),
(
    'Hampi',
    'Karnataka, India',
    'A UNESCO World Heritage Site featuring captivating ruins of the magnificent 14th-century Vijayanagara Empire amidst giant boulder landscapes.',
    'October - February',
    '₹7,000 - ₹14,000',
    'Virupaksha Temple, Stone Chariot, Vijaya Vittala Temple, Matanga Hill, Lotus Mahal',
    'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&auto=format&fit=crop&q=80'
),
(
    'Shillong',
    'Meghalaya, India',
    'Known as the "Scotland of the East", celebrated for cascading waterfalls, living root bridges, pine hills, and vibrant indie music culture.',
    'September - May',
    '₹10,000 - ₹20,000',
    'Elephant Falls, Umiam Lake, Shillong Peak, Don Bosco Museum, Laitlum Canyons',
    'https://images.unsplash.com/photo-1571536802807-30451e3955d8?w=800&auto=format&fit=crop&q=80'
),
(
    'Srinagar',
    'Jammu and Kashmir, India',
    'Paradise on Earth, famous for dreamy Shikara boat rides on Dal Lake, floating flower markets, traditional wooden houseboats, and Mughal gardens.',
    'April - October (Spring/Summer) & Dec - Feb (Snow)',
    '₹15,000 - ₹28,000',
    'Dal Lake Shikara Ride, Shalimar Bagh, Nishat Bagh, Shankaracharya Temple, Tulip Garden',
    'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=800&auto=format&fit=crop&q=80'
),
(
    'Mysore',
    'Karnataka, India',
    'The City of Palaces, renowned for the opulent illuminated Mysore Palace, aromatic sandalwood, Mysore Pak sweet, and rich silk handlooms.',
    'October - March',
    '₹7,000 - ₹15,000',
    'Mysore Palace, Chamundi Hills, Brindavan Gardens, St. Philomena’s Church, Mysore Zoo',
    'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop&q=80'
),
(
    'Coorg',
    'Karnataka, India',
    'Known as the Scotland of India, an enchanting hill haven renowned for lush coffee plantations, spice estates, misty peaks, and Kodava hospitality.',
    'October - April',
    '₹9,000 - ₹18,000',
    'Abbey Falls, Raja’s Seat, Dubare Elephant Camp, Talakaveri, Namdroling Monastery (Golden Temple)',
    'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=800&auto=format&fit=crop&q=80'
),
(
    'Jaisalmer',
    'Rajasthan, India',
    'The Golden City of Thar Desert, famous for its living yellow sandstone fort, camel desert safaris on Sam sand dunes, and ornate havelis.',
    'October - March',
    '₹10,000 - ₹20,000',
    'Jaisalmer Fort (Sonar Qila), Sam Sand Dunes Desert Safari, Patwon Ki Haveli, Gadisar Lake, Kuldhara Abandoned Village',
    'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80'
),
(
    'Gangtok',
    'Sikkim, India',
    'The charming capital of Sikkim overlooking Mt. Kanchenjunga, known for Buddhist monasteries, cable car rides, high mountain lakes, and organic culture.',
    'March - June & September - December',
    '₹12,000 - ₹24,000',
    'Tsomgo Lake, Nathula Pass, Rumtek Monastery, MG Marg, Ban Jhakri Falls',
    'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80'
),
(
    'Pondicherry',
    'Puducherry, India',
    'A French colonial seaside town featuring colorful yellow villas, cobblestone streets, beach promenades, serene cafes, and spiritual Auroville.',
    'October - March',
    '₹8,000 - ₹16,000',
    'Promenade Beach, French Quarter (White Town), Auroville Matrimandir, Paradise Beach, Sri Aurobindo Ashram',
    'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800&auto=format&fit=crop&q=80'
),
(
    'Kanyakumari',
    'Tamil Nadu, India',
    'The southernmost tip of the Indian subcontinent, where the Arabian Sea, the Bay of Bengal, and the Indian Ocean unite with spectacular sunrises.',
    'October - March',
    '₹6,000 - ₹13,000',
    'Vivekananda Rock Memorial, Thiruvalluvar Statue, Sunset View Point, Kanyakumari Beach, Padmanabhapuram Palace',
    'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800&auto=format&fit=crop&q=80'
),
(
    'Nainital',
    'Uttarakhand, India',
    'The Lake District of India, set around the shimmering eye-shaped Naini Lake surrounded by forested pine hills and scenic viewpoints.',
    'March - June & September - November',
    '₹8,000 - ₹16,000',
    'Naini Lake Boating, Naina Devi Temple, Snow View Point, Mall Road, Tiffin Top',
    'https://images.unsplash.com/photo-1597074866923-dc0589150358?w=800&auto=format&fit=crop&q=80'
);

-- Check inserted records count
SELECT COUNT(*) AS total_indian_destinations FROM destinations;
