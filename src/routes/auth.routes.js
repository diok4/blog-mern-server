import express from "express";
import {
  register,
  login,
  logout,
  isAuth,
  meGet,
  mePatch,
} from "../controllers/auth.controller.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

// /api/auth/register
router.post("/register", register);

// /api/auth/login
router.post("/login", login);

// /api/auth/logout
router.post("/logout", logout);

// /api/auth/isauth  — проверяет токен в cookie
router.get("/isauth", isAuth);

// /api/auth/me      — получить профиль (нужен токен)
router.get("/me", auth, meGet);

// /api/auth/me      — обновить профиль (нужен токен)
router.patch("/me", auth, mePatch);

export default router;
