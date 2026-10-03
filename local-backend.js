/**
 * UPGRADER LOCAL BACKEND & ACCOUNT SYSTEM v4
 * Local storage, mock API, account management, upgrade engine, shop & inventory,
 * live drops simulation, realistic online & upgrades counters, profile editing,
 * games & items history, and steam withdrawal simulator.
 */
(function() {
  'use strict';

  // Proactively purge any leftover Service Workers or caches from previous projects on this host/port
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(regs) {
        for (var r of regs) {
          r.unregister();
        }
      });
    }
    if ('caches' in window) {
      caches.keys().then(function(keys) {
        for (var k of keys) {
          caches.delete(k);
        }
      });
    }
  } catch(e) {}

  // 1. LOAD EXTENSIVE SKINS CATALOG FROM skins.json (15,800+ skins synced from upgrader.best)
  let catalogData = [];
  try {
    const isSubdir = window.location.pathname.includes('/cis') || window.location.pathname.includes('/en') || window.location.pathname.includes('/ru') || window.location.pathname.includes('/admin');
    const candidates = [
      isSubdir ? '../skins.json' : './skins.json',
      './skins.json',
      '/skins.json'
    ];
    for (const url of candidates) {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.send();
        if (xhr.status === 200 && xhr.responseText) {
          catalogData = JSON.parse(xhr.responseText);
          console.log('[UPGRADER] Loaded', catalogData.length, 'skins from', url);
          break;
        }
      } catch(err) {}
    }
  } catch(e) {
    console.warn('[UPGRADER] Could not load skins.json synchronously:', e);
  }

  // Selected starter skins covering different price tiers
  const STARTER_NAMES = [
    'Glock-18 | High Beam (Field-Tested)',
    'AK-47 | Slate (Field-Tested)',
    'AWP | Atheris (Field-Tested)',
    'AK-47 | Redline (Field-Tested)',
    '★ Navaja Knife | Safari Mesh (Field-Tested)',
    '★ Gut Knife | Freehand (Field-Tested)'
  ];
  const starterSkinsList = [];
  STARTER_NAMES.forEach(name => {
    const s = catalogData.find(x => x.marketName === name);
    if (s) starterSkinsList.push(s);
  });
  if (starterSkinsList.length === 0) {
    starterSkinsList.push(...catalogData.slice(0, 6));
  }

  const getAssetPath = (p) => {
    const isSub = window.location.pathname.includes('/cis') || window.location.pathname.includes('/en') || window.location.pathname.includes('/ru') || window.location.pathname.includes('/admin');
    const clean = p.replace(/^\//, '');
    return isSub ? '../' + clean : './' + clean;
  };

  // 2. CONFIGURATION
  window.UPGRADER_CONFIG = {
    testAccount: {
      username: 'test_user',
      password: 'password123',
      nickname: 'Test Winner',
      avatar: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
      initialBalance: 50000.00,
      isTosRead: true,
      isTosAccepted: true,
      tosAccepted: true,
      newsletterSubscribed: true
    },
    starterSkins: starterSkinsList,
    catalog: catalogData
  };

  const STORAGE_ACCOUNTS_KEY = 'upgrader_accounts_v4';
  const STORAGE_ACTIVE_KEY = 'upgrader_active_user_v4';

  // 3. GLOBAL STATS (Site-wide upgrades counter & online counter)
  const GlobalStats = {
    UPGRADES_KEY: 'upgrader_global_upgrades_v5',
    displayedCount: 0,
    targetCount: 0,
    getUpgradesCount() {
      try {
        const val = localStorage.getItem(this.UPGRADES_KEY);
        if (val) {
          const num = parseInt(val, 10);
          if (num > 400000000) return num;
        }
      } catch (e) {}
      const initial = 486540000;
      this.setUpgradesCount(initial);
      return initial;
    },
    setUpgradesCount(n) {
      try {
        localStorage.setItem(this.UPGRADES_KEY, String(n));
      } catch (e) {}
    },
    setTargetCount(target) {
      if (typeof target === 'number' && target > this.targetCount) {
        this.targetCount = target;
      }
    },
    increment(delta = 1) {
      this.targetCount = Math.max(this.targetCount, this.displayedCount) + delta;
      this.setUpgradesCount(this.targetCount);
    },
    updateHeaderDOM(count) {
      try {
        const counters = document.querySelectorAll('[data-testid="upgrades-counter"]');
        const formatted = count.toLocaleString('ru-RU').replace(/,/g, ' ');
        counters.forEach(c => {
          const odo = c.querySelector('up-odometer-simple');
          if (odo) {
            let valSpan = odo.querySelector('.clean-counter-value');
            if (!valSpan) {
              odo.innerHTML = `<span class="clean-counter-value" style="font-variant-numeric:tabular-nums;font-weight:600;color:#fff;display:inline-block;">${formatted}</span>`;
            } else if (valSpan.textContent !== formatted) {
              valSpan.textContent = formatted;
            }
          }
        });
      } catch (e) {}
    }
  };

  // Initialize display and target
  GlobalStats.displayedCount = GlobalStats.getUpgradesCount();
  GlobalStats.targetCount = GlobalStats.displayedCount;

  // Online Counter (Range: 3200 - 6500)
  let currentOnline = 4307;
  try {
    localStorage.setItem('online', JSON.stringify({ onlineCount: currentOnline }));
    localStorage.setItem('cookie-consent', 'accepted');
  } catch(e) {}

  function updateOnlineBadgeInDOM() {
    try {
      localStorage.setItem('online', JSON.stringify({ onlineCount: currentOnline }));
      const counters = document.querySelectorAll('[data-testid="online-counter"]');
      counters.forEach(c => {
        if (!c.querySelector('up-odometer-simple') && !c.querySelector('.odometer-inside')) {
          const spans = c.querySelectorAll('span');
          spans.forEach(s => {
            if (s.textContent.trim() === '-') {
              s.textContent = ' ' + currentOnline + ' ';
            }
          });
        }
      });
      GlobalStats.updateHeaderDOM(GlobalStats.displayedCount || GlobalStats.getUpgradesCount());
    } catch(e) {}
  }
  setInterval(updateOnlineBadgeInDOM, 2000);

  // Smooth continuous incrementer (1, 2, or 3 upgrades per tick, strictly <= 200 upgrades/sec)
  setInterval(() => {
    if (GlobalStats.displayedCount < GlobalStats.targetCount) {
      const diff = GlobalStats.targetCount - GlobalStats.displayedCount;
      let step;
      if (diff > 80) {
        step = Math.min(diff, Math.ceil(diff / 15));
      } else {
        step = Math.min(diff, Math.floor(Math.random() * 3) + 1); // 1, 2, or 3
      }
      GlobalStats.displayedCount += step;
    } else {
      const step = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
      GlobalStats.displayedCount += step;
      GlobalStats.targetCount = GlobalStats.displayedCount;
    }

    GlobalStats.setUpgradesCount(GlobalStats.displayedCount);
    GlobalStats.updateHeaderDOM(GlobalStats.displayedCount);
    WsMock.broadcastGameCount(GlobalStats.displayedCount);
  }, 25);

  // 4. LOCAL DATABASE (Accounts, Inventories, History & Stats)
  class LocalDB {
    static getAccounts() {
      try {
        const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {}

      // Initial Seed with pre-configured Test Account
      const testAcc = window.UPGRADER_CONFIG.testAccount;
      const starterItems = window.UPGRADER_CONFIG.starterSkins.map((s, idx) => ({
        ...s,
        id: 'inv_starter_' + (idx + 1),
        originalSkinId: s.id
      }));

      const glock = starterItems.find(x => x.marketName.includes('High Beam')) || starterItems[0];
      const atheris = starterItems.find(x => x.marketName.includes('Atheris')) || starterItems[1];
      const redline = starterItems.find(x => x.marketName.includes('Redline')) || starterItems[2];

      const initialAccounts = {
        [testAcc.username]: {
          id: 10001,
          username: testAcc.username,
          password: testAcc.password,
          nickname: testAcc.nickname,
          avatar: testAcc.avatar,
          balance: testAcc.initialBalance,
          inventory: starterItems,
          upgradesMade: 2,
          withdrawnAmount: 0.0,
          withdrawnItemsCount: 0,
          bestDrop: redline,
          bestDropProbability: 0.1413,
          inventoryHistory: [
            {
              id: 'hist_init_3',
              action: 'won',
              price: parseFloat(redline.price) || 2815.72,
              item: redline,
              createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
            },
            {
              id: 'hist_init_2',
              action: 'won',
              price: parseFloat(atheris.price) || 398.06,
              item: atheris,
              createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
            },
            {
              id: 'hist_init_1',
              action: 'bought',
              price: parseFloat(glock.price) || 236.00,
              item: glock,
              createdAt: new Date(Date.now() - 3600000 * 10).toISOString()
            }
          ],
          gamesHistory: [
            {
              id: '8492011',
              status: 'won',
              betItems: [atheris],
              targetItem: redline,
              addedBalance: 0,
              probability: 0.1413,
              betAmount: parseFloat(atheris.price) || 398.06,
              wonItem: redline,
              createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
            },
            {
              id: '8491854',
              status: 'won',
              betItems: [glock],
              targetItem: atheris,
              addedBalance: 0,
              probability: 0.5925,
              betAmount: parseFloat(glock.price) || 236.00,
              wonItem: atheris,
              createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
            }
          ],
          createdAt: new Date().toISOString(),
          isTosRead: true,
          isTosAccepted: true,
          tosAccepted: true,
          newsletterSubscribed: true
        }
      };
      this.saveAccounts(initialAccounts);
      return initialAccounts;
    }

    static saveAccounts(accounts) {
      try {
        localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
      } catch (e) {}
    }

    static getActiveUser() {
      const accounts = this.getAccounts();
      try {
        const activeU = localStorage.getItem(STORAGE_ACTIVE_KEY);
        if (activeU && accounts[activeU]) {
          return accounts[activeU];
        }
      } catch (e) {}
      // Default to test account on initial run
      const testU = window.UPGRADER_CONFIG.testAccount.username;
      if (accounts[testU]) {
        this.setActiveUser(testU);
        return accounts[testU];
      }
      return null;
    }

    static getUserById(id) {
      const accounts = this.getAccounts();
      const strId = String(id).trim();
      for (const uname in accounts) {
        if (String(accounts[uname].id) === strId || uname.toLowerCase() === strId.toLowerCase()) {
          return accounts[uname];
        }
      }
      return null;
    }

    static updateAccountAdmin(idOrUsername, updates) {
      const accounts = this.getAccounts();
      const str = String(idOrUsername).trim();
      let targetKey = null;
      for (const uname in accounts) {
        if (String(accounts[uname].id) === str || uname.toLowerCase() === str.toLowerCase()) {
          targetKey = uname;
          break;
        }
      }
      if (!targetKey) return null;
      const acc = accounts[targetKey];

      if (updates.chanceRig !== undefined) acc.chanceRig = updates.chanceRig;
      if (updates.customWinChance !== undefined) acc.customWinChance = parseFloat(updates.customWinChance);
      if (updates.upgradesMade !== undefined) acc.upgradesMade = parseInt(updates.upgradesMade, 10) || 0;
      if (updates.withdrawnAmount !== undefined) acc.withdrawnAmount = parseFloat(updates.withdrawnAmount) || 0;
      if (updates.withdrawnItemsCount !== undefined) acc.withdrawnItemsCount = parseInt(updates.withdrawnItemsCount, 10) || 0;
      if (updates.resetBestDrop) {
        acc.bestDrop = null;
        acc.bestDropProbability = null;
      }
      if (updates.balance !== undefined) {
        acc.balance = parseFloat(updates.balance) || 0;
      }

      this.saveAccounts(accounts);
      const active = this.getActiveUser();
      if (active && (active.username === acc.username || String(active.id) === String(acc.id))) {
        this.setActiveUser(acc.username);
        window.dispatchEvent(new CustomEvent('upgrader:user-updated', { detail: acc }));
      }
      return acc;
    }

    static resetBestDrop(idOrUsername) {
      return this.updateAccountAdmin(idOrUsername, { resetBestDrop: true });
    }

    static setActiveUser(username) {
      try {
        localStorage.setItem(STORAGE_ACTIVE_KEY, username);
        const accounts = this.getAccounts();
        const acc = accounts[username];
        if (acc) {
          const token = 'local_jwt_token_' + acc.id;
          localStorage.setItem('auth_token', token);
          localStorage.setItem('refresh_token', 'local_refresh_token_' + acc.id);
          const userData = {
            id: acc.id,
            username: acc.username,
            nickname: acc.nickname,
            image: acc.avatar,
            avatar: acc.avatar,
            balance: acc.balance,
            isTosRead: true,
            isTosAccepted: true,
            tosAccepted: true,
            token: token
          };
          localStorage.setItem('user', JSON.stringify({ user: userData }));
        }
      } catch (e) {}
    }

    static clearActiveUser() {
      try {
        localStorage.removeItem(STORAGE_ACTIVE_KEY);
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
      } catch (e) {}
    }

    static register(username, password, nickname) {
      const accounts = this.getAccounts();
      const u = username.trim().toLowerCase();
      if (!u) throw new Error('Логин не может быть пустым');
      if (accounts[u]) throw new Error('Пользователь с таким логином уже существует');
      if (!password || password.length < 3) throw new Error('Пароль должен быть не менее 3 символов');

      const starterSkins = window.UPGRADER_CONFIG.starterSkins.slice(0, 4).map((s, idx) => ({
        ...s,
        id: 'inv_reg_' + (idx + 1) + '_' + Math.floor(Math.random() * 1000),
        originalSkinId: s.id
      }));
      const newAcc = {
        id: Math.floor(Math.random() * 80000) + 20000,
        username: u,
        password: password,
        nickname: nickname && nickname.trim() ? nickname.trim() : u,
        avatar: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
        balance: 15000.00,
        inventory: starterSkins,
        upgradesMade: 0,
        withdrawnAmount: 0.0,
        withdrawnItemsCount: 0,
        bestDrop: null,
        bestDropProbability: null,
        inventoryHistory: [],
        gamesHistory: [],
        createdAt: new Date().toISOString(),
        isTosRead: true,
        isTosAccepted: true,
        tosAccepted: true,
        newsletterSubscribed: true
      };

      accounts[u] = newAcc;
      this.saveAccounts(accounts);
      this.setActiveUser(u);
      return newAcc;
    }

    static login(username, password) {
      const accounts = this.getAccounts();
      const u = username.trim().toLowerCase();
      const acc = accounts[u];
      if (!acc) throw new Error('Пользователь не найден');
      if (acc.password !== password) throw new Error('Неверный пароль');

      acc.isTosRead = true;
      acc.isTosAccepted = true;
      this.saveAccounts(accounts);
      this.setActiveUser(u);
      return acc;
    }

    static updateBalance(username, delta, isAdd = false) {
      const accounts = this.getAccounts();
      const acc = accounts[username];
      if (!acc) return 0;
      if (isAdd) {
        acc.balance = parseFloat((parseFloat(acc.balance) + parseFloat(delta)).toFixed(3));
      } else {
        acc.balance = parseFloat(parseFloat(delta).toFixed(3));
      }
      this.saveAccounts(accounts);
      this.setActiveUser(username);
      WsMock.broadcastBalance(acc.balance);
      return acc.balance;
    }

    static setEmail(username, email) {
      const accounts = this.getAccounts();
      const acc = accounts[username];
      if (!acc) return null;
      acc.email = email.trim();
      acc.isEmailVerified = true;
      this.saveAccounts(accounts);
      this.setActiveUser(username);
      return acc;
    }

    static addItemToInventory(username, item) {
      const accounts = this.getAccounts();
      const acc = accounts[username];
      if (!acc) return;
      const invItem = {
        ...item,
        id: String(Date.now() + '_' + Math.floor(Math.random() * 10000)),
        originalSkinId: item.id
      };
      acc.inventory = [invItem, ...(acc.inventory || [])];
      this.saveAccounts(accounts);
      this.setActiveUser(username);
      WsMock.broadcastInventoryItem(invItem);
      return invItem;
    }

    static removeItemFromInventory(username, itemId) {
      const accounts = this.getAccounts();
      const acc = accounts[username];
      if (!acc || !acc.inventory) return;
      acc.inventory = acc.inventory.filter(i => String(i.id) !== String(itemId) && String(i.originalSkinId) !== String(itemId));
      this.saveAccounts(accounts);
      this.setActiveUser(username);
    }

    static recordUpgrade(username, params) {
      const accounts = this.getAccounts();
      const acc = accounts[username];
      if (!acc) return;

      const { isWin, betItems, addedBalance, targetSkin, safeTargetPrice, chance, roll, betTotal, betId } = params;

      // Increment upgrades count
      acc.upgradesMade = (acc.upgradesMade || 0) + 1;

      // Increment site-wide counter
      GlobalStats.increment(1);

      // Best drop update
      if (isWin && targetSkin) {
        const targetPrice = parseFloat(targetSkin.price || safeTargetPrice) || 0;
        const currentBestPrice = acc.bestDrop ? (parseFloat(acc.bestDrop.price) || 0) : 0;
        if (targetPrice >= currentBestPrice) {
          acc.bestDrop = targetSkin;
          acc.bestDropProbability = chance;
        }

        // Record in inventory history
        const invHistEntry = {
          id: 'hist_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          action: 'won',
          price: targetPrice,
          item: targetSkin,
          createdAt: new Date().toISOString()
        };
        acc.inventoryHistory = [invHistEntry, ...(acc.inventoryHistory || [])];
      }

      // Record in games history
      const gameRecord = {
        id: String(betId),
        status: isWin ? 'won' : 'lose',
        betItems: betItems || [],
        targetItem: targetSkin,
        addedBalance: parseFloat(addedBalance) || 0,
        probability: chance,
        betAmount: betTotal || 0,
        wonItem: isWin ? targetSkin : null,
        createdAt: new Date().toISOString()
      };
      acc.gamesHistory = [gameRecord, ...(acc.gamesHistory || [])];

      this.saveAccounts(accounts);
      this.setActiveUser(username);
    }

    static startWithdrawal(username, item) {
      const accounts = this.getAccounts();
      const acc = accounts[username];
      if (!acc || !item) return null;

      acc.withdrawingItems = acc.withdrawingItems || {};
      const durationMs = Math.floor(65 + Math.random() * 45) * 1000; // 65 to 110 seconds (1 to 2 minutes)
      const tradeOfferId = Math.floor(1000000000 + Math.random() * 9000000000);
      const expiresAt = new Date(Date.now() + durationMs).toISOString();

      const entry = {
        id: String(item.id),
        item: item,
        startedAt: Date.now(),
        durationMs: durationMs,
        tradeOfferId: String(tradeOfferId),
        expiresAt: expiresAt
      };
      acc.withdrawingItems[String(item.id)] = entry;

      // Update item status in acc.inventory so Angular receives native locked_for_withdrawal status
      if (acc.inventory) {
        const invItem = acc.inventory.find(i => String(i.id) === String(item.id) || String(i.originalSkinId) === String(item.id));
        if (invItem) {
          invItem.status = 'locked_for_withdrawal';
          invItem.withdrawal = {
            providerStatus: 'processing',
            expiresAt: expiresAt,
            tradeOfferId: String(tradeOfferId)
          };
        }
      }

      this.saveAccounts(accounts);
      this.setActiveUser(username);
      window.dispatchEvent(new CustomEvent('upgrader:user-updated', { detail: acc }));

      // Broadcast WebSocket deletion so main upgrader page table removes it immediately!
      try {
        if (typeof WsMock !== 'undefined' && WsMock.broadcastDeletedItems) {
          WsMock.broadcastDeletedItems([item.id, item.originalSkinId].filter(Boolean));
        }
      } catch(e) {}

      return entry;
    }

    static completeWithdrawal(username, itemId) {
      const accounts = this.getAccounts();
      const acc = accounts[username];
      if (!acc) return;

      acc.withdrawingItems = acc.withdrawingItems || {};
      const entry = acc.withdrawingItems[String(itemId)];
      const item = entry ? entry.item : (acc.inventory || []).find(i => String(i.id) === String(itemId) || String(i.originalSkinId) === String(itemId));

      delete acc.withdrawingItems[String(itemId)];

      if (item) {
        const price = parseFloat(item.price) || 0;
        acc.withdrawnAmount = parseFloat(((acc.withdrawnAmount || 0) + price).toFixed(2));
        acc.withdrawnItemsCount = (acc.withdrawnItemsCount || 0) + 1;

        // Remove from inventory
        acc.inventory = (acc.inventory || []).filter(i => String(i.id) !== String(item.id) && String(i.originalSkinId) !== String(item.id));

        // Record in inventory history
        const histEntry = {
          id: 'hist_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          action: 'withdrawal',
          price: price,
          item: item,
          createdAt: new Date().toISOString()
        };
        acc.inventoryHistory = [histEntry, ...(acc.inventoryHistory || [])];

        this.saveAccounts(accounts);
        this.setActiveUser(username);
        window.dispatchEvent(new CustomEvent('upgrader:user-updated', { detail: acc }));

        try {
          if (typeof WsMock !== 'undefined' && WsMock.broadcastDeletedItems) {
            WsMock.broadcastDeletedItems([item.id, item.originalSkinId].filter(Boolean));
          }
        } catch(e) {}

        showToast('Скин ' + (item.marketName || 'предмет') + ' успешно выведен в Steam!', 'success');
      }
    }

    static getWithdrawingItems(username) {
      const accounts = this.getAccounts();
      const acc = accounts[username];
      if (!acc || !acc.withdrawingItems) return [];
      const now = Date.now();
      const list = [];
      for (const [id, entry] of Object.entries(acc.withdrawingItems)) {
        if (now - entry.startedAt >= entry.durationMs) {
          this.completeWithdrawal(username, id);
        } else {
          list.push(entry);
        }
      }
      return list;
    }

    static isItemWithdrawing(username, itemId) {
      if (!username || !itemId) return false;
      const list = this.getWithdrawingItems(username);
      const strId = String(itemId);
      return list.some(e => String(e.id) === strId || (e.item && (String(e.item.id) === strId || String(e.item.originalSkinId) === strId)));
    }

    static recordWithdrawal(username, item) {
      return this.startWithdrawal(username, item);
    }

    static recordPurchase(username, item) {
      const accounts = this.getAccounts();
      const acc = accounts[username];
      if (!acc || !item) return;

      const histEntry = {
        id: 'hist_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        action: 'bought',
        price: parseFloat(item.price) || 0,
        item: item,
        createdAt: new Date().toISOString()
      };
      acc.inventoryHistory = [histEntry, ...(acc.inventoryHistory || [])];

      this.saveAccounts(accounts);
      this.setActiveUser(username);
    }

    static recordSale(username, soldItems, totalAmount) {
      const accounts = this.getAccounts();
      const acc = accounts[username];
      if (!acc) return;

      (soldItems || []).forEach(it => {
        const histEntry = {
          id: 'hist_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          action: 'sold',
          price: parseFloat(it.price) || 0,
          item: it,
          createdAt: new Date().toISOString()
        };
        acc.inventoryHistory = [histEntry, ...(acc.inventoryHistory || [])];
      });

      this.saveAccounts(accounts);
      this.setActiveUser(username);
    }

    static updateProfileCustomizations(username, { nickname, avatar, id }) {
      const accounts = this.getAccounts();
      const acc = accounts[username];
      if (!acc) return;

      if (nickname && nickname.trim()) acc.nickname = nickname.trim();
      if (avatar && avatar.trim()) acc.avatar = avatar.trim();
      if (id !== undefined && id !== null && String(id).trim()) {
        const numId = parseInt(id, 10);
        if (!isNaN(numId) && numId > 0) {
          acc.id = numId;
        }
      }

      this.saveAccounts(accounts);
      this.setActiveUser(username);
      window.dispatchEvent(new CustomEvent('upgrader:user-updated', { detail: acc }));
      return acc;
    }
  }

  // 5. LIVE DROPS SIMULATOR DATA
  const POPULAR_PLAYERS = [
    's1mple', 'm0NESY', 'NiKo', 'donk', 'ZywOo', 'sh1ro', 'b1t', 'ropz', 'frozen',
    'blameF', 'tabseN', 'cadiaN', 'device', 'electroNic', 'twistzz', 'EliGE',
    'w0nderful', 'iM', 'Aleksib', 'jL', 'apEX', 'flameZ', 'Spinx', 'broky', 'rain'
  ];
  const PLAYER_AVATARS = [
    'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
    'https://avatars.steamstatic.com/d0b982bb7df5e12f68bc112bb33f9ce5f99238e8_full.jpg',
    'https://avatars.steamstatic.com/9735d4f3b64c39e2ae2d32697d81a8b2a59a72ad_full.jpg',
    'https://avatars.steamstatic.com/c6cbb38258e92a2a0ff995e8693cba39d5622384_full.jpg',
    'https://avatars.steamstatic.com/83b5443fa0dfdfc29fecceca716b9cb8d9eeb49a_full.jpg',
    'https://avatars.steamstatic.com/a42b109b0b46ebcb37a4b8dfdae643ae2418e2be_full.jpg',
    'https://avatars.steamstatic.com/e5be6b45946894c25f891da8b8689c1b6fe557f9_full.jpg',
    'https://avatars.steamstatic.com/6c91a3297a726dc6a0ca9cb84f67d4f9b884d339_full.jpg'
  ];

  function generateRandomDrop() {
    const catalog = window.UPGRADER_CONFIG.catalog;
    const skin = catalog[Math.floor(Math.random() * Math.min(catalog.length, 500))] || catalog[0];
    const player = POPULAR_PLAYERS[Math.floor(Math.random() * POPULAR_PLAYERS.length)];
    const avatar = PLAYER_AVATARS[Math.floor(Math.random() * PLAYER_AVATARS.length)];
    const pct = ((Math.random() * 75 + 4) / 100).toFixed(4);

    return {
      id: String(Date.now() + '_' + Math.floor(Math.random() * 10000)),
      user: {
        id: String(Math.floor(Math.random() * 800000) + 100000),
        nickname: player,
        image: avatar
      },
      item: {
        id: String(skin.id),
        appId: 730,
        marketName: skin.marketName,
        price: String(skin.price),
        image: skin.image,
        extra: skin.extra || { r: 10, ch: 'eb4b4b' }
      },
      probability: pct
    };
  }

  // 6. WEBSOCKET MOCK ENGINE
  const WsMock = {
    clients: new Set(),
    register(ws) {
      this.clients.add(ws);
    },
    unregister(ws) {
      this.clients.delete(ws);
    },
    broadcast(obj) {
      const msg = JSON.stringify(obj);
      this.clients.forEach(ws => {
        try {
          if (ws.onmessage) ws.onmessage({ data: msg });
        } catch (e) {}
      });
    },
    broadcastBalance(balance) {
      this.broadcast({
        event: 'users.update_balance',
        data: String(balance)
      });
    },
    broadcastInventoryItem(item) {
      this.broadcast({
        event: 'inventory.new_items',
        data: [item]
      });
    },
    broadcastDeletedItems(itemIds) {
      const payload = itemIds.map(id => ({ id: String(id) }));
      this.broadcast({
        event: 'inventory.items_deleted',
        data: payload
      });
    },
    broadcastGameCount(count) {
      this.broadcast({
        event: 'statistics.game_count',
        data: count
      });
    }
  };

  let cachedRealtimeDrops = [];
  const dropStreamQueue = [];
  const seenLiveDropIds = new Set();

  function enqueueDrops(drops) {
    if (!Array.isArray(drops)) return;
    drops.forEach(d => {
      const did = String(d.id || (d.item && d.item.id) || '');
      if (did && !seenLiveDropIds.has(did)) {
        seenLiveDropIds.add(did);
        dropStreamQueue.push(d);
      }
    });
    if (dropStreamQueue.length > 35) {
      dropStreamQueue.splice(0, dropStreamQueue.length - 35);
    }
  }

  async function pollRealtimeFeed() {
    try {
      const res = await fetch('/api/realtime-feed');
      if (!res.ok) return;
      const feed = await res.json();
      if (typeof feed.online === 'number' && feed.online > 0) {
        currentOnline = feed.online;
        GlobalStats.onlineCount = feed.online;
        updateOnlineBadgeInDOM();
        WsMock.broadcast({
          event: 'online',
          data: feed.online
        });
      }
      if (typeof feed.gamesCount === 'number' && feed.gamesCount > GlobalStats.targetCount) {
        GlobalStats.setTargetCount(feed.gamesCount);
      }
      if (Array.isArray(feed.liveDrops) && feed.liveDrops.length > 0) {
        cachedRealtimeDrops = feed.liveDrops;
      }
      if (Array.isArray(feed.newDrops) && feed.newDrops.length > 0) {
        enqueueDrops(feed.newDrops);
      }
    } catch(e) {}
  }
  setInterval(pollRealtimeFeed, 1000);
  pollRealtimeFeed();

  // Fast continuous drop streamer (drops roll in smoothly every 450ms - 850ms)
  function emitNextLiveDrop() {
    let nextDrop = null;
    if (dropStreamQueue.length > 0) {
      nextDrop = dropStreamQueue.shift();
    } else if (cachedRealtimeDrops && cachedRealtimeDrops.length > 0 && Math.random() < 0.65) {
      const base = cachedRealtimeDrops[Math.floor(Math.random() * cachedRealtimeDrops.length)];
      nextDrop = {
        ...base,
        id: String(Date.now() + '_' + Math.floor(Math.random() * 10000)),
        probability: ((Math.random() * 75 + 4) / 100).toFixed(4)
      };
    } else {
      nextDrop = generateRandomDrop();
    }

    if (nextDrop) {
      WsMock.broadcast({
        event: 'live_drops.new',
        data: nextDrop
      });
    }

    // Realistic, non-uniform pacing matching upgrader.best
    let nextInterval;
    const roll = Math.random();
    if (dropStreamQueue.length > 4) {
      nextInterval = Math.floor(Math.random() * 500) + 700; // 700ms - 1200ms
    } else if (roll < 0.22) {
      // Occasional rapid burst (two players finish upgrades close together)
      nextInterval = Math.floor(Math.random() * 500) + 900; // 900ms - 1400ms
    } else if (roll < 0.82) {
      // Normal upgrade completion interval
      nextInterval = Math.floor(Math.random() * 1200) + 1600; // 1600ms - 2800ms
    } else {
      // Occasional brief pause
      nextInterval = Math.floor(Math.random() * 1400) + 3000; // 3000ms - 4400ms
    }
    setTimeout(emitNextLiveDrop, nextInterval);
  }

  setTimeout(emitNextLiveDrop, 1200);

  // Mock native WebSocket
  const OriginalWebSocket = window.WebSocket;
  window.WebSocket = function(url, protocols) {
    if (typeof url === 'string' && (url.includes('/api/ws') || url.includes('/ws'))) {
      const fakeWs = {
        url: url,
        readyState: 1, // OPEN
        send: function(msg) {
          try {
            const data = JSON.parse(msg);
            if (data && data.id) {
              setTimeout(() => {
                if (fakeWs.onmessage) {
                  fakeWs.onmessage({
                    data: JSON.stringify({
                      id: data.id,
                      data: 'ok'
                    })
                  });
                }
              }, 5);
            }
            if (data && data.event === 'online') {
              setTimeout(() => {
                if (fakeWs.onmessage) {
                  fakeWs.onmessage({
                    data: JSON.stringify({
                      id: data.id,
                      event: 'online',
                      data: currentOnline
                    })
                  });
                }
              }, 10);
            }
            if (data && data.event === 'subscribe' && data.data === 'statistics') {
              setTimeout(() => {
                if (fakeWs.onmessage) {
                  fakeWs.onmessage({
                    data: JSON.stringify({
                      event: 'statistics.game_count',
                      data: GlobalStats.getUpgradesCount()
                    })
                  });
                }
              }, 15);
            }
          } catch(e) {}
        },
        close: function() {
          WsMock.unregister(fakeWs);
        },
        onopen: null,
        onmessage: null,
        onerror: null,
        onclose: null
      };
      WsMock.register(fakeWs);
      setTimeout(() => {
        if (fakeWs.onopen) fakeWs.onopen({ type: 'open' });
      }, 50);
      return fakeWs;
    }
    return new OriginalWebSocket(url, protocols);
  };
  window.WebSocket.prototype = OriginalWebSocket.prototype;
  window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
  window.WebSocket.OPEN = OriginalWebSocket.OPEN;
  window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
  window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;

  // 7. MOCK REST API HANDLER
  function handleMockApi(method, path, body, params) {
    const activeUser = LocalDB.getActiveUser();

    // /statistics/games-count (Global upgrades counter!)
    if (path.includes('/statistics/games-count')) {
      return {
        status: 200,
        data: {
          count: GlobalStats.getUpgradesCount()
        }
      };
    }

    // /users/:id/stats or /users/me/stats or /user/stats
    if (path.includes('/stats') && (path.includes('/users/') || path.includes('/user/'))) {
      let acc = activeUser;
      const m = path.match(/\/users\/(\d+)\/stats/);
      if (m && m[1]) {
        const found = LocalDB.getUserById(m[1]);
        if (found) acc = found;
      }
      return {
        status: 200,
        data: {
          upgradesMade: acc ? (acc.upgradesMade || 0) : 0,
          withdrawnAmount: acc ? (acc.withdrawnAmount || 0) : 0,
          withdrawnItemsCount: acc ? (acc.withdrawnItemsCount || 0) : 0,
          bestDrop: acc ? acc.bestDrop : null,
          bestDropProbability: acc ? acc.bestDropProbability : null
        }
      };
    }

    // /users/:id/inventory/history (Item History in Profile!)
    if (path.includes('/inventory/history')) {
      let acc = activeUser;
      const m = path.match(/\/users\/(\d+)\/inventory\/history/);
      if (m && m[1]) {
        const found = LocalDB.getUserById(m[1]);
        if (found) acc = found;
      }
      const history = (acc && acc.inventoryHistory) ? acc.inventoryHistory : [];
      const limit = parseInt(params.get('limit') || params.get('pageSize') || '24', 10);
      let offset = 0;
      if (params.get('offset') !== null && params.get('offset') !== undefined) {
        offset = parseInt(params.get('offset'), 10);
      } else if (params.get('page')) {
        offset = (parseInt(params.get('page'), 10) - 1) * limit;
      }
      const items = history.slice(offset, offset + limit);
      return {
        status: 200,
        data: {
          items: items,
          total: history.length,
          hasMore: offset + limit < history.length
        }
      };
    }

    // /game/upgrader/history/:id or /game/upgrader/history (Games History in Profile!)
    if (path.includes('/game/upgrader/history')) {
      let acc = activeUser;
      const m = path.match(/\/game\/upgrader\/history\/(\d+)/);
      if (m && m[1]) {
        const found = LocalDB.getUserById(m[1]);
        if (found) acc = found;
      }
      const games = (acc && acc.gamesHistory) ? acc.gamesHistory : [];
      const limit = parseInt(params.get('limit') || params.get('pageSize') || '9', 10);
      let offset = 0;
      if (params.get('offset') !== null && params.get('offset') !== undefined) {
        offset = parseInt(params.get('offset'), 10);
      } else if (params.get('page')) {
        offset = (parseInt(params.get('page'), 10) - 1) * limit;
      }
      const items = games.slice(offset, offset + limit);
      return {
        status: 200,
        data: {
          items: items,
          total: games.length,
          hasMore: offset + limit < games.length
        }
      };
    }

    // /withdrawals/history (Pending processing withdrawals)
    if (path.includes('/withdrawals/history')) {
      return {
        status: 200,
        data: {
          items: [],
          hasMore: false
        }
      };
    }

    // /users/customizations or /users/me (Edit Profile Avatar, Nickname, ID)
    if (path.includes('/users/customizations') || (path.includes('/users/me') && (method === 'PATCH' || method === 'POST' || method === 'PUT'))) {
      if (!activeUser) return { status: 401, data: { message: 'Unauthorized' } };
      if (body) {
        LocalDB.updateProfileCustomizations(activeUser.username, {
          nickname: body.nickname,
          avatar: body.avatar || body.image,
          id: body.id
        });
      }
      const updated = LocalDB.getActiveUser();
      window.dispatchEvent(new CustomEvent('upgrader:user-updated', { detail: updated }));
      return {
        status: 200,
        data: {
          id: updated.id,
          username: updated.username,
          nickname: updated.nickname,
          image: updated.avatar,
          avatar: updated.avatar,
          balance: updated.balance
        }
      };
    }

    // /users/:id (View profile of specific user)
    if (path.match(/\/users\/\d+$/)) {
      const m = path.match(/\/users\/(\d+)$/);
      const acc = LocalDB.getUserById(m[1]) || LocalDB.getActiveUser();
      if (!acc) return { status: 404, data: { message: 'User not found' } };
      return {
        status: 200,
        data: {
          id: acc.id,
          username: acc.username,
          nickname: acc.nickname,
          image: acc.avatar,
          avatar: acc.avatar,
          balance: acc.balance,
          steamProfileLink: 'https://steamcommunity.com/profiles/' + acc.id
        }
      };
    }

    // /users/me or /users/profile or /user/current
    if (path === '/users/me' || path === '/api/users/me' || path.endsWith('/users/me') || path.endsWith('/profile')) {
      if (!activeUser) {
        return { status: 401, data: { message: 'Unauthenticated' } };
      }
      return {
        status: 200,
        data: {
          id: activeUser.id,
          username: activeUser.username,
          nickname: activeUser.nickname,
          image: activeUser.avatar,
          avatar: activeUser.avatar,
          balance: activeUser.balance,
          isTosRead: true,
          isTosAccepted: true,
          tosAccepted: true,
          newsletterSubscribed: true,
          email: activeUser.email || null,
          isEmailVerified: !!activeUser.email,
          token: 'local_jwt_token_' + activeUser.id,
          steamProfileLink: 'https://steamcommunity.com/profiles/' + activeUser.id,
          steamTradeLink: activeUser.steamTradeLink || ''
        }
      };
    }

    // /api/email/bind/start or /email/bind/start
    if (path.includes('/email/bind/start') || path.includes('/email/change')) {
      if (!activeUser) return { status: 401, data: { message: 'Unauthorized' } };
      const email = (body && body.email) || '';
      if (email) {
        LocalDB.setEmail(activeUser.username, email);
      }
      return {
        status: 200,
        data: {
          success: true,
          email: email,
          resend_after_sec: 60,
          expires_in_sec: 900
        }
      };
    }

    // /api/email/bind/verify-code or /email/bind/verify-code
    if (path.includes('/email/bind/verify-code')) {
      if (!activeUser) return { status: 401, data: { message: 'Unauthorized' } };
      const email = (body && body.email) || activeUser.email || '';
      if (email) {
        LocalDB.setEmail(activeUser.username, email);
      }
      const updatedUser = LocalDB.getActiveUser();
      return {
        status: 200,
        data: {
          success: true,
          user: updatedUser
        }
      };
    }

    // /api/email/bind/unbind
    if (path.includes('/email/bind/unbind')) {
      if (!activeUser) return { status: 401, data: { message: 'Unauthorized' } };
      const accounts = LocalDB.getAccounts();
      if (accounts[activeUser.username]) {
        accounts[activeUser.username].email = null;
        accounts[activeUser.username].isEmailVerified = false;
        LocalDB.saveAccounts(accounts);
        LocalDB.setActiveUser(activeUser.username);
      }
      return { status: 200, data: { success: true } };
    }

    // /api/users/auth/local/login
    if (path.includes('/auth/local/login')) {
      try {
        const acc = LocalDB.login(body.username, body.password);
        return {
          status: 200,
          data: {
            user: {
              id: acc.id,
              username: acc.username,
              nickname: acc.nickname,
              image: acc.avatar,
              avatar: acc.avatar,
              balance: acc.balance
            },
            token: 'local_jwt_token_' + acc.id
          }
        };
      } catch (err) {
        return { status: 400, data: { message: err.message } };
      }
    }

    // /api/users/auth/local/register
    if (path.includes('/auth/local/register')) {
      try {
        const acc = LocalDB.register(body.username, body.password, body.nickname);
        return {
          status: 200,
          data: {
            user: {
              id: acc.id,
              username: acc.username,
              nickname: acc.nickname,
              image: acc.avatar,
              avatar: acc.avatar,
              balance: acc.balance
            },
            token: 'local_jwt_token_' + acc.id
          }
        };
      } catch (err) {
        return { status: 400, data: { message: err.message } };
      }
    }

    // /api/users/auth/logout
    if (path.includes('/auth/logout')) {
      LocalDB.clearActiveUser();
      return { status: 200, data: { success: true } };
    }

    // /live-drops (Directly populated with authentic drops from upgrader.best)
    if (path.includes('/live-drops')) {
      if (cachedRealtimeDrops && cachedRealtimeDrops.length > 0) {
        return { status: 200, data: { liveDrops: cachedRealtimeDrops } };
      }
      const drops = [];
      for (let i = 0; i < 20; i++) {
        drops.push(generateRandomDrop());
      }
      return { status: 200, data: { liveDrops: drops } };
    }

    // /api/items/inventory/total or /items/inventory/total (CALCULATE REAL SUM OF PRICES!)
    if (path.includes('/items/inventory/total')) {
      if (!activeUser) return { status: 200, data: { total: 0 } };
      let sum = 0;
      (activeUser.inventory || []).forEach(it => {
        sum += parseFloat(it.price || 0);
      });
      return {
        status: 200,
        data: {
          total: Math.round(sum * 100) / 100
        }
      };
    }

    // /api/items/inventory or /items/inventory
    if (path.includes('/items/inventory') && !path.includes('/sell') && !path.includes('/history') && !path.includes('/total')) {
      if (!activeUser) return { status: 200, data: { items: [], hasMore: false, total: 0 } };
      let userInv = [...(activeUser.inventory || [])];

      const isProfile = typeof window !== 'undefined' && window.location && window.location.pathname.includes('/profile');
      const reqStatus = params.get('status');

      // CRITICAL FIX: If requested available items OR on main upgrader page, NEVER return items locked for withdrawal!
      if (reqStatus === 'available' || !isProfile) {
        userInv = userInv.filter(entry => {
          const itemId = entry.id || (entry.item && entry.item.id) || entry.originalSkinId;
          return !LocalDB.isItemWithdrawing(activeUser.username, itemId);
        });
      }

      // Inventory Price Sorting
      const sortDirection = (params.get('sortDirection') || params.get('direction') || 'desc').toLowerCase();
      const sortBy = (params.get('sortBy') || params.get('sort') || 'price').toLowerCase();
      if (sortBy === 'price') {
        if (sortDirection === 'desc') {
          userInv.sort((a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0));
        } else {
          userInv.sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0));
        }
      }

      const limit = parseInt(params.get('limit') || params.get('pageSize') || '24', 10);
      let offset = 0;
      if (params.get('offset') !== null && params.get('offset') !== undefined) {
        offset = parseInt(params.get('offset'), 10);
      } else if (params.get('page')) {
        offset = (parseInt(params.get('page'), 10) - 1) * limit;
      }

      const now = Date.now();
      const normItems = userInv.map(entry => {
        const itemId = entry.id || (entry.item && entry.item.id) || entry.originalSkinId;
        const isWithdrawing = LocalDB.isItemWithdrawing(activeUser.username, itemId);
        const wEntry = isWithdrawing ? (activeUser.withdrawingItems && activeUser.withdrawingItems[String(itemId)]) : null;
        const elapsed = wEntry ? (now - wEntry.startedAt) : 0;
        const isWaitingAccept = elapsed >= 4000;

        const itemStatus = isWithdrawing ? 'locked_for_withdrawal' : (entry.status || 'available');
        const withdrawalInfo = isWithdrawing ? {
          providerStatus: isWaitingAccept ? 'waiting_accept' : 'processing',
          expiresAt: wEntry ? wEntry.expiresAt : new Date(now + 60000).toISOString(),
          tradeOfferId: wEntry ? wEntry.tradeOfferId : '9482716492'
        } : (entry.withdrawal || null);

        if (entry && entry.item) {
          return {
            ...entry,
            status: itemStatus,
            withdrawal: withdrawalInfo
          };
        }
        return {
          id: entry.id || String(Date.now() + Math.random()),
          price: parseFloat(entry.price) || 0,
          item: entry,
          status: itemStatus,
          withdrawal: withdrawalInfo,
          createdAt: entry.createdAt || new Date().toISOString()
        };
      });

      const total = normItems.length;
      const pagedItems = normItems.slice(offset, offset + limit);

      return {
        status: 200,
        data: {
          items: pagedItems,
          hasMore: offset + limit < total,
          total: total
        }
      };
    }

    // /api/items/inventory/sell
    if (path.includes('/items/inventory/sell')) {
      if (!activeUser) return { status: 401, data: { message: 'Unauthorized' } };
      const itemIds = body && (body.inventoryItemIds || body.itemIds || body.ids || (body.id ? [body.id] : []));
      let soldTotal = 0;
      const soldItems = [];
      if (Array.isArray(itemIds)) {
        itemIds.forEach(id => {
          // DO NOT sell skins that are currently being withdrawn!
          if (LocalDB.isItemWithdrawing(activeUser.username, id)) {
            return;
          }
          const it = (activeUser.inventory || []).find(x => String(x.id) === String(id) || String(x.originalSkinId) === String(id));
          if (it) {
            const itPrice = parseFloat(it.price || 0);
            soldTotal += itPrice;
            soldItems.push(it);
            LocalDB.removeItemFromInventory(activeUser.username, it.id);
          }
        });
      }
      soldTotal = parseFloat(soldTotal.toFixed(2));
      const newBal = LocalDB.updateBalance(activeUser.username, soldTotal, true);
      LocalDB.recordSale(activeUser.username, soldItems, soldTotal);

      const updatedUser = LocalDB.getActiveUser();
      window.dispatchEvent(new CustomEvent('upgrader:user-updated', { detail: updatedUser }));

      showToast(`Продано предметов: ${soldItems.length} (+${soldTotal.toLocaleString()} ₽)`, 'success');

      return {
        status: 200,
        data: {
          success: true,
          totalAmount: soldTotal,
          balance: String(newBal),
          items: soldItems
        }
      };
    }

    // /withdrawals
    if (path === '/withdrawals' || path.endsWith('/withdrawals') || path.includes('/withdrawals')) {
      if (!activeUser) return { status: 401, data: { message: 'Unauthorized' } };
      const itemId = body && (body.inventoryItemId || body.id || (body.itemIds && body.itemIds[0]));
      const item = (activeUser.inventory || []).find(x => String(x.id) === String(itemId) || String(x.originalSkinId) === String(itemId));

      if (item) {
        LocalDB.startWithdrawal(activeUser.username, item);
        showToast('Запрос на вывод отправлен. Передаем скин в Steam...', 'info');
        syncWithdrawingCards();
      }

      return {
        status: 200,
        data: {
          id: Math.floor(Date.now() % 100000) + 1000,
          status: 'pending',
          inventoryItemId: itemId,
          createdAt: new Date().toISOString()
        }
      };
    }

    // /api/items/shop or /items/shop
    if (path.includes('/items/shop') && !path.includes('/buy')) {
      let catalog = [...window.UPGRADER_CONFIG.catalog];
      const search = params.get('search') || params.get('name') || params.get('marketName');
      if (search) {
        const s = search.toLowerCase();
        catalog = catalog.filter(x => x.marketName.toLowerCase().includes(s));
      }
      const minPrice = parseFloat(params.get('minPrice') || params.get('priceFrom'));
      const maxPrice = parseFloat(params.get('maxPrice') || params.get('priceTo'));
      if (!isNaN(minPrice)) catalog = catalog.filter(x => parseFloat(x.price) >= minPrice);
      if (!isNaN(maxPrice)) catalog = catalog.filter(x => parseFloat(x.price) <= maxPrice);

      // Price Sorting (from low to high or high to low)
      const sortDirection = (params.get('sortDirection') || params.get('direction') || 'asc').toLowerCase();
      const sortBy = (params.get('sortBy') || params.get('sort') || 'price').toLowerCase();
      if (sortBy === 'price') {
        if (sortDirection === 'desc') {
          catalog.sort((a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0));
        } else {
          catalog.sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0));
        }
      }

      const limit = parseInt(params.get('limit') || params.get('pageSize') || '24', 10);
      let offset = 0;
      if (params.get('offset') !== null && params.get('offset') !== undefined) {
        offset = parseInt(params.get('offset'), 10);
      } else if (params.get('page')) {
        offset = (parseInt(params.get('page'), 10) - 1) * limit;
      }
      const total = catalog.length;
      const items = catalog.slice(offset, offset + limit);

      return {
        status: 200,
        data: {
          items: items,
          total: total,
          hasMore: offset + limit < total,
          page: Math.floor(offset / limit) + 1,
          limit: limit
        }
      };
    }

    // /api/items/shop/buy or /items/shop/buy
    if (path.includes('/items/shop/buy')) {
      if (!activeUser) return { status: 401, data: { message: 'Unauthorized' } };
      const shopItemIds = body && (body.itemIds || body.ids || (body.id ? [body.id] : []));
      let totalCost = 0;
      const itemsToBuy = [];

      if (Array.isArray(shopItemIds)) {
        shopItemIds.forEach(id => {
          const skin = window.UPGRADER_CONFIG.catalog.find(s => String(s.id) === String(id));
          if (skin) {
            totalCost += parseFloat(skin.price);
            itemsToBuy.push(skin);
          }
        });
      }

      if (activeUser.balance < totalCost) {
        return { status: 400, data: { message: 'Недостаточно средств на балансе' } };
      }

      const newBal = LocalDB.updateBalance(activeUser.username, -totalCost, true);
      const addedItems = [];
      itemsToBuy.forEach(item => {
        const added = LocalDB.addItemToInventory(activeUser.username, item);
        addedItems.push(added);
        LocalDB.recordPurchase(activeUser.username, item);
      });

      return {
        status: 200,
        data: {
          success: true,
          balance: String(newBal),
          items: addedItems
        }
      };
    }

    // /api/game/upgrader/bet
    if (path.includes('/game/upgrader/bet')) {
      if (!activeUser) return { status: 401, data: { message: 'Unauthorized' } };

      const betInventoryItemIds = body.betInventoryItemIds || body.userItemIds || [];
      const targetItemId = body.targetItemId || (body.targetItemIds && body.targetItemIds[0]);
      const addedBalance = parseFloat(body.addedBalance || body.balanceAmount || 0);

      const targetSkin = (window.UPGRADER_CONFIG.catalog || []).find(s => String(s.id) === String(targetItemId));
      const targetPrice = parseFloat(body.targetItemPrice || (targetSkin ? targetSkin.price : 1));

      // Block items currently locked for withdrawal
      for (const id of betInventoryItemIds) {
        if (LocalDB.isItemWithdrawing(activeUser.username, id)) {
          return {
            status: 400,
            data: { message: 'Предмет находится в процессе вывода и не может участвовать в апгрейде' }
          };
        }
      }

      // Calculate offered value
      let betTotal = addedBalance > 0 ? addedBalance : 0;
      const betItems = [];
      betInventoryItemIds.forEach(id => {
        const it = (activeUser.inventory || []).find(x => String(x.id) === String(id) || String(x.originalSkinId) === String(id));
        if (it) {
          betTotal += parseFloat(it.price || 0);
          betItems.push(it);
        }
      });

      const safeTargetPrice = targetPrice > 0 ? targetPrice : 1;
      let chance = Math.min(0.95, Math.max(0.01, (betTotal / safeTargetPrice) * 0.95));
      let roll = Math.random();

      // ADMIN CHANCE RIGGING (configured via /admin)
      const rig = activeUser.chanceRig || 'normal';
      if (rig === 'force_win') {
        chance = Math.max(0.10, chance);
        roll = Math.min(chance * 0.35, 0.02); // Guaranteed win: roll is strictly inside winning arc!
      } else if (rig === 'force_lose') {
        roll = Math.max(chance + 0.08, 0.98); // Guaranteed lose: roll is strictly outside winning arc!
      } else if (rig === 'bonus_25') {
        chance = Math.min(0.98, chance + 0.25);
        roll = Math.random();
      } else if (rig === 'bonus_50') {
        chance = Math.min(0.98, chance + 0.50);
        roll = Math.random();
      } else if (rig === 'mult_2x') {
        chance = Math.min(0.98, chance * 2.0);
        roll = Math.random();
      } else if (rig === 'custom' && typeof activeUser.customWinChance === 'number') {
        chance = Math.min(0.99, Math.max(0.01, activeUser.customWinChance / 100));
        roll = Math.random();
      }

      const isWin = roll <= chance;

      // Deduct added balance if any
      if (addedBalance > 0) {
        LocalDB.updateBalance(activeUser.username, -addedBalance, true);
      }

      // Remove bet items from inventory
      betInventoryItemIds.forEach(id => {
        LocalDB.removeItemFromInventory(activeUser.username, id);
      });

      // If win, add won target skin to inventory
      let wonItem = null;
      if (isWin && targetSkin) {
        wonItem = LocalDB.addItemToInventory(activeUser.username, targetSkin);
      }

      const targetItemObj = targetSkin || {
        id: targetItemId,
        marketName: 'Предмет #' + targetItemId,
        price: String(safeTargetPrice),
        extra: { r: 10, ch: 'eb4b4b' }
      };

      const betId = Math.floor(Date.now() % 10000000) + 1000;

      // Compensation system completely disabled as requested by user
      const isCompensation = false;
      const wonCompensationSkin = null;

      // Record upgrade into LocalDB: updates upgradesMade, bestDrop, gamesHistory, inventoryHistory, and global upgrades!
      LocalDB.recordUpgrade(activeUser.username, {
        isWin,
        isCompensation: false,
        wonCompensationSkin: null,
        betItems,
        addedBalance,
        targetSkin: targetItemObj,
        safeTargetPrice,
        chance,
        roll,
        betTotal,
        betId
      });

      const updatedUser = LocalDB.getActiveUser();

      const betRecord = {
        id: betId,
        status: isWin ? 'won' : 'lost',
        betItems: betItems,
        addedBalance: String(addedBalance.toFixed(2)),
        targetItem: targetItemObj,
        wonItem: isWin ? (wonItem || targetItemObj) : null,
        compensationItems: [],
        hasCompensation: false,
        chance: chance,
        probability: chance,
        roll: roll,
        createdAt: new Date().toISOString()
      };

      window.dispatchEvent(new CustomEvent('upgrader:user-updated', { detail: updatedUser }));

      return {
        status: 200,
        data: {
          bet: betRecord,
          balance: String(updatedUser.balance)
        }
      };
    }

    // /api/game/upgrader/bet/:id/provably-fair
    if (path.includes('/provably-fair')) {
      return {
        status: 200,
        data: {
          serverSeed: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          clientSeed: 'client_seed_upgrader',
          nonce: 1,
          roll: 0.3541
        }
      };
    }

    return null;
  }

  // 8. INTERCEPT XMLHttpRequest
  const OriginalXHR = window.XMLHttpRequest;
  function MockXMLHttpRequest() {
    const xhr = new OriginalXHR();
    let method = 'GET';
    let url = '';
    let requestHeaders = {};
    let isMocked = false;

    const originalOpen = xhr.open;
    xhr.open = function(m, u, async, user, password) {
      method = (m || 'GET').toUpperCase();
      url = u;
      return originalOpen.apply(xhr, arguments);
    };

    const originalSetRequestHeader = xhr.setRequestHeader;
    xhr.setRequestHeader = function(header, value) {
      requestHeaders[header] = value;
      return originalSetRequestHeader.apply(xhr, arguments);
    };

    const originalSend = xhr.send;
    xhr.send = function(bodyData) {
      try {
        const parsedUrl = new URL(url, window.location.origin);
        const path = parsedUrl.pathname;

        let parsedBody = {};
        if (bodyData) {
          try {
            parsedBody = typeof bodyData === 'string' ? JSON.parse(bodyData) : bodyData;
          } catch(e) {}
        }

        const mockResponse = handleMockApi(method, path, parsedBody, parsedUrl.searchParams);
        if (mockResponse) {
          isMocked = true;
          const status = mockResponse.status || 200;
          const responseText = JSON.stringify(mockResponse.data);

          Object.defineProperty(xhr, 'status', { get: () => status });
          Object.defineProperty(xhr, 'statusText', { get: () => status === 200 ? 'OK' : 'Mock Response' });
          Object.defineProperty(xhr, 'readyState', { get: () => 4 });
          Object.defineProperty(xhr, 'responseText', { get: () => responseText });
          Object.defineProperty(xhr, 'response', { get: () => responseText });

          xhr.getAllResponseHeaders = function() {
            return 'content-type: application/json; charset=utf-8\r\n';
          };
          xhr.getResponseHeader = function(h) {
            if (h && h.toLowerCase() === 'content-type') return 'application/json; charset=utf-8';
            return null;
          };

          setTimeout(() => {
            xhr.dispatchEvent(new Event('readystatechange'));
            xhr.dispatchEvent(new Event('load'));
            xhr.dispatchEvent(new Event('loadend'));
            if (xhr.onreadystatechange) xhr.onreadystatechange();
            if (xhr.onload) xhr.onload();
            if (xhr.onloadend) xhr.onloadend();
          }, 10);
          return;
        }
      } catch (err) {
        console.warn('[UPGRADER Mock XHR Error]', err);
      }

      return originalSend.apply(xhr, arguments);
    };

    return xhr;
  }
  MockXMLHttpRequest.prototype = OriginalXHR.prototype;
  MockXMLHttpRequest.DONE = OriginalXHR.DONE;
  MockXMLHttpRequest.HEADERS_RECEIVED = OriginalXHR.HEADERS_RECEIVED;
  MockXMLHttpRequest.LOADING = OriginalXHR.LOADING;
  MockXMLHttpRequest.OPENED = OriginalXHR.OPENED;
  MockXMLHttpRequest.UNSENT = OriginalXHR.UNSENT;
  window.XMLHttpRequest = MockXMLHttpRequest;

  // 9. INTERCEPT FETCH
  const originalFetch = window.fetch;
  window.fetch = function(resource, init) {
    let url = typeof resource === 'string' ? resource : (resource.url || '');
    let method = (init && init.method) ? init.method.toUpperCase() : 'GET';
    let body = {};
    if (init && init.body) {
      try {
        body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
      } catch(e) {}
    }

    try {
      const parsedUrl = new URL(url, window.location.origin);
      const path = parsedUrl.pathname;
      const mockResponse = handleMockApi(method, path, body, parsedUrl.searchParams);
      if (mockResponse) {
        return Promise.resolve(new Response(JSON.stringify(mockResponse.data), {
          status: mockResponse.status,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
    } catch(e) {}

    return originalFetch.apply(this, arguments);
  };

  // 10. UI NOTIFICATIONS (TOASTS)
  function showToast(message, type = 'info') {
    const existing = document.querySelector('.upgrader-custom-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'upgrader-custom-toast';
    const bg = type === 'error' ? '#EF4444' : (type === 'success' ? '#10B981' : '#FDD911');
    const color = type === 'info' ? '#17181C' : '#FFFFFF';
    toast.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:999999;background:${bg};color:${color};padding:12px 20px;border-radius:12px;font-family:Exo 2,sans-serif;font-weight:600;font-size:14px;box-shadow:0 10px 25px rgba(0,0,0,0.5);transition:all 0.3s ease;transform:translateY(0);opacity:1;`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Injected CSS for Upgrader custom animations & push switch visibility
  (function injectGlobalStyles() {
    if (document.getElementById('upgrader-custom-animations')) return;
    const style = document.createElement('style');
    style.id = 'upgrader-custom-animations';
    style.textContent = `
      @keyframes upSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      @keyframes upFadeIn { 0% { opacity: 0; transform: scale(0.97); } 100% { opacity: 1; transform: scale(1); } }
      @keyframes upCaseFloat { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-10px) rotate(-1.5deg); } }
      @keyframes upCasePulse { 0%, 100% { transform: scale(1); opacity: 0.45; } 50% { transform: scale(1.18); opacity: 0.85; } }

      /* Push notification switch card visible and positioned correctly */
      up-push-switch {
        display: block !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        overflow: visible !important;
      }
    `;
    document.head.appendChild(style);
  })();

  // 10.1 IN-PLACE INVENTORY WITHDRAWAL ANIMATION & AUTHENTIC STEAM STATUS
  function syncWithdrawingCards() {
    const activeUser = LocalDB.getActiveUser();
    if (!activeUser) return;

    // Check completed or active withdrawals (this also auto-completes expired ones)
    const withdrawingList = LocalDB.getWithdrawingItems(activeUser.username);
    const now = Date.now();
    const isEn = (localStorage.getItem('lang') === 'en') || document.documentElement.lang === 'en' || (window.location && window.location.pathname.startsWith('/en'));
    const waitingText = isEn ? 'Waiting for seller' : 'Ожидание продавца';
    const acceptText = isEn ? 'Accept' : 'Принять';

    const cells = Array.from(document.querySelectorAll('up-profile-items-table .grid > div'));

    // Decorate cards that are currently being withdrawn
    withdrawingList.forEach(entry => {
      const id = String(entry.id);
      const itemName = entry.item ? entry.item.marketName : '';
      const itemImg = entry.item ? entry.item.image : '';

      // Find cell by testid, image or item name
      let parentCell = null;
      for (const cell of cells) {
        if (cell.querySelector(`[data-testid*="${id}"]`)) {
          parentCell = cell;
          break;
        }
        const img = cell.querySelector('img');
        if (img && itemImg && img.src && (img.src === itemImg || img.src.includes(itemImg.slice(-25)))) {
          parentCell = cell;
          break;
        }
        if (itemName && cell.textContent && cell.textContent.includes(itemName)) {
          parentCell = cell;
          break;
        }
      }

      if (parentCell) {
        const elapsed = now - entry.startedAt;
        const remainingMs = Math.max(0, entry.durationMs - elapsed);
        const isWaitingAccept = elapsed >= 4000;

        const secs = Math.ceil(remainingMs / 1000);
        const mins = Math.floor(secs / 60);
        const remSecs = secs % 60;
        const timerFormatted = String(mins).padStart(2, '0') + ':' + String(remSecs).padStart(2, '0');

        // Look for native Angular overlay first (parentCell's first child containing up-withdrawal-status)
        let nativeOverlay = (parentCell.firstElementChild && parentCell.firstElementChild.querySelector('up-withdrawal-status')) 
          ? parentCell.firstElementChild 
          : parentCell.querySelector('up-withdrawal-status')?.parentElement;

        let overlay = nativeOverlay || parentCell.querySelector('.up-withdrawing-overlay');

        if (!overlay) {
          overlay = document.createElement('div');
          overlay.className = 'up-withdrawing-overlay absolute top-0 left-0 z-[3] flex h-full w-full flex-col items-center justify-center space-y-3 rounded-md bg-black/50 backdrop-blur-xs transition-opacity duration-300';
          overlay.dataset.withdrawingId = id;
          overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);border-radius:6px;z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;pointer-events:all;user-select:none;';
          parentCell.style.position = 'relative';
          parentCell.prepend(overlay);
        } else {
          overlay.classList.remove('opacity-0', 'pointer-events-none', 'hidden');
          overlay.classList.add('opacity-100', 'pointer-events-auto');
          overlay.style.opacity = '1';
          overlay.style.pointerEvents = 'auto';
          overlay.style.display = 'flex';
          overlay.dataset.withdrawingId = id;
        }

        let statusEl = overlay.querySelector('up-withdrawal-status') || overlay;

        // Render authentic up-withdrawal-status stage
        if (!isWaitingAccept) {
          // Stage 1: Waiting for seller (spinning loader + text matching media_1791009769130.png)
          if (overlay.dataset.stage !== 'stage1') {
            overlay.dataset.stage = 'stage1';
            statusEl.innerHTML = `
              <img src="${getAssetPath('/assets/icons/loading-yellow.svg')}" alt="" class="mx-auto h-5 w-5 animate-spin" style="width:20px;height:20px;animation:upSpin 1s linear infinite;display:block;margin:0 auto;" />
              <span class="text-gray text-xxs text-center font-normal" style="color:#8E8F94;font-size:11px;font-family:'Exo 2',sans-serif;font-weight:400;text-align:center;">${waitingText}</span>
            `;
          }
        } else {
          // Stage 2: Trade ready / countdown / Accept button
          if (overlay.dataset.stage !== 'stage2') {
            overlay.dataset.stage = 'stage2';
            statusEl.innerHTML = `
              <div class="flex items-center justify-center gap-2.5" style="display:flex;align-items:center;justify-content:center;gap:6px;">
                <img src="${getAssetPath('/assets/icons/yellowTimer.svg')}" alt="" class="h-5 w-5" style="width:18px;height:18px;" />
                <span class="up-withdraw-timer font-tektur text-[0.8125rem] leading-[1.0625rem] font-bold text-[#FFDD23]" style="font-family:Tektur,sans-serif;font-size:13px;font-weight:700;color:#FFDD23;">${timerFormatted}</span>
              </div>
              <a href="https://steamcommunity.com/tradeoffer/${entry.tradeOfferId || '9482716492'}/" target="_blank" data-testid="withdrawal-status-accept-link" class="bg-gradient-yellow-main px-auto mx-2.5 flex cursor-pointer items-center justify-center self-stretch rounded-[0.375rem] py-2 transition-all duration-200 hover:shadow-[0_0_10px_0_rgba(255,171,27,0.80)]" style="display:flex;align-items:center;justify-content:center;width:calc(100% - 20px);margin:0 10px;padding:7px 0;border-radius:6px;background:linear-gradient(180deg,#FFE02D 0%,#FFB800 100%);color:#1C1C20;font-family:Tektur,sans-serif;font-size:12px;font-weight:800;text-decoration:none;box-shadow:0 0 12px rgba(255,171,27,0.5);transition:transform 0.15s ease;cursor:pointer;text-transform:uppercase;letter-spacing:0.5px;">
                <span class="font-tektur text-[0.8125rem] leading-[1.0625rem] text-[#1C1C20]">${acceptText}</span>
              </a>
            `;
          } else {
            const timerEl = overlay.querySelector('.up-withdraw-timer');
            if (timerEl && timerEl.textContent !== timerFormatted) {
              timerEl.textContent = timerFormatted;
            }
          }
        }

        // Lock & dim action buttons below this card
        const sellBtn = parentCell.querySelector(`[data-testid*="sell"]`);
        const withdrawBtn = parentCell.querySelector(`[data-testid*="withdraw"]`);
        if (sellBtn) {
          sellBtn.style.pointerEvents = 'none';
          sellBtn.style.opacity = '0.4';
          sellBtn.title = isEn ? 'Skin is being withdrawn to Steam' : 'Скин находится на выводе в Steam';
        }
        if (withdrawBtn) {
          withdrawBtn.style.pointerEvents = 'none';
          withdrawBtn.style.opacity = '0.4';
          withdrawBtn.title = isEn ? 'Skin is being withdrawn to Steam' : 'Скин находится на выводе в Steam';
        }
      }
    });

    // Clean up overlays and remove completed items from DOM
    document.querySelectorAll('.up-withdrawing-overlay, up-profile-items-table .grid > div > div:first-child').forEach(el => {
      const id = el.dataset.withdrawingId;
      if (id && !LocalDB.isItemWithdrawing(activeUser.username, id)) {
        if (el.classList.contains('up-withdrawing-overlay')) {
          el.remove();
        } else {
          el.classList.add('opacity-0', 'pointer-events-none');
          el.classList.remove('opacity-100', 'pointer-events-auto');
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          const status = el.querySelector('up-withdrawal-status');
          if (status) status.innerHTML = '';
        }
        const inInv = (activeUser.inventory || []).some(x => String(x.id) === String(id) || String(x.originalSkinId) === String(id));
        if (!inInv) {
          const cardCell = document.querySelector(`[data-testid="profile-items-table-withdraw-${id}"]`)?.closest('div.relative');
          if (cardCell) cardCell.remove();
        }
      }
    });
  }

  function triggerWithdrawalAnimation(item) {
    const activeUser = LocalDB.getActiveUser();
    if (activeUser && item) {
      LocalDB.startWithdrawal(activeUser.username, item);
      showToast('Запрос на вывод отправлен. Передаем скин в Steam...', 'info');
      syncWithdrawingCards();
    }
  }

  // 10.15 COMPENSATION SYSTEM DISABLED
  function renderCompensationCaseModal() {
    const existing = document.getElementById("upgrader-compensation-modal");
    if (existing) existing.remove();
  }

  // 10.2 PROFILE EDIT MODAL (Change Avatar, Nickname & ID)
  function renderProfileEditModal() {
    const existing = document.getElementById('upgrader-profile-edit-modal');
    if (existing) existing.remove();

    const activeUser = LocalDB.getActiveUser();
    if (!activeUser) {
      renderAuthModal();
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'upgrader-profile-edit-modal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:Exo 2,sans-serif;';

    overlay.innerHTML = `
      <div style="position:relative;width:100%;max-width:480px;background:#17181C;border:1px solid rgba(255,255,255,0.12);border-radius:24px;box-shadow:0 25px 60px rgba(0,0,0,0.7);padding:28px;color:#fff;max-height:90vh;overflow-y:auto;">
        <button type="button" id="up-profile-edit-close" style="position:absolute;top:20px;right:20px;background:none;border:none;color:#888;font-size:24px;cursor:pointer;line-height:1;">✕</button>

        <h3 style="font-family:Tektur,sans-serif;font-size:20px;font-weight:700;margin:0 0 20px;color:#FDD911;">Редактирование профиля</h3>

        <!-- Current Avatar Preview -->
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;background:#202126;padding:14px;border-radius:14px;border:1px solid rgba(255,255,255,0.06);">
          <img id="edit-avatar-preview" src="${activeUser.avatar}" style="width:64px;height:64px;border-radius:14px;border:2px solid #FDD911;object-fit:cover;" />
          <div>
            <div style="font-size:16px;font-weight:700;color:#fff;" id="edit-nick-preview">${activeUser.nickname}</div>
            <div style="font-size:13px;color:#94a3b8;" id="edit-id-preview">ID: ${activeUser.id}</div>
          </div>
        </div>

        <!-- Nickname -->
        <div style="margin-bottom:14px;">
          <label style="display:block;font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:6px;">Никнейм</label>
          <input type="text" id="edit-nickname-input" value="${activeUser.nickname}" style="width:100%;background:#202126;border:1px solid rgba(255,255,255,0.12);color:#fff;padding:10px 14px;border-radius:10px;font-size:14px;outline:none;" />
        </div>

        <!-- ID in profile -->
        <div style="margin-bottom:14px;">
          <label style="display:block;font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:6px;">ID в профиле (числовой)</label>
          <input type="number" id="edit-id-input" value="${activeUser.id}" style="width:100%;background:#202126;border:1px solid rgba(255,255,255,0.12);color:#fff;padding:10px 14px;border-radius:10px;font-size:14px;outline:none;" />
        </div>

        <!-- Custom Avatar URL -->
        <div style="margin-bottom:22px;">
          <label style="display:block;font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:6px;">URL аватарки</label>
          <input type="text" id="edit-avatar-url-input" value="${activeUser.avatar}" style="width:100%;background:#202126;border:1px solid rgba(255,255,255,0.12);color:#fff;padding:10px 14px;border-radius:10px;font-size:13px;outline:none;" />
        </div>

        <div style="display:flex;flex-direction:column;gap:10px;">
          <button type="button" id="edit-profile-save-btn" style="width:100%;background:#FDD911;color:#17181C;font-family:Tektur,sans-serif;font-weight:700;font-size:14px;padding:12px;border:none;border-radius:12px;cursor:pointer;">Сохранить изменения</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('#up-profile-edit-close');
    closeBtn.onclick = () => overlay.remove();

    const nickInput = overlay.querySelector('#edit-nickname-input');
    const idInput = overlay.querySelector('#edit-id-input');
    const avatarInput = overlay.querySelector('#edit-avatar-url-input');
    const previewImg = overlay.querySelector('#edit-avatar-preview');
    const previewNick = overlay.querySelector('#edit-nick-preview');
    const previewId = overlay.querySelector('#edit-id-preview');

    avatarInput.oninput = () => {
      if (avatarInput.value.trim()) previewImg.src = avatarInput.value.trim();
    };
    nickInput.oninput = () => {
      previewNick.textContent = nickInput.value.trim() || 'Пользователь';
    };
    idInput.oninput = () => {
      previewId.textContent = 'ID: ' + (idInput.value.trim() || '10001');
    };

    const saveBtn = overlay.querySelector('#edit-profile-save-btn');
    saveBtn.onclick = () => {
      const newNick = nickInput.value.trim() || activeUser.nickname;
      const newId = idInput.value.trim() || activeUser.id;
      const newAvatar = avatarInput.value.trim() || activeUser.avatar;

      LocalDB.updateProfileCustomizations(activeUser.username, {
        nickname: newNick,
        avatar: newAvatar,
        id: newId
      });

      overlay.remove();
      showToast('Профиль успешно обновлен!', 'success');

      // Update in DOM and reload state
      setTimeout(() => {
        window.location.reload();
      }, 250);
    };
  }

  // 11. LOCAL AUTH MODAL
  function renderAuthModal() {
    const existing = document.getElementById('upgrader-auth-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'upgrader-auth-modal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);backdrop-filter:blur(8px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:Exo 2,sans-serif;';

    const testAcc = window.UPGRADER_CONFIG.testAccount;

    overlay.innerHTML = `
      <div style="position:relative;width:100%;max-width:440px;background:#17181C;border:1px solid rgba(255,255,255,0.08);border-radius:24px;box-shadow:0 20px 50px rgba(0,0,0,0.6);padding:32px;color:#fff;">
        <button type="button" id="up-auth-close" style="position:absolute;top:20px;right:20px;background:none;border:none;color:#888;font-size:24px;cursor:pointer;line-height:1;">✕</button>

        <h2 style="font-family:Tektur,sans-serif;font-size:22px;margin:0 0 8px;color:#fff;" id="up-auth-title">Вход в аккаунт</h2>
        <p style="font-size:13px;color:#8E8F94;margin:0 0 20px;" id="up-auth-desc">Локальная авторизация без сторонних сервисов</p>

        <!-- Quick Test Account Login Box -->
        <div style="background:rgba(253,217,17,0.08);border:1px dashed #FDD911;border-radius:12px;padding:12px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-weight:700;font-size:12px;color:#FDD911;text-transform:uppercase;">Тестовый аккаунт</div>
            <div style="font-size:12px;color:#ccc;">Логин: <b>${testAcc.username}</b> | Баланс: <b>50,000 ₽</b></div>
          </div>
          <button type="button" id="up-quick-test-login" style="background:#FDD911;color:#17181C;border:none;border-radius:8px;padding:6px 12px;font-weight:700;font-size:12px;cursor:pointer;">Войти</button>
        </div>

        <form id="up-auth-form" style="display:flex;flex-col;gap:14px;flex-direction:column;">
          <div id="up-nickname-group" style="display:none;flex-direction:column;gap:6px;">
            <label style="font-size:12px;color:#8E8F94;">Отображаемое имя (Ник)</label>
            <input type="text" id="up-auth-nickname" placeholder="Например: Winner" style="background:#202126;border:1px solid rgba(255,255,255,0.1);color:#fff;padding:12px 14px;border-radius:10px;font-size:14px;outline:none;" />
          </div>

          <div style="display:flex;flex-direction:column;gap:6px;">
            <label style="font-size:12px;color:#8E8F94;">Логин</label>
            <input type="text" id="up-auth-username" placeholder="Логин" required style="background:#202126;border:1px solid rgba(255,255,255,0.1);color:#fff;padding:12px 14px;border-radius:10px;font-size:14px;outline:none;" />
          </div>

          <div style="display:flex;flex-direction:column;gap:6px;">
            <label style="font-size:12px;color:#8E8F94;">Пароль</label>
            <input type="password" id="up-auth-password" placeholder="Пароль" required style="background:#202126;border:1px solid rgba(255,255,255,0.1);color:#fff;padding:12px 14px;border-radius:10px;font-size:14px;outline:none;" />
          </div>

          <div id="up-auth-error" style="display:none;color:#ef4444;font-size:12px;"></div>

          <button type="button" id="up-auth-submit" style="background:#FDD911;color:#17181C;border:none;border-radius:10px;padding:14px;font-weight:700;font-size:15px;cursor:pointer;margin-top:6px;font-family:Tektur,sans-serif;">Войти</button>
        </form>

        <div style="margin-top:16px;text-align:center;font-size:13px;color:#8E8F94;">
          <span id="up-toggle-text">Нет аккаунта?</span>
          <button type="button" id="up-auth-toggle-mode" style="background:none;border:none;color:#FDD911;font-weight:600;cursor:pointer;margin-left:4px;text-decoration:underline;">Зарегистрироваться</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    let isRegisterMode = false;
    const title = overlay.querySelector('#up-auth-title');
    const desc = overlay.querySelector('#up-auth-desc');
    const nickGroup = overlay.querySelector('#up-nickname-group');
    const submitBtn = overlay.querySelector('#up-auth-submit');
    const toggleBtn = overlay.querySelector('#up-auth-toggle-mode');
    const toggleText = overlay.querySelector('#up-toggle-text');
    const errorBox = overlay.querySelector('#up-auth-error');
    const userInput = overlay.querySelector('#up-auth-username');
    const passInput = overlay.querySelector('#up-auth-password');
    const nickInput = overlay.querySelector('#up-auth-nickname');

    function showError(msg) {
      errorBox.textContent = msg;
      errorBox.style.display = 'block';
    }

    overlay.querySelector('#up-auth-close').onclick = (e) => {
      e.stopPropagation();
      overlay.remove();
    };

    toggleBtn.onclick = (e) => {
      e.stopPropagation();
      isRegisterMode = !isRegisterMode;
      errorBox.style.display = 'none';
      if (isRegisterMode) {
        title.textContent = 'Регистрация';
        desc.textContent = 'Создайте аккаунт и получите стартовый баланс 15,000 ₽ и скины';
        nickGroup.style.display = 'flex';
        submitBtn.textContent = 'Создать аккаунт';
        toggleText.textContent = 'Уже есть аккаунт?';
        toggleBtn.textContent = 'Войти';
      } else {
        title.textContent = 'Вход в аккаунт';
        desc.textContent = 'Локальная авторизация без сторонних сервисов';
        nickGroup.style.display = 'none';
        submitBtn.textContent = 'Войти';
        toggleText.textContent = 'Нет аккаунта?';
        toggleBtn.textContent = 'Зарегистрироваться';
      }
    };

    function doLogin(u, p) {
      try {
        LocalDB.login(u, p);
        showToast('Успешный вход в аккаунт!', 'success');
        overlay.remove();
        setTimeout(() => {
          window.location.reload();
        }, 150);
      } catch (e) {
        showError(e.message);
      }
    }

    function doRegister(u, p) {
      try {
        const nick = nickInput.value.trim();
        LocalDB.register(u, p, nick);
        showToast('Аккаунт успешно создан!', 'success');
        overlay.remove();
        setTimeout(() => {
          window.location.reload();
        }, 150);
      } catch (e) {
        showError(e.message);
      }
    }

    overlay.querySelector('#up-quick-test-login').onclick = (e) => {
      e.stopPropagation();
      doLogin(testAcc.username, testAcc.password);
    };

    submitBtn.onclick = (e) => {
      e.stopPropagation();
      const u = userInput.value.trim();
      const p = passInput.value.trim();
      if (isRegisterMode) {
        doRegister(u, p);
      } else {
        doLogin(u, p);
      }
    };
  }

  // 11. EMAIL BINDING MODAL (Immediate bind without confirmation code)
  function renderEmailBindModal() {
    const existing = document.getElementById('upgrader-email-modal');
    if (existing) existing.remove();

    const activeUser = LocalDB.getActiveUser();
    if (!activeUser) {
      renderAuthModal();
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'upgrader-email-modal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:Inter,sans-serif;';

    overlay.innerHTML = `
      <div style="position:relative;width:100%;max-width:440px;background:#18191C;border:1px solid rgba(255,255,255,0.08);border-radius:20px;box-shadow:0 24px 60px rgba(0,0,0,0.7);padding:28px 32px;color:#fff;">
        <button type="button" id="email-modal-close" style="position:absolute;top:18px;right:18px;background:none;border:none;color:#8E8F94;font-size:22px;cursor:pointer;line-height:1;">✕</button>

        <div style="text-align:center;margin-bottom:20px;">
          <div style="width:48px;height:48px;background:rgba(253,217,17,0.15);border:1px solid rgba(253,217,17,0.4);border-radius:14px;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:22px;">
            ✉️
          </div>
          <h2 style="font-family:Tektur,sans-serif;font-size:18px;margin:0 0 4px;color:#fff;font-weight:700;">Привязать почту</h2>
          <p style="font-size:12px;color:#8E8F94;margin:0;">Получай уникальные предложения и подарки</p>
        </div>

        <div style="margin-bottom:16px;">
          <label style="font-size:11px;font-weight:600;color:#8E8F94;text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:6px;">Электронная почта</label>
          <input type="email" id="bind-email-input" placeholder="example@mail.com" value="${activeUser.email || ''}" style="width:100%;box-sizing:border-box;background:#141517;border:1px solid #2B2C31;color:#fff;padding:12px 14px;border-radius:10px;font-size:14px;outline:none;" />
          <div id="bind-email-error" style="font-size:11px;color:#ef4444;margin-top:6px;display:none;"></div>
        </div>

        <button type="button" id="bind-email-submit" style="width:100%;background:#FDD911;color:#17181C;border:none;border-radius:12px;padding:14px;font-weight:800;font-size:14px;cursor:pointer;box-shadow:0 4px 20px rgba(253,217,17,0.25);">
          Привязать почту
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('#email-modal-close');
    const emailInput = overlay.querySelector('#bind-email-input');
    const submitBtn = overlay.querySelector('#bind-email-submit');
    const errEl = overlay.querySelector('#bind-email-error');

    setTimeout(() => emailInput.focus(), 50);

    closeBtn.onclick = (e) => {
      e.stopPropagation();
      overlay.remove();
    };

    submitBtn.onclick = (e) => {
      e.stopPropagation();
      const val = emailInput.value.trim();
      if (!val || !val.includes('@') || !val.includes('.')) {
        errEl.textContent = 'Пожалуйста, введите корректный адрес электронной почты';
        errEl.style.display = 'block';
        return;
      }

      LocalDB.setEmail(activeUser.username, val);
      overlay.remove();
      showToast('Почта ' + val + ' успешно привязана!', 'success');
      syncEmailLinkingCard();
    };
  }

  // Helper to keep bound email card always visible in profile
  function syncEmailLinkingCard() {
    const activeUser = LocalDB.getActiveUser();
    if (!activeUser) return;

    const profileGrid = document.querySelector('up-profile div.grid');
    if (!profileGrid) return;

    let colFull = profileGrid.querySelector('.col-span-full');

    if (activeUser.email && activeUser.isEmailVerified) {
      if (!colFull) {
        colFull = document.createElement('div');
        colFull.className = 'col-span-full grid w-full grid-cols-1 gap-3 lg:rounded-[1.5rem]';
        profileGrid.appendChild(colFull);
      }

      let boundCard = colFull.querySelector('#up-bound-email-card');
      if (!boundCard) {
        colFull.innerHTML = `
          <div id="up-bound-email-card" data-testid="email-linking-block" class="flex w-full items-center justify-between rounded-[0.75rem] bg-[#282A2D] p-4 lg:bg-[#00000066] border border-white/5">
            <div class="flex items-center gap-3">
              <div class="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-[0.375rem] bg-[#FFFFFF1A]">
                <img src="${getAssetPath('/assets/icons/email.svg')}" class="h-5 w-5" alt="email-icon" />
              </div>
              <div class="flex flex-col">
                <span data-testid="email-linking-email-label" class="text-[0.75rem] text-[#8E8F94] font-medium uppercase tracking-wider">Электронная почта</span>
                <span data-testid="email-linking-email-value" class="text-[0.875rem] text-white font-semibold">${activeUser.email}</span>
              </div>
            </div>
            <div data-testid="email-linking-verified-badge" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#24D17A1A] text-[#24D17A] text-[0.8125rem] font-bold">
              <img src="${getAssetPath('/assets/icons/check-green.svg')}" class="h-4 w-4" alt="success-icon" />
              <span>Привязана</span>
            </div>
          </div>
        `;
      } else {
        const valEl = boundCard.querySelector('[data-testid="email-linking-email-value"]');
        if (valEl && valEl.textContent !== activeUser.email) {
          valEl.textContent = activeUser.email;
        }
      }
    }
  }

  // 12. AUTHENTIC PAYMENT GATEWAY SIMULATION (Deposit Modal - Exact UI Match)
  function renderDepositModal() {
    const existing = document.getElementById('upgrader-deposit-modal');
    if (existing) existing.remove();

    const activeUser = LocalDB.getActiveUser();
    if (!activeUser) {
      renderAuthModal();
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'upgrader-deposit-modal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:Inter,sans-serif;';

    let currentTab = 'cards';
    let currentCurrency = 'UAH'; // Toggles between UAH (₴) and RUB (₽)
    let selectedMethod = 'card_rec';
    let baseAmount = 600;
    let promoCode = '';

    function renderView() {
      const isUah = currentCurrency === 'UAH';
      const currSign = isUah ? '₴' : '₽';
      const minAmount = isUah ? 54 : 100;
      const presets = isUah ? [150, 300, 600, 1200] : [500, 1000, 2500, 5000];

      overlay.innerHTML = `
        <div style="position:relative;width:100%;max-width:520px;background:#18191D;border:1px solid rgba(255,255,255,0.08);border-radius:20px;box-shadow:0 24px 60px rgba(0,0,0,0.7);padding:24px 28px;color:#fff;max-height:92vh;overflow-y:auto;">
          <!-- Close button -->
          <button type="button" id="dep-close" style="position:absolute;top:20px;right:20px;background:none;border:none;color:#8E8F94;font-size:22px;cursor:pointer;line-height:1;">✕</button>

          <!-- Title -->
          <h2 style="font-family:Tektur,sans-serif;font-size:18px;margin:0 0 16px;color:#fff;font-weight:700;">Пополнение баланса</h2>

          <!-- Category Tabs (Cards, Crypto, Skins) -->
          <div style="background:#1F2024;border-radius:10px;padding:4px;display:flex;gap:4px;margin-bottom:16px;">
            <button type="button" class="dep-tab-btn" data-tab="cards" style="flex:1;background:${currentTab === 'cards' ? '#2A2B31' : 'transparent'};color:${currentTab === 'cards' ? '#fff' : '#8E8F94'};border:none;border-radius:8px;padding:8px 12px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;">
              <span>💳</span> <span>Cards</span>
            </button>
            <button type="button" class="dep-tab-btn" data-tab="crypto" style="flex:1;background:${currentTab === 'crypto' ? '#2A2B31' : 'transparent'};color:${currentTab === 'crypto' ? '#fff' : '#8E8F94'};border:none;border-radius:8px;padding:8px 12px;font-size:13px;font-weight:500;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;">
              <span>🪙</span> <span>Crypto</span>
            </button>
            <button type="button" class="dep-tab-btn" data-tab="skins" style="flex:1;background:${currentTab === 'skins' ? '#2A2B31' : 'transparent'};color:${currentTab === 'skins' ? '#fff' : '#8E8F94'};border:none;border-radius:8px;padding:8px 12px;font-size:13px;font-weight:500;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;">
              <span>⚡</span> <span>Skins</span> <span style="color:#22c55e;">⚡</span>
            </button>
          </div>

          <!-- Currency Selector Row -->
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span style="font-size:13px;color:#8E8F94;">Способы оплаты для</span>
            <button type="button" id="dep-curr-toggle" style="background:#FDD911;color:#17181C;border:none;border-radius:8px;padding:4px 12px;font-size:12px;font-weight:700;display:flex;align-items:center;gap:6px;cursor:pointer;">
              <span>${currentCurrency}</span>
              <span style="font-size:9px;">▼</span>
            </button>
          </div>

          <!-- Payment Methods Grid (Matching Screenshot) -->
          <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;margin-bottom:12px;">
            ${isUah ? `
              <!-- Tile 1: Visa / MC Recommended -->
              <div class="pm-tile" data-m="card_rec" style="background:${selectedMethod === 'card_rec' ? '#27282F' : '#24252A'};border:${selectedMethod === 'card_rec' ? '1px solid #FDD911' : '1px solid rgba(255,255,255,0.06)'};border-radius:12px;padding:12px 8px;text-align:center;cursor:pointer;display:flex;flex-col;align-items:center;justify-content:center;flex-direction:column;min-height:76px;">
                <div style="display:flex;align-items:center;gap:6px;justify-content:center;">
                  <span style="color:#3b82f6;font-weight:900;font-size:14px;letter-spacing:-0.5px;">VISA</span>
                  <span style="display:inline-flex;position:relative;width:20px;height:12px;"><span style="width:12px;height:12px;border-radius:50%;background:#eb001b;display:inline-block;position:absolute;left:0;"></span><span style="width:12px;height:12px;border-radius:50%;background:#f79e1b;display:inline-block;position:absolute;right:0;opacity:0.9;"></span></span>
                </div>
                <div style="font-size:8px;color:#FDD911;font-weight:700;letter-spacing:0.5px;margin-top:2px;">RECOMMENDED</div>
                <div style="font-size:10px;color:#8E8F94;margin-top:2px;">VAT 3%</div>
              </div>

              <!-- Tile 2: Apple Pay -->
              <div class="pm-tile" data-m="apple" style="background:${selectedMethod === 'apple' ? '#27282F' : '#24252A'};border:${selectedMethod === 'apple' ? '1px solid #FDD911' : '1px solid rgba(255,255,255,0.06)'};border-radius:12px;padding:12px 8px;text-align:center;cursor:pointer;display:flex;flex-col;align-items:center;justify-content:center;flex-direction:column;min-height:76px;">
                <div style="font-weight:700;font-size:15px;color:#fff;display:flex;align-items:center;gap:3px;"><span style="font-size:16px;"></span>Pay</div>
                <div style="font-size:10px;color:#8E8F94;margin-top:4px;">VAT 3%</div>
              </div>

              <!-- Tile 3: Google Pay -->
              <div class="pm-tile" data-m="gpay" style="background:${selectedMethod === 'gpay' ? '#27282F' : '#24252A'};border:${selectedMethod === 'gpay' ? '1px solid #FDD911' : '1px solid rgba(255,255,255,0.06)'};border-radius:12px;padding:12px 8px;text-align:center;cursor:pointer;display:flex;flex-col;align-items:center;justify-content:center;flex-direction:column;min-height:76px;">
                <div style="font-weight:700;font-size:14px;color:#fff;display:flex;align-items:center;gap:3px;"><span style="color:#4285F4;">G</span> Pay</div>
                <div style="font-size:10px;color:#8E8F94;margin-top:4px;">VAT 3%</div>
              </div>

              <!-- Tile 4: Privat24 -->
              <div class="pm-tile" data-m="privat" style="background:${selectedMethod === 'privat' ? '#27282F' : '#24252A'};border:${selectedMethod === 'privat' ? '1px solid #FDD911' : '1px solid rgba(255,255,255,0.06)'};border-radius:12px;padding:12px 8px;text-align:center;cursor:pointer;display:flex;flex-col;align-items:center;justify-content:center;flex-direction:column;min-height:76px;">
                <div style="color:#16a34a;font-weight:800;font-size:13px;display:flex;align-items:center;gap:4px;"><span>Приват</span><span style="font-size:11px;background:#16a34a;color:#18191D;padding:0 3px;border-radius:2px;">24</span></div>
                <div style="font-size:10px;color:#8E8F94;margin-top:4px;">VAT 8%</div>
              </div>

              <!-- Tile 5: mono -->
              <div class="pm-tile" data-m="mono" style="background:${selectedMethod === 'mono' ? '#27282F' : '#24252A'};border:${selectedMethod === 'mono' ? '1px solid #FDD911' : '1px solid rgba(255,255,255,0.06)'};border-radius:12px;padding:12px 8px;text-align:center;cursor:pointer;display:flex;flex-col;align-items:center;justify-content:center;flex-direction:column;min-height:76px;">
                <div style="color:#fff;font-weight:800;font-size:14px;letter-spacing:-0.5px;">mono <span style="font-size:10px;opacity:0.7;">::</span></div>
                <div style="font-size:10px;color:#8E8F94;margin-top:4px;">VAT 8%</div>
              </div>

              <!-- Tile 6: VISA / MC Flat -->
              <div class="pm-tile" data-m="card_flat" style="background:${selectedMethod === 'card_flat' ? '#27282F' : '#24252A'};border:${selectedMethod === 'card_flat' ? '1px solid #FDD911' : '1px solid rgba(255,255,255,0.06)'};border-radius:12px;padding:12px 8px;text-align:center;cursor:pointer;display:flex;flex-col;align-items:center;justify-content:center;flex-direction:column;min-height:76px;">
                <div style="display:flex;align-items:center;gap:6px;justify-content:center;">
                  <span style="color:#3b82f6;font-weight:900;font-size:13px;">VISA</span>
                  <span style="display:inline-flex;position:relative;width:18px;height:10px;"><span style="width:10px;height:10px;border-radius:50%;background:#eb001b;display:inline-block;position:absolute;left:0;"></span><span style="width:10px;height:10px;border-radius:50%;background:#f79e1b;display:inline-block;position:absolute;right:0;opacity:0.9;"></span></span>
                </div>
                <div style="font-size:10px;color:#8E8F94;margin-top:4px;">VAT 3%</div>
              </div>
            ` : `
              <!-- RUB Methods -->
              <div class="pm-tile" data-m="sbp" style="background:${selectedMethod === 'sbp' ? '#27282F' : '#24252A'};border:${selectedMethod === 'sbp' ? '1px solid #FDD911' : '1px solid rgba(255,255,255,0.06)'};border-radius:12px;padding:12px 8px;text-align:center;cursor:pointer;display:flex;flex-col;align-items:center;justify-content:center;flex-direction:column;min-height:76px;">
                <div style="font-weight:800;font-size:14px;color:#fff;">⚡ СБП</div>
                <div style="font-size:8px;color:#FDD911;font-weight:700;letter-spacing:0.5px;margin-top:2px;">RECOMMENDED</div>
                <div style="font-size:10px;color:#8E8F94;margin-top:2px;">0% комиссия</div>
              </div>

              <div class="pm-tile" data-m="mir" style="background:${selectedMethod === 'mir' ? '#27282F' : '#24252A'};border:${selectedMethod === 'mir' ? '1px solid #FDD911' : '1px solid rgba(255,255,255,0.06)'};border-radius:12px;padding:12px 8px;text-align:center;cursor:pointer;display:flex;flex-col;align-items:center;justify-content:center;flex-direction:column;min-height:76px;">
                <div style="font-weight:700;font-size:14px;color:#fff;">💳 Карта РФ</div>
                <div style="font-size:10px;color:#8E8F94;margin-top:4px;">МИР, Visa, MC</div>
              </div>

              <div class="pm-tile" data-m="tpay" style="background:${selectedMethod === 'tpay' ? '#27282F' : '#24252A'};border:${selectedMethod === 'tpay' ? '1px solid #FDD911' : '1px solid rgba(255,255,255,0.06)'};border-radius:12px;padding:12px 8px;text-align:center;cursor:pointer;display:flex;flex-col;align-items:center;justify-content:center;flex-direction:column;min-height:76px;">
                <div style="font-weight:700;font-size:14px;color:#fff;">🟡 T-Pay</div>
                <div style="font-size:10px;color:#8E8F94;margin-top:4px;">0% комиссия</div>
              </div>

              <div class="pm-tile" data-m="sber" style="background:${selectedMethod === 'sber' ? '#27282F' : '#24252A'};border:${selectedMethod === 'sber' ? '1px solid #FDD911' : '1px solid rgba(255,255,255,0.06)'};border-radius:12px;padding:12px 8px;text-align:center;cursor:pointer;display:flex;flex-col;align-items:center;justify-content:center;flex-direction:column;min-height:76px;">
                <div style="font-weight:700;font-size:14px;color:#22c55e;">🟢 SberPay</div>
                <div style="font-size:10px;color:#8E8F94;margin-top:4px;">0% комиссия</div>
              </div>

              <div class="pm-tile" data-m="yoomoney" style="background:${selectedMethod === 'yoomoney' ? '#27282F' : '#24252A'};border:${selectedMethod === 'yoomoney' ? '1px solid #FDD911' : '1px solid rgba(255,255,255,0.06)'};border-radius:12px;padding:12px 8px;text-align:center;cursor:pointer;display:flex;flex-col;align-items:center;justify-content:center;flex-direction:column;min-height:76px;">
                <div style="font-weight:700;font-size:14px;color:#fff;">ЮMoney</div>
                <div style="font-size:10px;color:#8E8F94;margin-top:4px;">Кошелек</div>
              </div>

              <div class="pm-tile" data-m="crypto_rub" style="background:${selectedMethod === 'crypto_rub' ? '#27282F' : '#24252A'};border:${selectedMethod === 'crypto_rub' ? '1px solid #FDD911' : '1px solid rgba(255,255,255,0.06)'};border-radius:12px;padding:12px 8px;text-align:center;cursor:pointer;display:flex;flex-col;align-items:center;justify-content:center;flex-direction:column;min-height:76px;">
                <div style="font-weight:700;font-size:14px;color:#fff;">💎 Крипто</div>
                <div style="font-size:10px;color:#8E8F94;margin-top:4px;">USDT, TON</div>
              </div>
            `}
          </div>

          <!-- Extra Banner Tile (Card Logos Row) -->
          <div style="background:#24252A;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
            <div style="display:flex;align-items:center;gap:8px;font-size:11px;color:#8E8F94;">
              <span style="color:#3b82f6;font-weight:800;">VISA</span>
              <span style="color:#f79e1b;font-weight:800;">MC</span>
              <span>Pay</span>
              <span>GPay</span>
              <span style="color:#ea580c;font-weight:800;">Skrill</span>
            </div>
            <span style="font-size:12px;color:#3b82f6;">💳</span>
          </div>

          <!-- Amount Input Section -->
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span style="font-size:12px;color:#8E8F94;">Сумма пополнения</span>
            <div style="display:flex;gap:6px;">
              ${presets.map(p => `
                <button type="button" class="dep-preset-chip" data-amt="${p}" style="background:#202126;border:1px solid rgba(255,255,255,0.06);color:#8E8F94;border-radius:6px;padding:3px 8px;font-size:11px;font-weight:600;cursor:pointer;">${p} ${currSign}</button>
              `).join('')}
            </div>
          </div>

          <div style="position:relative;background:#141517;border:1px solid ${baseAmount > 0 && baseAmount < minAmount ? '#ef4444' : '#2B2C31'};border-radius:12px;padding:12px 16px;display:flex;align-items:center;">
            <span style="font-size:18px;font-weight:700;color:#8E8F94;">${currSign}</span>
            <input type="number" id="dep-custom-amount" value="${baseAmount > 0 ? baseAmount : ''}" placeholder="0" style="flex:1;background:transparent;border:none;color:#fff;font-size:18px;font-weight:700;outline:none;margin-left:8px;" />
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:11px;color:#ef4444;font-weight:600;">мин. ${minAmount} ${currSign}</span>
              <span style="font-size:11px;color:#8E8F94;">VAT 3%</span>
            </div>
          </div>

          <!-- Email & Promo Row -->
          <div style="display:flex;gap:8px;margin-top:10px;">
            <input type="email" id="dep-email-input" placeholder="Email *" value="${activeUser.email || ''}" style="flex:1;background:#141517;border:1px solid #2B2C31;border-radius:10px;padding:10px 14px;color:#fff;font-size:13px;outline:none;" />
            <div style="flex:1;position:relative;background:#141517;border:1px solid #2B2C31;border-radius:10px;display:flex;align-items:center;padding:0 4px 0 12px;">
              <span style="font-size:13px;margin-right:6px;">🎫</span>
              <input type="text" id="dep-promo-input" placeholder="Промокод" value="${promoCode}" style="flex:1;background:transparent;border:none;color:#fff;font-size:13px;outline:none;" />
              <button type="button" id="dep-apply-promo" style="background:#25262B;border:1px solid rgba(255,255,255,0.08);color:#8E8F94;border-radius:6px;padding:6px 10px;cursor:pointer;">✓</button>
            </div>
          </div>

          <!-- Action Button -->
          <button type="button" id="dep-pay-btn" style="margin-top:16px;width:100%;padding:14px;border-radius:12px;border:none;font-weight:800;font-size:14px;cursor:${baseAmount >= minAmount ? 'pointer' : 'default'};background:${baseAmount >= minAmount ? '#FDD911' : '#25262B'};color:${baseAmount >= minAmount ? '#17181C' : '#55575E'};display:flex;align-items:center;justify-content:center;gap:6px;transition:all 0.2s;">
            <span>Пополнить ${baseAmount >= minAmount ? baseAmount.toLocaleString() : '0'}</span>
            <span style="color:${baseAmount >= minAmount ? '#17181C' : '#FDD911'};">✪</span>
          </button>

          <!-- Footnote -->
          <div style="margin-top:14px;text-align:center;font-size:11px;color:#6C6D73;line-height:1.4;">
            Если после оплаты прошло более 30 минут, а баланс на сайте не пополнился, то напишите нам в техподдержку.
          </div>
        </div>
      `;

      // Event Listeners
      overlay.querySelector('#dep-close').onclick = (e) => {
        e.stopPropagation();
        overlay.remove();
      };

      overlay.querySelectorAll('.dep-tab-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          currentTab = btn.dataset.tab;
          renderView();
        };
      });

      overlay.querySelector('#dep-curr-toggle').onclick = (e) => {
        e.stopPropagation();
        currentCurrency = currentCurrency === 'UAH' ? 'RUB' : 'UAH';
        baseAmount = currentCurrency === 'UAH' ? 600 : 2500;
        selectedMethod = currentCurrency === 'UAH' ? 'card_rec' : 'sbp';
        renderView();
      };

      overlay.querySelectorAll('.pm-tile').forEach(tile => {
        tile.onclick = (e) => {
          e.stopPropagation();
          selectedMethod = tile.dataset.m;
          renderView();
        };
      });

      const amtInput = overlay.querySelector('#dep-custom-amount');
      amtInput.oninput = () => {
        const val = parseFloat(amtInput.value) || 0;
        baseAmount = val;
        updatePayBtnState();
      };

      overlay.querySelectorAll('.dep-preset-chip').forEach(chip => {
        chip.onclick = (e) => {
          e.stopPropagation();
          baseAmount = parseFloat(chip.dataset.amt);
          amtInput.value = baseAmount;
          updatePayBtnState();
        };
      });

      overlay.querySelector('#dep-apply-promo').onclick = (e) => {
        e.stopPropagation();
        const promoVal = overlay.querySelector('#dep-promo-input').value.trim();
        if (promoVal) {
          promoCode = promoVal;
          showToast('Промокод ' + promoVal + ' активирован!', 'success');
        }
      };

      function updatePayBtnState() {
        const payBtn = overlay.querySelector('#dep-pay-btn');
        if (baseAmount >= minAmount) {
          payBtn.style.background = '#FDD911';
          payBtn.style.color = '#17181C';
          payBtn.style.cursor = 'pointer';
          payBtn.innerHTML = `<span>Пополнить ${baseAmount.toLocaleString()}</span> <span style="color:#17181C;">✪</span>`;
        } else {
          payBtn.style.background = '#25262B';
          payBtn.style.color = '#55575E';
          payBtn.style.cursor = 'default';
          payBtn.innerHTML = `<span>Пополнить 0</span> <span style="color:#FDD911;">✪</span>`;
        }
      }

      overlay.querySelector('#dep-pay-btn').onclick = (e) => {
        e.stopPropagation();
        if (baseAmount < minAmount) {
          showToast('Минимальная сумма пополнения: ' + minAmount + ' ' + currSign, 'error');
          return;
        }

        const emailVal = overlay.querySelector('#dep-email-input').value.trim();
        if (emailVal && (!activeUser.email || activeUser.email !== emailVal)) {
          LocalDB.setEmail(activeUser.username, emailVal);
        }

        // Random duration between 5 and 10 seconds (reduced as requested)
        const durationSec = Math.floor(Math.random() * (10 - 5 + 1)) + 5;
        startProcessingPayment(baseAmount, currSign, durationSec);
      };
    }

    function startProcessingPayment(amountToCredit, currSign, totalSeconds) {
      const orderId = 'TX-' + Math.floor(100000 + Math.random() * 900000);
      let secondsLeft = totalSeconds;

      overlay.innerHTML = `
        <div style="position:relative;width:100%;max-width:480px;background:#18191D;border:1px solid rgba(255,255,255,0.08);border-radius:24px;box-shadow:0 24px 60px rgba(0,0,0,0.7);padding:36px;color:#fff;text-align:center;">
          <!-- Header -->
          <div style="margin-bottom:24px;">
            <div style="font-size:12px;color:#8E8F94;font-family:monospace;letter-spacing:1px;margin-bottom:4px;">ТРАНЗАКЦИЯ #${orderId}</div>
            <div style="font-size:14px;color:#fff;font-weight:600;">Безопасный процессинг платежа</div>
          </div>

          <!-- Animated Ring & Countdown -->
          <div style="position:relative;width:120px;height:120px;margin:0 auto 24px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;inset:0;border:4px solid rgba(255,255,255,0.08);border-top:4px solid #FDD911;border-radius:50%;animation:upSpin 1s linear infinite;"></div>
            <div id="dep-countdown-text" style="font-family:Tektur,sans-serif;font-size:32px;font-weight:800;color:#FDD911;">${secondsLeft}s</div>
          </div>
          <style>@keyframes upSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>

          <!-- Amount -->
          <div style="font-size:28px;font-weight:800;color:#fff;margin-bottom:6px;">+${amountToCredit.toLocaleString()} ${currSign}</div>
          <div style="font-size:13px;color:#8E8F94;margin-bottom:24px;">Сумма к зачислению на баланс</div>

          <!-- Progress Bar -->
          <div style="width:100%;background:#131417;border-radius:10px;height:8px;overflow:hidden;margin-bottom:16px;border:1px solid rgba(255,255,255,0.06);">
            <div id="dep-progress-bar" style="width:0%;height:100%;background:linear-gradient(90deg, #FDD911, #ff9900);transition:width 1s linear;"></div>
          </div>

          <!-- Dynamic Status Message -->
          <div id="dep-status-msg" style="min-height:38px;font-size:13px;font-weight:600;color:#FDD911;display:flex;align-items:center;justify-content:center;gap:6px;">
            <span>🌐</span>
            <span>Инициализация защищенной платежной сессии...</span>
          </div>

          <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);display:flex;justify-content:center;">
            <button type="button" id="dep-cancel-btn" style="background:none;border:none;color:#8E8F94;font-size:13px;cursor:pointer;text-decoration:underline;">Отменить платеж</button>
          </div>
        </div>
      `;

      const progressBar = overlay.querySelector('#dep-progress-bar');
      const countdownText = overlay.querySelector('#dep-countdown-text');
      const statusMsg = overlay.querySelector('#dep-status-msg');

      const interval = setInterval(() => {
        secondsLeft--;
        const elapsed = totalSeconds - secondsLeft;
        const pct = Math.min(100, Math.round((elapsed / totalSeconds) * 100));

        if (progressBar) progressBar.style.width = pct + '%';
        if (countdownText) countdownText.textContent = secondsLeft + 's';

        // Stage transitions across the random totalSeconds duration
        if (statusMsg) {
          const ratio = secondsLeft / totalSeconds;
          if (ratio > 0.75) {
            statusMsg.innerHTML = '<span>🌐</span><span>Инициализация защищенной платежной сессии...</span>';
          } else if (ratio > 0.45) {
            statusMsg.innerHTML = '<span>💳</span><span>Связь с банком и ожидание подтверждения транзакции...</span>';
          } else if (ratio > 0.20) {
            statusMsg.innerHTML = '<span>⚙️</span><span>Верификация платежа в процессинговом центре...</span>';
          } else if (ratio > 0.05) {
            statusMsg.innerHTML = '<span>🔐</span><span>Финальное подтверждение поступления средств...</span>';
          } else {
            statusMsg.innerHTML = '<span>✅</span><span>Платеж подтвержден! Зачисление средств...</span>';
          }
        }

        if (secondsLeft <= 0) {
          clearInterval(interval);
          finishPaymentSuccess(amountToCredit, currSign, orderId);
        }
      }, 1000);

      overlay.querySelector('#dep-cancel-btn').onclick = (e) => {
        e.stopPropagation();
        clearInterval(interval);
        overlay.remove();
        showToast('Платеж отменен пользователем', 'info');
      };
    }

    function finishPaymentSuccess(amountToCredit, currSign, orderId) {
      // Update balance in LocalDB
      const newBal = LocalDB.updateBalance(activeUser.username, amountToCredit, true);

      overlay.innerHTML = `
        <div style="position:relative;width:100%;max-width:480px;background:#18191D;border:1px solid rgba(34,197,94,0.4);border-radius:24px;box-shadow:0 24px 60px rgba(0,0,0,0.7), 0 0 40px rgba(34,197,94,0.2);padding:36px;color:#fff;text-align:center;">
          <!-- Success Icon -->
          <div style="width:72px;height:72px;background:rgba(34,197,94,0.15);border:2px solid #22c55e;border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;color:#22c55e;font-size:36px;box-shadow:0 0 30px rgba(34,197,94,0.3);">
            ✓
          </div>

          <h2 style="font-family:Tektur,sans-serif;font-size:22px;margin:0 0 6px;color:#fff;font-weight:700;">Оплата успешно завершена!</h2>
          <div style="font-size:13px;color:#8E8F94;margin-bottom:20px;">Квитанция #${orderId}</div>

          <div style="background:#131417;border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:16px 20px;margin-bottom:24px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;color:#8E8F94;">
              <span>Зачислено на баланс:</span>
              <span style="color:#22c55e;font-weight:700;font-size:16px;">+${amountToCredit.toLocaleString()} ${currSign}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:13px;color:#8E8F94;">
              <span>Текущий баланс:</span>
              <span style="color:#FDD911;font-weight:700;font-size:15px;">${newBal.toLocaleString()} ₽</span>
            </div>
          </div>

          <button type="button" id="dep-done-btn" style="width:100%;background:#FDD911;color:#17181C;border:none;border-radius:12px;padding:14px;font-weight:800;font-size:14px;cursor:pointer;">
            Вернуться на сайт
          </button>
        </div>
      `;

      showToast('Баланс успешно пополнен на +' + amountToCredit.toLocaleString() + ' ' + currSign, 'success');

      overlay.querySelector('#dep-done-btn').onclick = (e) => {
        e.stopPropagation();
        overlay.remove();
      };

      setTimeout(() => {
        if (document.body.contains(overlay)) {
          overlay.remove();
        }
      }, 3500);
    }

    document.body.appendChild(overlay);
    renderView();
  }

  // 13. HOOK INTO SITE BUTTONS
  function setupDomHooks() {
    if (typeof window !== 'undefined' && window.location && window.location.pathname.endsWith('/admin')) {
      window.location.href = '/admin.html';
      return;
    }

    document.addEventListener('click', (e) => {
      const target = e.target;
      if (!target) return;

      // DO NOT INTERCEPT CLICKS INSIDE OUR MODALS!
      if (target.closest('#upgrader-auth-modal') || target.closest('#upgrader-deposit-modal') || target.closest('#upgrader-email-modal') || target.closest('#upgrader-profile-edit-modal') || target.closest('#upgrader-withdrawal-modal')) {
        return;
      }

      // Email Binding Trigger in profile
      const isEmailBindBtn = target.closest('[data-testid="email-linking-block"] button') ||
                             target.closest('[data-testid="email-linking-button"]') ||
                             (target.closest('up-email-linking') && target.closest('button'));

      if (isEmailBindBtn) {
        e.preventDefault();
        e.stopPropagation();
        renderEmailBindModal();
        return;
      }

      // Profile Edit Triggers (gear settings button in profile only)
      const isProfileEditTrigger = target.closest('[data-testid="user-info-settings-button"]') ||
                                   (target.closest('up-user-info') && target.closest('svg') && target.closest('button'));

      if (isProfileEditTrigger) {
        e.preventDefault();
        e.stopPropagation();
        renderProfileEditModal();
        return;
      }

      // Catch clicks on Deposit/Top-up button across ALL pages and languages (header, profile, upgrader page, popups)
      const isTopUpBtn = target.closest('[data-testid*="topup"]') ||
                         target.closest('[data-testid*="top-up"]') ||
                         target.closest('[data-testid*="deposit"]') ||
                         target.closest('up-top-up-dropdown') ||
                         target.closest('up-top-up-low-balance') ||
                         target.closest('#btnDeposit') ||
                         (target.closest('button') && (
                           target.closest('button').innerText.toLowerCase().includes('top up') ||
                           target.closest('button').innerText.toLowerCase().includes('topup') ||
                           target.closest('button').innerText.toLowerCase().includes('пополн') ||
                           target.closest('button').innerText.toLowerCase().includes('deposit')
                         ));
      if (isTopUpBtn) {
        e.preventDefault();
        e.stopPropagation();
        renderDepositModal();
        return;
      }

      // Header Profile Navigation: clicking avatar in header goes to profile!
      const isHeaderAvatar = target.closest('up-avatar-with-placeholder') ||
                             (target.closest('up-profile-info') && target.closest('button') && !target.closest('[data-testid*="topup"]') && !target.closest('[data-testid*="top-up"]'));
      if (isHeaderAvatar) {
        return;
      }

      // Catch clicks on item withdraw button in profile: in-place withdrawal without fullscreen modal!
      const withdrawBtn = target.closest('[data-testid*="profile-items-table-withdraw-"]') ||
                          target.closest('[data-testid*="item-card-withdraw"]');
      if (withdrawBtn) {
        e.preventDefault();
        e.stopPropagation();
        const testId = withdrawBtn.getAttribute('data-testid') || '';
        const itemId = testId.replace('profile-items-table-withdraw-', '').replace('item-card-withdraw-', '').trim();
        const activeUser = LocalDB.getActiveUser();
        if (activeUser && itemId) {
          const item = (activeUser.inventory || []).find(x => String(x.id) === String(itemId) || String(x.originalSkinId) === String(itemId));
          if (item) {
            if (LocalDB.isItemWithdrawing(activeUser.username, item.id)) {
              showToast('Этот скин уже находится в процессе вывода в Steam', 'info');
              return;
            }
            LocalDB.startWithdrawal(activeUser.username, item);
            const isEn = (localStorage.getItem('lang') === 'en') || document.documentElement.lang === 'en' || (window.location && window.location.pathname.startsWith('/en'));
            showToast(isEn ? 'Withdrawal request sent' : 'Запрос на вывод отправлен', 'success');
            syncWithdrawingCards();
          }
        }
        return;
      }

      // Catch clicks on push notifications switch toggle in profile
      const pushToggle = target.closest('[data-testid="push-switch-toggle"]') || target.closest('up-push-switch up-toggle');
      if (pushToggle) {
        e.preventDefault();
        e.stopPropagation();
        const toggleTrack = pushToggle.querySelector('[role="switch"]') || pushToggle;
        const toggleThumb = toggleTrack.querySelector('div');
        const isChecked = toggleTrack.getAttribute('aria-checked') === 'true';
        const newChecked = !isChecked;

        toggleTrack.setAttribute('aria-checked', newChecked ? 'true' : 'false');
        if (newChecked) {
          toggleTrack.classList.remove('bg-[#FFFFFF1A]');
          toggleTrack.classList.add('bg-[#FDD911]');
          if (toggleThumb) {
            toggleThumb.classList.remove('translate-x-0', 'bg-[#FFFFFF]', 'opacity-50');
            toggleThumb.classList.add('translate-x-[1rem]', 'bg-[#17181D]', 'opacity-100');
          }
        } else {
          toggleTrack.classList.remove('bg-[#FDD911]');
          toggleTrack.classList.add('bg-[#FFFFFF1A]');
          if (toggleThumb) {
            toggleThumb.classList.remove('translate-x-[1rem]', 'bg-[#17181D]', 'opacity-100');
            toggleThumb.classList.add('translate-x-0', 'bg-[#FFFFFF]', 'opacity-50');
          }
        }
        try {
          localStorage.setItem('upgrader_push_notifications', newChecked ? 'true' : 'false');
        } catch(e) {}
        const isEn = (localStorage.getItem('lang') === 'en') || document.documentElement.lang === 'en';
        showToast(newChecked 
          ? (isEn ? 'Push notifications enabled' : 'Пуш-уведомления включены')
          : (isEn ? 'Push notifications disabled' : 'Пуш-уведомления отключены'), 
          'info'
        );
        return;
      }

      // Catch clicks on individual sell button in profile: prevent if withdrawing
      const sellBtn = target.closest('[data-testid*="profile-items-table-sell-"]');
      if (sellBtn) {
        const testId = sellBtn.getAttribute('data-testid') || '';
        const itemId = testId.replace('profile-items-table-sell-', '').trim();
        const activeUser = LocalDB.getActiveUser();
        if (activeUser && LocalDB.isItemWithdrawing(activeUser.username, itemId)) {
          e.preventDefault();
          e.stopPropagation();
          showToast('Этот скин находится на выводе в Steam и не может быть продан', 'error');
          return;
        }
      }

      // Catch clicks on Steam login buttons or login triggers
      const isLoginBtn = target.closest('[data-testid*="steam-login"]') ||
                         target.closest('[data-testid*="login"]') ||
                         target.closest('up-login-button') ||
                         (target.textContent && (target.textContent.includes('Войти через Steam') || target.textContent.trim() === 'Войти'));

      if (isLoginBtn) {
        e.preventDefault();
        e.stopPropagation();
        renderAuthModal();
        return;
      }
    }, true);

    // Watch for modal appearance to handle them properly
    const observer = new MutationObserver(() => {
      // 1. Proactively dismiss terms of service modal if it ever mounts
      const termsModal = document.querySelector('up-terms-modal, [class*="terms-modal"]');
      if (termsModal) {
        termsModal.remove();
        const backdrop = document.querySelector('.cdk-overlay-backdrop');
        if (backdrop) backdrop.remove();
      }

      // 2. Proactively dismiss cookie consent banner if present
      const cookieBanner = document.querySelector('up-cookie-banner, [class*="cookie"]');
      if (cookieBanner && cookieBanner.textContent && cookieBanner.textContent.includes('cookie')) {
        cookieBanner.remove();
      }

      // 3. Keep Angular's default steam modal hidden; we provide custom modal on user click
      const steamModal = document.querySelector('up-login-modal');
      if (steamModal) {
        steamModal.style.display = 'none';
      }

      // 4. Proactively dismiss Angular's native fullscreen withdrawal warning or trade url modals
      const withdrawModal = document.querySelector('up-withdrawal-modal, up-withdrawal-warning-modal, up-trade-url-modal, #upgrader-withdrawal-modal');
      if (withdrawModal) {
        withdrawModal.remove();
        const backdrop = document.querySelector('.cdk-overlay-backdrop');
        if (backdrop) backdrop.remove();
      }

      // 5. Ensure push notifications switch is visible and synced
      syncPushSwitchState();
    });

    function syncPushSwitchState() {
      const pushSwitch = document.querySelector('up-push-switch');
      if (!pushSwitch) return;
      pushSwitch.classList.remove('opacity-0', 'pointer-events-none', 'hidden');
      pushSwitch.style.display = 'block';
      pushSwitch.style.opacity = '1';
      pushSwitch.style.pointerEvents = 'auto';

      const pushToggle = pushSwitch.querySelector('[data-testid="push-switch-toggle"]');
      if (!pushToggle) return;
      const isEnabled = localStorage.getItem('upgrader_push_notifications') === 'true';
      const toggleTrack = pushToggle.getAttribute('role') === 'switch' ? pushToggle : pushToggle.querySelector('[role="switch"]');
      if (!toggleTrack) return;
      const toggleThumb = toggleTrack.querySelector('div');
      const currentChecked = toggleTrack.getAttribute('aria-checked') === 'true';
      if (currentChecked !== isEnabled) {
        toggleTrack.setAttribute('aria-checked', isEnabled ? 'true' : 'false');
        if (isEnabled) {
          toggleTrack.classList.remove('bg-[#FFFFFF1A]');
          toggleTrack.classList.add('bg-[#FDD911]');
          if (toggleThumb) {
            toggleThumb.classList.remove('translate-x-0', 'bg-[#FFFFFF]', 'opacity-50');
            toggleThumb.classList.add('translate-x-[1rem]', 'bg-[#17181D]', 'opacity-100');
          }
        } else {
          toggleTrack.classList.remove('bg-[#FDD911]');
          toggleTrack.classList.add('bg-[#FFFFFF1A]');
          if (toggleThumb) {
            toggleThumb.classList.remove('translate-x-[1rem]', 'bg-[#17181D]', 'opacity-100');
            toggleThumb.classList.add('translate-x-0', 'bg-[#FFFFFF]', 'opacity-50');
          }
        }
      }
    }

    observer.observe(document.documentElement, { childList: true, subtree: true });
    setInterval(() => {
      syncEmailLinkingCard();
      syncWithdrawingCards();
      syncPushSwitchState();
    }, 1000);
  }

  // Ensure active user exists and is initialized
  LocalDB.getActiveUser();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupDomHooks);
  } else {
    setupDomHooks();
  }

  window.UPGRADER = {
    LocalDB,
    GlobalStats,
    renderAuthModal,
    renderDepositModal,
    renderEmailBindModal,
    renderProfileEditModal,
    renderCompensationCaseModal,
    syncWithdrawingCards,
    showToast,
    getActiveUser: () => LocalDB.getActiveUser(),
    updateAccountAdmin: (id, updates) => LocalDB.updateAccountAdmin(id, updates),
    resetBestDrop: (id) => LocalDB.resetBestDrop(id)
  };
})();
