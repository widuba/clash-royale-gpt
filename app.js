(() => {
  "use strict";

  const APP_CONFIG = {
    firebase: {
      apiKey: "REPLACE_ME",
      authDomain: "REPLACE_ME.firebaseapp.com",
      projectId: "REPLACE_ME",
      storageBucket: "REPLACE_ME.appspot.com",
      messagingSenderId: "1234567890",
      appId: "1:1234567890:web:REPLACE_ME"
    }
  };

  const LOCAL_SAVE_KEY = "siege_cards_phase6_local_save_v1";
  const CLOUD_SAVE_COLLECTION = "gameSaves";
  const PROFILE_COLLECTION = "profiles";
  const USERNAME_COLLECTION = "usernames";

  const USERNAME_REGEX = /^[A-Za-z][A-Za-z0-9_]{2,15}$/;

  const BOT_USERNAMES = [
    "RivenVale",
    "TalonForge",
    "MiraBloom",
    "NovaStrike",
    "EmberClash",
    "SteelRider",
    "FrostByte",
    "RuneCrest",
    "VoidLancer",
    "StoneSpark",
    "AshenFox",
    "EchoTitan",
    "BlazeOrbit",
    "StormWarden",
    "GlintHawk",
    "OnyxHarbor"
  ];

  const LEAGUES = [
    { name: "Bronze I", min: 0, max: 199 },
    { name: "Bronze II", min: 200, max: 399 },
    { name: "Silver I", min: 400, max: 699 },
    { name: "Silver II", min: 700, max: 999 },
    { name: "Gold I", min: 1000, max: 1399 },
    { name: "Gold II", min: 1400, max: 1799 },
    { name: "Crystal I", min: 1800, max: 2299 },
    { name: "Crystal II", min: 2300, max: 2799 },
    { name: "Master", min: 2800, max: 999999 }
  ];

  const CARDS = [
    { id: "iron_guard", name: "Iron Guard", cost: 3, role: "Tank", emoji: "🛡️", power: 16, hp: 24 },
    { id: "axe_runner", name: "Axe Runner", cost: 2, role: "Melee", emoji: "🪓", power: 12, hp: 14 },
    { id: "arc_archer", name: "Arc Archer", cost: 3, role: "Ranged", emoji: "🏹", power: 15, hp: 12 },
    { id: "ember_mage", name: "Ember Mage", cost: 4, role: "Spellcaster", emoji: "🔥", power: 22, hp: 11 },
    { id: "siege_ram", name: "Siege Ram", cost: 4, role: "Siege", emoji: "🐏", power: 26, hp: 20 },
    { id: "wolf_pack", name: "Wolf Pack", cost: 3, role: "Swarm", emoji: "🐺", power: 18, hp: 10 },
    { id: "shield_node", name: "Shield Node", cost: 3, role: "Structure", emoji: "🔷", power: 10, hp: 26 },
    { id: "fire_burst", name: "Fire Burst", cost: 4, role: "Spell", emoji: "💥", power: 24, hp: 0 },
    { id: "stone_brute", name: "Stone Brute", cost: 5, role: "Heavy Tank", emoji: "🪨", power: 24, hp: 34 },
    { id: "spark_bot", name: "Spark Bot", cost: 4, role: "Burst", emoji: "⚙️", power: 25, hp: 12 },
    { id: "dart_hunter", name: "Dart Hunter", cost: 2, role: "Chip", emoji: "🎯", power: 10, hp: 11 },
    { id: "twin_blade", name: "Twin Blade", cost: 4, role: "DPS", emoji: "⚔️", power: 23, hp: 16 }
  ];

  const STARTER_DECK = [
    "iron_guard",
    "axe_runner",
    "arc_archer",
    "ember_mage",
    "siege_ram",
    "wolf_pack",
    "shield_node",
    "fire_burst"
  ];

  const SHOP_ROTATION_SIZE = 4;

  const el = (id) => document.getElementById(id);
  const qsa = (selector) => Array.from(document.querySelectorAll(selector));

  const screens = {
    home: el("screen-home"),
    deck: el("screen-deck"),
    collection: el("screen-collection"),
    battle: el("screen-battle")
  };

  const state = {
    save: loadLocalSave(),
    selectedDeckSlot: null,
    firebaseReady: false,
    firebaseError: "",
    firebase: null,
    auth: null,
    db: null,
    currentUser: null,
    currentProfile: null,
    battle: null,
    battleTimerId: null,
    battleBotTimerId: null,
    authMode: "login"
  };

  init();

  async function init() {
    wireStaticUi();
    renderAll();
    await initFirebase();
    renderAll();
  }

  function wireStaticUi() {
    el("btnPlay")?.addEventListener("click", startMatchmakingFlow);
    el("btnDeck")?.addEventListener("click", () => showScreen("deck"));
    el("btnCollection")?.addEventListener("click", () => showScreen("collection"));
    el("btnShop")?.addEventListener("click", openShop);
    el("btnHistory")?.addEventListener("click", openHistory);
    el("btnSettings")?.addEventListener("click", openSettings);
    el("btnRefreshShop")?.addEventListener("click", async () => {
      state.save.shop = rotateShop();
      await persistSave();
      openShop();
    });

    qsa("[data-home]").forEach((btn) => {
      btn.addEventListener("click", () => showScreen("home"));
    });

    el("btnOpenAuth")?.addEventListener("click", openAuthModal);
    el("btnCloseAuth")?.addEventListener("click", closeAuthModal);
    el("btnLogin")?.addEventListener("click", handleLogin);
    el("btnSignup")?.addEventListener("click", handleSignup);
    el("btnGuest")?.addEventListener("click", closeAuthModal);
    el("btnLogout")?.addEventListener("click", handleLogout);
    el("tabLogin")?.addEventListener("click", () => setAuthMode("login"));
    el("tabSignup")?.addEventListener("click", () => setAuthMode("signup"));

    el("closeShop")?.addEventListener("click", closeShop);
    el("closeHistory")?.addEventListener("click", closeHistory);
    el("closeSettings")?.addEventListener("click", closeSettings);

    el("toggleSound")?.addEventListener("click", async () => {
      state.save.settings.soundEnabled = !state.save.settings.soundEnabled;
      await persistSave();
      renderSettings();
    });

    el("feedLimitSelect")?.addEventListener("change", async (e) => {
      state.save.settings.feedLimit = Number(e.target.value) || 40;
      await persistSave();
    });

    el("btnExitBattle")?.addEventListener("click", exitBattleToHome);
    el("playAgain")?.addEventListener("click", () => {
      closeResult();
      startMatchmakingFlow();
    });
    el("backHome")?.addEventListener("click", () => {
      closeResult();
      exitBattleToHome();
    });
  }

  async function initFirebase() {
    try {
      const firebaseAppMod = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
      const firebaseAuthMod = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js");
      const firebaseFsMod = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");

      const app = firebaseAppMod.initializeApp(APP_CONFIG.firebase);

      state.auth = firebaseAuthMod.getAuth(app);
      state.db = firebaseFsMod.getFirestore(app);

      state.firebase = {
        createUserWithEmailAndPassword: firebaseAuthMod.createUserWithEmailAndPassword,
        signInWithEmailAndPassword: firebaseAuthMod.signInWithEmailAndPassword,
        signOut: firebaseAuthMod.signOut,
        onAuthStateChanged: firebaseAuthMod.onAuthStateChanged,
        deleteUser: firebaseAuthMod.deleteUser,
        doc: firebaseFsMod.doc,
        getDoc: firebaseFsMod.getDoc,
        setDoc: firebaseFsMod.setDoc,
        runTransaction: firebaseFsMod.runTransaction,
        serverTimestamp: firebaseFsMod.serverTimestamp
      };

      state.firebaseReady = true;
      state.firebaseError = "";

      state.firebase.onAuthStateChanged(state.auth, async (user) => {
        state.currentUser = user || null;

        if (state.currentUser) {
          await hydrateFromCloudAfterLogin();
        } else {
          state.currentProfile = null;
          state.save = loadLocalSave();
          renderAll();
        }
      });
    } catch (err) {
      state.firebaseReady = false;
      state.firebaseError = "Firebase not ready. Replace config values and ensure your project is enabled.";
      renderAll();
    }
  }

  function buildDefaultSave() {
    return {
      username: "Guest",
      level: 1,
      coins: 150,
      trophies: 0,
      wins: 0,
      losses: 0,
      deck: [...STARTER_DECK],
      cardLevels: Object.fromEntries(CARDS.map((card) => [card.id, 1])),
      shop: rotateShop(),
      history: [],
      settings: {
        soundEnabled: true,
        feedLimit: 40
      }
    };
  }

  function hydrateSave(saveLike) {
    const base = buildDefaultSave();
    const merged = {
      ...base,
      ...saveLike,
      deck: Array.isArray(saveLike?.deck) && saveLike.deck.length === 8 ? [...saveLike.deck] : [...base.deck],
      cardLevels: {
        ...base.cardLevels,
        ...(saveLike?.cardLevels || {})
      },
      shop: Array.isArray(saveLike?.shop) && saveLike.shop.length ? saveLike.shop : rotateShop(),
      history: Array.isArray(saveLike?.history) ? saveLike.history : [],
      settings: {
        ...base.settings,
        ...(saveLike?.settings || {})
      }
    };

    if (!merged.username) merged.username = "Guest";
    return merged;
  }

  function loadLocalSave() {
    try {
      const raw = localStorage.getItem(LOCAL_SAVE_KEY);
      if (!raw) return buildDefaultSave();
      return hydrateSave(JSON.parse(raw));
    } catch {
      return buildDefaultSave();
    }
  }

  function persistLocalOnly() {
    localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(state.save));
  }

  async function persistSave() {
    persistLocalOnly();
    if (state.currentUser && state.firebaseReady) {
      await saveCloudProgress();
    }
    renderAll();
  }

  async function saveCloudProgress() {
    if (!state.currentUser || !state.firebaseReady) return;

    try {
      const saveRef = state.firebase.doc(state.db, CLOUD_SAVE_COLLECTION, state.currentUser.uid);
      await state.firebase.setDoc(
        saveRef,
        {
          save: state.save,
          updatedAt: state.firebase.serverTimestamp()
        },
        { merge: true }
      );
    } catch (err) {
      console.warn("Cloud save failed", err);
    }
  }

  async function hydrateFromCloudAfterLogin() {
    if (!state.currentUser || !state.firebaseReady) return;

    try {
      const profileRef = state.firebase.doc(state.db, PROFILE_COLLECTION, state.currentUser.uid);
      const profileSnap = await state.firebase.getDoc(profileRef);
      state.currentProfile = profileSnap.exists() ? profileSnap.data() : null;

      const saveRef = state.firebase.doc(state.db, CLOUD_SAVE_COLLECTION, state.currentUser.uid);
      const saveSnap = await state.firebase.getDoc(saveRef);

      if (saveSnap.exists()) {
        const cloudSave = saveSnap.data()?.save;
        state.save = hydrateSave(cloudSave);
      } else {
        state.save = hydrateSave(state.save);
        if (state.currentProfile?.username) {
          state.save.username = state.currentProfile.username;
        }
        await saveCloudProgress();
      }

      if (state.currentProfile?.username) {
        state.save.username = state.currentProfile.username;
      }

      persistLocalOnly();
      renderAll();
    } catch (err) {
      console.warn("Cloud hydrate failed", err);
      renderAll();
    }
  }

  function normalizeUsername(username) {
    return username.trim().toLowerCase();
  }

  function validateUsername(username) {
    const trimmed = username.trim();

    if (!USERNAME_REGEX.test(trimmed)) {
      return {
        ok: false,
        message: "Username must be 3–16 chars, start with a letter, and only use letters, numbers, or underscores."
      };
    }

    if (trimmed.includes("__")) {
      return {
        ok: false,
        message: "Username cannot contain double underscores."
      };
    }

    return { ok: true, value: trimmed };
  }

  async function reserveUsernameForUser(uid, email, username) {
    const validation = validateUsername(username);
    if (!validation.ok) {
      throw new Error(validation.message);
    }

    const normalized = normalizeUsername(username);
    const displayUsername = username.trim();

    const usernameRef = state.firebase.doc(state.db, USERNAME_COLLECTION, normalized);
    const profileRef = state.firebase.doc(state.db, PROFILE_COLLECTION, uid);

    await state.firebase.runTransaction(state.db, async (transaction) => {
      const existing = await transaction.get(usernameRef);
      if (existing.exists()) {
        throw new Error("That username is already taken.");
      }

      transaction.set(usernameRef, {
        uid,
        username: displayUsername,
        normalized,
        createdAt: state.firebase.serverTimestamp()
      });

      transaction.set(
        profileRef,
        {
          uid,
          email,
          username: displayUsername,
          normalizedUsername: normalized,
          createdAt: state.firebase.serverTimestamp(),
          updatedAt: state.firebase.serverTimestamp()
        },
        { merge: true }
      );
    });

    state.currentProfile = {
      uid,
      email,
      username: displayUsername,
      normalizedUsername: normalized
    };

    state.save.username = displayUsername;
    await persistSave();
  }

  async function handleSignup() {
    if (!state.firebaseReady) {
      setAuthMessage(state.firebaseError || "Firebase not ready.");
      return;
    }

    const email = (el("authEmail")?.value || "").trim();
    const password = (el("authPassword")?.value || "").trim();
    const username = (el("authUsername")?.value || "").trim();

    if (!email || !password || !username) {
      setAuthMessage("Email, password, and username are all required.");
      return;
    }

    const validation = validateUsername(username);
    if (!validation.ok) {
      setAuthMessage(validation.message);
      return;
    }

    try {
      setAuthMessage("Creating account...");
      const result = await state.firebase.createUserWithEmailAndPassword(state.auth, email, password);
      const user = result.user;

      try {
        await reserveUsernameForUser(user.uid, email, username);
      } catch (err) {
        try {
          await state.firebase.deleteUser(user);
        } catch (_) {}
        throw err;
      }

      closeAuthModal();
      setAuthMessage("Account created.");
    } catch (err) {
      setAuthMessage(err.message || "Could not create account.");
    }
  }

  async function handleLogin() {
    if (!state.firebaseReady) {
      setAuthMessage(state.firebaseError || "Firebase not ready.");
      return;
    }

    const email = (el("authEmail")?.value || "").trim();
    const password = (el("authPassword")?.value || "").trim();

    if (!email || !password) {
      setAuthMessage("Email and password are required.");
      return;
    }

    try {
      setAuthMessage("Logging in...");
      await state.firebase.signInWithEmailAndPassword(state.auth, email, password);
      closeAuthModal();
    } catch (err) {
      setAuthMessage(err.message || "Login failed.");
    }
  }

  async function handleLogout() {
    if (!state.firebaseReady || !state.currentUser) return;

    try {
      await persistSave();
      await state.firebase.signOut(state.auth);
      state.currentUser = null;
      state.currentProfile = null;
      state.save = loadLocalSave();
      renderAll();
    } catch (err) {
      console.warn("Logout failed", err);
    }
  }

  function setAuthMode(mode) {
    state.authMode = mode;

    const loginTab = el("tabLogin");
    const signupTab = el("tabSignup");
    const loginBtn = el("btnLogin");
    const signupBtn = el("btnSignup");
    const usernameWrap = el("usernameWrap");

    if (mode === "login") {
      loginTab.className = "btn";
      signupTab.className = "btn alt";
      loginBtn.classList.remove("hidden");
      signupBtn.classList.add("hidden");
      usernameWrap.classList.add("hidden");
    } else {
      loginTab.className = "btn alt";
      signupTab.className = "btn";
      loginBtn.classList.add("hidden");
      signupBtn.classList.remove("hidden");
      usernameWrap.classList.remove("hidden");
    }
  }

  function setAuthMessage(text) {
    const msg = el("authMessage");
    if (msg) msg.textContent = text;
  }

  function openAuthModal() {
    setAuthMode(state.authMode || "login");
    renderAuthUi();
    el("authModal")?.classList.add("show");
  }

  function closeAuthModal() {
    el("authModal")?.classList.remove("show");
  }

  function openShop() {
    renderShop();
    el("shopModal")?.classList.add("show");
  }

  function closeShop() {
    el("shopModal")?.classList.remove("show");
  }

  function openHistory() {
    renderHistory();
    el("historyModal")?.classList.add("show");
  }

  function closeHistory() {
    el("historyModal")?.classList.remove("show");
  }

  function openSettings() {
    renderSettings();
    el("settingsModal")?.classList.add("show");
  }

  function closeSettings() {
    el("settingsModal")?.classList.remove("show");
  }

  function closeResult() {
    el("resultModal")?.classList.remove("show");
  }

  function getLeagueInfo(trophies) {
    const current = LEAGUES.find((league) => trophies >= league.min && trophies <= league.max) || LEAGUES[LEAGUES.length - 1];
    const currentIndex = LEAGUES.findIndex((league) => league.name === current.name);
    const next = LEAGUES[Math.min(currentIndex + 1, LEAGUES.length - 1)];
    const range = Math.max(1, current.max - current.min + 1);
    const progress = currentIndex === LEAGUES.length - 1 ? 100 : ((trophies - current.min) / range) * 100;
    return {
      current,
      next,
      progress: Math.max(0, Math.min(100, progress))
    };
  }

  function getCard(cardId) {
    return CARDS.find((card) => card.id === cardId);
  }

  function scaledCardPower(card) {
    const level = state.save.cardLevels[card.id] || 1;
    return Math.round(card.power * (1 + (level - 1) * 0.1));
  }

  function scaledCardHp(card) {
    const level = state.save.cardLevels[card.id] || 1;
    return Math.round(card.hp * (1 + (level - 1) * 0.1));
  }

  function getUpgradeCost(level) {
    return 25 + level * 20;
  }

  function rotateShop() {
    const shuffled = [...CARDS].sort(() => Math.random() - 0.5).slice(0, SHOP_ROTATION_SIZE);
    return shuffled.map((card) => ({
      cardId: card.id,
      copies: 2 + Math.floor(Math.random() * 3),
      price: 20 + card.cost * 12 + Math.floor(Math.random() * 15)
    }));
  }

  function showScreen(name) {
    Object.values(screens).forEach((screen) => screen.classList.remove("active"));
    screens[name]?.classList.add("active");
    renderAll();
  }

  function renderAll() {
    renderHome();
    renderDeck();
    renderCollection();
    renderShop();
    renderHistory();
    renderSettings();
    renderAuthUi();
    renderBattleUi();
  }

  function renderHome() {
    const league = getLeagueInfo(state.save.trophies);

    el("homeLevel").textContent = state.save.level;
    el("homeCoins").textContent = state.save.coins;
    el("homeTrophies").textContent = state.save.trophies;

    el("leagueBadge").textContent = league.current.name;
    el("leagueTrophies").textContent = state.save.trophies;
    el("nextLeagueName").textContent = league.next.name;
    el("leagueProgress").style.width = `${league.progress}%`;
    el("leagueProgressText").textContent =
      league.current.name === league.next.name
        ? `${state.save.trophies} trophies`
        : `${state.save.trophies - league.current.min} / ${league.current.max - league.current.min + 1}`;

    el("profileUsername").textContent = state.save.username || "Guest";
    el("profileEmail").textContent = state.currentUser?.email || "Not signed in";
    el("statWins").textContent = state.save.wins;
    el("statLosses").textContent = state.save.losses;

    el("authStatusPill").textContent = state.currentUser
      ? (state.save.username || state.currentUser.email || "Signed In")
      : "Guest";

    el("btnLogout").classList.toggle("hidden", !state.currentUser);

    const avgCost = (state.save.deck.reduce((sum, id) => sum + (getCard(id)?.cost || 0), 0) / state.save.deck.length).toFixed(1);
    el("avgCostHome").textContent = avgCost;

    el("homeDeckPreview").innerHTML = state.save.deck.map((cardId, index) => {
      const card = getCard(cardId);
      return `
        <div class="slot filled">
          <div class="tag">Slot ${index + 1}</div>
          <div style="font-size:1.6rem;margin:8px 0 6px;">${card.emoji}</div>
          <div style="font-weight:900;">${card.name}</div>
          <div class="tiny muted">Cost ${card.cost} • Lvl ${state.save.cardLevels[card.id] || 1}</div>
        </div>
      `;
    }).join("");
  }

  function renderDeck() {
    const deckSlots = el("deckSlots");
    const deckCardPool = el("deckCardPool");
    if (!deckSlots || !deckCardPool) return;

    const avgCost = (state.save.deck.reduce((sum, id) => sum + (getCard(id)?.cost || 0), 0) / state.save.deck.length).toFixed(1);
    el("deckAvgCost").textContent = avgCost;
    el("deckSelectedBanner").textContent =
      state.selectedDeckSlot === null ? "Selected slot: none" : `Selected slot: ${state.selectedDeckSlot + 1}`;

    deckSlots.innerHTML = state.save.deck.map((cardId, index) => {
      const card = getCard(cardId);
      const selected = state.selectedDeckSlot === index;
      return `
        <button class="slot filled" data-deck-slot="${index}" style="${selected ? "outline:2px solid var(--gold);" : ""}">
          <div class="tag">Slot ${index + 1}</div>
          <div style="font-size:1.5rem;margin:8px 0 6px;">${card.emoji}</div>
          <div style="font-weight:900;">${card.name}</div>
          <div class="tiny muted">Cost ${card.cost} • Lvl ${state.save.cardLevels[card.id] || 1}</div>
        </button>
      `;
    }).join("");

    deckCardPool.innerHTML = CARDS.map((card) => {
      const alreadyInDeck = state.save.deck.includes(card.id);
      return `
        <div class="ccard">
          <div class="ccard-header">
            <div class="tag">${card.role}</div>
            <div class="cost">${card.cost}</div>
          </div>
          <div class="card-art">${card.emoji}</div>
          <strong>${card.name}</strong>
          <div class="stats">
            <span>Power ${scaledCardPower(card)}</span>
            <span>HP ${scaledCardHp(card)}</span>
            <span>Lvl ${state.save.cardLevels[card.id] || 1}</span>
          </div>
          <div class="btn-row">
            <button class="btn ${alreadyInDeck ? "alt" : ""}" data-pick-card="${card.id}">
              ${alreadyInDeck ? "In Deck" : "Use In Slot"}
            </button>
          </div>
        </div>
      `;
    }).join("");

    qsa("[data-deck-slot]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.selectedDeckSlot = Number(btn.dataset.deckSlot);
        renderDeck();
      });
    });

    qsa("[data-pick-card]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const cardId = btn.dataset.pickCard;

        if (state.selectedDeckSlot === null) {
          alert("Select a deck slot first.");
          return;
        }

        const existingIndex = state.save.deck.indexOf(cardId);
        if (existingIndex !== -1 && existingIndex !== state.selectedDeckSlot) {
          alert("That card is already in your deck.");
          return;
        }

        state.save.deck[state.selectedDeckSlot] = cardId;
        await persistSave();
        renderDeck();
      });
    });
  }

  function renderCollection() {
    const grid = el("collectionGrid");
    if (!grid) return;

    el("collectionCoins").textContent = state.save.coins;

    grid.innerHTML = CARDS.map((card) => {
      const level = state.save.cardLevels[card.id] || 1;
      const upgradeCost = getUpgradeCost(level);
      const canUpgrade = state.save.coins >= upgradeCost && level < 10;

      return `
        <div class="ccard">
          <div class="ccard-header">
            <div class="tag">${card.role}</div>
            <div class="cost">${card.cost}</div>
          </div>
          <div class="card-art">${card.emoji}</div>
          <strong>${card.name}</strong>
          <div class="stats">
            <span>Lvl ${level}</span>
            <span>Power ${scaledCardPower(card)}</span>
            <span>HP ${scaledCardHp(card)}</span>
          </div>
          <div class="btn-row">
            <button class="btn ${canUpgrade ? "good" : "alt"}" data-upgrade-card="${card.id}" ${canUpgrade ? "" : "disabled"}>
              Upgrade (${upgradeCost})
            </button>
          </div>
        </div>
      `;
    }).join("");

    qsa("[data-upgrade-card]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const cardId = btn.dataset.upgradeCard;
        const level = state.save.cardLevels[cardId] || 1;
        const cost = getUpgradeCost(level);

        if (state.save.coins < cost || level >= 10) return;

        state.save.coins -= cost;
        state.save.cardLevels[cardId] = level + 1;
        await persistSave();
      });
    });
  }

  function renderShop() {
    const grid = el("shopGrid");
    if (!grid) return;

    grid.innerHTML = state.save.shop.map((offer, index) => {
      const card = getCard(offer.cardId);
      const affordable = state.save.coins >= offer.price;
      return `
        <div class="ccard">
          <div class="ccard-header">
            <div class="tag">Offer</div>
            <div class="cost">${card.cost}</div>
          </div>
          <div class="card-art">${card.emoji}</div>
          <strong>${card.name}</strong>
          <div class="stats">
            <span>+${offer.copies} copies</span>
            <span>${offer.price} coins</span>
          </div>
          <div class="btn-row">
            <button class="btn ${affordable ? "gold" : "alt"}" data-buy-offer="${index}" ${affordable ? "" : "disabled"}>
              Buy
            </button>
          </div>
        </div>
      `;
    }).join("");

    qsa("[data-buy-offer]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const index = Number(btn.dataset.buyOffer);
        const offer = state.save.shop[index];
        if (!offer || state.save.coins < offer.price) return;

        state.save.coins -= offer.price;
        state.save.shop.splice(index, 1, rotateShop()[0]);
        await persistSave();
      });
    });
  }

  function renderHistory() {
    const list = el("historyList");
    if (!list) return;

    if (!state.save.history.length) {
      list.innerHTML = `<div class="notice">No matches yet.</div>`;
      return;
    }

    list.innerHTML = state.save.history.map((entry) => `
      <div class="mini-card">
        <div class="title-row">
          <strong>${entry.result.toUpperCase()} vs ${entry.opponent}</strong>
          <div class="tag">${entry.when}</div>
        </div>
        <div class="tiny muted">Trophies: ${entry.beforeTrophies} → ${entry.afterTrophies}</div>
        <div class="tiny muted">Reward: ${entry.coins} coins</div>
      </div>
    `).join("");
  }

  function renderSettings() {
    const toggleSound = el("toggleSound");
    const feedLimitSelect = el("feedLimitSelect");

    if (toggleSound) {
      toggleSound.textContent = state.save.settings.soundEnabled ? "Sound: On" : "Sound: Off";
    }

    if (feedLimitSelect) {
      feedLimitSelect.value = String(state.save.settings.feedLimit || 40);
    }
  }

  function renderAuthUi() {
    if (state.currentUser) {
      setAuthMessage(`Signed in as ${state.save.username || state.currentUser.email || "player"}.`);
    } else if (!state.firebaseReady) {
      setAuthMessage(state.firebaseError || "Firebase not ready. Replace config values.");
    } else {
      setAuthMessage("Login or create an account with a unique username.");
    }

    setAuthMode(state.authMode);
  }

  function renderBattleUi() {
    if (!state.battle) {
      el("battleStatusTag").textContent = "Waiting";
      el("battlePlayerName").textContent = state.save.username || "Guest";
      el("battleOpponentName").textContent = "Unknown";
      el("battleTime").textContent = "60";
      el("battleFlux").textContent = "0";
      el("battlePlayerBar").style.width = "100%";
      el("battleEnemyBar").style.width = "100%";
      el("battlePlayerHpText").textContent = "100";
      el("battleEnemyHpText").textContent = "100";
      el("hand").innerHTML = `<div class="notice">No active battle.</div>`;
      el("battleLogLines").innerHTML = "No actions yet.";
      return;
    }

    const battle = state.battle;

    el("battleStatusTag").textContent = battle.finished ? "Finished" : "Live";
    el("battlePlayerName").textContent = battle.playerName;
    el("battleOpponentName").textContent = battle.opponentName;
    el("battleTime").textContent = String(battle.timeLeft);
    el("battleFlux").textContent = String(battle.flux);

    el("battlePlayerBar").style.width = `${Math.max(0, battle.playerHp)}%`;
    el("battleEnemyBar").style.width = `${Math.max(0, battle.enemyHp)}%`;
    el("battlePlayerHpText").textContent = String(Math.max(0, Math.round(battle.playerHp)));
    el("battleEnemyHpText").textContent = String(Math.max(0, Math.round(battle.enemyHp)));

    el("hand").innerHTML = battle.hand.map((cardId, index) => {
      const card = getCard(cardId);
      const disabled = battle.flux < card.cost || battle.finished;

      return `
        <button class="hand-card ${disabled ? "disabled" : ""}" data-play-card="${index}" ${disabled ? "disabled" : ""}>
          <div class="cost-bubble">${card.cost}</div>
          <div style="font-size:1.4rem;">${card.emoji}</div>
          <div class="name">${card.name}</div>
          <div class="mini">${card.role}</div>
        </button>
      `;
    }).join("");

    qsa("[data-play-card]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!state.battle || state.battle.finished) return;
        playPlayerCard(Number(btn.dataset.playCard));
      });
    });

    if (!battle.log.length) {
      el("battleLogLines").innerHTML = "No actions yet.";
    } else {
      const limit = state.save.settings.feedLimit || 40;
      el("battleLogLines").innerHTML = battle.log
        .slice(-limit)
        .reverse()
        .map((line) => `<div style="margin-bottom:8px;">• ${escapeHtml(line)}</div>`)
        .join("");
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function startMatchmakingFlow() {
    closeResult();
    showQueue(true);
    el("queueText").textContent = "Finding a match...";

    setTimeout(() => {
      beginBattle();
      showQueue(false);
      showScreen("battle");
    }, 1200);
  }

  function showQueue(show) {
    el("queueScreen")?.classList.toggle("show", show);
  }

  function beginBattle() {
    clearBattleTimers();

    const playerName = state.save.username || "Guest";
    const opponentName = pickOpponentUsername(playerName);

    state.battle = {
      playerName,
      opponentName,
      playerHp: 100,
      enemyHp: 100,
      flux: 0,
      timeLeft: 60,
      hand: drawOpeningHand(),
      deckCycle: [...state.save.deck],
      finished: false,
      log: [`Match found against ${opponentName}.`]
    };

    renderBattleUi();

    state.battleTimerId = window.setInterval(() => {
      if (!state.battle || state.battle.finished) return;

      state.battle.timeLeft -= 1;
      state.battle.flux = Math.min(10, state.battle.flux + 1);

      if (state.battle.timeLeft <= 0) {
        endBattleByTimer();
        return;
      }

      renderBattleUi();
    }, 1000);

    state.battleBotTimerId = window.setInterval(() => {
      if (!state.battle || state.battle.finished) return;
      botTakeTurn();
    }, 1800);
  }

  function drawOpeningHand() {
    return [...state.save.deck.slice(0, 4)];
  }

  function cycleCard(index) {
    const battle = state.battle;
    const nextCard = battle.deckCycle.shift();
    battle.deckCycle.push(nextCard);
    battle.hand.splice(index, 1);
    battle.hand.push(nextCard);
  }

  function playPlayerCard(index) {
    const battle = state.battle;
    if (!battle || battle.finished) return;

    const cardId = battle.hand[index];
    const card = getCard(cardId);
    if (!card || battle.flux < card.cost) return;

    battle.flux -= card.cost;

    const damage = scaledCardPower(card) + Math.floor(Math.random() * 6);
    battle.enemyHp = Math.max(0, battle.enemyHp - damage);
    battle.log.push(`${battle.playerName} played ${card.name} for ${damage} damage.`);

    cycleCard(index);

    if (battle.enemyHp <= 0) {
      finishBattle("victory");
      return;
    }

    renderBattleUi();
  }

  function botTakeTurn() {
    const battle = state.battle;
    if (!battle || battle.finished) return;

    const possibleCardId = battle.deckCycle[Math.floor(Math.random() * battle.deckCycle.length)];
    const card = getCard(possibleCardId);
    if (!card) return;

    const damage = Math.max(6, Math.floor(card.power * 0.7) + Math.floor(Math.random() * 6));
    battle.playerHp = Math.max(0, battle.playerHp - damage);
    battle.log.push(`${battle.opponentName} played ${card.name} for ${damage} damage.`);

    if (battle.playerHp <= 0) {
      finishBattle("defeat");
      return;
    }

    renderBattleUi();
  }

  function endBattleByTimer() {
    const battle = state.battle;
    if (!battle || battle.finished) return;

    if (battle.playerHp > battle.enemyHp) {
      finishBattle("victory");
    } else if (battle.enemyHp > battle.playerHp) {
      finishBattle("defeat");
    } else {
      finishBattle("draw");
    }
  }

  function clearBattleTimers() {
    if (state.battleTimerId) {
      clearInterval(state.battleTimerId);
      state.battleTimerId = null;
    }
    if (state.battleBotTimerId) {
      clearInterval(state.battleBotTimerId);
      state.battleBotTimerId = null;
    }
  }

  async function finishBattle(result) {
    const battle = state.battle;
    if (!battle || battle.finished) return;

    battle.finished = true;
    clearBattleTimers();

    let coins = 0;
    let trophiesDelta = 0;

    if (result === "victory") {
      coins = 40 + Math.floor(Math.random() * 20);
      trophiesDelta = 28 + Math.floor(Math.random() * 7);
      state.save.wins += 1;
    } else if (result === "defeat") {
      coins = 14 + Math.floor(Math.random() * 8);
      trophiesDelta = -(10 + Math.floor(Math.random() * 6));
      state.save.losses += 1;
    } else {
      coins = 22;
      trophiesDelta = 0;
    }

    const beforeTrophies = state.save.trophies;
    state.save.coins += coins;
    state.save.trophies = Math.max(0, state.save.trophies + trophiesDelta);

    state.save.history.unshift({
      result,
      opponent: battle.opponentName,
      coins,
      beforeTrophies,
      afterTrophies: state.save.trophies,
      when: new Date().toLocaleString()
    });

    if (state.save.history.length > 20) {
      state.save.history = state.save.history.slice(0, 20);
    }

    await persistSave();

    el("resultText").textContent = capitalize(result);
    el("resultTag").textContent = "Match Complete";
    el("resultRewards").innerHTML = `
      <div><strong>Opponent:</strong> ${escapeHtml(battle.opponentName)}</div>
      <div><strong>Coins:</strong> +${coins}</div>
      <div><strong>Trophies:</strong> ${trophiesDelta >= 0 ? "+" : ""}${trophiesDelta}</div>
      <div><strong>Final HP:</strong> You ${Math.round(battle.playerHp)} • Opponent ${Math.round(battle.enemyHp)}</div>
    `;

    el("resultModal")?.classList.add("show");
    renderAll();
  }

  function closeResult() {
    el("resultModal")?.classList.remove("show");
  }

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function exitBattleToHome() {
    clearBattleTimers();
    state.battle = null;
    renderAll();
    showScreen("home");
  }

  function pickOpponentUsername(playerUsername) {
    const filtered = BOT_USERNAMES.filter(
      (name) => name.toLowerCase() !== String(playerUsername).toLowerCase()
    );
    return filtered[Math.floor(Math.random() * filtered.length)] || "ArenaRival";
  }
})();
