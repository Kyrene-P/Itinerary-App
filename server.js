require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the "public" folder
app.use(express.static('public'));

//////////////////////////////////////
//ROUTES TO SERVE HTML FILES
//////////////////////////////////////
// Default route to serve logon.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/logon.html');
});

// Route to serve dashboard.html
app.get('/dashboard', (req, res) => {
    res.sendFile(__dirname + '/public/dashboard.html');
});

// Routes to get to the itinerary.html
app.get('/dashboard/itinerary', (req,res) => {
    res.sendFile(__dirname  + '/public/itinerary.html')
})

//////////////////////////////////////
//END ROUTES TO SERVE HTML FILES
//////////////////////////////////////


/////////////////////////////////////////////////
//HELPER FUNCTIONS AND AUTHENTICATION MIDDLEWARE
/////////////////////////////////////////////////
// Helper function to create a MySQL connection
async function createConnection() {
    return await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });
}

// **Authorization Middleware: Verify JWT Token and Check User in Database**
async function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token.' });
        }

        try {
            const connection = await createConnection();

            // Query the database to verify that the email is associated with an active account
            const [rows] = await connection.execute(
                'SELECT email FROM user WHERE email = ?',
                [decoded.email]
            );

            await connection.end();  // Close connection

            if (rows.length === 0) {
                return res.status(403).json({ message: 'Account not found or deactivated.' });
            }

            req.user = decoded;  // Save the decoded email for use in the route
            next();  // Proceed to the next middleware or route handler
        } catch (dbError) {
            console.error(dbError);
            res.status(500).json({ message: 'Database error during authentication.' });
        }
    });
}
// generates a random Id for itineraries
async function generateUniqueId() {
    let isUnique = false;
    let itineraryId;

    while (!isUnique) {
        // Generate a 9-digit random number
        itineraryId = Math.floor(100000000 + Math.random() * 900000000);

        
        const connection = await createConnection();
        const [rows] = await connection.execute("SELECT COUNT(*) AS count FROM itineraries WHERE id = ?", [itineraryId]);

        await connection.end(); //close connection
        if (rows[0].count === 0) {
            isUnique = true;
        }
    }

    return itineraryId;
}
/////////////////////////////////////////////////
//END HELPER FUNCTIONS AND AUTHENTICATION MIDDLEWARE
/////////////////////////////////////////////////


//////////////////////////////////////
//ROUTES TO HANDLE API REQUESTS
//////////////////////////////////////
// Route: Create Account
app.post('/api/create-account', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const connection = await createConnection();
        const hashedPassword = await bcrypt.hash(password, 10);  // Hash password

        const [result] = await connection.execute(
            'INSERT INTO user (email, password) VALUES (?, ?)',
            [email, hashedPassword]
        );

        await connection.end();  // Close connection

        res.status(201).json({ message: 'Account created successfully!' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: 'An account with this email already exists.' });
        } else {
            console.error(error);
            res.status(500).json({ message: 'Error creating account.' });
        }
    }
});

// Route: Logon
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const connection = await createConnection();

        const [rows] = await connection.execute(
            'SELECT * FROM user WHERE email = ?',
            [email]
        );

        await connection.end();  // Close connection

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const user = rows[0];

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error logging in.' });
    }
});

// Route: Get All Email Addresses
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const connection = await createConnection();

        const [rows] = await connection.execute('SELECT email FROM user');

        await connection.end();  // Close connection

        const emailList = rows.map((row) => row.email);
        res.status(200).json({ emails: emailList });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving email addresses.' });
    }
});

// Route: Get All Itineraries for a user (including joined itineraries)
app.get('/api/itineraries', authenticateToken, async (req, res) => {
    try {
        const connection = await createConnection();

        // Fetch itineraries where user is the creator
        const [ownedItineraries] = await connection.execute(
            'SELECT * FROM itineraries WHERE user_email = ?',
            [req.user.email]
        );

        // Fetch itineraries where user is a participant (joined via invite code)
        const [joinedItineraries] = await connection.execute(
            `SELECT itineraries.* 
             FROM itineraries 
             JOIN itinerary_users ON itineraries.id = itinerary_users.itinerary_id 
             WHERE itinerary_users.user_email = ?`,
            [req.user.email]
        );

        await connection.end();

        // Combine both owned and joined itineraries
        const allItineraries = [...ownedItineraries, ...joinedItineraries];

        res.status(200).json({ itineraries: allItineraries });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving itineraries.' });
    }
});



