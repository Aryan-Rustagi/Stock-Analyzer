const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

function generateToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

async function register(req, res) {
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({ name, email, password });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id)
        });
    }
    catch(error) {
        res.status(500).json({ message: 'Server error' });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id)
        });
    }
    catch(error) {
        res.status(500).json({ message: 'Server error' });
    }
}

module.exports = { register, login };