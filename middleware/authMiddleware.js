// This middleware runs BEFORE any protected route (like POST/PUT/DELETE on products).
// It checks that the request has a valid login token attached.
// If it doesn't, the request is rejected before it ever touches the database.

const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    // The frontend sends the token like this: "Authorization: Bearer <token>"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // grabs the part after "Bearer "

    if (!token) {
        return res.status(401).json({ message: 'No token provided — please log in' });
    }

    // Check the token was signed with our secret and hasn't expired
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token — please log in again' });
        }

        req.user = decoded; // attach the decoded info (username) to the request
        next(); // token is valid — let the request continue to the actual route
    });
}

module.exports = verifyToken;