//Route: Get Information of a Specific Itinerary
app.get('/api/itineraries/:id', authenticateToken, async (req, res) => {
    try {
        const itineraryId = req.params.id;
        const connection = await createConnection();

        // Fetch the itinerary if the user is the creator OR has joined
        const [rows] = await connection.execute(
            `SELECT i.* 
             FROM itineraries i
             LEFT JOIN itinerary_users iu ON i.id = iu.itinerary_id
             WHERE i.id = ? AND (i.user_email = ? OR iu.user_email = ?)`,
            [itineraryId, req.user.email, req.user.email]
        );

        await connection.end();

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Itinerary not found or access denied.' });
        }

        res.status(200).json(rows[0]); // Send itinerary details
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving itinerary details.' });
    }
});


// Route: Create a new itinerary
app.post('/api/itineraries', authenticateToken, async (req, res) => {
    const { title, description, start_date, end_date } = req.body;

    // Validate required fields
    if (!title || !start_date || !end_date) {
        return res.status(400).json({ message: 'Title, start date, and end date are required.' });
    }

    try {
        const itineraryId = await generateUniqueId();

        const connection = await createConnection();
        const createdAt = new Date();
        const updatedAt = createdAt;

        const [result] = await connection.execute(
            `INSERT INTO itineraries (id, user_email, title, description, start_date, end_date, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [itineraryId, req.user.email, title, description || '', start_date, end_date, createdAt, updatedAt]
        );

        await connection.end();

        res.status(201).json({ 
            message: 'Itinerary created successfully!', 
            itineraryId: result.insertId 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating itinerary.' });
    }
});

// Route: Update the itinerary with new information
app.put('/api/itineraries/:id', authenticateToken, async (req, res) => {
    const { title, description } = req.body;
    const itineraryId = req.params.id;

    if (!title) {
        return res.status(400).json({ message: 'Title is required.' });
    }

    try {
        const connection = await createConnection();
        const updatedAt = new Date();

        const [result] = await connection.execute(
            `UPDATE itineraries 
             SET title = ?, description = ?, updated_at = ? 
             WHERE id = ? AND user_email = ?`,
            [title, description || '', updatedAt, itineraryId, req.user.email]
        );

        await connection.end();

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Itinerary not found or unauthorized.' });
        }

        res.status(200).json({ message: 'Itinerary updated successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating itinerary.' });
    }
});

// Route: Delete an itinerary
app.delete('/api/itineraries/:id', authenticateToken, async (req, res) => {
    const itineraryId = req.params.id;

    try {
        const connection = await createConnection();

        const [isOwner] = await connection.execute(
            `SELECT * FROM itineraries WHERE id = ? AND user_email = ?`,
            [itineraryId, req.user.email]
        );

        let result;

        if(isOwner.length > 0){
            // if the User is the owner, the itinerary is deleted from the itineraries table
            [result] = await connection.execute(
                `DELETE FROM itineraries WHERE id = ? AND user_email = ?`,
                [itineraryId, req.user.email]
            );
        }else{
            // if the User is NOT the owner, they are removed from the itinerary_users table
            [result] = await connection.execute(
                `DELETE FROM itinerary_users WHERE itinerary_id = ? AND user_email = ?`,
                [itineraryId, req.user.email]
            );
        }

        await connection.end();

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Itinerary not found or unauthorized.' });
        }

        res.status(200).json({ message: 'Itinerary deleted successfully!' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting itinerary.' });
    }
});

//Route: Join an itinerary
app.post('/api/itineraries/join', authenticateToken, async (req, res) => {
    const { inviteCode } = req.body;
    if (!inviteCode) {
        return res.status(400).json({ message: 'Invite code is required.' });
    }

    try {
        const connection = await createConnection();
        const [rows] = await connection.execute('SELECT * FROM itineraries WHERE id = ?', [inviteCode]);
        if (rows.length === 0) {
            await connection.end();
            return res.status(404).json({ message: 'Itinerary not found.' });
        }

        const [existing] = await connection.execute(
            'SELECT * FROM itinerary_users WHERE itinerary_id = ? AND user_email = ?',
            [inviteCode, req.user.email]
        );
        if (existing.length > 0) {
            await connection.end();
            return res.status(409).json({ message: 'You are already part of this itinerary.' });
        }

        await connection.execute(
            'INSERT INTO itinerary_users (itinerary_id, user_email, role) VALUES (?, ?, ?)',
            [inviteCode, req.user.email, 'member']
        );
        await connection.end();
        res.status(200).json({ message: 'Successfully joined the itinerary!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error joining itinerary.' });
    }
});
// Route: Get filtered activities for a specific itinerary
app.get('/api/itineraries/:id/activities', authenticateToken, async (req, res) => {
    const itineraryId = req.params.id;

    try {
        const connection = await createConnection();

        // Base query
        let query = `
    SELECT 
        al.ActivityId, al.ActivityName, al.ActivityLocation, al.ActivityMood, al.ActivityCost,
        ROUND(AVG(ar.rating), 1) AS averageRating
    FROM UserActivities a
    JOIN itineraries i ON i.id = a.id
    LEFT JOIN ActivitiesList al ON al.ActivityId = a.ActivityID
    LEFT JOIN ActivityRatings ar ON ar.ActivityID = al.ActivityId
    WHERE a.id = ?
    GROUP BY al.ActivityId
`;


        const params = [itineraryId];

        const [activities] = await connection.execute(query, params);
        await connection.end();

        res.status(200).json({ activities });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving itinerary activities.' });
    }
});

//Route: add activities
app.post('/api/itineraries/:id/activities', authenticateToken, async (req, res) => {
    const itineraryId = req.params.id;
    const { limit, location, mood, minCost, maxCost } = req.body; // Filters

    try {
        const connection = await createConnection();

        // Query 5 random activities from ActivitiesList
        let query = `
            SELECT ActivityId FROM ActivitiesList
            WHERE 1=1
        `;

        const params = [];
         // Apply optional filters dynamically
        if (location) {
            query += ` AND ActivityLocation = ?`;
            params.push(location);
        }
        if (mood) {
            query += ` AND ActivityMood = ?`;
            params.push(mood);
        }
        if (minCost) {
            query += ` AND ActivityCost >= ?`;
            params.push(parseFloat(minCost));
        }
        if (maxCost) {
            query += ` AND ActivityCost <= ?`;
            params.push(parseFloat(maxCost));
        }

        query += ` ORDER BY RAND() LIMIT ?`;
        params.push(parseInt(limit));

        const [activities] = await connection.execute(query, params);

        // Insert selected activities into UserActivities
        for (const activity of activities) {
            await connection.execute(
                `INSERT INTO UserActivities (id, ActivityId) VALUES (?, ?)`,
                [itineraryId, activity.ActivityId]
            );
        }

        res.status(201).json({ message: 'Activities added successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error adding activities' });
    }
});
//Route: Activity Ratings
app.post('/api/activities/:activityId/rate', authenticateToken, async (req, res) => {
    const { activityId } = req.params;
    const { rating } = req.body;
    const email = req.user.email;

    if (!rating || rating < 0.5 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 0.5 and 5.0' });
    }

    try {
        const connection = await createConnection();

        // Check if user has already rated the activity
        const [existing] = await connection.execute(
            'SELECT * FROM ActivityRatings WHERE email = ? AND ActivityID = ?',
            [email, activityId]
        );

        if (existing.length > 0) {
            // Update the existing rating
            await connection.execute(
                'UPDATE ActivityRatings SET rating = ? WHERE email = ? AND ActivityID = ?',
                [rating, email, activityId]
            );
        } else {
            // Insert new rating
            await connection.execute(
                'INSERT INTO ActivityRatings (email, ActivityID, rating) VALUES (?, ?, ?)',
                [email, activityId, rating]
            );
        }

        await connection.end();
        res.status(200).json({ message: 'Rating submitted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error submitting rating' });
    }
});
app.get('/api/activities/:activityId/rating', authenticateToken, async (req, res) => {
    const { activityId } = req.params;

    try {
        const connection = await createConnection();

        const [rows] = await connection.execute(
            `SELECT 
                (SELECT AVG(rating) FROM ActivityRatings WHERE ActivityID = ?) AS averageRating,
                (SELECT rating FROM ActivityRatings WHERE ActivityID = ? AND email = ?) AS userRating`,
            [activityId, activityId, req.user.email]
        );

        await connection.end();

        const average = rows[0].averageRating;
        res.status(200).json({ averageRating: average ? parseFloat(average.toFixed(1)) : null });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching rating' });
    }
});


//////////////////////////////////////
//END ROUTES TO HANDLE API REQUESTS
//////////////////////////////////////


// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});