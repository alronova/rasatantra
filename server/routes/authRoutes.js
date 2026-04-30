const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  username: Joi.string().min(3).max(30).required(),
  name: Joi.string().min(2).max(100).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const buildToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const sanitizeUser = (user) => ({
  id: user._id,
  email: user.email,
  username: user.username,
  name: user.name,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

router.post('/register', async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        message: 'Invalid registration payload',
        errors: error.details.map((detail) => detail.message),
      });
    }

    const normalizedEmail = value.email.toLowerCase();

    const [existingEmail, existingUsername] = await Promise.all([
      User.findOne({ email: normalizedEmail }),
      User.findOne({ username: value.username }),
    ]);

    if (existingEmail) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    if (existingUsername) {
      return res.status(409).json({ message: 'Username is already taken' });
    }

    const hashedPassword = await bcrypt.hash(value.password, 10);

    const user = await User.create({
      ...value,
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = buildToken(user._id.toString());

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        message: 'Invalid login payload',
        errors: error.details.map((detail) => detail.message),
      });
    }

    const user = await User.findOne({ email: value.email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(value.password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = buildToken(user._id.toString());

    return res.json({
      message: 'Login successful',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', protect, async (req, res) => {
  return res.json({ user: sanitizeUser(req.user) });
});

module.exports = router;
