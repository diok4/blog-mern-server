import express from "express";
import {
  register,
  login,
  logout,
  isAuth,
  meGet,
} from "../controllers/auth.controller.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/logout", logout);

router.get("/isauth", isAuth);

router.get("/me", auth, meGet);

export default router;
