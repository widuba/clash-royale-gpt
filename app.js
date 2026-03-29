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

  const LOCAL_SAVE_KEY = "siege_cards_phase8_save_v1";
  const CLOUD_SAVE_COLLECTION = "gameSaves";
  const PROFILE_COLLECTION = "profiles";
  const USERNAME_COLLECTION = "usernames";

  const USERNAME_REGEX = /^[A-Za-z][A-Za-z0-9_]{2,15}$/;

  const BOT_NAMES = [
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
    {
      id: "iron_guard",
      name: "Iron Guard",
      cost: 3,
      role: "Tank",
      emoji: "🛡️",
      hp: 520,
      damage: 34,
      speed: 11,
      range: 24,
      attackSpeed: 1.05,
      target: "ground",
      count: 1,
      radius: 20
    },
    {
      id: "axe_runner",
      name: "Axe Runner",
      cost: 2,
      role: "Melee",
      emoji: "🪓",
      hp: 260,
      damage: 56,
      speed: 18,
      range: 22,
      attackSpeed: 0.8,
      target: "ground",
      count: 1,
      radius: 18
    },
    {
      id: "arc_archer",
      name: "Arc Archer",
      cost: 3,
      role: "Ranged",
      emoji: "🏹",
      hp: 220,
      damage: 36,
      speed: 12,
      range: 120,
      attackSpeed: 0.95,
      target: "all",
      count: 1,
      radius: 17
    },
    {
      id: "ember_mage",
      name: "Ember Mage",
      cost: 4,
      role: "Caster",
      emoji: "🔥",
      hp: 210,
      damage: 58,
      speed: 11,
      range: 108,
      attackSpeed: 1.25,
      target: "all",
      splash: 20,
      count: 1,
      radius: 17
    },
    {
      id: "siege_ram",
      name: "Siege Ram",
      cost: 4,
      role: "Siege",
      emoji: "🐏",
      hp: 420,
      damage: 120,
      speed: 20,
      range: 20,
      attackSpeed: 1.35,
      target: "buildings",
      count: 1,
      radius: 20
    },
    {
      id: "wolf_pack",
      name: "Wolf Pack",
      cost: 3,
      role: "Swarm",
      emoji: "🐺",
      hp: 120,
      damage: 21,
      speed: 22,
      range: 16,
      attackSpeed: 0.58,
      target: "ground",
      count: 3,
      radius: 13
    },
    {
      id: "shield_node",
      name: "Shield Node",
      cost: 3,
      role: "Structure",
      emoji: "🔷",
      hp: 620,
      damage: 24,
      speed: 0,
      range: 96,
      attackSpeed: 1.0,
      target: "all",
      structure: true,
      lifetime: 28,
      count: 1,
      radius: 18
    },
    {
      id: "fire_burst",
      name: "Fire Burst",
      cost: 4,
      role: "Spell",
      emoji: "💥",
      spell: true,
      damage: 120,
      radiusSpell: 13
    },
    {
      id: "stone_brute",
      name: "Stone Brute",
      cost: 5,
      role: "Heavy Tank",
      emoji: "🪨",
      hp: 760,
      damage: 42,
      speed: 8,
      range: 22,
      attackSpeed: 1.15,
      target: "ground",
      count: 1,
      radius: 22
    },
    {
      id: "spark_bot",
      name: "Spark Bot",
      cost: 4,
      role: "Burst",
      emoji: "⚙️",
      hp: 180,
      damage: 140,
      speed: 10,
      range: 128,
      attackSpeed: 1.8,
      target: "all",
      count: 1,
      radius: 17
    },
    {
      id: "dart_hunter",
      name: "Dart Hunter",
      cost: 2,
      role: "Chip",
      emoji: "🎯",
      hp: 170,
      damage: 24,
      speed: 13,
      range: 132,
      attackSpeed: 0.72,
      target: "all",
      count: 1,
      radius: 15
    },
    {
      id: "twin_blade",
      name: "Twin Blade",
      cost: 4,
      role: "DPS",
      emoji: "⚔️",
      hp: 320,
      damage: 34,
      speed: 16,
      range: 18,
      attackSpeed: 0.42,
      target: "ground",
      count: 1,
      radius: 18
    }
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
  const MAX_ELIXIR = 10;
  const BATTLE_LENGTH = 180;

  const $ = (id) => document.getElementById(id);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const screens = {
    home: $("screen-home"),
    deck: $("screen-deck"),
    collection: $("screen-collection"),
    battle: $("screen-battle")
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
    authMode: "login",
    animationFrame: null,
    lastFrameTs: 0,
    drag: {
      active: false,
      handIndex: null,
      ghost: null,
      pointerId: null
    }
  };

  init();

  async function init() {
    wireUi();
    renderAll();
    await initFirebase();
    renderAll();
  }

  function wireUi() {
    $("btnPlay")?.addEventListener("click", startMatchmakingFlow);
    $("btnDeck")?.addEventListener("click", () => showScreen("deck"));
    $("btnCollection")?.addEventListener("click", () => showScreen("collection"));
    $("btnShop")?.addEventListener("click", openShop);
    $("btnHistory")?.addEventListener("click", openHistory);
    $("btnSettings")?.addEventListener("click", openSettings);
    $("btnRefreshShop")?.addEventListener("click", async () => {
      state.save.shop = rotateShop();
      await persistSave();
      openShop();
    });

    $$("[data-home]").forEach((btn) => {
      btn.addEventListener("click", () => showScreen("home"));
    });

    $("btnOpenAuth")?.addEventListener("click", openAuthModal);
    $("btnCloseAuth")?.addEventListener("click", closeAuthModal);
    $("btnLogin")?.addEventListener("click", handleLogin);
    $("btnSignup")?.addEventListener("click", handleSignup);
    $("btnGuest")?.addEventListener("click", closeAuthModal);
    $("btnLogout")?.addEventListener("click", handleLogout);
    $("tabLogin")?.addEventListener("click", () => setAuthMode("login"));
    $("tabSignup")?.addEventListener("click", () => setAuthMode("signup"));

    $("closeShop")?.addEventListener("click", closeShop);
    $("closeHistory")?.addEventListener("click", closeHistory);
    $("closeSettings")?.addEventListener("click", closeSettings);

    $("toggleSound")?.addEventListener("click", async () => {
      state.save.settings.soundEnabled = !state.save.settings.soundEnabled;
      await persistSave();
      renderSettings();
    });

    $("feedLimitSelect")?.addEventListener("change", async (e) => {
      state.save.settings.feedLimit = Number(e.target.value) || 40;
      await persistSave();
    });

    $("btnExitBattle")?.addEventListener("click", exitBattleToHome);
    $("backHome")?.addEventListener("click", () => {
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
      state.firebaseError = "Firebase not ready. Replace config values.";
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
        state.save = hydrateSave(saveSnap.data()?.save);
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

    return { ok: true };
  }

  async function reserveUsernameForUser(uid, email, username) {
    const validation = validateUsername(username);
    if (!validation.ok) throw new Error(validation.message);

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

    const email = ($("authEmail")?.value || "").trim();
    const password = ($("authPassword")?.value || "").trim();
    const username = ($("authUsername")?.value || "").trim();

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

    const email = ($("authEmail")?.value || "").trim();
    const password = ($("authPassword")?.value || "").trim();

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

    const loginTab = $("tabLogin");
    const signupTab = $("tabSignup");
    const loginBtn = $("btnLogin");
    const signupBtn = $("btnSignup");
    const usernameWrap = $("usernameWrap");

    if (loginTab && signupTab) {
      if (mode === "login") {
        loginTab.className = "btn";
        signupTab.className = "btn alt";
      } else {
        loginTab.className = "btn alt";
        signupTab.className = "btn";
      }
    }

    if (loginBtn) loginBtn.classList.toggle("hidden", mode !== "login");
    if (signupBtn) signupBtn.classList.toggle("hidden", mode !== "signup");
    if (usernameWrap) usernameWrap.classList.toggle("hidden", mode !== "signup");
  }

  function setAuthMessage(text) {
    const node = $("authMessage");
    if (node) node.textContent = text;
  }

  function openAuthModal() {
    setAuthMode(state.authMode);
    renderAuthUi();
    $("authModal")?.classList.add("show");
  }

  function closeAuthModal() {
    $("authModal")?.classList.remove("show");
  }

  function openShop() {
    renderShop();
    $("shopModal")?.classList.add("show");
  }

  function closeShop() {
    $("shopModal")?.classList.remove("show");
  }

  function openHistory() {
    renderHistory();
    $("historyModal")?.classList.add("show");
  }

  function closeHistory() {
    $("historyModal")?.classList.remove("show");
  }

  function openSettings() {
    renderSettings();
    $("settingsModal")?.classList.add("show");
  }

  function closeSettings() {
    $("settingsModal")?.classList.remove("show");
  }

  function closeResult() {
    $("resultModal")?.classList.remove("show");
  }

  function getLeagueInfo(trophies) {
    const current = LEAGUES.find((league) => trophies >= league.min && trophies <= league.max) || LEAGUES[LEAGUES.length - 1];
    return { current };
  }

  function getCard(cardId) {
    return CARDS.find((card) => card.id === cardId);
  }

  function cardLevel(cardId) {
    return state.save.cardLevels[cardId] || 1;
  }

  function scaledUnitStats(card) {
    const level = cardLevel(card.id);
    const mult = 1 + (level - 1) * 0.10;
    return {
      hp: Math.round((card.hp || 0) * mult),
      damage: Math.round((card.damage || 0) * mult)
    };
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

  function getTowerStatsForTrophies(trophies) {
    const tier = Math.floor(trophies / 200);
    return {
      crownHp: 1400 + tier * 120,
      kingHp: 2400 + tier * 180,
      crownDamage: 42 + tier * 3,
      kingDamage: 54 + tier * 4
    };
  }

  function showScreen(name) {
    Object.values(screens).forEach((screen) => screen?.classList.remove("active"));
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
    const league = getLeagueInfo(state.save.trophies).current;

    if ($("homeLevel")) $("homeLevel").textContent = state.save.level;
    if ($("homeCoins")) $("homeCoins").textContent = state.save.coins;
    if ($("homeTrophies")) $("homeTrophies").textContent = state.save.trophies;
    if ($("leagueBadge")) $("leagueBadge").textContent = league.name;
    if ($("leagueTrophies")) $("leagueTrophies").textContent = String(state.save.trophies);

    if ($("profileUsername")) $("profileUsername").textContent = state.save.username || "Guest";
    if ($("profileEmail")) $("profileEmail").textContent = state.currentUser?.email || "Not signed in";
    if ($("statWins")) $("statWins").textContent = state.save.wins;
    if ($("statLosses")) $("statLosses").textContent = state.save.losses;
    if ($("authStatusPill")) {
      $("authStatusPill").textContent = state.currentUser
        ? (state.save.username || state.currentUser.email || "Signed In")
        : "Guest";
    }
    if ($("btnLogout")) $("btnLogout").classList.toggle("hidden", !state.currentUser);

    const homeDeck = $("homeDeckPreview");
    if (homeDeck) {
      homeDeck.innerHTML = state.save.deck.map((cardId, index) => {
        const card = getCard(cardId);
        return `
          <div class="slot filled">
            <div class="tag">Slot ${index + 1}</div>
            <div style="font-size:1.55rem;margin:8px 0 6px;">${card.emoji}</div>
            <div style="font-weight:900;">${card.name}</div>
            <div class="tiny muted">Cost ${card.cost} • Lvl ${cardLevel(card.id)}</div>
          </div>
        `;
      }).join("");
    }
  }

  function renderDeck() {
    const slotsHost = $("deckSlots");
    const poolHost = $("deckCardPool");
    if (!slotsHost || !poolHost) return;

    const avgCost = (state.save.deck.reduce((sum, id) => sum + (getCard(id)?.cost || 0), 0) / state.save.deck.length).toFixed(1);
    if ($("deckAvgCost")) $("deckAvgCost").textContent = avgCost;

    slotsHost.className = "deck-slots";
    slotsHost.innerHTML = state.save.deck.map((cardId, index) => {
      const card = getCard(cardId);
      const selected = state.selectedDeckSlot === index;
      return `
        <button class="slot filled" data-deck-slot="${index}" style="${selected ? "outline:2px solid var(--gold);" : ""}">
          <div class="tag">Slot ${index + 1}</div>
          <div style="font-size:1.5rem;margin:8px 0 6px;">${card.emoji}</div>
          <div style="font-weight:900;">${card.name}</div>
          <div class="tiny muted">Cost ${card.cost} • Lvl ${cardLevel(card.id)}</div>
        </button>
      `;
    }).join("");

    poolHost.className = "collection-grid";
    poolHost.innerHTML = CARDS.map((card) => {
      const stats = scaledUnitStats(card);
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
            <span>Lvl ${cardLevel(card.id)}</span>
            ${card.spell ? `<span>Spell ${card.damage}</span>` : `<span>ATK ${stats.damage}</span><span>HP ${stats.hp}</span>`}
          </div>
          <div class="btn-row">
            <button class="btn ${alreadyInDeck ? "alt" : ""}" data-pick-card="${card.id}">
              ${alreadyInDeck ? "In Deck" : "Use In Slot"}
            </button>
          </div>
        </div>
      `;
    }).join("");

    $$("[data-deck-slot]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.selectedDeckSlot = Number(btn.dataset.deckSlot);
        renderDeck();
      });
    });

    $$("[data-pick-card]").forEach((btn) => {
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
    const grid = $("collectionGrid");
    if (!grid) return;

    if ($("collectionCoins")) $("collectionCoins").textContent = state.save.coins;

    grid.className = "collection-grid";
    grid.innerHTML = CARDS.map((card) => {
      const level = cardLevel(card.id);
      const stats = scaledUnitStats(card);
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
            ${card.spell ? `<span>Spell ${card.damage}</span>` : `<span>ATK ${stats.damage}</span><span>HP ${stats.hp}</span>`}
          </div>
          <div class="btn-row">
            <button class="btn ${canUpgrade ? "good" : "alt"}" data-upgrade-card="${card.id}" ${canUpgrade ? "" : "disabled"}>
              Upgrade (${upgradeCost})
            </button>
          </div>
        </div>
      `;
    }).join("");

    $$("[data-upgrade-card]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const cardId = btn.dataset.upgradeCard;
        const level = cardLevel(cardId);
        const cost = getUpgradeCost(level);
        if (state.save.coins < cost || level >= 10) return;

        state.save.coins -= cost;
        state.save.cardLevels[cardId] = level + 1;
        await persistSave();
      });
    });
  }

  function renderShop() {
    const grid = $("shopGrid");
    if (!grid) return;

    grid.className = "collection-grid";
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

    $$("[data-buy-offer]").forEach((btn) => {
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
    const list = $("historyList");
    if (!list) return;

    list.className = "history-list";

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
    if ($("toggleSound")) {
      $("toggleSound").textContent = state.save.settings.soundEnabled ? "Sound: On" : "Sound: Off";
    }
    if ($("feedLimitSelect")) {
      $("feedLimitSelect").value = String(state.save.settings.feedLimit || 40);
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
      if ($("battlePlayerName")) $("battlePlayerName").textContent = state.save.username || "Guest";
      if ($("battleOpponentName")) $("battleOpponentName").textContent = "Unknown";
      setBattleElixir(0, 0);
      if ($("battleTime")) $("battleTime").textContent = String(BATTLE_LENGTH);
      if ($("playerLeftHp")) $("playerLeftHp").textContent = "0";
      if ($("playerRightHp")) $("playerRightHp").textContent = "0";
      if ($("playerKingHp")) $("playerKingHp").textContent = "0";
      if ($("enemyLeftHp")) $("enemyLeftHp").textContent = "0";
      if ($("enemyRightHp")) $("enemyRightHp").textContent = "0";
      if ($("enemyKingHp")) $("enemyKingHp").textContent = "0";
      if ($("hand")) $("hand").innerHTML = `<div class="notice">No active battle.</div>`;
      if ($("battleLogLines")) $("battleLogLines").innerHTML = "No actions yet.";
      if ($("arenaUnits")) $("arenaUnits").innerHTML = "";
      return;
    }

    const battle = state.battle;

    if ($("battlePlayerName")) $("battlePlayerName").textContent = battle.playerName;
    if ($("battleOpponentName")) $("battleOpponentName").textContent = battle.opponentName;
    if ($("battleTime")) $("battleTime").textContent = String(Math.max(0, Math.ceil(battle.timeLeft)));
    setBattleElixir(battle.player.elixir, battle.enemy.elixir);

    if ($("playerLeftHp")) $("playerLeftHp").textContent = String(Math.max(0, Math.round(battle.towers.player.left.hp)));
    if ($("playerRightHp")) $("playerRightHp").textContent = String(Math.max(0, Math.round(battle.towers.player.right.hp)));
    if ($("playerKingHp")) $("playerKingHp").textContent = String(Math.max(0, Math.round(battle.towers.player.king.hp)));
    if ($("enemyLeftHp")) $("enemyLeftHp").textContent = String(Math.max(0, Math.round(battle.towers.enemy.left.hp)));
    if ($("enemyRightHp")) $("enemyRightHp").textContent = String(Math.max(0, Math.round(battle.towers.enemy.right.hp)));
    if ($("enemyKingHp")) $("enemyKingHp").textContent = String(Math.max(0, Math.round(battle.towers.enemy.king.hp)));

    renderHand();
    renderBattleLog();
    renderUnits();
  }

  function setBattleElixir(playerValue, enemyValue) {
    document.querySelectorAll("[id='battleFlux']").forEach((node) => {
      node.textContent = String(playerValue);
    });
    if ($("elixirBar")) {
      const percent = Math.max(0, Math.min(100, (playerValue / MAX_ELIXIR) * 100));
      $("elixirBar").style.width = `${percent}%`;
    }
  }

  function renderHand() {
    const hand = $("hand");
    if (!hand || !state.battle) return;

    hand.innerHTML = state.battle.player.hand.map((cardId, index) => {
      const card = getCard(cardId);
      const disabled = state.battle.player.elixir < card.cost || state.battle.finished;

      return `
        <button class="hand-card ${disabled ? "disabled" : ""}" data-hand-index="${index}" ${disabled ? "disabled" : ""}>
          <div class="cost-bubble">${card.cost}</div>
          <div style="font-size:1.4rem;">${card.emoji}</div>
          <div class="name">${card.name}</div>
          <div class="mini">${card.role}</div>
        </button>
      `;
    }).join("");

    $$("[data-hand-index]").forEach((btn) => {
      const index = Number(btn.dataset.handIndex);

      btn.addEventListener("click", () => {
        if (!state.battle || state.battle.finished) return;
        state.battle.selectedHandIndex = index;
      });

      btn.addEventListener("pointerdown", (e) => {
        if (!state.battle || state.battle.finished) return;
        startDrag(index, e);
      });
    });

    wireArenaDrop();
  }

  function wireArenaDrop() {
    const arena = document.querySelector(".arena");
    if (!arena || arena.dataset.dragWired === "1") return;
    arena.dataset.dragWired = "1";

    arena.addEventListener("pointermove", onArenaPointerMove);
    arena.addEventListener("pointerup", onArenaPointerUp);
    arena.addEventListener("pointercancel", cancelDrag);
    arena.addEventListener("click", onArenaClickDeploy);
  }

  function startDrag(handIndex, event) {
    const battle = state.battle;
    if (!battle || battle.finished) return;

    const cardId = battle.player.hand[handIndex];
    const card = getCard(cardId);
    if (!card || battle.player.elixir < card.cost) return;

    cancelDrag();

    state.drag.active = true;
    state.drag.handIndex = handIndex;
    state.drag.pointerId = event.pointerId;

    const ghost = document.createElement("div");
    ghost.className = "hand-card";
    ghost.style.position = "fixed";
    ghost.style.left = `${event.clientX - 48}px`;
    ghost.style.top = `${event.clientY - 56}px`;
    ghost.style.width = "96px";
    ghost.style.height = "112px";
    ghost.style.zIndex = "1000";
    ghost.style.pointerEvents = "none";
    ghost.style.opacity = "0.92";
    ghost.style.transform = "scale(1.02)";
    ghost.innerHTML = `
      <div class="cost-bubble">${card.cost}</div>
      <div style="font-size:1.4rem;">${card.emoji}</div>
      <div class="name">${card.name}</div>
      <div class="mini">${card.role}</div>
    `;
    document.body.appendChild(ghost);
    state.drag.ghost = ghost;
  }

  function onArenaPointerMove(event) {
    if (!state.drag.active || !state.drag.ghost) return;
    state.drag.ghost.style.left = `${event.clientX - 48}px`;
    state.drag.ghost.style.top = `${event.clientY - 56}px`;
  }

  function onArenaPointerUp(event) {
    if (!state.drag.active) return;
    tryDeployDraggedCard(event);
  }

  function onArenaClickDeploy(event) {
    const battle = state.battle;
    if (!battle || battle.finished) return;
    if (state.drag.active) return;
    if (battle.selectedHandIndex == null) return;

    deployPlayerCardAtPointer(battle.selectedHandIndex, event);
    battle.selectedHandIndex = null;
  }

  function tryDeployDraggedCard(event) {
    const handIndex = state.drag.handIndex;
    cancelDrag();
    if (handIndex == null) return;
    deployPlayerCardAtPointer(handIndex, event);
  }

  function cancelDrag() {
    state.drag.active = false;
    state.drag.handIndex = null;
    state.drag.pointerId = null;
    if (state.drag.ghost) {
      state.drag.ghost.remove();
      state.drag.ghost = null;
    }
  }

  function deployPlayerCardAtPointer(handIndex, event) {
    const battle = state.battle;
    if (!battle || battle.finished) return;

    const arena = document.querySelector(".arena");
    if (!arena) return;

    const rect = arena.getBoundingClientRect();
    const xPct = clamp(((event.clientX - rect.left) / rect.width) * 100, 6, 94);
    const yPctRaw = clamp(((event.clientY - rect.top) / rect.height) * 100, 6, 94);

    if (yPctRaw < 54) {
      battle.log.push("You can only place cards on your side of the arena.");
      renderBattleLog();
      return;
    }

    playPlayerCard(handIndex, xPct, yPctRaw);
  }

  function renderBattleLog() {
    const host = $("battleLogLines");
    if (!host || !state.battle) return;

    const limit = state.save.settings.feedLimit || 40;
    if (!state.battle.log.length) {
      host.innerHTML = "No actions yet.";
      return;
    }

    host.innerHTML = state.battle.log
      .slice(-limit)
      .reverse()
      .map((line) => `<div class="feed-line">• ${escapeHtml(line)}</div>`)
      .join("");
  }

  function renderUnits() {
    const host = $("arenaUnits");
    if (!host || !state.battle) return;

    host.innerHTML = state.battle.units.map((unit) => {
      const hpPct = Math.max(0, Math.min(100, (unit.hp / unit.maxHp) * 100));
      return `
        <div class="unit ${unit.side}" style="left:${unit.x}%;top:${unit.y}%;">
          <div class="unit-bar"><span style="width:${hpPct}%"></span></div>
          <div>${unit.emoji}</div>
        </div>
      `;
    }).join("");
  }

  function startMatchmakingFlow() {
    closeResult();
    showQueue(true);
    if ($("queueText")) $("queueText").textContent = "Finding a match...";

    setTimeout(() => {
      beginBattle();
      showQueue(false);
      showScreen("battle");
    }, 1200);
  }

  function showQueue(show) {
    $("queueScreen")?.classList.toggle("show", show);
  }

  function beginBattle() {
    cancelAnimationFrame(state.animationFrame);
    state.lastFrameTs = 0;
    cancelDrag();

    const playerName = state.save.username || "Guest";
    const opponentName = pickOpponentUsername(playerName);
    const towerStats = getTowerStatsForTrophies(state.save.trophies);

    state.battle = {
      playerName,
      opponentName,
      timeLeft: BATTLE_LENGTH,
      finished: false,
      log: [`Match found against ${opponentName}.`],
      selectedHandIndex: null,
      player: {
        elixir: 0,
        elixirTimer: 0,
        drawQueue: [...state.save.deck],
        hand: [...state.save.deck.slice(0, 4)]
      },
      enemy: {
        elixir: 0,
        elixirTimer: 0,
        drawQueue: shuffle([...state.save.deck]),
        hand: shuffle([...state.save.deck]).slice(0, 4),
        thinkTimer: 1.0
      },
      towers: {
        player: {
          left: { x: 14, y: 83, hp: towerStats.crownHp, maxHp: towerStats.crownHp, damage: towerStats.crownDamage, type: "crown", cooldown: 0, range: 105 },
          right: { x: 86, y: 83, hp: towerStats.crownHp, maxHp: towerStats.crownHp, damage: towerStats.crownDamage, type: "crown", cooldown: 0, range: 105 },
          king: { x: 50, y: 94, hp: towerStats.kingHp, maxHp: towerStats.kingHp, damage: towerStats.kingDamage, type: "king", cooldown: 0, range: 118 }
        },
        enemy: {
          left: { x: 14, y: 17, hp: towerStats.crownHp, maxHp: towerStats.crownHp, damage: towerStats.crownDamage, type: "crown", cooldown: 0, range: 105 },
          right: { x: 86, y: 17, hp: towerStats.crownHp, maxHp: towerStats.crownHp, damage: towerStats.crownDamage, type: "crown", cooldown: 0, range: 105 },
          king: { x: 50, y: 6, hp: towerStats.kingHp, maxHp: towerStats.kingHp, damage: towerStats.kingDamage, type: "king", cooldown: 0, range: 118 }
        }
      },
      units: [],
      idSeq: 1
    };

    renderBattleUi();
    state.animationFrame = requestAnimationFrame(battleLoop);
  }

  function battleLoop(ts) {
    if (!state.battle || state.battle.finished) return;

    if (!state.lastFrameTs) state.lastFrameTs = ts;
    const dt = Math.min(0.033, (ts - state.lastFrameTs) / 1000);
    state.lastFrameTs = ts;

    const battle = state.battle;

    battle.timeLeft -= dt;

    updateElixir(dt);
    updateBot(dt);
    updateUnits(dt);
    updateTowers(dt);
    cleanupDeadUnits();

    if (battle.timeLeft <= 0) {
      finishBattle(decideWinnerOnTime());
      return;
    }

    if (battle.towers.player.king.hp <= 0) {
      finishBattle("defeat");
      return;
    }

    if (battle.towers.enemy.king.hp <= 0) {
      finishBattle("victory");
      return;
    }

    renderBattleUi();
    state.animationFrame = requestAnimationFrame(battleLoop);
  }

  function updateElixir(dt) {
    const battle = state.battle;
    if (!battle) return;

    battle.player.elixirTimer += dt;
    battle.enemy.elixirTimer += dt;

    if (battle.player.elixirTimer >= 1.15) {
      battle.player.elixirTimer = 0;
      battle.player.elixir = Math.min(MAX_ELIXIR, battle.player.elixir + 1);
    }

    if (battle.enemy.elixirTimer >= 1.15) {
      battle.enemy.elixirTimer = 0;
      battle.enemy.elixir = Math.min(MAX_ELIXIR, battle.enemy.elixir + 1);
    }
  }

  function updateBot(dt) {
    const battle = state.battle;
    if (!battle) return;

    battle.enemy.thinkTimer -= dt;
    if (battle.enemy.thinkTimer > 0) return;

    battle.enemy.thinkTimer = 1.1 + Math.random() * 0.75;

    const playable = battle.enemy.hand
      .map((id, index) => ({ id, index, card: getCard(id) }))
      .filter((entry) => entry.card && entry.card.cost <= battle.enemy.elixir);

    if (!playable.length) return;

    playable.sort((a, b) => b.card.cost - a.card.cost);
    const pick = playable[0];

    const laneLeft = Math.random() < 0.5;
    const x = laneLeft ? 28 + Math.random() * 8 : 64 + Math.random() * 8;
    const y = pick.card.spell ? 66 + Math.random() * 8 : 18 + Math.random() * 6;

    battle.enemy.elixir -= pick.card.cost;
    battle.log.push(`${battle.opponentName} played ${pick.card.name}.`);

    if (pick.card.spell) {
      castSpell("enemy", pick.card, x, y);
    } else {
      spawnCardUnits("enemy", pick.card, x, 18 + Math.random() * 6);
    }

    cycleHandCard("enemy", pick.index);
  }

  function playPlayerCard(index, xPct, yPct) {
    const battle = state.battle;
    if (!battle || battle.finished) return;

    const cardId = battle.player.hand[index];
    const card = getCard(cardId);
    if (!card || battle.player.elixir < card.cost) return;

    battle.player.elixir -= card.cost;
    battle.log.push(`${battle.playerName} played ${card.name}.`);

    if (card.spell) {
      castSpell("player", card, xPct, yPct);
    } else {
      spawnCardUnits("player", card, xPct, yPct);
    }

    cycleHandCard("player", index);
    renderBattleUi();
  }

  function cycleHandCard(side, index) {
    const holder = state.battle[side];
    const queue = holder.drawQueue;
    if (!queue.length) return;

    const next = queue.shift();
    queue.push(next);
    holder.hand.splice(index, 1);
    holder.hand.push(next);
  }

  function castSpell(side, card, xPct, yPct) {
    const enemySide = side === "player" ? "enemy" : "player";
    const radius = card.radiusSpell || 12;
    let hitSomething = false;

    state.battle.units.forEach((unit) => {
      if (unit.side !== enemySide) return;
      if (distancePoints(unit.x, unit.y, xPct, yPct) <= radius) {
        unit.hp -= card.damage;
        hitSomething = true;
      }
    });

    for (const tower of Object.values(state.battle.towers[enemySide])) {
      if (tower.hp <= 0) continue;
      if (distancePoints(tower.x, tower.y, xPct, yPct) <= radius) {
        const hit = Math.round(card.damage * 0.7);
        tower.hp -= hit;
        hitSomething = true;
      }
    }

    if (hitSomething) {
      state.battle.log.push(`${side === "player" ? state.battle.playerName : state.battle.opponentName} used ${card.name}.`);
    }
  }

  function spawnCardUnits(side, card, baseX, baseY) {
    const stats = scaledUnitStats(card);
    const count = card.count || 1;

    for (let i = 0; i < count; i++) {
      const spreadX = count === 1 ? 0 : (i - (count - 1) / 2) * 3.5;
      const spreadY = count === 1 ? 0 : (i % 2 === 0 ? 1.1 : -1.1);

      state.battle.units.push({
        uid: `u_${state.battle.idSeq++}`,
        cardId: card.id,
        side,
        emoji: card.emoji,
        x: clamp(baseX + spreadX, 8, 92),
        y: clamp(baseY + spreadY, 8, 92),
        hp: stats.hp,
        maxHp: stats.hp,
        damage: stats.damage,
        speed: card.speed || 12,
        range: card.range || 22,
        attackSpeed: card.attackSpeed || 1,
        attackCd: Math.random() * 0.25,
        targetMode: card.target || "ground",
        radius: card.radius || 18,
        splash: card.splash || 0,
        structure: !!card.structure,
        lifetime: card.lifetime || null
      });
    }
  }

  function updateUnits(dt) {
    const battle = state.battle;
    if (!battle) return;

    for (const unit of battle.units) {
      if (unit.lifetime !== null) {
        unit.lifetime -= dt;
        if (unit.lifetime <= 0) {
          unit.hp = 0;
          continue;
        }
      }

      unit.attackCd -= dt;

      const target = findUnitTarget(unit);
      if (!target) continue;

      const dx = target.x - unit.x;
      const dy = target.y - unit.y;
      const dist = Math.hypot(dx, dy);
      const rangePct = unit.range / 18;

      if (dist <= rangePct) {
        if (unit.attackCd <= 0) {
          dealUnitAttack(unit, target);
          unit.attackCd = unit.attackSpeed;
        }
      } else if (!unit.structure) {
        const moveAmt = (unit.speed / 10) * dt;
        unit.x += (dx / (dist || 1)) * moveAmt;
        unit.y += (dy / (dist || 1)) * moveAmt;
      }
    }
  }

  function updateTowers(dt) {
    const battle = state.battle;
    if (!battle) return;

    for (const sideKey of ["player", "enemy"]) {
      const enemySide = sideKey === "player" ? "enemy" : "player";

      for (const tower of Object.values(battle.towers[sideKey])) {
        if (tower.hp <= 0) continue;
        tower.cooldown -= dt;

        const target = findClosestEnemyUnit(tower, enemySide, tower.range / 18);
        if (!target) continue;

        if (tower.cooldown <= 0) {
          target.hp -= tower.damage;
          tower.cooldown = tower.type === "king" ? 1.05 : 0.95;
        }
      }
    }
  }

  function findClosestEnemyUnit(origin, enemySide, maxDist) {
    let best = null;
    let bestDist = Infinity;

    for (const unit of state.battle.units) {
      if (unit.side !== enemySide) continue;
      const d = distancePoints(origin.x, origin.y, unit.x, unit.y);
      if (d <= maxDist && d < bestDist) {
        bestDist = d;
        best = unit;
      }
    }

    return best;
  }

  function findUnitTarget(unit) {
    const enemySide = unit.side === "player" ? "enemy" : "player";

    let best = null;
    let bestDist = Infinity;

    if (unit.targetMode !== "buildings") {
      for (const other of state.battle.units) {
        if (other.side !== enemySide) continue;
        const d = distancePoints(unit.x, unit.y, other.x, other.y);
        if (d < bestDist) {
          bestDist = d;
          best = other;
        }
      }
    }

    const tower = choosePriorityTower(enemySide, unit.x);
    if (tower) {
      const d = distancePoints(unit.x, unit.y, tower.x, tower.y);
      if (d < bestDist || unit.targetMode === "buildings") {
        best = tower;
      }
    }

    return best;
  }

  function choosePriorityTower(side, laneX = 50) {
    const towers = state.battle.towers[side];
    const preferred = laneX < 50 ? towers.left : towers.right;
    const other = laneX < 50 ? towers.right : towers.left;

    if (preferred.hp > 0) return preferred;
    if (other.hp > 0) return other;
    if (towers.king.hp > 0) return towers.king;
    return null;
  }

  function dealUnitAttack(unit, target) {
    target.hp -= unit.damage;

    if ("cardId" in target) {
      const attackerName = getCard(unit.cardId)?.name || "Unit";
      const defenderName = getCard(target.cardId)?.name || "Unit";
      state.battle.log.push(`${attackerName} hit ${defenderName} for ${unit.damage}.`);

      if (unit.splash) {
        for (const other of state.battle.units) {
          if (other.side !== target.side || other === target) continue;
          if (distancePoints(target.x, target.y, other.x, other.y) <= unit.splash / 18) {
            other.hp -= Math.round(unit.damage * 0.55);
          }
        }
      }
    } else {
      const attackerName = getCard(unit.cardId)?.name || "Unit";
      state.battle.log.push(`${attackerName} hit a tower for ${unit.damage}.`);
    }
  }

  function cleanupDeadUnits() {
    if (!state.battle) return;
    state.battle.units = state.battle.units.filter((u) => u.hp > 0);

    for (const sideKey of ["player", "enemy"]) {
      for (const tower of Object.values(state.battle.towers[sideKey])) {
        tower.hp = Math.max(0, tower.hp);
      }
    }
  }

  function decideWinnerOnTime() {
    const p = totalHp(state.battle.towers.player);
    const e = totalHp(state.battle.towers.enemy);
    if (e < p) return "victory";
    if (p < e) return "defeat";
    return "draw";
  }

  function totalHp(sideTowers) {
    return sideTowers.left.hp + sideTowers.right.hp + sideTowers.king.hp;
  }

  async function finishBattle(result) {
    const battle = state.battle;
    if (!battle || battle.finished) return;

    battle.finished = true;
    cancelAnimationFrame(state.animationFrame);
    state.animationFrame = null;
    cancelDrag();

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

    if ($("resultText")) $("resultText").textContent = capitalize(result);
    if ($("resultTag")) $("resultTag").textContent = "Match Complete";
    if ($("resultRewards")) {
      $("resultRewards").innerHTML = `
        <div><strong>Opponent:</strong> ${escapeHtml(battle.opponentName)}</div>
        <div><strong>Coins:</strong> +${coins}</div>
        <div><strong>Trophies:</strong> ${trophiesDelta >= 0 ? "+" : ""}${trophiesDelta}</div>
        <div><strong>Final HP:</strong> You ${Math.round(totalHp(battle.towers.player))} • Opponent ${Math.round(totalHp(battle.towers.enemy))}</div>
      `;
    }

    $("resultModal")?.classList.add("show");
    renderAll();
  }

  function exitBattleToHome() {
    cancelAnimationFrame(state.animationFrame);
    state.animationFrame = null;
    state.battle = null;
    state.lastFrameTs = 0;
    cancelDrag();
    renderAll();
    showScreen("home");
  }

  function pickOpponentUsername(playerUsername) {
    const filtered = BOT_NAMES.filter((name) => name.toLowerCase() !== String(playerUsername).toLowerCase());
    return filtered[Math.floor(Math.random() * filtered.length)] || "ArenaRival";
  }

  function distancePoints(x1, y1, x2, y2) {
    return Math.hypot(x1 - x2, y1 - y2);
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
})();
