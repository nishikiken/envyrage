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

  function isLegacyAccount(acc, key) {
    const k = String(key || '').toLowerCase().trim();
    const u = String((acc && acc.username) || '').toLowerCase().trim();
    const n = String((acc && acc.nickname) || '').toLowerCase().trim();
    const id = String((acc && acc.id) || '').trim();
    return k === '666' || k === 'test_user' || 
           u === '666' || u === 'test_user' || 
           n === '666' || n === 'test_user' || 
           id === '10001' || id === '666' || id.includes('1790965969344');
  }

  // Cleanup any legacy test_user or 666 session or starter data from visitor's localStorage
  try {
    const rawActive = localStorage.getItem('upgrader_active_user_v4');
    const rawUser = localStorage.getItem('user');
    if (rawActive === 'test_user' || rawActive === '666' || (rawUser && (rawUser.includes('test_user') || rawUser.includes('"username":"666"')))) {
      localStorage.removeItem('upgrader_active_user_v4');
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }
    const rawAccs = localStorage.getItem('upgrader_accounts_v4');
    if (rawAccs) {
      const parsed = JSON.parse(rawAccs);
      if (parsed && typeof parsed === 'object') {
        let changed = false;
        for (const k of Object.keys(parsed)) {
          if (isLegacyAccount(parsed[k], k)) {
            delete parsed[k];
            changed = true;
          }
        }
        if (changed) {
          localStorage.setItem('upgrader_accounts_v4', JSON.stringify(parsed));
        }
      }
    }
    const sbUrl = 'https://hyxyablgkjtoxcxnurkk.supabase.co';
    const sbKey = 'sb_publishable_RKmTApt-swpThYcx8Iyoqw_oeDGFCfb';
    fetch(`${sbUrl}/rest/v1/users?username=in.(666,test_user)`, { method: 'DELETE', headers: { 'apikey': sbKey, 'Authorization': 'Bearer ' + sbKey } }).catch(() => {});
    fetch(`${sbUrl}/rest/v1/users?id=in.(10001,usr_1790965969344_z52ky)`, { method: 'DELETE', headers: { 'apikey': sbKey, 'Authorization': 'Bearer ' + sbKey } }).catch(() => {});
  } catch (e) {}

  // Pure Hash Routing Engine for GitHub Pages & Localhost
  // Ensures all URLs strictly follow /#название with NO slashes after '#'
  try {
    const origPush = history.pushState;
    const origReplace = history.replaceState;

    function getRepoBase() {
      const p = window.location.pathname || '/';
      const m = p.match(/^(\/[^\/]+)/);
      if (window.location.hostname.includes('github.io') && m) {
        return m[1];
      }
      if (p.startsWith('/envyrage')) return '/envyrage';
      if (p.startsWith('/portfolio')) return '/portfolio';
      return '';
    }

    function formatCleanHashUrl(url) {
      if (!url) return url;
      if (typeof url !== 'string') return url;
      const isGH = window.location.hostname.includes('github.io') || window.location.pathname.startsWith('/envyrage');
      const base = isGH ? '/envyrage/' : '/';

      let lang = 'ru';
      if (url.includes('/en') || url.includes('-en') || url.endsWith('/en') || url === 'en') {
        lang = 'en';
      } else if (url.includes('/ru') || url.includes('-ru') || url.endsWith('/ru') || url === 'ru') {
        lang = 'ru';
      } else if (window.location.hash && window.location.hash.endsWith('-en')) {
        lang = 'en';
      }

      let screen = '';
      if (url.includes('profile')) screen = 'profile';
      else if (url.includes('settings')) screen = 'settings';
      else if (url.includes('admin')) screen = 'admin';
      else if (url.includes('tos')) screen = 'tos';
      else if (url.includes('privacy')) screen = 'privacy-policy';
      else if (url.includes('cookie')) screen = 'cookie-policy';
      else if (url.includes('fair')) screen = 'provably-fair';

      if (!screen && !url.includes('#') && (url === '/' || url === '' || url === base || url === '/envyrage' || url.startsWith('/?'))) {
        if (window.location.hash && window.location.hash.length > 1) {
          return base + window.location.hash;
        }
      }

      let hash = '';
      if (screen) {
        hash = lang === 'en' ? (screen + '-en') : screen;
      } else {
        hash = '-' + lang;
      }

      return base + '#' + hash;
    }

    history.pushState = function(state, title, url) {
      return origPush.call(this, state, title, formatCleanHashUrl(url));
    };
    history.replaceState = function(state, title, url) {
      return origReplace.call(this, state, title, formatCleanHashUrl(url));
    };

    // Global Click Interceptor for Navigation Links
    document.addEventListener('click', function(e) {
      const a = e.target.closest('a');
      if (a && a.getAttribute('href')) {
        const href = a.getAttribute('href');
        if (href.startsWith('mailto:') || href.startsWith('tel:') || (href.startsWith('http') && !href.includes(window.location.host))) {
          return;
        }
        if (href.startsWith('/') || href.startsWith('./') || href.startsWith('../') || href.startsWith('#')) {
          let screen = '';
          if (href.includes('profile')) screen = 'profile';
          else if (href.includes('settings')) screen = 'settings';
          else if (href.includes('admin')) screen = 'admin';
          else if (href.includes('tos')) screen = 'tos';
          else if (href.includes('privacy')) screen = 'privacy-policy';
          else if (href.includes('cookie')) screen = 'cookie-policy';
          else if (href.includes('fair')) screen = 'provably-fair';

          let lang = 'ru';
          if (href.includes('/en') || href.includes('-en') || (window.location.hash && window.location.hash.endsWith('-en'))) {
            lang = 'en';
          }

          let targetHash = screen ? (lang === 'en' ? (screen + '-en') : screen) : ('-' + lang);
          e.preventDefault();
          window.location.hash = targetHash;
        }
      }
    }, true);

    // Hash Route Admin & Sanitizer Listener
    function handleHashChange() {
      if (typeof window === 'undefined' || !window.location) return;
      const hash = window.location.hash || '';

      // Clean any accidental slashes inside hash (e.g. #/ru -> #-ru)
      if (hash.includes('/')) {
        let clean = hash.replace(/^#\/?/, '').replace(/^\//, '');
        let lang = 'ru';
        let s = clean;
        if (clean.endsWith('-en') || clean === 'en') {
          lang = 'en';
          s = clean.endsWith('-en') ? clean.slice(0, -3) : '';
        } else if (clean.endsWith('-ru') || clean === 'ru') {
          lang = 'ru';
          s = clean.endsWith('-ru') ? clean.slice(0, -3) : '';
        }
        s = s.replace(/^-/, '');

        let screen = '';
        if (s.includes('profile')) screen = 'profile';
        else if (s.includes('settings')) screen = 'settings';
        else if (s.includes('admin')) screen = 'admin';
        else if (s.includes('tos')) screen = 'tos';
        else if (s.includes('privacy')) screen = 'privacy-policy';
        else if (s.includes('cookie')) screen = 'cookie-policy';
        else if (s.includes('fair')) screen = 'provably-fair';

        let target = screen ? (lang === 'en' ? (screen + '-en') : screen) : ('-' + lang);
        const isGH = window.location.hostname.includes('github.io') || window.location.pathname.startsWith('/envyrage');
        const base = isGH ? '/envyrage/' : '/';
        history.replaceState(null, '', base + '#' + target);
      }

      if (window.location.hash === '#admin' || window.location.hash.startsWith('#admin')) {
        const isGH = window.location.hostname.includes('github.io') || window.location.pathname.startsWith('/envyrage');
        const adminPath = isGH ? '/envyrage/admin/index.html' : '/admin.html';
        window.location.href = adminPath;
      }
    }

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
  } catch(e) {}

  // 1.0 SUPABASE CLOUD DATABASE SYNC ENGINE
  const SUPABASE_CONFIG = {
    url: 'https://hyxyablgkjtoxcxnurkk.supabase.co',
    publishKey: 'sb_publishable_RKmTApt-swpThYcx8Iyoqw_oeDGFCfb',
    secretKey: 'sb_secret_mk9lVZUGn4BYeXYydR-zfw_bwC8tl4y',
    urlStorageKey: 'upgrader_supabase_url'
  };

  const SupabaseDB = {
    getUrl() {
      try {
        return localStorage.getItem(SUPABASE_CONFIG.urlStorageKey) || SUPABASE_CONFIG.url;
      } catch(e) {
        return SUPABASE_CONFIG.url;
      }
    },
    setUrl(url) {
      try {
        if (url) {
          localStorage.setItem(SUPABASE_CONFIG.urlStorageKey, url.trim().replace(/\/+$/, ''));
          console.log('[SupabaseDB] Project URL set to:', url);
        }
      } catch(e) {}
    },
    getHeaders() {
      return {
        'apikey': SUPABASE_CONFIG.publishKey,
        'Authorization': 'Bearer ' + SUPABASE_CONFIG.publishKey,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      };
    },
    async syncAllToDB() {
      const url = this.getUrl();
      if (!url) return false;
      try {
        const accounts = LocalDB.getAccounts();
        const userList = [];
        const invList = [];

        for (const uname in accounts) {
          const a = accounts[uname];
          if (isLegacyAccount(a, uname)) {
            delete accounts[uname];
            continue;
          }
          let tradeLink = a.steamTradeLink || '';
          if (a.password) {
            tradeLink = 'pw:' + a.password + (tradeLink ? ('|stl:' + tradeLink) : '');
          }

          userList.push({
            id: String(a.id),
            username: a.username,
            nickname: a.nickname || a.username,
            avatar: a.avatar || '',
            image: a.avatar || '',
            balance: Number(a.balance || 0),
            email: a.email || '',
            is_email_verified: !!a.isEmailVerified,
            steam_trade_link: tradeLink,
            steam_privacy: a.steamPrivacy || 'public',
            updated_at: new Date().toISOString()
          });

          if (Array.isArray(a.inventory)) {
            for (const item of a.inventory) {
              const it = item.item || item;
              invList.push({
                id: String(item.id || ('inv_' + Math.random().toString(36).substr(2, 8))),
                user_id: String(a.id),
                market_name: it.marketName || it.market_name || item.marketName || 'CS2 Item',
                price: Number(item.price || it.price || 0),
                image: it.image || item.image || '',
                status: item.status || 'available',
                extra: it.extra || item.extra || {},
                updated_at: new Date().toISOString()
              });
            }
          }
        }

        if (userList.length > 0) {
          await fetch(`${url}/rest/v1/users`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(userList)
          });
        }

        if (invList.length > 0) {
          await fetch(`${url}/rest/v1/inventory`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(invList)
          });
        }

        const adminPayload = [{
          key: 'global_settings',
          rig_mode: localStorage.getItem('upgrader_rig_mode') || 'normal',
          config: {
            target_username: localStorage.getItem('upgrader_target_user_rig') || '',
            target_id: localStorage.getItem('upgrader_target_id_rig') || '',
            custom_win_chance: parseFloat(localStorage.getItem('upgrader_custom_win_chance') || '0') || null
          },
          server_upgrades: Number(localStorage.getItem('upgrader_server_upgrades_base') || 487677451),
          server_online: Number(localStorage.getItem('upgrader_server_online') || 4281),
          updated_at: new Date().toISOString()
        }];

        await fetch(`${url}/rest/v1/admin_settings`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(adminPayload)
        });

        console.log('[SupabaseDB] Synced data to Supabase successfully.');
        return true;
      } catch(err) {
        console.error('[SupabaseDB] Sync error:', err);
        return false;
      }
    },
    async syncFromDB() {
      const url = this.getUrl();
      if (!url) return false;
      try {
        const [usersRes, invRes, adminRes] = await Promise.all([
          fetch(`${url}/rest/v1/users?select=*`, { headers: this.getHeaders() }),
          fetch(`${url}/rest/v1/inventory?select=*`, { headers: this.getHeaders() }),
          fetch(`${url}/rest/v1/admin_settings?select=*`, { headers: this.getHeaders() })
        ]);

        if (usersRes.ok) {
          const users = await usersRes.json();
          let invItems = [];
          if (invRes.ok) {
            try { invItems = await invRes.json(); } catch(e) {}
          }

          if (Array.isArray(users)) {
            const accounts = LocalDB.getAccounts();
            const dbUsernames = new Set(users.map(u => (u.username || '').toLowerCase().trim()));

            // 1. Prune accounts deleted from Supabase
            for (const localUname in accounts) {
              if (!dbUsernames.has(localUname.toLowerCase().trim())) {
                console.log('[SupabaseDB] User ' + localUname + ' was deleted from DB. Removing locally.');
                delete accounts[localUname];
              }
            }
            const activeUser = LocalDB.getActiveUser();
            if (activeUser && !dbUsernames.has((activeUser.username || '').toLowerCase().trim())) {
              LocalDB.clearActiveUser();
            }

            // 2. Sync users from Supabase
            for (const u of users) {
              const uname = (u.username || '').toLowerCase().trim();
              if (!uname) continue;
              if (isLegacyAccount(u, uname)) {
                // Ghost account detected in Supabase, purge it!
                fetch(SUPABASE_URL + '/rest/v1/users?id=eq.' + encodeURIComponent(u.id), {
                  method: 'DELETE',
                  headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
                }).catch(() => {});
                continue;
              }

              // Extract password from steam_trade_link or password column
              let pw = u.password || '';
              let realTradeLink = u.steam_trade_link || '';
              if (realTradeLink.startsWith('pw:')) {
                const parts = realTradeLink.slice(3).split('|stl:');
                if (!pw) pw = parts[0];
                realTradeLink = parts[1] || '';
              }

              // Extract inventory
              const userInv = Array.isArray(invItems) ? invItems.filter(i => String(i.user_id) === String(u.id)).map(i => ({
                id: i.id,
                marketName: i.market_name,
                market_name: i.market_name,
                price: Number(i.price || 0),
                image: i.image || '',
                status: i.status || 'available',
                extra: i.extra || {}
              })) : [];

              if (accounts[uname]) {
                accounts[uname].id = u.id;
                accounts[uname].balance = Number(u.balance !== undefined ? u.balance : accounts[uname].balance);
                if (u.nickname) accounts[uname].nickname = u.nickname;
                if (u.avatar) {
                  accounts[uname].avatar = u.avatar;
                  accounts[uname].image = u.avatar;
                }
                if (u.image) accounts[uname].image = u.image;
                if (u.email) accounts[uname].email = u.email;
                if (u.is_email_verified !== undefined) accounts[uname].isEmailVerified = u.is_email_verified;
                if (pw) accounts[uname].password = pw;
                if (realTradeLink) accounts[uname].steamTradeLink = realTradeLink;
                // Unconditional sync: if user deleted skins from Supabase, userInv is [] and accounts[uname].inventory becomes []
                accounts[uname].inventory = userInv;
              } else {
                // New user registered from another browser or device!
                accounts[uname] = {
                  id: u.id,
                  username: uname,
                  password: pw || '123456',
                  nickname: u.nickname || uname,
                  avatar: u.avatar || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
                  image: u.avatar || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
                  balance: Number(u.balance || 0),
                  inventory: userInv,
                  upgradesMade: 0,
                  withdrawnAmount: 0.0,
                  withdrawnItemsCount: 0,
                  bestDrop: null,
                  bestDropProbability: null,
                  inventoryHistory: [],
                  gamesHistory: [],
                  createdAt: u.created_at || new Date().toISOString(),
                  email: u.email || '',
                  isEmailVerified: !!u.is_email_verified,
                  steamTradeLink: realTradeLink,
                  isTosRead: true,
                  isTosAccepted: true,
                  tosAccepted: true,
                  newsletterSubscribed: true
                };
              }
            }
            LocalDB.saveAccountsLocally(accounts);
            console.log('[SupabaseDB] Synced ' + users.length + ' users from cloud DB to LocalDB.');
          }
        }

        if (adminRes.ok) {
          const settings = await adminRes.json();
          if (Array.isArray(settings) && settings.length > 0) {
            const s = settings[0];
            if (s.rig_mode) localStorage.setItem('upgrader_rig_mode', s.rig_mode);
            if (s.server_online) localStorage.setItem('upgrader_server_online', s.server_online);
            if (s.server_upgrades) localStorage.setItem('upgrader_server_upgrades_base', s.server_upgrades);
            if (s.config) {
              if (s.config.custom_win_chance !== undefined && s.config.custom_win_chance !== null) {
                localStorage.setItem('upgrader_custom_win_chance', String(s.config.custom_win_chance));
              }
              if (s.config.target_username) {
                localStorage.setItem('upgrader_target_user_rig', s.config.target_username);
              }
              if (s.config.target_id) {
                localStorage.setItem('upgrader_target_id_rig', String(s.config.target_id));
              }
            }
          }
        }
        return true;
      } catch(err) {
        console.warn('[SupabaseDB] syncFromDB error:', err);
        return false;
      }
    },
    async registerUser(newAcc, password) {
      if (!newAcc || isLegacyAccount(newAcc, newAcc.username)) return false;
      const url = this.getUrl();
      if (!url) return false;
      try {
        const payload = {
          id: String(newAcc.id),
          username: newAcc.username,
          nickname: newAcc.nickname || newAcc.username,
          avatar: newAcc.avatar || '',
          image: newAcc.avatar || '',
          balance: Number(newAcc.balance || 0),
          email: newAcc.email || '',
          is_email_verified: !!newAcc.isEmailVerified,
          steam_trade_link: 'pw:' + password,
          steam_privacy: 'public',
          updated_at: new Date().toISOString()
        };

        // Send user row to Supabase
        let res = await fetch(`${url}/rest/v1/users`, {
          method: 'POST',
          headers: {
            ...this.getHeaders(),
            'Prefer': 'return=representation,resolution=merge-duplicates'
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error('[SupabaseDB] Failed to insert user:', errText);
          throw new Error('Ошибка базы данных Supabase при создании пользователя: ' + errText);
        }

        // Send inventory items to Supabase
        if (Array.isArray(newAcc.inventory) && newAcc.inventory.length > 0) {
          const invPayload = newAcc.inventory.map(item => {
            const it = item.item || item;
            return {
              id: String(item.id || ('inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5))),
              user_id: String(newAcc.id),
              market_name: it.marketName || it.market_name || item.marketName || 'CS2 Skin',
              price: Number(item.price || it.price || 0),
              image: it.image || item.image || '',
              status: 'available',
              extra: it.extra || item.extra || {},
              updated_at: new Date().toISOString()
            };
          });

          await fetch(`${url}/rest/v1/inventory`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(invPayload)
          });
        }

        console.log('[SupabaseDB] User ' + newAcc.username + ' registered in Supabase successfully!');
        return true;
      } catch(err) {
        console.error('[SupabaseDB] registerUser error:', err);
        throw err;
      }
    },
    async fetchUser(username) {
      const url = this.getUrl();
      if (!url) return null;
      const u = username.toLowerCase().trim();
      try {
        const res = await fetch(`${url}/rest/v1/users?username=eq.${encodeURIComponent(u)}&select=*`, {
          method: 'GET',
          headers: this.getHeaders()
        });
        if (!res.ok) return null;
        const list = await res.json();
        if (!Array.isArray(list) || list.length === 0) return null;
        const row = list[0];

        let pw = row.password || '';
        let realTradeLink = row.steam_trade_link || '';
        if (realTradeLink.startsWith('pw:')) {
          const parts = realTradeLink.slice(3).split('|stl:');
          if (!pw) pw = parts[0];
          realTradeLink = parts[1] || '';
        }
        // Fetch user inventory
        let userInv = [];
        try {
          const invRes = await fetch(`${url}/rest/v1/inventory?user_id=eq.${encodeURIComponent(row.id)}&select=*`, {
            method: 'GET',
            headers: this.getHeaders()
          });
          if (invRes.ok) {
            const rawInv = await invRes.json();
            if (Array.isArray(rawInv)) {
              userInv = rawInv.map(i => ({
                id: i.id,
                marketName: i.market_name,
                market_name: i.market_name,
                price: Number(i.price || 0),
                image: i.image || '',
                status: i.status || 'available',
                extra: i.extra || {}
              }));
            }
          }
        } catch(e) {}

        const acc = {
          id: row.id,
          username: u,
          password: pw || '123456',
          nickname: row.nickname || u,
          avatar: row.avatar || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
          balance: Number(row.balance || 0),
          inventory: userInv,
          upgradesMade: 0,
          withdrawnAmount: 0.0,
          withdrawnItemsCount: 0,
          bestDrop: null,
          bestDropProbability: null,
          inventoryHistory: [],
          gamesHistory: [],
          createdAt: row.created_at || new Date().toISOString(),
          email: row.email || '',
          isEmailVerified: !!row.is_email_verified,
          steamTradeLink: realTradeLink,
          isTosRead: true,
          isTosAccepted: true,
          tosAccepted: true,
          newsletterSubscribed: true
        };

        const accounts = LocalDB.getAccounts();
        accounts[u] = acc;
        LocalDB.saveAccounts(accounts);
        return acc;
      } catch(err) {
        console.warn('[SupabaseDB] fetchUser error:', err);
        return null;
      }
    },
    async updateUser(userId, fields) {
      if (!userId || isLegacyAccount(null, userId)) return false;
      const url = this.getUrl();
      if (!url) return false;
      try {
        const payload = {};
        if (fields.balance !== undefined) payload.balance = Number(fields.balance);
        if (fields.nickname !== undefined) payload.nickname = fields.nickname;
        if (fields.avatar !== undefined) {
          payload.avatar = fields.avatar;
          payload.image = fields.avatar;
        }
        if (fields.image !== undefined) payload.image = fields.image;
        if (fields.email !== undefined) payload.email = fields.email;
        if (fields.isEmailVerified !== undefined) payload.is_email_verified = !!fields.isEmailVerified;
        if (fields.steamTradeLink !== undefined) payload.steam_trade_link = fields.steamTradeLink;
        payload.updated_at = new Date().toISOString();

        const targetQuery = `or=(id.eq.${encodeURIComponent(userId)},username.eq.${encodeURIComponent(userId)})`;
        const res = await fetch(`${url}/rest/v1/users?${targetQuery}`, {
          method: 'PATCH',
          headers: {
            ...this.getHeaders(),
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(payload)
        });
        return res.ok;
      } catch(err) {
        console.error('[SupabaseDB] updateUser error:', err);
        return false;
      }
    },
    async addInventoryItem(userId, item) {
      const url = this.getUrl();
      if (!url || !userId || !item) return false;
      try {
        const it = item.item || item;
        const payload = [{
          id: String(item.id || ('inv_' + Date.now())),
          user_id: String(userId),
          market_name: it.marketName || it.market_name || item.marketName || 'CS2 Item',
          price: Number(item.price || it.price || 0),
          image: it.image || item.image || '',
          status: item.status || 'available',
          extra: it.extra || item.extra || {},
          updated_at: new Date().toISOString()
        }];

        await fetch(`${url}/rest/v1/inventory`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(payload)
        });
        return true;
      } catch(e) {
        return false;
      }
    },
    async removeInventoryItem(itemId) {
      const url = this.getUrl();
      if (!url || !itemId) return false;
      try {
        await fetch(`${url}/rest/v1/inventory?id=eq.${encodeURIComponent(itemId)}`, {
          method: 'DELETE',
          headers: this.getHeaders()
        });
        return true;
      } catch(e) {
        return false;
      }
    },
    async updateAdminSettings(settings) {
      const url = this.getUrl();
      if (!url) return false;
      try {
        const payload = [{
          key: 'global_settings',
          rig_mode: settings.rig_mode || localStorage.getItem('upgrader_rig_mode') || 'normal',
          server_upgrades: Number(settings.server_upgrades || localStorage.getItem('upgrader_server_upgrades_base') || 487677451),
          server_online: Number(settings.server_online || localStorage.getItem('upgrader_server_online') || 4281),
          updated_at: new Date().toISOString()
        }];

        await fetch(`${url}/rest/v1/admin_settings`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(payload)
        });
        return true;
      } catch(e) {
        return false;
      }
    }
  };

  window.SupabaseDB = SupabaseDB;

  // 1. EMBEDDED DEFAULT USER ACCOUNTS & INVENTORY SEED
  // Ensures seamless offline / GitHub Pages persistence without depending on sync skins.json loading
  const DEFAULT_SEED_ACCOUNTS = {};

  // 2. LOAD EXTENSIVE SKINS CATALOG FROM skins.json (15,800+ skins synced from upgrader.best)
  let catalogData = [];
  function populateCatalog(data) {
    if (!data || !Array.isArray(data) || data.length === 0) return;
    catalogData = data;
    if (window.UPGRADER_CONFIG) {
      window.UPGRADER_CONFIG.catalog = catalogData;
    }
    console.log('[UPGRADER] Loaded', catalogData.length, 'skins into catalog.');
  }

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
          populateCatalog(JSON.parse(xhr.responseText));
          break;
        }
      } catch(err) {}
    }
  } catch(e) {}

  if (catalogData.length === 0) {
    const isSubdir = window.location.pathname.includes('/cis') || window.location.pathname.includes('/en') || window.location.pathname.includes('/ru') || window.location.pathname.includes('/admin');
    const relSkinsUrl = isSubdir ? '../skins.json' : './skins.json';
    fetch(relSkinsUrl)
      .then(res => res.json())
      .then(data => populateCatalog(data))
      .catch(() => {
        fetch('./skins.json').then(r => r.json()).then(d => populateCatalog(d)).catch(() => {});
      });
  }

  const getAssetPath = (p) => {
    const isSub = window.location.pathname.includes('/cis') || window.location.pathname.includes('/en') || window.location.pathname.includes('/ru') || window.location.pathname.includes('/admin');
    const clean = p.replace(/^\//, '');
    return isSub ? '../' + clean : './' + clean;
  };

  // 3. CONFIGURATION
  window.UPGRADER_CONFIG = {
    testAccount: null,
    starterSkins: [],
    catalog: catalogData
  };

  const STORAGE_ACCOUNTS_KEY = 'upgrader_accounts_v4';
  const STORAGE_ACTIVE_KEY = 'upgrader_active_user_v4';

  // 4. GLOBAL STATS (Site-wide upgrades counter & online counter)
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
        step = Math.min(diff, Math.floor(Math.random() * 3) + 1);
      }
      GlobalStats.displayedCount += step;
    } else {
      const step = Math.floor(Math.random() * 3) + 1;
      GlobalStats.displayedCount += step;
      GlobalStats.targetCount = GlobalStats.displayedCount;
    }

    GlobalStats.setUpgradesCount(GlobalStats.displayedCount);
    GlobalStats.updateHeaderDOM(GlobalStats.displayedCount);
    WsMock.broadcastGameCount(GlobalStats.displayedCount);
  }, 25);

  // 5. LOCAL DATABASE (Accounts, Inventories, History & Stats)
  class LocalDB {
    static getAccounts() {
      try {
        const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
        if (raw) {
          const accs = JSON.parse(raw);
          if (accs && typeof accs === 'object') {
            let updated = false;
            for (const k of Object.keys(accs)) {
              if (isLegacyAccount(accs[k], k)) {
                delete accs[k];
                updated = true;
              }
            }
            if (updated) {
              this.saveAccountsLocally(accs);
            }
            return accs;
          }
        }
      } catch (e) {}

      const initialAccounts = {};
      this.saveAccountsLocally(initialAccounts);
      return initialAccounts;
    }

    static restoreDefaultAccounts() {
      const accounts = {};
      this.saveAccountsLocally(accounts);
      this.clearActiveUser();
      return accounts;
    }

    static saveAccountsLocally(accounts) {
      try {
        localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
      } catch (e) {}
    }

    static saveAccounts(accounts) {
      this.saveAccountsLocally(accounts);
    }

    static saveUser(user) {
      if (!user || !user.username) return;
      const accounts = this.getAccounts();
      accounts[user.username] = user;
      this.saveAccounts(accounts);
    }

    static getActiveUser() {
      const accounts = this.getAccounts();
      try {
        const activeU = localStorage.getItem(STORAGE_ACTIVE_KEY);
        if (!activeU) return null;
        const trimmed = activeU.trim();
        if (isLegacyAccount(null, trimmed)) return null;
        if (accounts[trimmed]) return accounts[trimmed];
        const lower = trimmed.toLowerCase();
        if (accounts[lower]) return accounts[lower];
        for (const k in accounts) {
          const acc = accounts[k];
          if (!acc) continue;
          if ((acc.username && acc.username.toLowerCase() === lower) ||
              String(acc.id) === trimmed ||
              (acc.nickname && acc.nickname.toLowerCase() === lower)) {
            return acc;
          }
        }
      } catch (e) {}
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
        if (!username || username === 'test_user' || username === '666') {
          this.clearActiveUser();
          return;
        }
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

      const newAcc = {
        id: Math.floor(Math.random() * 80000) + 20000,
        username: u,
        password: password,
        nickname: nickname && nickname.trim() ? nickname.trim() : u,
        avatar: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
        balance: 0.00,
        inventory: [],
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
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
        SupabaseDB.registerUser(newAcc, password).catch(e => console.warn(e));
      }
      return newAcc;
    }

    static async registerAsync(username, password, nickname) {
      const accounts = this.getAccounts();
      const u = username.trim().toLowerCase();
      if (!u) throw new Error('Логин не может быть пустым');
      if (accounts[u]) throw new Error('Пользователь с таким логином уже существует');
      if (!password || password.length < 3) throw new Error('Пароль должен быть не менее 3 символов');

      // Check cloud DB
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
        const cloudUser = await SupabaseDB.fetchUser(u);
        if (cloudUser) {
          throw new Error('Пользователь с таким логином уже существует в базе данных');
        }
      }

      const newAcc = {
        id: Math.floor(Math.random() * 80000) + 20000,
        username: u,
        password: password,
        nickname: nickname && nickname.trim() ? nickname.trim() : u,
        avatar: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
        balance: 0.00,
        inventory: [],
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

      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
        await SupabaseDB.registerUser(newAcc, password);
      }
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

    static async loginAsync(username, password) {
      const u = username.trim().toLowerCase();
      if (!u) throw new Error('Логин не может быть пустым');

      let accounts = this.getAccounts();
      let acc = accounts[u];

      // If user not found locally, fetch directly from cloud DB!
      if (!acc && typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
        acc = await SupabaseDB.fetchUser(u);
        accounts = this.getAccounts();
      }

      if (!acc) throw new Error('Пользователь не зарегистрирован');

      if (acc.password !== password) {
        if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
          const fresh = await SupabaseDB.fetchUser(u);
          if (fresh && fresh.password === password) {
            acc = fresh;
            accounts = this.getAccounts();
          } else {
            throw new Error('Неверный пароль');
          }
        } else {
          throw new Error('Неверный пароль');
        }
      }

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
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
        SupabaseDB.updateUser(acc.id, { balance: acc.balance });
      }
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
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
        SupabaseDB.updateUser(acc.id, { email: acc.email, isEmailVerified: true });
      }
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
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
        SupabaseDB.addInventoryItem(acc.id, invItem);
      }
      return invItem;
    }

    static removeItemFromInventory(username, itemId) {
      const accounts = this.getAccounts();
      const acc = accounts[username];
      if (!acc || !acc.inventory) return;
      acc.inventory = acc.inventory.filter(i => String(i.id) !== String(itemId) && String(i.originalSkinId) !== String(itemId));
      this.saveAccounts(accounts);
      this.setActiveUser(username);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
        SupabaseDB.removeInventoryItem(itemId);
      }
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
      if (avatar && avatar.trim()) {
        acc.avatar = avatar.trim();
        acc.image = avatar.trim();
      }
      if (id !== undefined && id !== null && String(id).trim()) {
        const numId = parseInt(id, 10);
        if (!isNaN(numId) && numId > 0) {
          acc.id = numId;
        }
      }

      this.saveAccountsLocally(accounts);
      this.setActiveUser(username);
      window.dispatchEvent(new CustomEvent('upgrader:user-updated', { detail: acc }));
      return acc;
    }
  }

  // Real-time synchronization across tabs (Admin panel <-> Main site)
  function applyLiveRigUpdate(payload) {
    if (!payload) return;
    const mode = payload.mode || payload.rig_mode;
    const customChance = payload.customChance !== undefined ? payload.customChance : payload.custom_win_chance;
    const targetUser = (payload.targetUser || payload.target_username || '').toLowerCase().trim();
    const targetId = String(payload.targetId || payload.target_id || '').trim();

    const activeUser = LocalDB.getActiveUser();
    if (!activeUser) return;

    const matchesUser = !targetUser || targetUser === (activeUser.username || '').toLowerCase() || targetUser === String(activeUser.id);
    const matchesId = !targetId || targetId === String(activeUser.id) || targetId === (activeUser.username || '').toLowerCase();

    if (matchesUser || matchesId) {
      if (mode) {
        activeUser.chanceRig = mode;
        localStorage.setItem('upgrader_rig_mode', mode);
      }
      if (customChance !== undefined && customChance !== null) {
        activeUser.customWinChance = parseFloat(customChance);
        localStorage.setItem('upgrader_custom_win_chance', String(customChance));
      }
      LocalDB.saveUser(activeUser);
      console.log(`[local-backend] Instant rig applied in real-time to active user ${activeUser.username}: ${mode} (custom: ${customChance}%)`);
      window.dispatchEvent(new CustomEvent('upgrader:user-updated', { detail: activeUser }));
    }
  }

  // Listen to Storage events from other tabs (Admin tab changes localStorage)
  window.addEventListener('storage', (e) => {
    if (e.key === 'upgrader_rig_event' && e.newValue) {
      try {
        const payload = JSON.parse(e.newValue);
        applyLiveRigUpdate(payload);
      } catch (err) {}
    } else if (e.key === 'upgrader_rig_mode' && e.newValue) {
      const mode = e.newValue;
      const customVal = parseFloat(localStorage.getItem('upgrader_custom_win_chance'));
      const targetUser = localStorage.getItem('upgrader_target_user_rig');
      const targetId = localStorage.getItem('upgrader_target_id_rig');
      applyLiveRigUpdate({ mode, customChance: customVal, targetUser, targetId });
    } else if (e.key === STORAGE_ACCOUNTS_KEY) {
      const activeUser = LocalDB.getActiveUser();
      if (activeUser) {
        window.dispatchEvent(new CustomEvent('upgrader:user-updated', { detail: activeUser }));
      }
    }
  });

  // Listen to BroadcastChannel for zero-latency cross-tab communication
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const bc = new BroadcastChannel('upgrader_channel');
      bc.onmessage = (event) => {
        if (event.data && event.data.type === 'RIG_UPDATED') {
          applyLiveRigUpdate(event.data);
        }
      };
    } catch (e) {}
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
    console.log('[handleMockApi]', method, path, body);

    // 0. Payments API (Original Angular up-payment-modal-new)
    if (path.includes('/payments/categories')) {
      const origin = window.location.origin + (window.location.pathname.startsWith('/envyrage') ? '/envyrage' : '');
      return {
        status: 200,
        data: [
          {
            id: 'cards',
            name: 'Cards',
            children: [
              {
                id: 'rub',
                name: 'RUB',
                methods: [
                  {
                    id: 'sbp_a',
                    name: 'СБП QRCODE A',
                    image: `${origin}/assets/icons/payment-methods/sbp_a.svg`,
                    minAmount: '50',
                    maxAmount: '100000',
                    currency: 'RUB',
                    userFeeEnabled: false
                  },
                  {
                    id: 'sbp_i',
                    name: 'СБП QRCODE I',
                    image: `${origin}/assets/icons/payment-methods/sbp_i.svg`,
                    minAmount: '50',
                    maxAmount: '100000',
                    currency: 'RUB',
                    userFeeEnabled: false
                  },
                  {
                    id: 'spay',
                    name: 'S Pay',
                    image: `${origin}/assets/icons/payment-methods/spay.svg`,
                    minAmount: '50',
                    maxAmount: '100000',
                    currency: 'RUB',
                    userFeeEnabled: false
                  },
                  {
                    id: 'sber',
                    name: 'СБЕР КАРТЫ',
                    image: `${origin}/assets/icons/payment-methods/sber.svg`,
                    minAmount: '50',
                    maxAmount: '100000',
                    currency: 'RUB',
                    userFeeEnabled: false
                  },
                  {
                    id: 'mir',
                    name: 'МИР',
                    image: `${origin}/assets/icons/payment-methods/mir.svg`,
                    minAmount: '50',
                    maxAmount: '100000',
                    currency: 'RUB',
                    giftcard: true,
                    userFeeEnabled: false
                  }
                ]
              }
            ]
          },
          {
            id: 'crypto',
            name: 'Crypto',
            children: [
              {
                id: 'usdt',
                name: 'USDT',
                methods: [
                  {
                    id: 'usdt',
                    name: 'USDT TRC-20',
                    image: `${origin}/assets/icons/payment-modal-new/crypto.svg`,
                    minAmount: '10',
                    maxAmount: '10000',
                    currency: 'USDT',
                    userFeeEnabled: false
                  },
                  {
                    id: 'btc',
                    name: 'Bitcoin',
                    image: `${origin}/assets/icons/payment-modal-new/crypto.svg`,
                    minAmount: '20',
                    maxAmount: '10000',
                    currency: 'BTC',
                    userFeeEnabled: false
                  }
                ]
              }
            ],
            methods: [
              {
                id: 'usdt',
                name: 'USDT TRC-20',
                image: `${origin}/assets/icons/payment-modal-new/crypto.svg`,
                minAmount: '10',
                maxAmount: '10000',
                currency: 'USDT',
                userFeeEnabled: false
              },
              {
                id: 'btc',
                name: 'Bitcoin',
                image: `${origin}/assets/icons/payment-modal-new/crypto.svg`,
                minAmount: '20',
                maxAmount: '10000',
                currency: 'BTC',
                userFeeEnabled: false
              }
            ]
          },
          {
            id: 'skins',
            name: 'Skins',
            children: [],
            methods: [
              {
                id: '100',
                name: 'CS2 Skins',
                skinsGame: 'cs2',
                image: `${origin}/assets/icons/payment-modal-new/skins.svg`,
                minAmount: '10',
                maxAmount: '100000',
                currency: 'RUB',
                depositFlow: 'onsite'
              }
            ]
          }
        ]
      };
    }

    if (path.includes('/skins/inventory')) {
      return {
        status: 200,
        data: {
          items: [
            {
              id: 'steam_skin_1',
              marketName: 'AK-47 | Ice Coaled (Field-Tested)',
              price: 1250,
              image: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FABz7PLfYQJS5NO0m5O0m_7zO6-fzj9V7cAl2eyVpIrz2FKx_0NpZmGlLNeScVU2M1rU-Ae5wOq-18e0uMzXiSw0e026q08'
            },
            {
              id: 'steam_skin_2',
              marketName: 'AWP | Atheris (Field-Tested)',
              price: 890,
              image: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FABz7PLfYQJG6d2inL-GkvP9Jrafw2lU6ccp0rqVp4rz2Q22qUs6Zjj7d9eTdwU8Y1vX_VG6kO-8gMW66ZzJmiFhu3Qi43-MnAv33089sY8R9A'
            },
            {
              id: 'steam_skin_3',
              marketName: 'M4A4 | The Emperor (Field-Tested)',
              price: 2450,
              image: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhjxszFJTwW09izh4-GkvP9Jrafw2lU6ccp0rqVp4rz2Q22qUs6Zjj7d9eTdwU8Y1vX_VG6kO-8gMW66ZzJmiFhu3Qi43-MnAv33089sY8R9A'
            }
          ],
          hasMore: false
        }
      };
    }

    if (path.includes('/create-invoice')) {
      const num = parseFloat(body.amount) || 500;
      const desktopPromo = document.querySelector('[data-testid="payment-modal-promocode-input-desktop"]')?.value;
      const mobilePromo = document.querySelector('[data-testid="payment-modal-promocode-input-mobile"]')?.value;
      const rawPromoInput = document.querySelector('#promocode-input')?.value;
      const anyPromoInput = document.querySelector('input[placeholder*="промокод" i], input[placeholder*="promo" i]')?.value;
      const passedPromo = body.promocode || (body.metadata && body.metadata.promocode) || window._currentPromoCode || desktopPromo || mobilePromo || rawPromoInput || anyPromoInput || '';
      const cleanPromo = String(passedPromo).trim().toLowerCase();
      const isEnvyPromo = cleanPromo === 'envy!' || cleanPromo === 'envy' || cleanPromo.replace(/['"!]/g, '') === 'envy';

      if (isEnvyPromo) {
        let user = LocalDB.getActiveUser();
        if (user) {
          user.balance = Math.round((Number(user.balance || 0) + num) * 100) / 100;
          LocalDB.saveUser(user);
          if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
            SupabaseDB.updateUser(user.id || user.username, { balance: user.balance }).catch(e => console.warn(e));
          }
          WsMock.broadcastBalance(user.balance);
          if (window.MockSocketInstance && typeof window.MockSocketInstance.send === 'function') {
            window.MockSocketInstance.send(JSON.stringify({
              type: 'users.update_balance',
              data: { balance: user.balance }
            }));
          }
          closeNativePaymentModal();
          showToast('Промокод envy! активирован! Баланс пополнен на ' + num.toLocaleString('ru-RU') + ' ₽', 'success');
        }
        return {
          status: 200,
          data: {
            id: 'pay_' + Date.now(),
            status: 'completed',
            amount: num
          }
        };
      } else {
        // Not envy! -> Simulate card payment gateway
        closeNativePaymentModal();
        setTimeout(() => {
          renderCardPaymentGatewayModal(num);
        }, 80);
        return {
          status: 200,
          data: {
            id: 'pay_' + Date.now(),
            status: 'processing',
            redirectUrl: null
          }
        };
      }
    }

    if (path.includes('/promo/deposit')) {
      return {
        status: 200,
        data: { promocode: null }
      };
    }

    if (path.includes('/promo/activate')) {
      if (body && (body.code || body.promocode)) {
        window._currentPromoCode = String(body.code || body.promocode).trim();
      }
      return {
        status: 200,
        data: {
          deposit_bonus: {
            percent: '15',
            maxAmount: '5000'
          }
        }
      };
    }

    if (path.includes('/payments/instant-deposit')) {
      return {
        status: 200,
        data: { eligible: false }
      };
    }

    if (path.includes('/gift-cards/redeem')) {
      return {
        status: 200,
        data: { success: true }
      };
    }

    if (path.includes('/currencies/crypto_rates')) {
      return {
        status: 200,
        data: {
          base: 'RUB',
          rates: {
            RUB: 1,
            USDT: 0.011,
            USDTTRC: 0.011,
            TON: 0.002,
            BTC: 0.00000015,
            ETH: 0.0000035
          }
        }
      };
    }

    if (path.includes('/currencies/rates') || path.includes('/payments/currencies/rates')) {
      return {
        status: 200,
        data: {
          base: 'RUB',
          rates: {
            RUB: 1,
            USD: 0.011,
            EUR: 0.01,
            UAH: 0.45,
            KZT: 5.2
          }
        }
      };
    }

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

      // DYNAMIC ADMIN CHANCE RIGGING (Real-time sync with /admin)
      let rig = activeUser.chanceRig || 'normal';
      let customVal = typeof activeUser.customWinChance === 'number' ? activeUser.customWinChance : null;

      const fastRigMode = localStorage.getItem('upgrader_rig_mode');
      const targetUserRig = (localStorage.getItem('upgrader_target_user_rig') || '').toLowerCase().trim();
      const targetIdRig = String(localStorage.getItem('upgrader_target_id_rig') || '').trim();

      if (fastRigMode) {
        const uMatches = !targetUserRig || targetUserRig === (activeUser.username || '').toLowerCase() || targetUserRig === String(activeUser.id);
        const idMatches = !targetIdRig || targetIdRig === String(activeUser.id) || targetIdRig === (activeUser.username || '').toLowerCase();
        if (uMatches || idMatches) {
          rig = fastRigMode;
          const fastCustom = parseFloat(localStorage.getItem('upgrader_custom_win_chance'));
          if (!isNaN(fastCustom)) customVal = fastCustom;
        }
      }

      let roll = Math.random();
      let isWin = false;

      if (rig === 'force_win') {
        isWin = true;
        chance = Math.max(0.10, chance);
        roll = Math.min(chance * 0.35, 0.015); // Guaranteed win: strictly inside winning sector
      } else if (rig === 'force_lose') {
        isWin = false;
        roll = Math.max(chance + 0.10, 0.98); // Guaranteed lose: strictly outside winning sector
      } else if (rig === 'bonus_25') {
        chance = Math.min(0.98, chance + 0.25);
        isWin = Math.random() <= chance;
        roll = isWin ? (Math.random() * (chance * 0.92)) : Math.min(0.99, chance + 0.02 + Math.random() * Math.max(0.01, 1 - chance - 0.02));
      } else if (rig === 'bonus_50') {
        chance = Math.min(0.98, chance + 0.50);
        isWin = Math.random() <= chance;
        roll = isWin ? (Math.random() * (chance * 0.92)) : Math.min(0.99, chance + 0.02 + Math.random() * Math.max(0.01, 1 - chance - 0.02));
      } else if (rig === 'mult_2x') {
        chance = Math.min(0.98, chance * 2.0);
        isWin = Math.random() <= chance;
        roll = isWin ? (Math.random() * (chance * 0.92)) : Math.min(0.99, chance + 0.02 + Math.random() * Math.max(0.01, 1 - chance - 0.02));
      } else if (rig === 'custom' && customVal !== null) {
        const winProb = Math.min(0.99, Math.max(0.01, customVal / 100));
        chance = winProb;
        if (customVal >= 99) {
          isWin = true;
          roll = Math.min(chance * 0.35, 0.015);
        } else if (customVal <= 1) {
          isWin = false;
          roll = Math.max(chance + 0.05, 0.98);
        } else {
          isWin = Math.random() < winProb;
          roll = isWin ? (Math.random() * (chance * 0.92)) : Math.min(0.99, chance + 0.02 + Math.random() * Math.max(0.01, 1 - chance - 0.02));
        }
      } else {
        isWin = roll <= chance;
        if (isWin) {
          roll = Math.random() * (chance * 0.92);
        } else {
          roll = Math.min(0.99, chance + 0.02 + Math.random() * Math.max(0.01, 1 - chance - 0.02));
        }
      }

      // Deduct added balance if any
      if (addedBalance > 0) {
        LocalDB.updateBalance(activeUser.username, -addedBalance, true);
      }

      // Remove bet items from inventory
      betInventoryItemIds.forEach(id => {
        LocalDB.removeItemFromInventory(activeUser.username, id);
      });

      const targetItemObj = targetSkin || {
        id: targetItemId,
        marketName: 'Предмет #' + targetItemId,
        market_name: 'Предмет #' + targetItemId,
        price: String(safeTargetPrice),
        image: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf0ebcZThQ6tCvq4GGqPr1Ibndk1Rx5sB9teXI8oThxlKxr0VvfTrxIYfEewA6MFGD_FS9xr3n08K6u5rLnCRiuD5iuyjCj6j6fQ/360fx360f',
        extra: { r: 10, ch: 'eb4b4b' }
      };

      // If win, add won target skin to inventory
      let wonItem = null;
      if (isWin) {
        wonItem = LocalDB.addItemToInventory(activeUser.username, targetItemObj);
      }

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

        <!-- Custom Avatar URL & Device Upload -->
        <div style="margin-bottom:22px;">
          <label style="display:block;font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:6px;">Аватарка профиля</label>
          <div style="display:flex;gap:8px;align-items:center;">
            <input type="text" id="edit-avatar-url-input" value="${activeUser.avatar}" placeholder="URL картинки или файл" style="flex:1;background:#202126;border:1px solid rgba(255,255,255,0.12);color:#fff;padding:10px 14px;border-radius:10px;font-size:13px;outline:none;" />
            <input type="file" id="edit-avatar-file-input" accept="image/*" style="display:none;" />
            <button type="button" id="edit-avatar-upload-btn" style="background:#2A2B32;border:1px solid rgba(255,255,255,0.15);color:#FDD911;border-radius:10px;padding:10px 14px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;">📁 С устройства</button>
          </div>
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
    const fileInput = overlay.querySelector('#edit-avatar-file-input');
    const uploadBtn = overlay.querySelector('#edit-avatar-upload-btn');
    const previewImg = overlay.querySelector('#edit-avatar-preview');
    const previewNick = overlay.querySelector('#edit-nick-preview');
    const previewId = overlay.querySelector('#edit-id-preview');

    uploadBtn.onclick = () => fileInput.click();
    fileInput.onchange = () => {
      const file = fileInput.files && fileInput.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          showToast('Размер файла не должен превышать 2 МБ', 'error');
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target.result;
          avatarInput.value = dataUrl;
          previewImg.src = dataUrl;
        };
        reader.readAsDataURL(file);
      }
    };

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
    saveBtn.onclick = async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Сохранение в базе данных...';

      const newNick = nickInput.value.trim() || activeUser.nickname;
      const newId = idInput.value.trim() || activeUser.id;
      const newAvatar = avatarInput.value.trim() || activeUser.avatar;

      LocalDB.updateProfileCustomizations(activeUser.username, {
        nickname: newNick,
        avatar: newAvatar,
        id: newId
      });

      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
        try {
          await SupabaseDB.updateUser(activeUser.id || activeUser.username, {
            nickname: newNick,
            avatar: newAvatar,
            image: newAvatar,
            id: newId
          });
        } catch(err) {
          console.warn('[SupabaseDB] updateUser error:', err);
        }
      }

      overlay.remove();
      showToast('Профиль успешно обновлен в базе данных!', 'success');

      // Update in DOM and reload state
      setTimeout(() => {
        window.location.reload();
      }, 200);
    };
  }

  // 11. LOCAL AUTH MODAL
  function renderAuthModal() {
    const existing = document.getElementById('upgrader-auth-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'upgrader-auth-modal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);backdrop-filter:blur(8px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:Exo 2,sans-serif;';

    overlay.innerHTML = `
      <div style="position:relative;width:100%;max-width:440px;background:#17181C;border:1px solid rgba(255,255,255,0.08);border-radius:24px;box-shadow:0 20px 50px rgba(0,0,0,0.6);padding:32px;color:#fff;">
        <button type="button" id="up-auth-close" style="position:absolute;top:20px;right:20px;background:none;border:none;color:#888;font-size:24px;cursor:pointer;line-height:1;">✕</button>

        <h2 style="font-family:Tektur,sans-serif;font-size:22px;margin:0 0 8px;color:#fff;" id="up-auth-title">Вход в аккаунт</h2>
        <p style="font-size:13px;color:#8E8F94;margin:0 0 20px;" id="up-auth-desc">Авторизация в апгрейдере</p>

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
        desc.textContent = 'Создайте аккаунт для игры в апгрейдер';
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

    async function doLogin(u, p) {
      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Вход...';
        await LocalDB.loginAsync(u, p);
        showToast('Успешный вход в аккаунт!', 'success');
        overlay.remove();
        setTimeout(() => {
          window.location.reload();
        }, 200);
      } catch (e) {
        showError(e.message || 'Ошибка входа');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Войти';
      }
    }

    async function doRegister(u, p) {
      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Создание...';
        const nick = nickInput.value.trim();
        await LocalDB.registerAsync(u, p, nick);
        showToast('Аккаунт успешно создан в базе данных!', 'success');
        overlay.remove();
        setTimeout(() => {
          window.location.reload();
        }, 200);
      } catch (e) {
        showError(e.message || 'Ошибка регистрации');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Создать аккаунт';
      }
    }

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
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:20px;height:20px;">
                  <path d="M4 7.00005L10.2 11.65C11.2667 12.45 12.7333 12.45 13.8 11.65L20 7" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  <rect x="3" y="5" width="18" height="14" rx="3" stroke="#FFFFFF" stroke-width="1.8"/>
                </svg>
              </div>
              <div class="flex flex-col">
                <span data-testid="email-linking-email-label" class="text-[0.75rem] text-[#8E8F94] font-medium uppercase tracking-wider">Электронная почта</span>
                <span data-testid="email-linking-email-value" class="text-[0.875rem] text-white font-semibold">${activeUser.email}</span>
              </div>
            </div>
            <div data-testid="email-linking-verified-badge" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#24D17A1A] text-[#24D17A] text-[0.8125rem] font-bold">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px;">
                <path d="M13.3332 4L5.99984 11.3333L2.6665 8" stroke="#24D17A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
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

  // 12. AUTHENTIC PAYMENT GATEWAY (Original Angular up-payment-modal-new)
  function openNativePaymentModal() {
    // 1. Try finding Angular component on <up-payment-modal-new>
    try {
      const modalEls = document.querySelectorAll('up-payment-modal-new');
      for (const el of modalEls) {
        if (typeof ng !== 'undefined' && ng.getComponent) {
          const comp = ng.getComponent(el);
          if (comp && typeof comp.show === 'function') {
            comp.show('header');
            return true;
          }
        }
      }
    } catch(e) {}

    // 2. Try triggering click on Angular header top-up button or profile button
    const angularBtn = document.querySelector('up-top-up-dropdown button, up-top-up-low-balance button, [data-testid="profile-top-up"], [data-testid="advertising-main-topup"], [data-testid*="topup"], [data-testid*="top-up"]');
    if (angularBtn) {
      angularBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      return true;
    }
    return false;
  }

  function closeNativePaymentModal() {
    try {
      const modalEls = document.querySelectorAll('up-payment-modal-new');
      for (const el of modalEls) {
        if (typeof ng !== 'undefined' && ng.getComponent) {
          const comp = ng.getComponent(el);
          if (comp && typeof comp.onClose === 'function') {
            comp.onClose();
          } else if (comp && typeof comp.hide === 'function') {
            comp.hide();
          }
        }
      }
    } catch(e) {}

    const closeBtns = document.querySelectorAll('up-payment-modal-new [data-testid*="close"], up-payment-modal-new button[aria-label="Close"], up-payment-modal-new up-modal-cdk button, [data-testid="modal-close-button"]');
    for (const btn of closeBtns) {
      try { btn.click(); } catch(e) {}
    }
  }

  function renderCardPaymentGatewayModal(amount = 500) {
    const existing = document.getElementById('upgrader-card-gateway-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'upgrader-card-gateway-modal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);z-index:9999999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;box-sizing:border-box;';

    const orderNum = 'SPAY-' + Math.floor(100000 + Math.random() * 900000);

    overlay.innerHTML = `
      <div style="position:relative;width:100%;max-width:440px;background:#16171B;border:1px solid rgba(255,255,255,0.12);border-radius:24px;box-shadow:0 25px 60px rgba(0,0,0,0.8);padding:24px;color:#fff;overflow:hidden;">
        <button type="button" id="cg-close-btn" style="position:absolute;top:18px;right:18px;background:none;border:none;color:#8E8F94;font-size:22px;cursor:pointer;line-height:1;transition:color 0.2s;">✕</button>

        <!-- Header -->
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
          <div style="width:36px;height:36px;border-radius:10px;background:#24D17A20;border:1px solid #24D17A40;display:flex;align-items:center;justify-content:center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#24D17A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/>
              <line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
          </div>
          <div>
            <div style="font-weight:700;font-size:16px;color:#fff;display:flex;align-items:center;gap:6px;">
              S Pay • Банковская карта
              <span style="font-size:10px;background:#24D17A25;color:#24D17A;padding:2px 6px;border-radius:6px;font-weight:700;">SSL 256-BIT</span>
            </div>
            <div style="font-size:12px;color:#8E8F94;">Заказ #${orderNum}</div>
          </div>
        </div>

        <div id="cg-content-container">
          <!-- Order Summary Card -->
          <div style="background:#1F2026;border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:14px 16px;margin-bottom:18px;display:flex;justify-content:between;align-items:center;justify-content:space-between;">
            <span style="color:#8E8F94;font-size:13px;">К оплате:</span>
            <span style="font-size:22px;font-weight:800;color:#FDD911;font-family:Tektur,sans-serif;">${Number(amount).toLocaleString('ru-RU')} ₽</span>
          </div>

          <!-- Realistic Card Visualizer -->
          <div style="background:linear-gradient(135deg, #262832 0%, #15161A 100%);border:1px solid rgba(255,255,255,0.15);border-radius:16px;padding:16px;margin-bottom:18px;box-shadow:0 10px 25px rgba(0,0,0,0.5);position:relative;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
              <!-- Gold Chip -->
              <div style="width:38px;height:28px;background:linear-gradient(135deg, #e6c875 0%, #b8973d 100%);border-radius:6px;border:1px solid rgba(255,255,255,0.2);position:relative;overflow:hidden;">
                <div style="position:absolute;top:50%;left:0;right:0;height:1px;background:#967623;"></div>
                <div style="position:absolute;top:0;bottom:0;left:50%;width:1px;background:#967623;"></div>
              </div>
              <span id="cg-card-brand" style="font-weight:800;font-size:14px;color:#fff;letter-spacing:1px;text-transform:uppercase;">МИР</span>
            </div>

            <div id="cg-preview-number" style="font-family:'Courier New',Courier,monospace;font-size:17px;font-weight:700;letter-spacing:2px;color:#fff;margin-bottom:16px;">•••• •••• •••• ••••</div>

            <div style="display:flex;justify-content:space-between;align-items:flex-end;">
              <div>
                <div style="font-size:9px;color:#8E8F94;text-transform:uppercase;letter-spacing:0.5px;">Держатель карты</div>
                <div id="cg-preview-holder" style="font-size:12px;font-weight:600;color:#ddd;letter-spacing:1px;text-transform:uppercase;">CARDHOLDER</div>
              </div>
              <div>
                <div style="font-size:9px;color:#8E8F94;text-transform:uppercase;letter-spacing:0.5px;">Срок действия</div>
                <div id="cg-preview-expiry" style="font-size:12px;font-weight:600;color:#ddd;letter-spacing:1px;">MM/YY</div>
              </div>
            </div>
          </div>

          <!-- Card Form Inputs -->
          <form id="cg-form" style="display:flex;flex-direction:column;gap:12px;">
            <div>
              <label style="display:block;font-size:12px;color:#8E8F94;margin-bottom:4px;">Номер карты</label>
              <input type="text" id="cg-input-number" placeholder="2200 0000 0000 0000" maxlength="19" autocomplete="cc-number" style="width:100%;box-sizing:border-box;background:#1F2026;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:12px;color:#fff;font-size:14px;font-family:'Courier New',Courier,monospace;letter-spacing:1px;outline:none;" required />
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div>
                <label style="display:block;font-size:12px;color:#8E8F94;margin-bottom:4px;">Срок действия</label>
                <input type="text" id="cg-input-expiry" placeholder="ММ / ГГ" maxlength="5" autocomplete="cc-exp" style="width:100%;box-sizing:border-box;background:#1F2026;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:12px;color:#fff;font-size:14px;outline:none;text-align:center;" required />
              </div>
              <div>
                <label style="display:block;font-size:12px;color:#8E8F94;margin-bottom:4px;">CVC / CVV</label>
                <input type="password" id="cg-input-cvc" placeholder="•••" maxlength="3" autocomplete="cc-csc" style="width:100%;box-sizing:border-box;background:#1F2026;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:12px;color:#fff;font-size:14px;outline:none;text-align:center;" required />
              </div>
            </div>

            <div>
              <label style="display:block;font-size:12px;color:#8E8F94;margin-bottom:4px;">Имя на карте (латиницей)</label>
              <input type="text" id="cg-input-holder" placeholder="IVAN IVANOV" autocomplete="cc-name" style="width:100%;box-sizing:border-box;background:#1F2026;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:12px;color:#fff;font-size:14px;text-transform:uppercase;outline:none;" required />
            </div>

            <!-- Hint about promo envy! -->
            <div style="background:rgba(253,217,17,0.08);border:1px dashed rgba(253,217,17,0.3);border-radius:10px;padding:10px 12px;font-size:11px;color:#ccc;line-height:1.4;">
              <b style="color:#FDD911;">⚡ Мгновенное зачисление:</b><br/>
              Чтобы пополнить баланс без ввода данных банковской карты, укажите промокод <b style="color:#FDD911;">envy!</b> в окне пополнения.
            </div>

            <button type="button" id="cg-submit-btn" style="width:100%;background:#FDD911;color:#16171B;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:700;cursor:pointer;margin-top:6px;transition:opacity 0.2s;font-family:Tektur,sans-serif;">Оплатить ${Number(amount).toLocaleString('ru-RU')} ₽</button>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#cg-close-btn').onclick = () => overlay.remove();

    // Elements
    const numInput = overlay.querySelector('#cg-input-number');
    const expInput = overlay.querySelector('#cg-input-expiry');
    const cvcInput = overlay.querySelector('#cg-input-cvc');
    const holderInput = overlay.querySelector('#cg-input-holder');

    const prevNumber = overlay.querySelector('#cg-preview-number');
    const prevHolder = overlay.querySelector('#cg-preview-holder');
    const prevExpiry = overlay.querySelector('#cg-preview-expiry');
    const prevBrand = overlay.querySelector('#cg-card-brand');

    const submitBtn = overlay.querySelector('#cg-submit-btn');

    // Number formatting
    numInput.oninput = () => {
      let val = numInput.value.replace(/\D/g, '').substring(0, 16);
      let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
      numInput.value = formatted;

      prevNumber.textContent = formatted || '•••• •••• •••• ••••';

      if (val.startsWith('2')) prevBrand.textContent = 'МИР';
      else if (val.startsWith('4')) prevBrand.textContent = 'VISA';
      else if (val.startsWith('5')) prevBrand.textContent = 'MASTERCARD';
      else prevBrand.textContent = 'МИР';
    };

    // Expiry formatting
    expInput.oninput = () => {
      let val = expInput.value.replace(/\D/g, '').substring(0, 4);
      if (val.length >= 2) {
        val = val.substring(0, 2) + '/' + val.substring(2);
      }
      expInput.value = val;
      prevExpiry.textContent = val || 'MM/YY';
    };

    holderInput.oninput = () => {
      prevHolder.textContent = holderInput.value.trim().toUpperCase() || 'CARDHOLDER';
    };

    // Submit -> 3DS Simulation
    submitBtn.onclick = () => {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.7';
      submitBtn.textContent = 'Авторизация в банке...';

      setTimeout(() => {
        // Switch to 3DS confirmation screen
        const container = overlay.querySelector('#cg-content-container');
        if (!container) return;

        let secondsLeft = 59;
        container.innerHTML = `
          <div style="background:#1F2026;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:20px;text-align:center;">
            <div style="width:48px;height:48px;margin:0 auto 12px;background:#FDD91115;border:1px solid #FDD91140;border-radius:50%;display:flex;align-items:center;justify-content:center;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FDD911" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>

            <h4 style="font-family:Tektur,sans-serif;font-size:17px;font-weight:700;margin:0 0 6px;color:#fff;">Подтверждение 3D-Secure</h4>
            <p style="font-size:12px;color:#8E8F94;margin:0 0 16px;">ПАО СБЕРБАНК / Т-БАНК • Сумма: <b style="color:#FDD911;">${Number(amount).toLocaleString('ru-RU')} ₽</b></p>
            <p style="font-size:12px;color:#ccc;margin:0 0 14px;">Введите 6-значный SMS-код, отправленный на номер +7 (9••) •••-••-92</p>

            <input type="text" id="cg-sms-code" placeholder="• • • • • •" maxlength="6" style="width:100%;box-sizing:border-box;background:#151619;border:1px solid rgba(255,255,255,0.15);border-radius:10px;padding:12px;color:#fff;font-size:20px;text-align:center;letter-spacing:6px;font-weight:700;outline:none;margin-bottom:10px;" />

            <div style="font-size:11px;color:#8E8F94;margin-bottom:16px;">
              Повторная отправка через: <span id="cg-timer-val" style="color:#FDD911;">00:${secondsLeft}</span>
            </div>

            <div style="background:rgba(253,217,17,0.08);border:1px dashed rgba(253,217,17,0.3);border-radius:10px;padding:12px;font-size:11px;color:#ccc;text-align:left;line-height:1.4;margin-bottom:16px;">
              <b style="color:#FDD911;">💡 Информация:</b><br/>
              Это демонстрационный шлюз оплаты. Реальное списание денег отключено.<br/>
              Для моментального автоматического зачисления баланса введите промокод <b style="color:#FDD911;">envy!</b> в окне пополнения.
            </div>

            <div style="display:flex;gap:10px;">
              <button type="button" id="cg-sms-confirm-btn" style="flex:1;background:#FDD911;color:#16171B;border:none;border-radius:10px;padding:12px;font-weight:700;font-size:14px;cursor:pointer;font-family:Tektur,sans-serif;">Подтвердить</button>
              <button type="button" id="cg-sms-cancel-btn" style="background:#2A2B32;color:#fff;border:none;border-radius:10px;padding:12px 16px;font-size:13px;cursor:pointer;">Отмена</button>
            </div>
          </div>
        `;

        const timerEl = container.querySelector('#cg-timer-val');
        const interval = setInterval(() => {
          secondsLeft--;
          if (timerEl) {
            timerEl.textContent = '00:' + (secondsLeft < 10 ? '0' : '') + secondsLeft;
          }
          if (secondsLeft <= 0) clearInterval(interval);
        }, 1000);

        container.querySelector('#cg-sms-cancel-btn').onclick = () => {
          clearInterval(interval);
          overlay.remove();
        };

        container.querySelector('#cg-sms-confirm-btn').onclick = () => {
          clearInterval(interval);
          showToast('Тестовый шлюз: реальные списания отключены. Для моментального зачисления укажите промокод envy!', 'warning');
          overlay.remove();
        };
      }, 1200);
    };
  }

  function renderDepositModal() {
    if (openNativePaymentModal()) return;

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
      const isSub = window.location.pathname.startsWith('/envyrage'); window.location.href = isSub ? '/envyrage/admin/index.html' : '/admin.html';
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

      // Allow native Angular payment modal to open on top-up buttons.
      // If an external custom deposit button (like #btnDeposit) is clicked, open native modal:
      const customDepositBtn = target.closest('#btnDeposit');
      if (customDepositBtn) {
        e.preventDefault();
        e.stopPropagation();
        openNativePaymentModal();
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
      const isLoginBtn = target.closest('[data-testid*="steam"]') ||
                         target.closest('[data-testid*="login"]') ||
                         target.closest('up-login-button') ||
                         (target.textContent && (
                           target.textContent.includes('Steam') ||
                           target.textContent.includes('Войти') ||
                           target.textContent.includes('Login') ||
                           target.textContent.includes('Sign in')
                         ));

      if (isLoginBtn) {
        if (!LocalDB.getActiveUser()) {
          e.preventDefault();
          e.stopPropagation();
          renderAuthModal();
          return;
        }
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

  // Ensure active user state is consistent on boot
  const initialActiveUser = LocalDB.getActiveUser();
  if (!initialActiveUser) {
    LocalDB.clearActiveUser();
  }

  // Trigger Cloud Database Sync on boot
  if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
    SupabaseDB.syncFromDB().then(() => {
      const cur = LocalDB.getActiveUser();
      if (cur) {
        WsMock.broadcastBalance(cur.balance);
      }
    }).catch(e => console.warn('[SupabaseDB] Boot sync error:', e));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupDomHooks);
  } else {
    setupDomHooks();
  }

  window.LocalDB = LocalDB;
  window.handleMockApi = handleMockApi;

  window.UPGRADER = {
    LocalDB,
    GlobalStats,
    handleMockApi,
    renderAuthModal,
    renderDepositModal,
    openNativePaymentModal,
    closeNativePaymentModal,
    renderCardPaymentGatewayModal,
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
