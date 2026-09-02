// ====================================================================
// script.js - Frontend JavaScript for Travel Information Management System
// ====================================================================
// This file handles:
// 1. Checking and updating user authentication status across all pages.
// 2. Handling user Login and Registration forms.
// 3. Searching for travel destinations.
// 4. Loading single destination details and OpenStreetMap location data.
// 5. Saving, viewing, and removing favourite destinations.
// ====================================================================

// Global variable to store current logged-in user state
let currentUser = null;

// --------------------------------------------------------------------
// 1. Helper Function: Show Alert Messages
// --------------------------------------------------------------------
function showAlert(alertId, message, type = 'error') {
    const alertBox = document.getElementById(alertId);
    if (!alertBox) return;

    // Set styling based on type ('error', 'success', 'info')
    alertBox.className = `alert alert-${type} show`;
    alertBox.innerHTML = `<span>${message}</span>`;

    // Auto-hide success messages after 4 seconds
    if (type === 'success') {
        setTimeout(() => {
            alertBox.classList.remove('show');
        }, 4000);
    }
}

// --------------------------------------------------------------------
// 2. Authentication Status & Dynamic Navbar
// --------------------------------------------------------------------
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth-status');
        const data = await response.json();

        const authNav = document.getElementById('auth-nav');
        if (!authNav) return;

        if (data.loggedIn && data.user) {
            currentUser = data.user;
            // User is logged in: Show user badge, Favourites link, and Logout button
            authNav.innerHTML = `
                <li><a href="index.html">Home</a></li>
                <li><a href="favourites.html">❤️ My Favourites</a></li>
                <li><span class="user-badge">👤 ${escapeHtml(data.user.name)}</span></li>
                <li><button onclick="handleLogout()" class="btn btn-outline" style="padding: 0.4rem 0.9rem; font-size: 0.88rem;">Logout</button></li>
            `;
        } else {
            currentUser = null;
            // User is NOT logged in: Show Login and Register buttons
            authNav.innerHTML = `
                <li><a href="index.html">Home</a></li>
                <li><a href="login.html" class="btn btn-outline" style="padding: 0.4rem 1rem;">Login</a></li>
                <li><a href="register.html" class="btn btn-primary" style="padding: 0.4rem 1rem;">Register</a></li>
            `;
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
    }
}

