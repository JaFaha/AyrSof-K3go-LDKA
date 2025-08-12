// index.js (updated server, removed DB and old routes)
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// Инициализация Express
const app = express();
app.use(cors());
app.use(express.json());

// Пути для фронтенда
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webappPath = path.resolve(__dirname, "../webapp");

// Раздача статики (HTML, CSS, JS)
app.use(express.static(webappPath));

// Главная страница — index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(webappPath, "index.html"));
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));