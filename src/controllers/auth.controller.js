import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

function sendAuthCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

export async function register(req, res) {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      username,
      password: hashed,
    });

    const token = generateToken(user.id);

    const safeUser = user.toObject();
    delete safeUser.password;

    return res.status(201).json({ user: safeUser, token });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user.id);

    const safeUser = user.toObject();
    delete safeUser.password;

    return res.json({ user: safeUser, token });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
}

export async function logout(_req, res) {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });

    res.json({ message: "Logged out" });
  } catch (err) {
    console.error("LOGOUT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
}

export async function isAuth(req, res) {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.json({ authenticated: false });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.json({ authenticated: false });
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      return res.json({ authenticated: false });
    }

    return res.json({ authenticated: true });
  } catch (err) {
    console.error("ISAUTH ERROR:", err);
    return res.json({ authenticated: false });
  }
}

export async function meGet(req, res) {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(payload.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ user });
  } catch (err) {
    console.error("ME ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
