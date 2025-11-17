// client/src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; 
import { FaCalendarAlt, FaClock, FaUserFriends, FaClipboardList, FaArrowLeft } from 'react-icons/fa'; // Import icons

// -------------------------------------------------------------------------
// IMPORTANT: Update this URL with your actual Render backend service URL!
// -------------------------------------------------------------------------
const API_URL = process.env.NODE_ENV === 'production' 
    ? 'https://your-render-app-name.onrender.com' 
    : 'http://localhost:5000';
// -------------------------------------------------------------------------

// Mock data for the dashboard (In production, this would come from an API)
const MOCK_BOOKINGS = [
    { id: 101, restaurant: "The Local Bistro", date: "2025-11-20", time: "7:00 PM", party: 2, status: "Confirmed" },
    { id: 102, restaurant: "Café Solace", date: "2025-11-15", time: "1:30 PM", party: 4, status: "Completed" },
    { id: 103, restaurant: "Grill Master PH", date: "2025-12-05", time: "6:30 PM", party: 6, status: "Confirmed" },
];


function App() {
    // State to manage the current view: 'home' (search) or 'dashboard'
    const [currentView, setCurrentView] = useState('home'); 
    
    // Search states (unchanged)
    const [searchParams, setSearchParams] = useState({
        date: new Date().toISOString().split('T')[0],
        time: '19:00',
        partySize: 2
    });
    const [restaurants, setRestaurants] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQueryDisplay, setSearchQueryDisplay] = useState('');
    
    // Dashboard states (new)
    const [userBookings, setUserBookings] = useState(MOCK_BOOKINGS);

    // --- FR-C01, FR-C02: Handle Search ---
    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        
        setIsLoading(true);
        setRestaurants([]); 
        
        const { date, time, partySize } = searchParams;

        setSearchQueryDisplay(`Available Reservations for (${partySize} Guests, ${new Date(date).toLocaleDateString()}, ${time})`);
        
        try {
            const response = await axios.post(`${API_URL}/api/search`, searchParams);
            setRestaurants(response.data);
        } catch (error) {
            console.error('Error fetching restaurants:', error);
            alert('Service connection failed. Please try again later.'); 
        } finally {
            setIsLoading(false);
        }
    };
    
    // FR-C03, FR-C05: Handle Booking (Simplified)
    const handleBooking = async (restaurantId, restaurantName) => {
        const { date, time, partySize } = searchParams;
        
        if (!window.confirm(`Confirm booking at ${restaurantName} for ${partySize} people at ${time}?\n(A small deposit of ₱100 is required.)`)) {
            return;
        }

        try {
            const bookingData = {
                restaurantId,
                customerName: 'Demo User',
                partySize,
                bookingTime: `${date}T${time}:00`,
                deposit: 100.00
            };
            
            await axios.post(`${API_URL}/api/book`, bookingData);
            
            alert(`✅ BOOKING CONFIRMED! Your table at ${restaurantName} is reserved.`);
            
            // Re-run search and simulate adding the new booking to the dashboard
            handleSearch({ preventDefault: () => {} });
            const newBooking = { 
                id: Math.floor(Math.random() * 1000), 
                restaurant: restaurantName, 
                date: date, 
                time: time, 
                party: partySize, 
                status: "Confirmed" 
            };
            setUserBookings(prev => [newBooking, ...prev]);

        } catch (error) {
            console.error('Error creating booking:', error);
            alert('Failed to complete booking. The slot might have just been taken.');
        }
    };
    
    // FR-C04: Handle Cancellation (Dashboard feature)
    const handleCancel = (id) => {
        if (window.confirm("Are you sure you want to cancel this booking?")) {
            setUserBookings(userBookings.map(b => 
                b.id === id ? { ...b, status: 'Cancelled' } : b
            ));
            alert(`Booking #${id} cancelled.`);
        }
    };

    // Run initial search on component load
    useEffect(() => {
        handleSearch();
    }, []); 
    
    // --- Render Functions ---

    // 1. Hero Section (New Introduction)
    const renderHeroSection = () => (
        <section id="hero-section" className="hero-section">
            <div className="container">
                <h1>The Easiest Way to Reserve a Table.</h1>
                <p>No lines, no hassle. Discover local favorites and book instantly.</p>
                <button 
                    className="btn accent" 
                    onClick={() => document.getElementById('search-bar').scrollIntoView({ behavior: 'smooth' })}
                >
                    Start Booking Now
                </button>
            </div>
        </section>
    );

    // 2. Search and Results View
    const renderSearchView = () => (
        <>
            {renderHeroSection()}
            
            <main className="container">
                {/* Search & Filter Section (FR-C01) */}
                <section id="search-bar" className="panel search-panel">
                    <h2>Find Your Perfect Table</h2>
                    <form id="booking-form" className="form-grid" onSubmit={handleSearch}>
                        
                        <div className="input-group">
                            <label htmlFor="date"><FaCalendarAlt /> Date</label>
                            <input type="date" id="date" value={searchParams.date} onChange={(e) => setSearchParams({...searchParams, date: e.target.value})} required />
                        </div>
                        
                        <div className="input-group">
                            <label htmlFor="time"><FaClock /> Time</label>
                            <select id="time" value={searchParams.time} onChange={(e) => setSearchParams({...searchParams, time: e.target.value})} required>
                                <option value="18:00">6:00 PM</option>
                                <option value="19:00">7:00 PM</option>
                                <option value="20:00">8:00 PM</option>
                            </select>
                        </div>
                        
                        <div className="input-group">
                            <label htmlFor="party-size"><FaUserFriends /> Guests</label>
                            <select id="party-size" value={searchParams.partySize} onChange={(e) => setSearchParams({...searchParams, partySize: parseInt(e.target.value)})} required>
                                <option value={2}>2 People</option>
                                <option value={4}>4 People</option>
                                <option value={6}>6 People</option>
                            </select>
                        </div>
                        
                        <button type="submit" className="btn primary search-button">
                            {isLoading ? 'Searching...' : 'Search Availability'}
                        </button>
                    </form>
                </section>

                {/* Results Section */}
                <section id="results" className="results-list">
                    <h3>{searchQueryDisplay}</h3>

                    {isLoading && <p>Searching real-time availability...</p>}
                    
                    {!isLoading && restaurants.length > 0 && restaurants.map(restaurant => (
                        <article className="restaurant-card" key={restaurant.id}>
                            <div className="details">
                                <h4 className="restaurant-name">{restaurant.name} <span className="rating">⭐️ 4.5</span></h4>
                                <p className="cuisine-type">{restaurant.cuisine}</p>
                                <p className="tag-promo">Remaining Slots: **{restaurant.available_slots}**</p>
                            </div>
                            <div className="availability-times">
                                <button 
                                    className="btn accent book-button" 
                                    onClick={() => handleBooking(restaurant.id, restaurant.name)}
                                >
                                    Book ({searchParams.time})
                                </button>
                            </div>
                        </article>
                    ))}

                    {!isLoading && restaurants.length === 0 && (
                        <p>No restaurants found matching your criteria. Try another time or party size!</p>
                    )}
                </section>

            </main>
        </>
    );
    
    // 3. User Dashboard View (New Dashboard)
    const renderDashboardView = () => (
        <main className="container dashboard-view">
            <button className="btn back-button" onClick={() => setCurrentView('home')}>
                <FaArrowLeft /> Back to Search
            </button>
            <section className="panel">
                <h2><FaClipboardList /> My Reservations</h2>
                {userBookings.length === 0 ? (
                    <p>You have no active or past bookings.</p>
                ) : (
                    <div className="booking-table">
                        <div className="table-header">
                            <span>Restaurant</span>
                            <span>Date & Time</span>
                            <span>Party</span>
                            <span>Status</span>
                            <span>Action</span>
                        </div>
                        {userBookings.map(booking => (
                            <div className={`table-row status-${booking.status.toLowerCase()}`} key={booking.id}>
                                <span>{booking.restaurant}</span>
                                <span>{booking.date} @ {booking.time}</span>
                                <span>{booking.party}</span>
                                <span className="status-badge">{booking.status}</span>
                                <span>
                                    {booking.status === 'Confirmed' && (
                                        <button 
                                            className="btn btn-cancel" 
                                            onClick={() => handleCancel(booking.id)}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );

    // Main App Render
    return (
        <div className="app-container">
            {/* Header Structure */}
            <header className="app-header">
                <div className="container">
                    <h1 className="logo">Reserve.PH</h1>
                    <nav>
                        <a href="#book" onClick={() => setCurrentView('home')}>Book</a>
                        <a href="#dashboard" onClick={() => setCurrentView('dashboard')}>Dashboard</a>
                        <a href="#login">Login</a>
                    </nav>
                </div>
            </header>

            {currentView === 'home' ? renderSearchView() : renderDashboardView()}

            <footer className="app-footer">
                <div className="container">
                    <p>&copy; 2025 Reserve.PH. The easiest way to book local.</p>
                </div>
            </footer>
        </div>
    );
}

export default App;