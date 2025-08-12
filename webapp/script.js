const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe.user;
document.getElementById("username").textContent = user.username || "Гость";

fetch("https://ayrsof-k3go-ldka.onrender.com/auth", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ initDataUnsafe: tg.initDataUnsafe })
});

async function loadStats() {
  const res = await fetch(`https://ayrsof-k3go-ldka.onrender.com/stats/${user.id}`);
  const data = await res.json();
  document.getElementById("games").textContent = data.games_played || 0;
  document.getElementById("wins").textContent = data.wins || 0;
}

document.getElementById("play").addEventListener("click", async () => {
  let games = parseInt(document.getElementById("games").textContent) + 1;
  let wins = parseInt(document.getElementById("wins").textContent) + (Math.random() > 0.5 ? 1 : 0);

  await fetch("https://ayrsof-k3go-ldka.onrender.com/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: user.id, games_played: games, wins })
  });

  loadStats();
});

loadStats();
