// Реальные вызовы к бэку + заглушки для кошелька
const API = (() => {
  const BASE = ""; // тот же домен

  // кошелёк — пока мок
  let walletConnected = false;
  let balanceCached = 0;

  function isWalletConnected() { return walletConnected; }
  function connectWallet() {
    walletConnected = true;
    return { ok: true };
  }

  function getBalance() { return balanceCached; }
  function setBalanceLocally(v){ balanceCached = Number(v)||0; }

  // Telegram utils
  function isInTelegram() {
    return !!(window.Telegram && window.Telegram.WebApp);
  }
  function getInitDataString() {
    try { return window.Telegram.WebApp.initData || ""; } catch { return ""; }
  }

  // Init user via server
  async function initUserFromTelegram() {
    const initData = getInitDataString();
    if (!initData) throw new Error("No initData");

    const res = await fetch(`${BASE}/user/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData })
    });
    if (!res.ok) throw new Error("init_failed");
    const data = await res.json();
    // запомним баланс локально
    setBalanceLocally(data?.user?.balance ?? 0);
    return data.user;
  }

  // Dev handshake (если не из Telegram)
  async function devHandshake(passcode) {
    const res = await fetch(`${BASE}/dev/handshake`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode })
    });
    return res.ok;
  }

  async function getUser(id){
    const r = await fetch(`${BASE}/user/${id}`);
    return r.ok ? r.json() : null;
  }

  async function updateBalance(id, delta){
    const r = await fetch(`${BASE}/user/balance`,{
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ id, delta })
    });
    const d = await r.json();
    setBalanceLocally(d?.balance ?? 0);
    return d?.balance ?? 0;
  }

  async function setTonWallet(id, ton_wallet){
    const r = await fetch(`${BASE}/user/wallet`,{
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ id, ton_wallet })
    });
    return r.ok;
  }

  // TG user (для фронта)
  function getTelegramUser() {
    try {
      const tg = window.Telegram?.WebApp;
      if (tg?.initDataUnsafe?.user) {
        return {
          id: tg.initDataUnsafe.user.id,
          username: tg.initDataUnsafe.user.username || "Ayrelia",
          first_name: tg.initDataUnsafe.user.first_name || "Ayrelia",
          last_name: tg.initDataUnsafe.user.last_name || "",
          language_code: tg.initDataUnsafe.user.language_code || "en",
          photo_url: tg.initDataUnsafe.user.photo_url || null
        };
      }
    } catch {}
    return { id: 2417, username: "Ayrelia", first_name: "Ayrelia", last_name: "", language_code: "en", photo_url: null };
  }

  return {
    // wallet
    isWalletConnected, connectWallet, getBalance, setBalanceLocally,
    // user
    isInTelegram, getInitDataString, initUserFromTelegram, getTelegramUser,
    // server
    devHandshake, getUser, updateBalance, setTonWallet
  };
})();
