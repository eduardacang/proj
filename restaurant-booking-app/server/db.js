// server/db.js
const { Pool } = require('pg');
require('dotenv').config();

// Connect using environment variables provided by Render
// RENDER will provide process.env.DATABASE_URL in production
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for connecting to external Render/Cloud DBs
    }
});

pool.connect((err, client, release) => {
    if (err) {
        // This is the error path you were seeing (ECONNREFUSED)
        return console.error('Error acquiring client: Connection failed or DB is offline', err.stack);
    }
    console.log('✅ Successfully connected to PostgreSQL!');
    release();
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};
// --- Initial SQL Schema (Run this manually in your Render PSQL dashboard) ---
/*
CREATE TABLE restaurants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    capacity INT NOT NULL,
    subscription_active BOOLEAN DEFAULT TRUE,
    daily_commission_rate NUMERIC(3, 2) DEFAULT 0.10, -- Revenue Stream #2: 10%
    city VARCHAR(100),
    cuisine VARCHAR(100)
);

CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    restaurant_id INT REFERENCES restaurants(id),
    customer_name VARCHAR(100),
    party_size INT NOT NULL,
    booking_time TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'Confirmed',
    deposit_amount NUMERIC(10, 2) DEFAULT 0.00
);
*/