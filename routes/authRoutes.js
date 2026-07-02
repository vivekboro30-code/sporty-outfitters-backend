// Handles POST /api/auth/login
// Checks the username/password against your .env file, and if correct,
// hands back a signed token the frontend will use for every future
// add/edit/delete request.

const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    const isValid =
        username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD;

    if (!isValid) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Token is valid for 8 hours — after that, you'll need to log in again
    const token = jwt.sign(
        { username },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );

    res.json({ token });
});

module.exports = router;