// --------------------------------------------------------------------
// 3. User Logout
// --------------------------------------------------------------------
async function handleLogout() {
    try {
        const response = await fetch('/api/logout');
        const data = await response.json();
        if (data.success) {
            // Redirect to home page after logout
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// --------------------------------------------------------------------
// 4. User Registration (for register.html)
// --------------------------------------------------------------------
async function handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!name || !email || !password) {
        showAlert('register-alert', 'Please fill in all required fields.', 'error');
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (data.success) {
            showAlert('register-alert', data.message + ' Redirecting to login...', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            showAlert('register-alert', data.message || 'Registration failed.', 'error');
        }
    } catch (error) {
        console.error('Register error:', error);
        showAlert('register-alert', 'Server error. Please ensure the backend is running.', 'error');
    }
}

// --------------------------------------------------------------------
// 5. User Login (for login.html)
// --------------------------------------------------------------------
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showAlert('login-alert', 'Please enter your email and password.', 'error');
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            showAlert('login-alert', 'Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showAlert('login-alert', data.message || 'Invalid credentials.', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('login-alert', 'Server error. Please ensure the backend is running.', 'error');
    }
}

// Global variable to cache loaded destinations for real-time filtering
let allDestinationsCache = [];

// --------------------------------------------------------------------
// 6. Home Page: Load Featured Destinations
// --------------------------------------------------------------------
async function loadHomeDestinations() {
    const grid = document.getElementById('destinations-grid');
    if (!grid) return;

    try {
        const response = await fetch('/api/destinations');
        const data = await response.json();

        if (data.success && data.destinations.length > 0) {
            allDestinationsCache = data.destinations;
            renderDestinationCards(data.destinations, grid);
        } else {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-icon">🏖️</div>
                    <h3>No destinations found</h3>
                    <p>Make sure you have imported the sample data from <code>database/database.sql</code> into MySQL.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading destinations:', error);
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon">⚠️</div>
                <h3>Could not connect to database</h3>
                <p>Please ensure your Node server and MySQL database are running.</p>
            </div>
        `;
    }
}

// --------------------------------------------------------------------
// 7. Home Page: Live Real-time Search as user types
// --------------------------------------------------------------------
function handleLiveSearch(query) {
    const cleanQuery = query.trim().toLowerCase();
    const grid = document.getElementById('destinations-grid');
    const titleHeader = document.getElementById('destinations-title');

    if (!cleanQuery) {
        if (titleHeader) titleHeader.textContent = 'Popular Destinations';
        renderDestinationCards(allDestinationsCache, grid);
        return;
    }

    if (titleHeader) titleHeader.textContent = `Search Results for "${query}"`;

    const filtered = allDestinationsCache.filter(d => 
        d.name.toLowerCase().includes(cleanQuery) || 
        d.location.toLowerCase().includes(cleanQuery) ||
        d.attractions.toLowerCase().includes(cleanQuery) ||
        d.description.toLowerCase().includes(cleanQuery)
    );

    if (filtered.length > 0) {
        renderDestinationCards(filtered, grid);
    } else {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon">🔍</div>
                <h3 style="color: #0f172a; font-size: 1.35rem; margin-bottom: 0.5rem;">Sorry, we couldn't find that destination.</h3>
                <p style="color: #64748b; margin-bottom: 1.2rem;">We couldn't find any travel spot matching "<strong>${escapeHtml(query)}</strong>". Try searching for places like Goa, Manali, Jaipur, Kerala, or Ladakh.</p>
                <button class="btn btn-primary" onclick="resetSearch()">Explore All Destinations</button>
            </div>
        `;
    }
}

// --------------------------------------------------------------------
// 7b. Home Page: Category Filters (Beaches, Hills, Heritage, etc.)
// --------------------------------------------------------------------
function filterByCategory(category, btnElement) {
    // Update active pill styling
    const pills = document.querySelectorAll('.filter-pill');
    pills.forEach(p => p.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

    const grid = document.getElementById('destinations-grid');
    const titleHeader = document.getElementById('destinations-title');

    if (category === 'all') {
        if (titleHeader) titleHeader.textContent = 'All Destinations (25)';
        renderDestinationCards(allDestinationsCache, grid);
        return;
    }

    const categoryMap = {
        'beach': ['goa', 'kerala', 'andaman', 'pondicherry', 'kanyakumari', 'gokarna'],
        'hills': ['manali', 'shimla', 'ooty', 'darjeeling', 'ladakh', 'munnar', 'shillong', 'srinagar', 'coorg', 'gangtok', 'nainital'],
        'heritage': ['jaipur', 'agra', 'udaipur', 'hampi', 'mysore', 'jaisalmer', 'amritsar'],
        'nature': ['kerala', 'munnar', 'coorg', 'shillong', 'ooty', 'andaman', 'ladakh', 'nainital'],
        'spiritual': ['varanasi', 'rishikesh', 'amritsar', 'hampi', 'kanyakumari']
    };

    const targetKeywords = categoryMap[category] || [];
    const filtered = allDestinationsCache.filter(d => {
        const nameLower = d.name.toLowerCase();
        return targetKeywords.some(kw => nameLower.includes(kw));
    });

    const categoryTitles = {
        'beach': '🏖️ Beaches & Coastal Destinations',
        'hills': '🏔️ Hill Stations & Mountain Getaways',
        'heritage': '👑 Royal & Heritage Monuments',
        'nature': '🌿 Nature, Lakes & Backwaters',
        'spiritual': '🛕 Spiritual & Sacred Cities'
    };

    if (titleHeader) titleHeader.textContent = categoryTitles[category] || 'Filtered Destinations';
    renderDestinationCards(filtered, grid);
}

// --------------------------------------------------------------------
// 7c. Home Page: Form Submission Search
// --------------------------------------------------------------------
async function handleHomeSearch(event) {
    if (event) event.preventDefault();

    const searchInput = document.getElementById('search-input');
    const query = searchInput ? searchInput.value.trim() : '';

    if (!query) {
        resetSearch();
        return;
    }

    handleLiveSearch(query);
}

// Reset search and show all destinations
function resetSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    const titleHeader = document.getElementById('destinations-title');
    if (titleHeader) titleHeader.textContent = 'Popular Destinations';
    const pills = document.querySelectorAll('.filter-pill');
    pills.forEach((p, idx) => {
        if (idx === 0) p.classList.add('active');
        else p.classList.remove('active');
    });
    renderDestinationCards(allDestinationsCache, document.getElementById('destinations-grid'));
}

// Quick search tag button clicked
function quickSearch(placeName) {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = placeName;
        handleLiveSearch(placeName);
    }
}

// Render list of destinations into HTML cards
function renderDestinationCards(destinations, container) {
    const defaultImg = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800';
    container.innerHTML = destinations.map(dest => `
        <div class="destination-card">
            <div class="card-image-wrap">
                <img 
                    src="${dest.image_url || defaultImg}" 
                    alt="${escapeHtml(dest.name)}" 
                    loading="lazy"
                    onerror="this.onerror=null; this.src='${defaultImg}';"
                >
                <span class="card-badge">⭐ Recommended</span>
            </div>
            <div class="card-content">
                <div class="card-header">
                    <h3 class="card-title">${escapeHtml(dest.name)}</h3>
                </div>
                <div class="card-location">
                    📍 ${escapeHtml(dest.location)}
                </div>
                <p class="card-desc">${escapeHtml(dest.description)}</p>
                <div class="card-meta">
                    <div class="meta-item">
                        <span class="meta-label">Best Season</span>
                        <span class="meta-value">🗓️ ${escapeHtml(dest.best_time)}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Est. Budget</span>
                        <span class="meta-value">💰 ${escapeHtml(dest.budget)}</span>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <a href="destination.html?id=${dest.id}" class="btn btn-primary btn-full">
                    View Details & Location Info &rarr;
                </a>
            </div>
        </div>
    `).join('');
}

// --------------------------------------------------------------------
// 8. Destination Details Page (destination.html)
// --------------------------------------------------------------------
async function loadDestinationDetailPage() {
    const params = new URLSearchParams(window.location.search);
    const destinationId = params.get('id');
    const searchQuery = params.get('q');

    const detailContainer = document.getElementById('destination-detail-content');
    if (!detailContainer) return;

    try {
        let url = '';
        if (destinationId) {
            url = `/api/destinations/${destinationId}`;
        } else if (searchQuery) {
            url = `/api/destinations/search?q=${encodeURIComponent(searchQuery)}`;
        } else {
            detailContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🗺️</div>
                    <h3 style="color: #0f172a; font-size: 1.35rem; margin-bottom: 0.5rem;">No Destination Selected</h3>
                    <p style="color: #64748b; margin-bottom: 1.2rem;">Please choose a destination from the home page.</p>
                    <a href="index.html" class="btn btn-primary">Back to Home</a>
                </div>
            `;
            return;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (!data.success) {
            detailContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3 style="color: #0f172a; font-size: 1.35rem; margin-bottom: 0.5rem;">Sorry, we couldn't find that destination.</h3>
                    <p style="color: #64748b; margin-bottom: 1.2rem;">${escapeHtml(data.message || "Sorry, we couldn't find that destination.")}</p>
                    <a href="index.html" class="btn btn-primary">Explore All Destinations</a>
                </div>
            `;
            return;
        }

        // Handle if response came from search (array) or direct ID (single object)
        const destination = data.destination || (data.destinations && data.destinations[0]);
        const locationApi = data.locationApi || {};

        if (!destination) {
            detailContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3 style="color: #0f172a; font-size: 1.35rem; margin-bottom: 0.5rem;">Sorry, we couldn't find that destination.</h3>
                    <p style="color: #64748b; margin-bottom: 1.2rem;">No destination matching your search was found in the database.</p>
                    <a href="index.html" class="btn btn-primary">Explore All Destinations</a>
                </div>
            `;
            return;
        }

        // Interactive Attraction Descriptions & Photos Dictionary
        const attractionInfoMap = {
            'baga beach': {
                tag: '🏖️ Beach & Nightlife',
                desc: 'Famous for exhilarating water sports (parasailing, jet skiing, banana rides), lively beach shacks with seafood, and vibrant nightlife at Tito\'s Lane.',
                img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&auto=format&fit=crop&q=80'
            },
            'fort aguada': {
                tag: '🏰 Historical Fort',
                desc: 'A well-preserved 17th-century Portuguese fortress overlooking the Arabian Sea, featuring a historic 4-storey lighthouse and panoramic ocean views.',
                img: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=600&auto=format&fit=crop&q=80'
            },
            'calangute beach': {
                tag: '🌊 Popular Beach',
                desc: 'Known as the "Queen of Beaches" in Goa, popular for golden sands, swimming, sunbathing, and colorful souvenir markets.',
                img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80'
            },
            'dudhsagar falls': {
                tag: '💦 Waterfall Trek',
                desc: 'A majestic four-tiered milky white waterfall located on the Mandovi River, surrounded by dense forests in the Western Ghats.',
                img: 'https://images.unsplash.com/photo-1571536802807-30451e3955d8?w=600&auto=format&fit=crop&q=80'
            },
            'basilica of bom jesus': {
                tag: '⛪ UNESCO Heritage',
                desc: 'Historic Roman Catholic basilica holding the sacred mortal remains of St. Francis Xavier, renowned for baroque colonial architecture.',
                img: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&auto=format&fit=crop&q=80'
            },
            'solang valley': {
                tag: '⛷️ Adventure Sports',
                desc: 'A premier Himalayan adventure hub offering paragliding, zorbing, quad biking, and winter snow skiing against majestic peaks.',
                img: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&auto=format&fit=crop&q=80'
            },
            'rohtang pass': {
                tag: '❄️ High Mountain Pass',
                desc: 'A breathtaking mountain pass at 3,978m connecting Kullu with Lahaul Valley, offering year-round snow landscapes, glaciers, and scenic views.',
                img: 'https://images.unsplash.com/photo-1597074866923-dc0589150358?w=600&auto=format&fit=crop&q=80'
            },
            'hadimba temple': {
                tag: '🪵 Ancient Pagoda',
                desc: 'A unique 16th-century four-tiered wooden pagoda temple dedicated to Hadimba Devi, nestled peacefully amidst towering deodar pine forests.',
                img: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&auto=format&fit=crop&q=80'
            },
            'old manali': {
                tag: '☕ Cafes & Culture',
                desc: 'Charming village vibe with wooden houses, bohemian rooftop cafes, live music, apple orchards, and artisanal souvenir shops.',
                img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80'
            },
            'jogini waterfall': {
                tag: '🥾 Nature Trek',
                desc: 'A scenic cascading waterfall reachable via a peaceful 1-hour forest trail with stunning panoramic views of the Beas River and peaks.',
                img: 'https://images.unsplash.com/photo-1571536802807-30451e3955d8?w=600&auto=format&fit=crop&q=80'
            },
            'hawa mahal': {
                tag: '🏛️ Palace of Winds',
                desc: 'Iconic five-story pink sandstone palace with 953 intricately carved jharokhas (windows) designed for royal ladies to observe street festivals.',
                img: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&auto=format&fit=crop&q=80'
            },
            'amber fort': {
                tag: '👑 Royal Hill Fort',
                desc: 'A magnificent hilltop fortress blending Rajput and Mughal architecture, famed for the sparkling Sheesh Mahal (Mirror Palace) and royal courtyards.',
                img: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?w=600&auto=format&fit=crop&q=80'
            },
            'city palace': {
                tag: '💎 Royal Residence',
                desc: 'A sprawling royal complex in the heart of Jaipur featuring courtyards, museums, Chandra Mahal, and Mubarak Mahal with regal costumes and weapons.',
                img: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?w=600&auto=format&fit=crop&q=80'
            },
            'jantar mantar': {
                tag: '🔭 UNESCO Observatory',
                desc: 'A UNESCO World Heritage astronomical observatory built by Maharaja Jai Singh II, featuring the world\'s largest stone sundial.',
                img: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&auto=format&fit=crop&q=80'
            },
            'nahargarh fort': {
                tag: '🌄 Sunset Viewpoint',
                desc: 'Perched on the edge of the Aravalli Hills, offering spellbinding sunset views over the entire illuminated Pink City.',
                img: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&auto=format&fit=crop&q=80'
            },
            'alleppey backwaters': {
                tag: '🛶 Houseboat Cruise',
                desc: 'Cruise peacefully through tranquil palm-fringed canals on traditional thatched houseboats, observing authentic rural Kerala village life.',
                img: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&auto=format&fit=crop&q=80'
            },
            'taj mahal': {
                tag: '🤍 Wonder of the World',
                desc: 'An exquisite ivory-white marble mausoleum built by Emperor Shah Jahan in memory of Mumtaz Mahal, universally celebrated for symmetry and beauty.',
                img: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&auto=format&fit=crop&q=80'
            },
            'agra fort': {
                tag: '🏰 Mughal Fortress',
                desc: 'A massive 16th-century red sandstone fortress that served as the main residence of the Mughal emperors, offering clear views of the Taj Mahal.',
                img: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&auto=format&fit=crop&q=80'
            },
            'pangong lake': {
                tag: '🌊 High-Altitude Lake',
                desc: 'An extraordinary high-altitude salt lake at 4,350m that dramatically changes colors from deep blue to turquoise, spanning India and Tibet.',
                img: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=600&auto=format&fit=crop&q=80'
            },
            'nubra valley': {
                tag: '🐫 Cold Desert Safari',
                desc: 'Known as the Valley of Flowers, famous for high-altitude sand dunes, double-humped Bactrian camels, and Diskit Monastery.',
                img: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=600&auto=format&fit=crop&q=80'
            },
            'dashashwamedh ghat': {
                tag: '🔥 Sacred Ganga Aarti',
                desc: 'The main spiritual ghat on the River Ganges in Varanasi, world-famous for its mesmerizing evening Ganga Aarti ceremony with brass lamps.',
                img: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=600&auto=format&fit=crop&q=80'
            },
            'kashi vishwanath temple': {
                tag: '🛕 Jyotirlinga Temple',
                desc: 'One of the twelve revered Jyotirlinga shrines dedicated to Lord Shiva, located on the western bank of the sacred River Ganges.',
                img: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=600&auto=format&fit=crop&q=80'
            },
            'laxman jhula': {
                tag: '🌉 Iconic Suspension Bridge',
                desc: 'A legendary 450-foot iron suspension bridge across the holy Ganges River, surrounded by yoga ashrams, temples, and riverside cafes.',
                img: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=600&auto=format&fit=crop&q=80'
            },
            'the ridge': {
                tag: '🌲 Hill Promenade',
                desc: 'A wide open promenade in the center of Shimla offering panoramic views of snow-capped mountains and the historic neo-gothic Christ Church.',
                img: 'https://images.unsplash.com/photo-1597074866923-dc0589150358?w=600&auto=format&fit=crop&q=80'
            },
            'golden temple (harmandir sahib)': {
                tag: '✨ Spiritual Center',
                desc: 'The holiest shrine of Sikhism, coated with real gold leaf and surrounded by the sacred Amrit Sarovar pool, serving free meals (langar) to everyone.',
                img: 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=600&auto=format&fit=crop&q=80'
            },
            'eravikulam national park': {
                tag: '🦌 Wildlife & Tea Hills',
                desc: 'Home to the endangered Nilgiri Tahr mountain goat and rolling grasslands adorned with the rare Neelakurinji flower that blooms every 12 years.',
                img: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=600&auto=format&fit=crop&q=80'
            },
            'virupaksha temple': {
                tag: '🛕 UNESCO Ancient Temple',
                desc: 'An active 7th-century Dravidian temple dedicated to Lord Shiva, renowned for its towering 50-meter entrance gopuram and carved stone pillars.',
                img: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=600&auto=format&fit=crop&q=80'
            },
            'dal lake shikara ride': {
                tag: '🛶 Jewel of Kashmir',
                desc: 'Glide gently across misty Dal Lake in colorful wooden Shikaras, visiting floating flower markets, lotus gardens, and ornate houseboats.',
                img: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=600&auto=format&fit=crop&q=80'
            },
            'mysore palace': {
                tag: '🏰 Illuminated Royal Palace',
                desc: 'One of India\'s most visited monuments, a breathtaking Indo-Saracenic royal palace illuminated by nearly 100,000 light bulbs on weekends.',
                img: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&auto=format&fit=crop&q=80'
            },
            'abbey falls': {
                tag: '💦 Waterfall Haven',
                desc: 'A scenic cascading waterfall nestled amidst dense coffee plantations and aromatic spice estates in the Western Ghats.',
                img: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600&auto=format&fit=crop&q=80'
            },
            'jaisalmer fort (sonar qila)': {
                tag: '🏜️ Living Golden Fort',
                desc: 'A magnificent living yellow sandstone fort rising from the Thar desert, housing houses, cafes, Jain temples, and royal palaces.',
                img: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&auto=format&fit=crop&q=80'
            }
        };

        // Format attractions into interactive accordion cards
        const attractionsArray = destination.attractions
            ? destination.attractions.split(',').map(a => a.trim())
            : [];

        const defaultAttrImg = destination.image_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600';

        const attractionsHtml = attractionsArray.map((attraction, idx) => {
            const cleanKey = attraction.toLowerCase().trim();
            const matched = attractionInfoMap[cleanKey] || {
                tag: '⭐ Popular Attraction',
                desc: `${attraction} is one of the top-rated spots in ${destination.name}. It offers memorable sightseeing, photography opportunities, and a rich experience of local charm.`,
                img: defaultAttrImg
            };
            const spotImage = matched.img || defaultAttrImg;
            const mapQuery = encodeURIComponent(`${attraction} ${destination.location || destination.name}`);

            return `
                <li class="attraction-card-item" id="attr-item-${idx}">
                    <button type="button" class="attraction-header-btn" onclick="toggleAttraction(${idx})">
                        <div class="attraction-title-wrap">
                            <span>✨</span>
                            <span>${escapeHtml(attraction)}</span>
                        </div>
                        <span class="attraction-chevron" id="chevron-${idx}">▼</span>
                    </button>
                    <div class="attraction-details-panel" id="attr-panel-${idx}">
                        <div class="attraction-body-grid">
                            <div class="attraction-img-wrap">
                                <img 
                                    src="${spotImage}" 
                                    alt="${escapeHtml(attraction)}" 
                                    loading="lazy"
                                    onerror="this.onerror=null; this.src='${defaultAttrImg}';"
                                >
                            </div>
                            <div class="attraction-info-wrap">
                                <p class="attraction-desc-text">${escapeHtml(matched.desc)}</p>
                                <div class="attraction-action-row">
                                    <span class="attraction-tag">${escapeHtml(matched.tag)}</span>
                                    <a href="https://www.google.com/maps/search/?api=1&query=${mapQuery}" target="_blank" rel="noopener noreferrer" class="attraction-map-link">
                                        🗺️ View spot on Google Maps &rarr;
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </li>
            `;
        }).join('');

        // Google Maps Location Box Markup
        let apiBoxHtml = '';
        const googleDirectLink = locationApi.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination.location || destination.name)}`;
        const googleEmbedLink = locationApi.embedMapUrl || `https://maps.google.com/maps?q=${encodeURIComponent(destination.location || destination.name)}&t=&z=12&ie=UTF8&iwloc=&output=embed`;

        if (locationApi.found) {
            apiBoxHtml = `
                <div class="api-box">
                    <div class="api-box-header">
                        🗺️ Google Maps Location & Coordinates
                    </div>
                    <div class="api-data-row">
                        <strong>Official Address:</strong> ${escapeHtml(locationApi.displayName || destination.location)}
                    </div>
                    <div class="api-data-row">
                        <strong>Latitude:</strong> <code>${escapeHtml(String(locationApi.latitude))}</code> &nbsp;|&nbsp; 
                        <strong>Longitude:</strong> <code>${escapeHtml(String(locationApi.longitude))}</code>
                    </div>

                    <!-- Interactive Google Map Embed -->
                    <div style="margin-top: 1rem; border-radius: 10px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                        <iframe 
                            width="100%" 
                            height="240" 
                            frameborder="0" 
                            scrolling="no" 
                            marginheight="0" 
                            marginwidth="0" 
                            src="${googleEmbedLink}"
                            style="display: block; border: 0;"
                            loading="lazy"
                        ></iframe>
                    </div>

                    <div class="api-data-row" style="margin-top: 0.8rem;">
                        <a href="${googleDirectLink}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="font-size: 0.88rem; padding: 0.5rem 1.1rem; display: inline-flex; align-items: center; gap: 0.4rem;">
                            📍 Open in Google Maps &rarr;
                        </a>
                    </div>
                </div>
            `;
        } else {
            apiBoxHtml = `
                <div class="api-box">
                    <div class="api-box-header">
                        🗺️ Google Maps Location
                    </div>
                    <!-- Interactive Google Map Embed -->
                    <div style="margin-top: 0.6rem; border-radius: 10px; overflow: hidden; border: 1px solid #cbd5e1;">
                        <iframe 
                            width="100%" 
                            height="240" 
                            frameborder="0" 
                            scrolling="no" 
                            marginheight="0" 
                            marginwidth="0" 
                            src="${googleEmbedLink}"
                            style="display: block; border: 0;"
                            loading="lazy"
                        ></iframe>
                    </div>
                    <div class="api-data-row" style="margin-top: 0.8rem;">
                        <a href="${googleDirectLink}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="font-size: 0.88rem; padding: 0.5rem 1.1rem;">
                            📍 Open in Google Maps &rarr;
                        </a>
                    </div>
                </div>
            `;
        }

        // Weather Widget data based on destination type
        const weatherInfo = getWeatherInfo(destination.name);

        // Render the Full Destination View
        detailContainer.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.8rem;">
                <a href="index.html" class="back-link" style="margin-bottom: 0;">&larr; Back to Destinations</a>
                <button onclick="copyShareLink()" class="btn btn-outline" style="font-size: 0.88rem; padding: 0.4rem 0.9rem;">
                    🔗 Share Destination
                </button>
            </div>

            <div id="fav-alert" class="alert"></div>

            <div class="detail-hero-card">
                <div class="detail-banner">
                    <img 
                        src="${destination.image_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200'}" 
                        alt="${escapeHtml(destination.name)}"
                        onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200';"
                    >
                    <div class="detail-banner-overlay">
                        <div class="detail-title-group">
                            <h1>${escapeHtml(destination.name)}</h1>
                            <p>📍 ${escapeHtml(destination.location)}</p>
                        </div>
                    </div>
                </div>

                <div class="detail-body">
                    <div class="detail-grid">
                        <!-- Main Content Column -->
                        <div class="detail-main-col">
                            <div class="detail-section">
                                <h3>📖 Overview</h3>
                                <p class="detail-description">${escapeHtml(destination.description)}</p>
                            </div>

                            <div class="detail-section">
                                <h3>🏖️ Popular Attractions & Highlights</h3>
                                <div class="attractions-hint">
                                    <span>💡 Click on any spot below to view details, photos & map</span>
                                </div>
                                <ul class="attractions-list">
                                    ${attractionsHtml}
                                </ul>
                            </div>

                            <!-- Integrated Location API Box -->
                            ${apiBoxHtml}

                            <!-- Traveler Reviews & Ratings Section -->
                            <div class="reviews-section">
                                <div class="reviews-header">
                                    <h3>💬 Traveler Reviews & Experiences</h3>
                                    <div class="overall-rating-badge">
                                        ⭐ 4.8 / 5.0 (Verified Travelers)
                                    </div>
                                </div>

                                <div id="reviews-list-container">
                                    <div class="review-card">
                                        <div class="review-top">
                                            <div class="reviewer-name">🧑‍💼 Rohan Sharma <span style="font-size:0.75rem; color:#64748b; font-weight:normal;">• Visited last month</span></div>
                                            <div class="review-stars">⭐⭐⭐⭐⭐</div>
                                        </div>
                                        <p class="review-text">"One of the best trips I've ever taken in India! The sightseeing spots and local atmosphere in ${escapeHtml(destination.name)} were unforgettable."</p>
                                    </div>

                                    <div class="review-card">
                                        <div class="review-top">
                                            <div class="reviewer-name">👩‍🎓 Ananya Verma <span style="font-size:0.75rem; color:#64748b; font-weight:normal;">• Visited recently</span></div>
                                            <div class="review-stars">⭐⭐⭐⭐⭐</div>
                                        </div>
                                        <p class="review-text">"The weather was wonderful and the food was delicious. Highly recommend checking out all the top attractions listed here!"</p>
                                    </div>
                                </div>

                                <!-- Add Your Review Form -->
                                <form onsubmit="handleReviewSubmit(event, '${escapeHtml(destination.name)}')" class="add-review-form">
                                    <h4>✍️ Leave a Travel Review</h4>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin-bottom: 0.8rem;">
                                        <input type="text" id="rev-name" class="form-input" placeholder="Your Name" required>
                                        <select id="rev-stars" class="form-input">
                                            <option value="5">⭐⭐⭐⭐⭐ (5/5 Excellent)</option>
                                            <option value="4">⭐⭐⭐⭐ (4/5 Great)</option>
                                            <option value="3">⭐⭐⭐ (3/5 Good)</option>
                                        </select>
                                    </div>
                                    <textarea id="rev-comment" class="form-input" rows="2" placeholder="Share your experience, tips, or favorite spot..." required style="margin-bottom: 0.8rem;"></textarea>
                                    <button type="submit" class="btn btn-primary btn-sm">Post Review</button>
                                </form>
                            </div>
                        </div>

                        <!-- Sidebar Summary & Action Column -->
                        <div class="detail-side-col">
                            <div class="info-card">
                                <div class="info-item">
                                    <div class="info-label">Best Time to Visit</div>
                                    <div class="info-value">🗓️ ${escapeHtml(destination.best_time)}</div>
                                </div>

                                <div class="info-item">
                                    <div class="info-label">Estimated Budget</div>
                                    <div class="info-value">💰 ${escapeHtml(destination.budget)}</div>
                                </div>

                                <div class="info-item" style="margin-top: 1.5rem;">
                                    <button id="save-fav-btn" onclick="saveToFavourites(${destination.id})" class="btn btn-primary btn-full btn-lg">
                                        ❤️ Save to Favourites
                                    </button>
                                </div>
                            </div>

                            <!-- Live Weather Information Widget -->
                            <div class="weather-card">
                                <div class="weather-header">
                                    <span class="weather-title">🌤️ Current Weather</span>
                                    <span style="font-size: 0.78rem; opacity: 0.9;">Live Forecast</span>
                                </div>
                                <div class="weather-body">
                                    <div class="weather-temp-wrap">
                                        <span class="weather-icon-lg">${weatherInfo.icon}</span>
                                        <div>
                                            <div class="weather-degrees">${weatherInfo.temp}</div>
                                            <div class="weather-condition">${weatherInfo.condition}</div>
                                        </div>
                                    </div>
                                    <div class="weather-stats">
                                        <div>💧 Humidity: <strong>${weatherInfo.humidity}</strong></div>
                                        <div>💨 Wind: <strong>${weatherInfo.wind}</strong></div>
                                    </div>
                                </div>
                            </div>

                            <!-- Interactive Trip Cost Estimator -->
                            <div class="budget-calc-card">
                                <div class="budget-calc-header">
                                    <span>🧮</span>
                                    <span>Trip Cost Estimator</span>
                                </div>
                                <div class="calc-row">
                                    <span>Trip Duration:</span>
                                    <select id="calc-days" class="calc-select" onchange="calculateTripCost('${escapeHtml(destination.budget)}')">
                                        <option value="3">3 Days (Weekend)</option>
                                        <option value="5" selected>5 Days (Standard)</option>
                                        <option value="7">7 Days (Full Week)</option>
                                        <option value="10">10 Days (Extended)</option>
                                    </select>
                                </div>
                                <div class="calc-row">
                                    <span>Travelers:</span>
                                    <select id="calc-travelers" class="calc-select" onchange="calculateTripCost('${escapeHtml(destination.budget)}')">
                                        <option value="1">1 Person (Solo)</option>
                                        <option value="2" selected>2 People (Couple)</option>
                                        <option value="4">4 People (Group/Family)</option>
                                    </select>
                                </div>
                                <div class="calc-result-box">
                                    <div class="calc-result-label">Estimated Total Trip Cost</div>
                                    <div class="calc-result-amount" id="calc-cost-display">₹22,000 - ₹34,000</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Initialize Trip Cost Estimator calculation
        calculateTripCost(destination.budget);

        // Check if this destination is already favorited by the logged in user
        checkFavouriteStatus(destination.id);

    } catch (error) {
        console.error('Error loading destination details:', error);
    }
}

// Toggle interactive attraction card expand/collapse
function toggleAttraction(index) {
    const item = document.getElementById(`attr-item-${index}`);
    if (!item) return;
    item.classList.toggle('active');
}

// Check if destination is already favorited to change button text
async function checkFavouriteStatus(destinationId) {
    try {
        const response = await fetch(`/api/favourites/check/${destinationId}`);
        const data = await response.json();

        const btn = document.getElementById('save-fav-btn');
        if (btn) {
            if (data.isFavourite) {
                btn.innerHTML = '❤️ Saved in Favourites (Click to Remove)';
                btn.className = 'btn btn-secondary btn-full btn-lg';
                btn.onclick = () => toggleFavouriteOnDetails(destinationId, true);
            } else {
                btn.innerHTML = '❤️ Save to Favourites';
                btn.className = 'btn btn-primary btn-full btn-lg';
                btn.onclick = () => toggleFavouriteOnDetails(destinationId, false);
            }
        }
    } catch (e) {
        // silent catch
    }
}

// Toggle favourite on destination details page (Save or Remove)
async function toggleFavouriteOnDetails(destinationId, isAlreadyFav) {
    if (isAlreadyFav) {
        // Remove from favourites
        try {
            const response = await fetch(`/api/favourites/${destinationId}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (response.status === 401) {
                alert('Please login first.');
                window.location.href = 'login.html';
                return;
            }

            if (data.success) {
                showAlert('fav-alert', '🗑️ Destination removed from your favourites.', 'info');
                const btn = document.getElementById('save-fav-btn');
                if (btn) {
                    btn.innerHTML = '❤️ Save to Favourites';
                    btn.className = 'btn btn-primary btn-full btn-lg';
                    btn.onclick = () => toggleFavouriteOnDetails(destinationId, false);
                }
            } else {
                showAlert('fav-alert', data.message || 'Could not remove favourite.', 'error');
            }
        } catch (error) {
            console.error('Error removing favourite:', error);
            showAlert('fav-alert', 'Failed to connect to the server.', 'error');
        }
    } else {
        // Save to favourites
        try {
            const response = await fetch('/api/favourites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ destination_id: destinationId })
            });

            const data = await response.json();

            if (response.status === 401) {
                alert('Please login first to save destinations to your favourites.');
                window.location.href = 'login.html';
                return;
            }

            if (data.success) {
                showAlert('fav-alert', '🎉 ' + data.message, 'success');
                const btn = document.getElementById('save-fav-btn');
                if (btn) {
                    btn.innerHTML = '❤️ Saved in Favourites (Click to Remove)';
                    btn.className = 'btn btn-secondary btn-full btn-lg';
                    btn.onclick = () => toggleFavouriteOnDetails(destinationId, true);
                }
            } else {
                showAlert('fav-alert', data.message || 'Could not save to favourites.', 'info');
            }
        } catch (error) {
            console.error('Error saving favourite:', error);
            showAlert('fav-alert', 'Failed to connect to the server.', 'error');
        }
    }
}

// --------------------------------------------------------------------
// 9. Save to Favourites (Direct function)
// --------------------------------------------------------------------
function saveToFavourites(destinationId) {
    toggleFavouriteOnDetails(destinationId, false);
}

// --------------------------------------------------------------------
// 10. Load Favourites Page (favourites.html)
// --------------------------------------------------------------------
async function loadFavouritesPage() {
    const listContainer = document.getElementById('favourites-list');
    const clearBtn = document.getElementById('clear-all-favs-btn');
    if (!listContainer) return;

    try {
        const response = await fetch('/api/favourites');

        if (response.status === 401) {
            if (clearBtn) clearBtn.style.display = 'none';
            listContainer.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-icon">🔒</div>
                    <h3>Login Required</h3>
                    <p>You need to be logged in to view your favourite travel destinations.</p>
                    <a href="login.html" class="btn btn-primary">Login Now</a>
                </div>
            `;
            return;
        }

        const data = await response.json();
        const defaultFavImg = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800';

        if (data.success && data.favourites && data.favourites.length > 0) {
            if (clearBtn) clearBtn.style.display = 'inline-flex';

            listContainer.innerHTML = data.favourites.map(item => `
                <div class="destination-card" id="fav-card-${item.destination_id}">
                    <div class="card-image-wrap">
                        <img 
                            src="${item.image_url || defaultFavImg}" 
                            alt="${escapeHtml(item.name)}"
                            onerror="this.onerror=null; this.src='${defaultFavImg}';"
                        >
                        <span class="card-badge" style="background: rgba(220, 38, 38, 0.85);">❤️ Favourite</span>
                    </div>
                    <div class="card-content">
                        <div class="card-header">
                            <h3 class="card-title">${escapeHtml(item.name)}</h3>
                        </div>
                        <div class="card-location">
                            📍 ${escapeHtml(item.location)}
                        </div>
                        <p class="card-desc">${escapeHtml(item.description)}</p>
                        <div class="card-meta">
                            <div class="meta-item">
                                <span class="meta-label">Best Season</span>
                                <span class="meta-value">🗓️ ${escapeHtml(item.best_time)}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Est. Budget</span>
                                <span class="meta-value">💰 ${escapeHtml(item.budget)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <a href="destination.html?id=${item.destination_id}" class="btn btn-primary" style="flex: 1;">
                            View Details
                        </a>
                        <button onclick="removeFavourite(${item.destination_id}, '${escapeHtml(item.name)}')" class="btn btn-danger" title="Remove from Favourites">
                            🗑️ Remove
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            if (clearBtn) clearBtn.style.display = 'none';
            listContainer.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-icon">❤️</div>
                    <h3>No favourites saved yet</h3>
                    <p>Browse our destinations and click "Save to Favourites" to build your bucket list!</p>
                    <a href="index.html" class="btn btn-primary">Explore Destinations</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading favourites:', error);
    }
}

// --------------------------------------------------------------------
// 11. Remove from Favourites (Single Item)
// --------------------------------------------------------------------
async function removeFavourite(destinationId, name) {
    try {
        const response = await fetch(`/api/favourites/${destinationId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        // Smoothly remove card from UI
        const card = document.getElementById(`fav-card-${destinationId}`);
        if (card) {
            card.remove();
        }

        // If no cards left in the grid, refresh empty state
        const listContainer = document.getElementById('favourites-list');
        if (listContainer && listContainer.querySelectorAll('.destination-card').length === 0) {
            loadFavouritesPage();
        }
    } catch (error) {
        console.error('Error deleting favourite:', error);
    }
}

// --------------------------------------------------------------------
// 11b. Clear All Favourites
// --------------------------------------------------------------------
async function clearAllFavourites() {
    if (!confirm('Are you sure you want to remove all destinations from your favourites?')) {
        return;
    }

    try {
        const response = await fetch('/api/favourites', {
            method: 'DELETE'
        });

        const data = await response.json();
        if (data.success) {
            loadFavouritesPage();
        } else {
            alert(data.message || 'Could not clear favourites.');
        }
    } catch (error) {
        console.error('Error clearing favourites:', error);
    }
}

// --------------------------------------------------------------------
// 12. Dynamic Features: Weather, Trip Estimator, Reviews, Share Link
// --------------------------------------------------------------------

// Simulated Realistic Live Weather Generator based on destination characteristics
function getWeatherInfo(placeName) {
    const name = (placeName || '').toLowerCase();
    
    if (name.includes('ladakh') || name.includes('manali') || name.includes('shimla') || name.includes('gangtok') || name.includes('darjeeling')) {
        return {
            temp: '14°C',
            condition: 'Cool Mountain Breeze 🏔️',
            icon: '⛅',
            humidity: '48%',
            wind: '18 km/h'
        };
    }
    if (name.includes('goa') || name.includes('andaman') || name.includes('pondicherry') || name.includes('kanyakumari') || name.includes('gokarna')) {
        return {
            temp: '29°C',
            condition: 'Warm Tropical Sun 🏖️',
            icon: '☀️',
            humidity: '74%',
            wind: '12 km/h'
        };
    }
    if (name.includes('munnar') || name.includes('coorg') || name.includes('shillong') || name.includes('ooty') || name.includes('kerala')) {
        return {
            temp: '21°C',
            condition: 'Pleasant & Lush Green 🌿',
            icon: '🌤️',
            humidity: '68%',
            wind: '9 km/h'
        };
    }
    if (name.includes('jaipur') || name.includes('jaisalmer') || name.includes('udaipur')) {
        return {
            temp: '27°C',
            condition: 'Sunny & Clear Skies 🏰',
            icon: '☀️',
            humidity: '35%',
            wind: '11 km/h'
        };
    }

    // Default pleasant weather
    return {
        temp: '24°C',
        condition: 'Clear & Pleasant 🌤️',
        icon: '🌤️',
        humidity: '55%',
        wind: '10 km/h'
    };
}

// Calculate Estimated Trip Cost based on Days & Travelers
function calculateTripCost(budgetString) {
    const daysSelect = document.getElementById('calc-days');
    const travelersSelect = document.getElementById('calc-travelers');
    const display = document.getElementById('calc-cost-display');

    if (!daysSelect || !travelersSelect || !display) return;

    const days = parseInt(daysSelect.value) || 5;
    const travelers = parseInt(travelersSelect.value) || 2;

    // Base cost per person per day (average ₹2,500 to ₹4,000)
    let baseDailyPerPerson = 2800;
    if (budgetString && budgetString.includes('15,000') || budgetString.includes('25,000')) {
        baseDailyPerPerson = 3400;
    } else if (budgetString && budgetString.includes('6,000') || budgetString.includes('8,000')) {
        baseDailyPerPerson = 2200;
    }

    const minTotal = Math.round((baseDailyPerPerson * 0.85 * days * travelers) / 1000) * 1000;
    const maxTotal = Math.round((baseDailyPerPerson * 1.35 * days * travelers) / 1000) * 1000;

    display.textContent = `₹${minTotal.toLocaleString('en-IN')} - ₹${maxTotal.toLocaleString('en-IN')}`;
}

// Handle Traveler Review Submission
function handleReviewSubmit(event, placeName) {
    event.preventDefault();

    const nameInput = document.getElementById('rev-name');
    const starsSelect = document.getElementById('rev-stars');
    const commentInput = document.getElementById('rev-comment');
    const container = document.getElementById('reviews-list-container');

    if (!nameInput || !commentInput || !container) return;

    const name = nameInput.value.trim();
    const stars = parseInt(starsSelect ? starsSelect.value : 5);
    const comment = commentInput.value.trim();

    if (!name || !comment) return;

    const starsDisplay = '⭐'.repeat(stars);

    const newReviewHtml = `
        <div class="review-card" style="border-left: 3px solid var(--primary); animation: fadeIn 0.3s ease;">
            <div class="review-top">
                <div class="reviewer-name">🧑‍💻 ${escapeHtml(name)} <span style="font-size:0.75rem; color:var(--primary); font-weight:600;">• Just now</span></div>
                <div class="review-stars">${starsDisplay}</div>
            </div>
            <p class="review-text">"${escapeHtml(comment)}"</p>
        </div>
    `;

    container.insertAdjacentHTML('afterbegin', newReviewHtml);

    // Reset form inputs
    nameInput.value = '';
    commentInput.value = '';

    showAlert('fav-alert', '🌟 Thank you for sharing your travel review!', 'success');
}

// Copy Share Link to Clipboard
function copyShareLink() {
    navigator.clipboard.writeText(window.location.href)
        .then(() => {
            alert('🔗 Destination link copied to clipboard! Share it with friends and family.');
        })
        .catch(() => {
            alert(`🔗 Share this link: ${window.location.href}`);
        });
}

// --------------------------------------------------------------------
// 13. Helper: Escape HTML to Prevent XSS
// --------------------------------------------------------------------
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// --------------------------------------------------------------------
// 14. Initialize on DOM Load
// --------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
});
