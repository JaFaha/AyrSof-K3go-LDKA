(async function boot(){
  try { window.Telegram?.WebApp?.expand?.(); } catch {}

  const tgLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
  const lang = ["ru","uk","en"].includes(tgLang) ? (tgLang === "uk" ? "ru" : tgLang) : "en";
  await I18N.load(lang);

  // GATE:
  if (API.isInTelegram()) {
    // нормальный путь: валидируемся на сервере и создаём/получаем пользователя
    try {
      const userRow = await API.initUserFromTelegram();
      API.setBalanceLocally(userRow?.balance ?? 0);
    } catch (e) {
      console.error("TMA init failed:", e);
      // если не прошли валидацию, закрыть мини-апп (в TG это корректно)
      try { window.Telegram.WebApp.close(); } catch {}
      return;
    }
  } else {
    // не из Telegram: dev-only
    const pass = prompt("Dev passcode:");
    const ok = await API.devHandshake(pass || "");
    if (!ok) {
      // жёстко: закрыть вкладку/уйти
      try { window.close(); } catch {}
      location.replace("about:blank");
      return;
    }
  }

  // остальное UI
  UI.initTabs("home");
  UI.bindProfileOpeners();
  UI.renderAvatars();
  UI.renderHeaderWallet();
  UI.initInventoryToggle();
  UI.bindActions();
})();