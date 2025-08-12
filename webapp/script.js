import { translations } from './translations.js';

const tg = window.Telegram.WebApp;
tg.ready();

let lang = 'en';
const user = tg.initDataUnsafe.user || { username: 'AyrSof' };

const welcomeScreen = document.getElementById('welcome-screen');
const welcomeText = document.getElementById('welcome-text');
const languageButtons = document.getElementById('language-buttons');
const mainApp = document.getElementById('main-app');
const avatar = document.getElementById('avatar');
const settingsButton = document.getElementById('settings-button');
const content = document.getElementById('content');
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');

function initAvatar() {
    if (user.photo_url) {
        const img = document.createElement('img');
        img.src = user.photo_url;
        avatar.appendChild(img);
    } else {
        avatar.textContent = 'AS';
    }
}

function setLanguage(selectedLang) {
    lang = selectedLang;
    updateTexts();
    welcomeScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    showPage('home');
}

function updateTexts() {
    const t = translations[lang];
    document.querySelector('#home-btn span').textContent = t.home;
    document.querySelector('#games-btn span').textContent = t.games;
    document.querySelector('#trade-btn span').textContent = t.trade;
    settingsButton.textContent = user.username || 'AyrSof';
    closeSettings.textContent = t.close;
}

function showPage(page) {
    const t = translations[lang];
    content.innerHTML = `<h2>${t[page]} | ${t.comingSoon}</h2>`;
}

document.getElementById('ru-button').addEventListener('click', () => setLanguage('ru'));
document.getElementById('en-button').addEventListener('click', () => setLanguage('en'));

document.getElementById('home-btn').addEventListener('click', () => showPage('home'));
document.getElementById('games-btn').addEventListener('click', () => showPage('games'));
document.getElementById('trade-btn').addEventListener('click', () => showPage('trade'));

settingsButton.addEventListener('click', () => {
    settingsModal.querySelector('h2').textContent = translations[lang].settings;
    settingsModal.classList.remove('hidden');
});

closeSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));

welcomeText.addEventListener('animationend', () => {
    setTimeout(() => {
        welcomeText.style.transform = 'translateY(-50px)';
        languageButtons.classList.remove('hidden');
        languageButtons.style.opacity = 1;
    }, 1000);
});

initAvatar();