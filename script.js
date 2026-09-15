/*
 * NEXUS PROJEKT | SCP:RP – GMod Loading Screen
 */

const BACKGROUNDS = [
  "assets/backgrounds/background_1.png",
  "assets/backgrounds/background_2.jpg"
];

const BACKGROUND_CHANGE_TIME = 10000;
const TAB_CHANGE_TIME = 10000;

const MUSIC_PLAYLIST = [
  "assets/music/Warteliste.ogg"
];
const MUSIC_VOLUME = 0.18;

const STAFF_API_URL = "https://nexus-load-api.seraphicphantom.workers.dev";

const STAFF_MEMBERS = [
  { steamId: "76561198125443821", rank: "Community Owner" },
  { steamId: "76561198812358962", rank: "Community Manager" },
  { steamId: "76561198446667412", rank: "Community Supervisor" },
  { steamId: "76561198245818728", rank: "Team Verwaltung" },
  { steamId: "76561199376690183", rank: "Stv. Serverleiter" },
  { steamId: "76561199221582970", rank: "Team Leitung" }
];

(function () {
  "use strict";

  const $ = id => document.getElementById(id);
  const DEFAULT_AVATAR = "assets/avatars/default-avatar.png";

  let filesTotal = 0;
  let filesNeeded = 0;
  let backgroundIndex = 0;
  let tabIndex = 0;

  function setText(id, value, fallback = "UNKNOWN") {
    const element = $(id);
    if (!element) return;

    element.textContent = value !== undefined && value !== null && value !== ""
      ? String(value)
      : fallback;
  }

  function setProgress(value) {
    value = Math.max(0, Math.min(100, Number(value) || 0));

    const progressBar = $("progressBar");
    const progressPercent = $("progressPercent");

    if (progressBar) progressBar.style.width = value + "%";
    if (progressPercent) progressPercent.textContent = Math.round(value) + "%";
  }

  function updateProgress() {
    if (!filesTotal) return;

    const completed = Math.max(0, filesTotal - filesNeeded);
    setProgress((completed / filesTotal) * 100);
  }

  window.GameDetails = function (serverName, serverURL, mapName, maxPlayers, steamID, gamemode) {
    setText("serverName", serverName, "NEXUS PROJEKT | SCP:RP");
    setText("mapName", mapName);
    setText("gamemode", gamemode, "SCPRP");
    setText("staffGamemode", gamemode, "SCPRP");
    setText("maxPlayers", maxPlayers, "--");
    setText("statusText", "Mit dem Server verbunden");
    setText("progressLabel", "CONNECTED");
  };

  window.SetFilesTotal = function (total) {
    filesTotal = Math.max(0, Number(total) || 0);
    filesNeeded = filesTotal;

    if (!filesTotal) {
      setProgress(100);
      setText("downloadText", "Keine zusätzlichen Dateien erforderlich.");
      return;
    }

    updateProgress();
  };

  window.SetFilesNeeded = function (needed) {
    filesNeeded = Math.max(0, Number(needed) || 0);
    updateProgress();

    if (filesTotal) {
      const completed = Math.max(0, filesTotal - filesNeeded);
      setText("downloadText", completed + " / " + filesTotal + " Dateien verarbeitet");

      if (filesNeeded === 0) {
        setText("progressLabel", "READY");
      }
    }
  };

  window.DownloadingFile = function (fileName) {
    setText("downloadText", "DOWNLOAD: " + (fileName || "Datei"));
    setText("progressLabel", "DOWNLOADING");
  };

  window.SetStatusChanged = function (status) {
    setText("statusText", status, "Connecting...");
    setText("progressLabel", String(status || "Connecting").toUpperCase());
  };

  function preloadBackgrounds() {
    BACKGROUNDS.forEach(path => {
      const image = new Image();
      image.src = path;
    });
  }

  function changeBackground() {
    if (BACKGROUNDS.length < 2) return;

    const background = $("background");
    if (!background) return;

    const nextIndex = (backgroundIndex + 1) % BACKGROUNDS.length;
    const nextImage = new Image();

    nextImage.onload = function () {
      background.classList.add("next");

      setTimeout(function () {
        background.style.backgroundImage = 'url("' + BACKGROUNDS[nextIndex] + '")';
        background.classList.remove("next");
        backgroundIndex = nextIndex;
      }, 900);
    };

    nextImage.src = BACKGROUNDS[nextIndex];
  }

  function activateTab(index) {
    const tabs = Array.from(document.querySelectorAll(".tab"));
    const contents = Array.from(document.querySelectorAll(".tab-content"));

    if (!tabs.length || !contents.length) return;

    tabIndex = ((index % tabs.length) + tabs.length) % tabs.length;

    tabs.forEach((tab, currentIndex) => {
      const active = currentIndex === tabIndex;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
    });

    contents.forEach(content => {
      content.classList.toggle("active", content.id === tabs[tabIndex].dataset.tab);
    });
  }

  function initTabs() {
    const tabs = Array.from(document.querySelectorAll(".tab"));
    if (!tabs.length) return;

    const initiallyActive = tabs.findIndex(tab => tab.classList.contains("active"));
    activateTab(initiallyActive >= 0 ? initiallyActive : 0);

    setInterval(function () {
      activateTab(tabIndex + 1);
    }, TAB_CHANGE_TIME);
  }

  function getTrackName(path) {
    const fileName = String(path).split("/").pop() || "MUSIK";
    return fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").toUpperCase();
  }

  function initMusic() {
    if (!MUSIC_PLAYLIST.length) return;

    let trackIndex = 0;
    const audio = new Audio();
    audio.volume = MUSIC_VOLUME;
    audio.preload = "auto";

    function playTrack(index) {
      trackIndex = index % MUSIC_PLAYLIST.length;
      audio.src = MUSIC_PLAYLIST[trackIndex];
      setText("musicTitle", getTrackName(MUSIC_PLAYLIST[trackIndex]), "MUSIK");
      audio.play().catch(function () { });
    }

    audio.addEventListener("ended", function () {
      playTrack(trackIndex + 1);
    });

    audio.addEventListener("error", function () {
      if (MUSIC_PLAYLIST.length > 1) playTrack(trackIndex + 1);
    });

    playTrack(0);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#039;",
      "\"": "&quot;"
    })[character]);
  }

  function validSteamId(steamId) {
    return /^7656119\d{10}$/.test(String(steamId || "").trim());
  }

  function createStaffCard(member) {
    const steamId = String(member.steamId || "").trim();
    const rank = String(member.rank || "Teammitglied").trim();
    const fallbackName = String(member.name || "Lädt...").trim();
    const fallbackAvatar = String(member.avatar || DEFAULT_AVATAR).trim();

    const card = document.createElement("article");
    card.className = "staff-member";
    card.innerHTML =
      '<img class="staff-avatar" src="' + escapeHtml(fallbackAvatar) + '" alt="Steam-Profilbild">' +
      '<span class="staff-name">' + escapeHtml(fallbackName) + '</span>' +
      '<span class="staff-rank">' + escapeHtml(rank) + '</span>';

    const avatar = card.querySelector(".staff-avatar");
    const name = card.querySelector(".staff-name");

    avatar.addEventListener("error", function () {
      if (avatar.src !== DEFAULT_AVATAR) avatar.src = DEFAULT_AVATAR;
    });

    if (!validSteamId(steamId)) {
      name.textContent = "SteamID ungültig";
      return card;
    }

    loadSteamProfile(steamId, name, avatar, fallbackName, fallbackAvatar);
    return card;
  }

  function loadSteamProfile(steamId, nameElement, avatarElement, fallbackName, fallbackAvatar) {
    const requestUrl = STAFF_API_URL + (STAFF_API_URL.includes("?") ? "&" : "?") +
      "steamid=" + encodeURIComponent(steamId);

    fetch(requestUrl)
      .then(response => {
        if (!response.ok) throw new Error("Profil konnte nicht geladen werden");
        return response.json();
      })
      .then(profile => {
        if (profile.error) throw new Error(profile.error);

        nameElement.textContent = profile.name || fallbackName || ("SteamID: " + steamId);
        avatarElement.src = profile.avatar || fallbackAvatar || DEFAULT_AVATAR;
      })
      .catch(function () {
        nameElement.textContent = fallbackName || ("SteamID: " + steamId);
        avatarElement.src = fallbackAvatar || DEFAULT_AVATAR;
      });
  }

  function renderStaff() {
    const grid = $("staffGrid");
    if (!grid) return;

    grid.innerHTML = "";

    if (!STAFF_MEMBERS.length) {
      grid.innerHTML = '<div class="staff-loading">Noch keine Teammitglieder eingetragen.</div>';
      return;
    }

    STAFF_MEMBERS.forEach(member => grid.appendChild(createStaffCard(member)));
  }

  preloadBackgrounds();
  renderStaff();
  initTabs();
  initMusic();

  setInterval(changeBackground, BACKGROUND_CHANGE_TIME);

  setTimeout(function () {
    const mapName = $("mapName");
    if (mapName && mapName.textContent === "LADEN...") {
      setText("serverName", "NEXUS PROJEKT | SCP:RP");
      setText("mapName", "WARTE AUF GMOD");
      setText("gamemode", "SCPRP");
      setText("maxPlayers", "--");
      setText("statusText", "Warte auf Garry's Mod...");
    }
  }, 800);
})();
