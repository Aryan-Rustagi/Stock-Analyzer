const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

async function register(req, res) {
    try {
        const { name, email, password } = req.body || {};

        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ message: 'Name is required' });
        }
        if (name.trim().length < 2 || name.trim().length > 50) {
            return res.status(400).json({ message: 'Name must be between 2 and 50 characters' });
        }

        if (!email || typeof email !== 'string' || !email.trim()) {
            return res.status(400).json({ message: 'Email is required' });
        }
        const cleanEmail = email.trim().toLowerCase();
        if (!EMAIL_REGEX.test(cleanEmail)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }

        if (!password || typeof password !== 'string') {
            return res.status(400).json({ message: 'Password is required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        const userExists = await User.findOne({ email: cleanEmail });
        if (userExists) {
            return res.status(400).json({ message: 'An account with this email already exists' });
        }

        const user = await User.create({
            name: name.trim(),
            email: cleanEmail,
            password: password
        });

        return res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id)
        });
    } catch(error) {
        console.error('Registration error:', error);
        return res.status(500).json({ message: 'Registration failed. Please try again later.' });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body || {};

        if (!email || typeof email !== 'string' || !email.trim()) {
            return res.status(400).json({ message: 'Email is required' });
        }
        const cleanEmail = email.trim().toLowerCase();

        if (!password || typeof password !== 'string' || !password) {
            return res.status(400).json({ message: 'Password is required' });
        }

        const user = await User.findOne({ email: cleanEmail });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        return res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id)
        });
    } catch(error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Login failed. Please try again later.' });
    }
}

module.exports = { register, login };
