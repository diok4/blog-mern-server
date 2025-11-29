import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { setAuthCookie, clearAuthCookie } from "../middlewares/auth.js";

function sign(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    algorithm: "HS256",
  });
}

// общий безопасный геттер пользователя без пароля
export async function getUserSafe(userId) {
  if (!userId) return null;
  const user = await User.findById(userId).select("-password");
  return user || null;
}

// ============== REGISTER ==============
export async function register(req, res) {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const exist = await User.findOne({ email });
    if (exist) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      username,
      password: hash,
    });

    const token = sign(user.id);
    setAuthCookie(res, token);

    const safeUser = user.toObject();
    delete safeUser.password;

    res.status(201).json({ user: safeUser });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
}

// ============== LOGIN ==============
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

    const token = sign(user.id);
    setAuthCookie(res, token);

    const safeUser = user.toObject();
    delete safeUser.password;

    res.json({ user: safeUser });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
}

// ============== LOGOUT ==============
export async function logout(_req, res) {
  try {
    clearAuthCookie(res);
    res.json({ message: "Logged out" });
  } catch (err) {
    console.error("LOGOUT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
}

// ============== IS AUTH ==============
export async function isAuth(req, res) {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.json({ authenticated: false });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.json({ authenticated: false });
    }

    const user = await User.findById(payload.userId).select("_id");
    if (!user) {
      return res.json({ authenticated: false });
    }

    return res.json({ authenticated: true });
  } catch (err) {
    console.error("ISAUTH ERROR:", err);
    return res.json({ authenticated: false });
  }
}

// ============== ME GET (получить данные пользователя) ==============
// теперь умеет:
//   GET /api/auth/me           -> текущий пользователь (по токену)
//   GET /api/auth/me?id=XXX    -> пользователь по id
export async function meGet(req, res) {
  try {
    // приоритет: ?id в query, иначе текущий userId из middleware
    const idFromQuery = req.query?.id;
    const targetUserId = idFromQuery || req.userId;

    const user = await getUserSafe(targetUserId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user });
  } catch (err) {
    console.error("ME GET ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
}

// ============== GET USER BY ID (отдельный handler, если пригодится) ==============
// сейчас не привязан к роуту, но может использоваться внутри других контроллеров
export async function getUserById(req, res) {
  try {
    const userId = req.params.id;
    const user = await getUserSafe(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user });
  } catch (err) {
    console.error("USER GET BY ID ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// ============== ME PATCH (обновить username / avatar) ==============
export async function mePatch(req, res) {
  try {
    const { username, avatar } = req.body;

    const update = {
      ...(username && { username }),
      ...(avatar && { avatar }),
    };

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: update },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    console.error("ME PATCH ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
}
