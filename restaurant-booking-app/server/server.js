// server/server.js
const express = require('express');
const cors = require('cors');
const db = require('./db'); // Import the database connection module
require('dotenv').config();
const path = require('path'); // <<< FIX 1: IMPORT 'path' MODULE

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allows React client to talk to this server
app.use(express.json()); // For parsing application/json data

// --- API Routes ---

/**
 * POST /api/search
 * Implements FR-C01 & FR-C02: Searches for available tables based on criteria.
 */
app.post('/api/search', async (req, res) => {
    const { date, time, partySize } = req.body;
    
    // Construct the timestamp for the booking
    const targetTime = new Date(`${date}T${time}:00`);
    const oneHourBuffer = new Date(targetTime.getTime() - 3600000); // 1 hour buffer for overlap checking

    try {
        // Query PostgreSQL for restaurants with available capacity near the target time
        // Note: The HAVING clause already ensures capacity is met, so we select all relevant data.
        const availabilityQuery = `
            SELECT 
                r.id, r.name, r.capacity, r.cuisine,
                COALESCE(SUM(b.party_size), 0) AS booked_count
            FROM restaurants r
            LEFT JOIN bookings b ON r.id = b.restaurant_id
            AND b.booking_time >= $1 AND b.booking_time <= $2
            WHERE r.subscription_active = TRUE
            GROUP BY r.id, r.name, r.capacity, r.cuisine
            HAVING r.capacity >= $3 + COALESCE(SUM(b.party_size), 0)
            ORDER BY r.name;
        `;
        
        // Use the partySize requested by the customer in the query
        const { rows } = await db.query(availabilityQuery, [oneHourBuffer, targetTime, partySize]);
        
        // Transform the data to include remaining slots
        const availableRestaurants = rows.map(r => ({
            ...r,
            // FIX 2: Correctly calculate the available slots based on current bookings
            available_slots: r.capacity - (r.booked_count || 0), 
        }));

        res.json(availableRestaurants);

    } catch (err) {
        console.error('Search API Error:', err.message);
        res.status(500).json({ error: 'Database query failed.' });
    }
});

/**
 * POST /api/book
 * Implements FR-C03 & FR-C05: Creates a new booking. (Assumes payment success)
 */
app.post('/api/book', async (req, res) => {
    const { restaurantId, customerName, partySize, bookingTime, deposit } = req.body;
    
    try {
        const result = await db.query(
            'INSERT INTO bookings (restaurant_id, customer_name, party_size, booking_time, deposit_amount, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [restaurantId, customerName, partySize, bookingTime, deposit || 0.00, 'Confirmed']
        );
        res.status(201).json({ 
            message: 'Booking successful!', 
            booking: result.rows[0] 
        });
    } catch (err) {
        console.error('Booking API Error:', err.message);
        res.status(500).json({ error: 'Failed to create booking.' });
    }
});

// GET: Simple root route to confirm the server is running (Development Check)
app.get('/', (req, res) => {
    res.json({ message: 'Server is running! API ready on /api/search' });
});


// Serve static assets in production (optional for Render but good practice)
if (process.env.NODE_ENV === 'production') {
    // FIX 3: Removed duplicate code block and ensured it's correctly placed at the end.
    app.use(express.static(path.join(__dirname, 'client/build')));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
    });
}


app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});