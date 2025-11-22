import { Post } from "../models/Post.js";

export async function listPosts(_req, res) {
  const posts = await Post.find()
    .populate("author", "username")
    .sort({ createdAt: -1 });
  res.json({ posts });
}

export async function getPost(req, res) {
  const post = await Post.findById(req.params.id).populate(
    "author",
    "username"
  );
  if (!post) return res.status(404).json({ message: "Post not found" });
  res.json({ post });
}

export async function createPost(req, res) {
  const { title, text, tags, published } = req.body;
  if (!title || !text)
    return res.status(400).json({ message: "Missing fields" });

  const post = await Post.create({
    title,
    text,
    tags: tags || [],
    published: published ?? true,
    author: req.userId,
  });

  res.status(201).json({ post });
}

export async function updatePost(req, res) {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });
  if (post.author.toString() !== req.userId)
    return res.status(403).json({ message: "Forbidden" });

  Object.assign(post, req.body);
  await post.save();
  res.json({ post });
}

export async function deletePost(req, res) {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });
  if (post.author.toString() !== req.userId)
    return res.status(403).json({ message: "Forbidden" });

  await post.deleteOne();
  res.json({ message: "Deleted" });
}
