import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import crypto from "crypto";
import pkg from "pg";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

// ---- static (фронт) ----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webappPath = path.resolve(__dirname, "../webapp");
app.use(express.static(webappPath));

// ---- db ----
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Временный init endpoint: создаёт таблицу users
app.get("/initdb", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT PRIMARY KEY,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        language_code TEXT,
        photo_url TEXT,
        ton_wallet TEXT,
        balance BIGINT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    await pool.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
      CREATE TRIGGER trg_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
    `);

    res.json({ ok: true, msg: "Users table created/updated successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "db_init_failed", details: e.message });
  }
});


// ───────────────────────────────────────────────────────────────
// Telegram WebApp initData validation (RFC из доков)
function parseInitData(initDataStrOrObj) {
  if (typeof initDataStrOrObj === "string") {
    const params = new URLSearchParams(initDataStrOrObj);
    const data = {};
    for (const [k, v] of params.entries()) data[k] = v;
    // user, chat и т.д. могут быть JSON-ами строкой:
    if (data.user) try { data.user = JSON.parse(data.user); } catch {}
    if (data.chat) try { data.chat = JSON.parse(data.chat); } catch {}
    return data;
  }
  // на случай если прислали объект (не рек. вариант)
  return initDataStrOrObj || {};
}

function dataCheckString(obj) {
  // Док-сортировка по ключам и склейка
  const keys = Object.keys(obj).filter(k => k !== "hash").sort();
  return keys.map(k => `${k}=${obj[k]}`).join("\n");
}

function validateInitData(initDataStrOrObj) {
  const data = parseInitData(initDataStrOrObj);
  if (!data.hash) return { ok:false, reason:"no hash" };

  const botToken = process.env.BOT_TOKEN || "";
  const secretKey = crypto.createHash("sha256").update(botToken).digest(); // HMAC key
  const check = dataCheckString(data);
  const hmac = crypto.createHmac("sha256", secretKey).update(check).digest("hex");
  const ok = hmac === data.hash;
  return { ok, data, reason: ok ? undefined : "bad hash" };
}
// ───────────────────────────────────────────────────────────────

// upsert user
async function upsertUserFromInitData(user) {
  const {
    id, username, first_name, last_name, language_code, photo_url
  } = user || {};
  if (!id) return;

  await pool.query(
    `INSERT INTO users (id, username, first_name, last_name, language_code, photo_url)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (id) DO UPDATE SET
       username = COALESCE(EXCLUDED.username, users.username),
       first_name = COALESCE(EXCLUDED.first_name, users.first_name),
       last_name = COALESCE(EXCLUDED.last_name, users.last_name),
       language_code = COALESCE(EXCLUDED.language_code, users.language_code),
       photo_url = COALESCE(EXCLUDED.photo_url, users.photo_url)`,
    [id, username, first_name, last_name, language_code, photo_url]
  );
  const res = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
  return res.rows[0];
}

// ── API: TMA init → проверка/регистрация пользователя ──
app.post("/user/init", async (req, res) => {
  try {
    const { initData } = req.body; // строка tg.initData
    const v = validateInitData(initData);
    if (!v.ok) return res.status(403).json({ error: "invalid_init_data", reason: v.reason });

    const user = v.data.user;
    const row = await upsertUserFromInitData(user);
    res.json({ ok: true, user: row });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server_error" });
  }
});

// ── API: получить мои данные (по id) ──
app.get("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const r = await pool.query(`SELECT * FROM users WHERE id=$1`, [id]);
    res.json(r.rows[0] || null);
  } catch (e) {
    res.status(500).json({ error: "server_error" });
  }
});

// ── API: обновить кошелёк / баланс (заготовки) ──
app.post("/user/wallet", async (req, res) => {
  try {
    const { id, ton_wallet } = req.body;
    await pool.query(`UPDATE users SET ton_wallet=$1 WHERE id=$2`, [ton_wallet || null, id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "server_error" });
  }
});

app.post("/user/balance", async (req, res) => {
  try {
    const { id, delta } = req.body; // delta может быть +/-
    const r = await pool.query(
      `UPDATE users SET balance = COALESCE(balance,0) + $1 WHERE id=$2 RETURNING balance`,
      [Number(delta)||0, id]
    );
    res.json({ ok: true, balance: r.rows[0]?.balance ?? 0 });
  } catch (e) {
    res.status(500).json({ error: "server_error" });
  }
});

// ───────────────────────────────────────────────────────────────
// DEV-доступ: если открыли НЕ из Telegram — требуем passcode/UA
app.post("/dev/handshake", (req, res) => {
  const ua = req.headers["user-agent"] || "";
  const pass = (req.body?.passcode || "").toString();

  const needPass = (process.env.DEV_PASSCODE || "").length > 0;
  const okPass = !needPass || pass === process.env.DEV_PASSCODE;
  const needUA = (process.env.DEV_UA_SUBSTR || "").length > 0;
  const okUA = !needUA || ua.includes(process.env.DEV_UA_SUBSTR);

  if (okPass && okUA) {
    return res.json({ ok: true });
  }
  return res.status(403).json({ ok:false });
});
// ───────────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.sendFile(path.join(webappPath, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
