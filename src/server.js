import express from "express";
import posts from "./routes/posts.js";
import users from "./routes/users.js";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use(posts);
app.use(users);

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
