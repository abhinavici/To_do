const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const httpError = require("../utils/httpError");
const asyncHandler = require("../utils/asyncHandler");

const MIN_PASSWORD_LENGTH = 6;

// Register
exports.registerUser = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const trimmedName = typeof name === "string" ? name.trim() : "";

  if (!trimmedName || !normalizedEmail || !password) {
    return next(httpError(400, "Name, email, and password are required"));
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return next(httpError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`));
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return next(httpError(400, "User already exists"));
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    name: trimmedName,
    email: normalizedEmail,
    password: hashedPassword,
  });

  res.status(201).json({ message: "User registered successfully" });
});

// Login
exports.loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedEmail || !password) {
    return next(httpError(400, "Email and password are required"));
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return next(httpError(400, "Invalid credentials"));
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(httpError(400, "Invalid credentials"));
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

  res.json({ token });
});
