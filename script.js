const BACKGROUNDS = [
  "background_1.jpg",
  "background_2.jpg",
  "background_3.jpg",
  "background_4.jpg",
  "background_5.jpg",
  "background_6.jpg",
  "background_7.jpg",
  "background_8.jpg"
];

const MUSIC_PLAYLIST = ["song.ogg"];
const STAFF_MEMBERS = [
  { steamId: "76561198125443821", rank: "Community Owner" },
  { steamId: "76561198812358962", rank: "Community Manager" },
  { steamId: "76561198446667412", rank: "Community Supervisor" },
  { steamId: "76561198245818728", rank: "Team Verwaltung" },
  { steamId: "76561199376690183", rank: "SCP:RP Serverleiter" },
  { steamId: "76561199221582970", rank: "SCP:RP Team Leitung" },
  { steamId: "76561198281815795", rank: "Head of Mapping" },
  { steamId: "76561199158654608", rank: "Discord Verwaltung" }
];

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const DEFAULT_AVATAR = "logo.png";
  let filesTotal = 0;
  let filesNeeded = 0;
  let lastNeededValue = null;
  let backgroundIndex = 0;
  let activeBackground = "A";
  let tabIndex = 0;
  let gotDownloadData = false;

  function setText(id, value, fallback) {
    const element = $(id);
    if (!element) return;
    element.textContent = value !== undefined && value !== null && value !== "" ? String(value) : (fallback || "UNKNOWN");
  }

  function setProgress(value) {
    const progressBar = $("progressBar");
    const progressPercent = $("progressPercent");
    const percent = Math.max(0, Math.min(100, Number(value) || 0));
    if (progressBar) {
      progressBar.style.width = percent + "%";
      progressBar.style.transform = "";
    }
    if (progressPercent) progressPercent.textContent = Math.round(percent) + "%";
  }

  function updateProgress() {
    if (filesTotal <= 0) return;
    const completed = Math.max(0, filesTotal - filesNeeded);
    setProgress((completed / filesTotal) * 100);
    setText("downloadText", completed + " / " + filesTotal + " Dateien verarbeitet");
  }

  window.GameDetails = function (serverName, serverURL, mapName, maxPlayers, steamID, gamemode) {
    setText("serverName", serverName, "NEXUS PROJEKT | SCP:RP");
    setText("mapName", mapName, "LADEN...");
    setText("gamemode", gamemode, "SCP:RP");
    setText("maxPlayers", maxPlayers, "--");
    setText("statusText", "Mit dem Server verbunden");
    setText("progressLabel", "VERBUNDEN");
  };

  window.SetFilesTotal = function (total) {
    gotDownloadData = true;
    filesTotal = Math.max(0, parseInt(total, 10) || 0);

    if (lastNeededValue !== null) {
      filesNeeded = Math.max(0, Math.min(lastNeededValue, filesTotal));
    } else {
      filesNeeded = filesTotal;
    }

    if (filesTotal === 0) {
      setProgress(0);
      setText("progressLabel", "WARTEN");
      setText("downloadText", "Warte auf Dateiinformationen...");
      return;
    }

    updateProgress();
    setText("progressLabel", "VORBEREITEN");
  };

  window.SetFilesNeeded = function (needed) {
    gotDownloadData = true;
    const parsedNeeded = Math.max(0, parseInt(needed, 10) || 0);
    lastNeededValue = parsedNeeded;

    if (filesTotal <= 0) {
      filesTotal = parsedNeeded;
    }

    filesNeeded = Math.max(0, Math.min(parsedNeeded, filesTotal));
    updateProgress();
    if (filesTotal > 0 && filesNeeded === 0) {
      setProgress(100);
      setText("progressLabel", "BEREIT");
    }
  };

  window.DownloadingFile = function (fileName) {
    gotDownloadData = true;
    setText("progressLabel", "DOWNLOAD");
    if (filesTotal > 0) {
      updateProgress();
      return;
    }
    setText("downloadText", "LÄDT: " + (fileName || "Datei"));
  };

  window.SetStatusChanged = function (status) {
    const text = String(status || "Verbinden...");
    setText("statusText", text, "Verbinden...");
    setText("progressLabel", text.toUpperCase());
  };

  function setBackground(element, path) {
    element.style.backgroundImage = "url('" + path.replace(/'/g, "%27") + "')";
  }

  function preloadBackgrounds() {
    BACKGROUNDS.forEach((path) => {
      const image = new Image();
      image.src = path;
    });
  }

  function changeBackground() {
    if (BACKGROUNDS.length < 2) return;

    const current = $("background" + activeBackground);
    const nextName = activeBackground === "A" ? "B" : "A";
    const next = $("background" + nextName);
    backgroundIndex = (backgroundIndex + 1) % BACKGROUNDS.length;
    const image = new Image();

    image.onload = function () {
      setBackground(next, BACKGROUNDS[backgroundIndex]);
      next.classList.add("background-active");
      current.classList.remove("background-active");
      activeBackground = nextName;
    };

    image.onerror = function () {
      console.log("Background konnte nicht geladen werden: " + BACKGROUNDS[backgroundIndex]);
    };

    image.src = BACKGROUNDS[backgroundIndex];
  }

  function initBackgrounds() {
    const first = $("backgroundA");
    const second = $("backgroundB");
    if (!first || !second || !BACKGROUNDS.length) return;
    setBackground(first, BACKGROUNDS[0]);
    second.style.backgroundImage = "none";
    preloadBackgrounds();
    setInterval(changeBackground, 10000);
  }

  function activateTab(index) {
    const tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
    const contents = Array.prototype.slice.call(document.querySelectorAll(".tab-content"));
    if (!tabs.length || !contents.length) return;

    tabIndex = ((index % tabs.length) + tabs.length) % tabs.length;
    tabs.forEach((tab, currentIndex) => tab.classList.toggle("active", currentIndex === tabIndex));
    contents.forEach((content) => content.classList.toggle("active", content.id === tabs[tabIndex].getAttribute("data-tab")));
  }

  function initTabs() {
    const tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
    if (!tabs.length) return;
    tabs.forEach((tab, index) => tab.addEventListener("click", () => activateTab(index)));
    activateTab(0);
    setInterval(() => activateTab(tabIndex + 1), 10000);
  }

  function getTrackName(path) {
    const fileName = String(path).split("/").pop() || "MUSIK";
    return fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").toUpperCase();
  }

  function initMusic() {
    if (!MUSIC_PLAYLIST.length) return;
    let trackIndex = 0;
    let started = false;
    const audio = new Audio();
    audio.volume = 0.18;
    audio.preload = "auto";

    function playTrack(index) {
      trackIndex = index % MUSIC_PLAYLIST.length;
      audio.src = MUSIC_PLAYLIST[trackIndex];
      setText("musicTitle", getTrackName(MUSIC_PLAYLIST[trackIndex]), "MUSIK");
      audio.play().then(() => {
        started = true;
        setText("musicState", "AKTUELLER SONG");
      }).catch(() => setText("musicState", "KLICKEN FÜR MUSIK"));
    }

    function startOnInput() {
      if (!started) playTrack(trackIndex);
    }

    audio.addEventListener("ended", () => playTrack(trackIndex + 1));
    audio.addEventListener("error", () => setText("musicState", "AUDIO NICHT GEFUNDEN"));
    document.addEventListener("click", startOnInput, { once: true });
    document.addEventListener("keydown", startOnInput, { once: true });
    playTrack(0);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;"
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
      '<div class="staff-avatar-wrap"><img class="staff-avatar" src="' + escapeHtml(fallbackAvatar) + '" alt="Steam Avatar"><span class="staff-online"></span></div>' +
      '<span class="staff-name">' + escapeHtml(fallbackName) + '</span>' +
      '<span class="staff-rank">' + escapeHtml(rank) + '</span>';

    const avatar = card.querySelector(".staff-avatar");
    const name = card.querySelector(".staff-name");
    avatar.onerror = function () { avatar.src = DEFAULT_AVATAR; };

    if (!validSteamId(steamId)) {
      name.textContent = "SteamID ungültig";
      return card;
    }

    const requestUrl =
      "https://nexus-load-api.seraphicphantom.workers.dev" +
      "?steamid=" +
      encodeURIComponent(steamId) +
      "&v=20260920-2039";

    fetch(requestUrl, {
      cache: "no-store"
    })
      .then(async (response) => {
        const profile = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(profile.error || `HTTP ${response.status}`);
        }

        return profile;
      })
      .then((profile) => {
        name.textContent = profile.name || `SteamID: ${steamId}`;
        avatar.src = profile.avatar || DEFAULT_AVATAR;
      })
      .catch((error) => {
        console.error(`Steam-Profil ${steamId} konnte nicht geladen werden:`, error);
        name.textContent = "Profil nicht verfügbar";
        avatar.src = DEFAULT_AVATAR;
      });

    return card;
  }

  function renderStaff() {
    const grid = $("staffGrid");
    if (!grid) return;
    grid.innerHTML = "";
    STAFF_MEMBERS.forEach((member) => grid.appendChild(createStaffCard(member)));
  }

  function init() {
    initBackgrounds();
    initTabs();
    initMusic();
    renderStaff();
    setProgress(0);
    setTimeout(() => {
      if (!gotDownloadData) setText("downloadText", "Verbinde mit dem Server – warte auf Downloadinformationen...");
    }, 1600);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
