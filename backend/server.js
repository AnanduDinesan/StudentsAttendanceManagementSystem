const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'attendance_system',
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to the database');
});

// Login Endpoint
app.post('/login', (req, res) => {
    const { email, password, role } = req.body;

    const query = 'SELECT user_id, role FROM users WHERE email = ? AND password = ? AND role = ?';
    db.query(query, [email, password, role], (err, results) => {
        if (err) {
            console.error('Error during login:', err);
            res.status(500).send({ message: 'Server error' });
        } else if (results.length > 0) {
            const { user_id, role } = results[0];
            res.send({ message: 'Login successful', user_id, role });
        } else {
            res.status(401).send({ message: 'Invalid credentials' });
        }
    });
});

// Fetch all students
app.get('/students', (req, res) => {
    const query = 'SELECT user_id AS id, name FROM users WHERE role = "user"';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching students:', err);
            res.status(500).send({ message: 'Failed to fetch students' });
        } else {
            res.json(results);
        }
    });
});

// Mark attendance
app.post('/mark-attendance', (req, res) => {
    const { date, attendance } = req.body;

    const attendanceRecords = Object.entries(attendance).map(([studentId, status]) => [
        studentId,
        date,
        status,
        1 // Assuming admin ID is 1 for now
    ]);

    const query = `
        INSERT INTO attendance (student_id, date, status, marked_by)
        VALUES ? ON DUPLICATE KEY UPDATE status = VALUES(status)
    `;

    db.query(query, [attendanceRecords], (err) => {
        if (err) {
            console.error('Error marking attendance:', err);
            res.status(500).send({ message: 'Failed to mark attendance' });
        } else {
            res.send({ message: 'Attendance marked successfully' });
        }
    });
});


// Student registration
app.post('/register-student', (req, res) => {
    const { name, email, password } = req.body;
    const role = 'user'; // Default role

    const query = `
        INSERT INTO users (name, email, password, role)
        VALUES (?, ?, ?, ?)
    `;

    db.query(query, [name, email, password, role], (err) => {
        if (err) {
            console.error('Error registering student:', err);
            res.status(500).send({ message: 'Failed to register student' });
        } else {
            res.send({ message: 'Student registered successfully' });
        }
    });
});

// Fetch user attendance
app.get('/user-attendance/:userId', (req, res) => {
    const userId = req.params.userId;

    const query = `
        SELECT date, status 
        FROM attendance 
        WHERE student_id = ?
        ORDER BY date ASC
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching attendance:', err);
            res.status(500).send({ message: 'Failed to fetch attendance' });
        } else {
            res.send(results);
        }
    });
});

// Fetch user name
app.get('/users/:userId', (req, res) => {
    const userId = req.params.userId;

    const query = 'SELECT name FROM users WHERE user_id = ?';

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user name:', err);
            res.status(500).send({ message: 'Failed to fetch user name' });
        } else if (results.length > 0) {
            res.send(results[0]);
        } else {
            res.status(404).send({ message: 'User not found' });
        }
    });
});

// Endpoint to delete a user by ID
//app.delete('/delete-user/:userId', (req, res) => {
//    const { userId } = req.params;
//
//    const query = 'DELETE FROM users WHERE user_id = ?';
//    db.query(query, [userId], (err, result) => {
//        if (err) {
//            console.error('Error deleting user:', err);
//            return res.status(500).json({ message: 'Failed to delete the user.' });
//        }
//
//        if (result.affectedRows === 0) {
//            return res.status(404).json({ message: 'User not found.' });
//        }
//
//        res.status(200).json({ message: 'User deleted successfully.' });
//    });
//});


// Start the server
app.listen(5000, () => {
    console.log('Server is running on port 5000');
});
