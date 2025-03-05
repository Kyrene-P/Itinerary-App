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

//Route: Get All Itineraries for a user
app.get('/api/itineraries', authenticateToken, async (req, res) => {
    try {
        const connection = await createConnection();

        const [rows] = await connection.execute(
            'SELECT * FROM itineraries WHERE user_email = ?',
            [req.user.email]
        );

        await connection.end();

        res.status(200).json({ itineraries: rows });
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

        const [rows] = await connection.execute(
            'SELECT * FROM itineraries WHERE id = ? and user_email = ?',
            [itineraryId, req.user.email]
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
        const connection = await createConnection();
        const createdAt = new Date();
        const updatedAt = createdAt;

        const [result] = await connection.execute(
            `INSERT INTO itineraries (user_email, title, description, start_date, end_date, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.user.email, title, description || '', start_date, end_date, createdAt, updatedAt]
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

        const [result] = await connection.execute(
            `DELETE FROM itineraries WHERE id = ? AND user_email = ?`,
            [itineraryId, req.user.email]
        );

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
//////////////////////////////////////
//END ROUTES TO HANDLE API REQUESTS
//////////////////////////////////////


// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});