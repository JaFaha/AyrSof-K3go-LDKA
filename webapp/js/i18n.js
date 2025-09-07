// Простая i18n подгрузка. Позже можно заменить на полноценный.
const I18N = (() => {
  let dict = {};
  let lang = "en";

  async function load(langCode = "en") {
    lang = langCode;
    const res = await fetch(`i18n/${lang}.json`);
    dict = await res.json();
    apply();
  }

  function t(key) {
    return dict[key] ?? key;
  }

  function apply() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      el.textContent = t(key);
    });
  }

  return { load, t, get lang(){return lang;} };
})();
