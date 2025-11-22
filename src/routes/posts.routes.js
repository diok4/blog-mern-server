import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import {
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
} from "../controllers/posts.controller.js";

const r = Router();

r.get("/", listPosts);
r.get("/:id", getPost);
r.post("/", auth, createPost);
r.patch("/:id", auth, updatePost);
r.delete("/:id", auth, deletePost);

export default r;
