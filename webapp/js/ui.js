// UI и навигация по страницам
const UI = (() => {
  // Tabs
  const tabs = {
    game:    { btn: "#tab-game",    page: "#page-game" },
    home:    { btn: "#tab-home",    page: "#page-home" },
    swap:    { btn: "#tab-swap",    page: "#page-swap" },
    profile: { btn: "#tab-profile", page: "#page-profile" }
  };

  function initTabs(defaultTab = "home") {
    Object.entries(tabs).forEach(([key, sel]) => {
      const btn = document.querySelector(sel.btn);
      btn?.addEventListener("click", () => openTab(key));
    });
    openTab(defaultTab);
  }

  function openTab(key) {
    // Switch active tab
    Object.values(tabs).forEach(sel => {
      document.querySelector(sel.btn)?.classList.remove("active");
      document.querySelector(sel.page)?.setAttribute("hidden", "true");
    });
    document.querySelector(tabs[key].btn)?.classList.add("active");
    document.querySelector(tabs[key].page)?.removeAttribute("hidden");
  }

  // Header wallet/balance switch
  function renderHeaderWallet() {
    const connectBtn = document.getElementById("btn-connect-wallet");
    const balanceBox = document.getElementById("balance-box");
    if (API.isWalletConnected()) {
      connectBtn.classList.add("hidden");
      balanceBox.classList.remove("hidden");
      document.getElementById("balance-amount").textContent = API.getBalance();
      document.getElementById("swap-balance").textContent = API.getBalance();
      document.getElementById("profile-balance").textContent = API.getBalance();
    } else {
      connectBtn.classList.remove("hidden");
      balanceBox.classList.add("hidden");
    }
  }

  // Avatars + profile header
  function renderAvatars() {
    const { first_name, username, photo_url } = API.getTelegramUser();

    // Header avatar
    paintAvatar(document.getElementById("avatar"), photo_url, first_name);

    // Profile avatar & name
    paintAvatar(document.getElementById("profile-avatar"), photo_url, first_name);
    const uname = document.getElementById("profile-username");
    uname.textContent = username || first_name || "Ayrelia";
  }

  // Helper: paint avatar or fallback
  function paintAvatar(rootEl, photoUrl, textForLetter) {
    if (!rootEl) return;
    rootEl.innerHTML = "";
    if (photoUrl) {
      const img = document.createElement("img");
      img.src = photoUrl;
      img.alt = "User";
      rootEl.appendChild(img);
    } else {
      const span = document.createElement("span");
      span.className = "avatar-fallback";
      const letter = (textForLetter || "A").trim().charAt(0).toUpperCase() || "A";
      span.textContent = letter;
      rootEl.appendChild(span);
    }
  }

  // Inventory toggle (визуальный свитчер)
  function initInventoryToggle() {
    const all = document.getElementById("inv-all");
    const available = document.getElementById("inv-available");
    const empty = document.getElementById("inventory-empty");

    const setActive = (btnActive, btnInactive) => {
      btnActive.classList.add("active");
      btnInactive.classList.remove("active");
      // пока инвентарь пуст всегда
      empty.style.display = "flex";
    };

    all?.addEventListener("click", () => setActive(all, available));
    available?.addEventListener("click", () => setActive(available, all));
  }

  // Bind header/profile logo/avatar to open Profile page
  function bindProfileOpeners() {
    const logo = document.getElementById("btn-logo");
    const avatarBtn = document.getElementById("btn-avatar");
    logo?.addEventListener("click", () => openTab("profile"));
    avatarBtn?.addEventListener("click", () => openTab("profile"));
  }

  // Handlers for actions
  function bindActions() {
    const connectBtn = document.getElementById("btn-connect-wallet");
    const connectCard = document.getElementById("card-connect-wallet");

    const connect = () => {
      API.connectWallet();
      renderHeaderWallet();
    };

    connectBtn?.addEventListener("click", connect);
    connectCard?.addEventListener("click", connect);

    document.getElementById("btn-deposit")?.addEventListener("click", () => {
      // позже: открытие модалки депозита
      console.log("Deposit click");
    });

    document.getElementById("btn-withdrawal")?.addEventListener("click", () => {
      console.log("Withdrawal click");
    });

    document.getElementById("btn-promo")?.addEventListener("click", () => {
      console.log("Promo click");
    });

    document.getElementById("btn-upgrade")?.addEventListener("click", () => {
      console.log("Upgrade click");
    });

    document.getElementById("btn-open-case")?.addEventListener("click", () => {
      console.log("Open case click");
    });
  }

  return {
    initTabs,
    renderHeaderWallet,
    renderAvatars,
    initInventoryToggle,
    bindProfileOpeners,
    bindActions
  };
})();
