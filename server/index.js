import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import crypto from "crypto";
import pkg from "pg";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const { Pool } = pkg;

// Инициализация Express
const app = express();
app.use(cors());
app.use(express.json());

// Подключение к базе
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Пути для фронтенда
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webappPath = path.resolve(__dirname, "../webapp");

// Раздача статики (HTML, CSS, JS)
app.use(express.static(webappPath));

// Валидация Telegram данных
function validateTelegramData(initData) {
  const secret = crypto.createHash("sha256").update(process.env.BOT_TOKEN).digest();
  const checkString = Object.keys(initData)
    .filter(k => k !== "hash")
    .sort()
    .map(k => `${k}=${initData[k]}`)
    .join("\n");

  const hmac = crypto.createHmac("sha256", secret).update(checkString).digest("hex");
  return hmac === initData.hash;
}

// Роуты API
app.post("/auth", async (req, res) => {
  const { initDataUnsafe } = req.body;
  if (!initDataUnsafe || !validateTelegramData(initDataUnsafe)) {
    return res.status(403).json({ error: "Invalid Telegram data" });
  }

  const userId = initDataUnsafe.user.id;
  const username = initDataUnsafe.user.username || "Unknown";

  await pool.query(
    `INSERT INTO users (id, username, games_played, wins) 
     VALUES ($1, $2, 0, 0) 
     ON CONFLICT (id) DO NOTHING`,
    [userId, username]
  );

  res.json({ ok: true });
});

app.get("/stats/:id", async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
  res.json(result.rows[0] || {});
});

app.post("/update", async (req, res) => {
  const { id, games_played, wins } = req.body;
  await pool.query(
    `UPDATE users SET games_played = $1, wins = $2 WHERE id = $3`,
    [games_played, wins, id]
  );
  res.json({ ok: true });
});

// Главная страница — index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(webappPath, "index.html"));
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
