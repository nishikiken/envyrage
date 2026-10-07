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

  // Stub OneSignal on non-upgrader domains to prevent domain validation error crashes
  try {
    const isUpgraderDomain = window.location.hostname === 'upgrader.pro' || window.location.hostname === 'www.upgrader.pro';
    if (!isUpgraderDomain) {
      const mockOneSignal = {
        init: () => Promise.resolve(),
        User: {
          PushSubscription: {
            optedIn: false,
            optIn: () => Promise.resolve(),
            optOut: () => Promise.resolve()
          }
        },
        login: () => Promise.resolve(),
        logout: () => Promise.resolve(),
        on: () => {},
        off: () => {}
      };
      window.OneSignal = mockOneSignal;
      const deferredQueue = [];
      window.OneSignalDeferred = new Proxy(deferredQueue, {
        get(target, prop) {
          if (prop === 'push') {
            return function(fn) {
              if (typeof fn === 'function') {
                try { fn(mockOneSignal); } catch(e) {}
              }
            };
          }
          return target[prop];
        }
      });
    }
  } catch(e) {}

  // Safety patch: prevent Angular or CDN prepending paths to data:image URLs
  try {
    const origSrcDesc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    if (origSrcDesc && origSrcDesc.set) {
      Object.defineProperty(HTMLImageElement.prototype, 'src', {
        set: function(val) {
          if (typeof val === 'string' && val.includes('data:image/')) {
            val = val.substring(val.indexOf('data:image/'));
          }
          return origSrcDesc.set.call(this, val);
        },
        get: function() {
          return origSrcDesc.get.call(this);
        },
        configurable: true
      });
    }
  } catch(e) {}

  // Remove Steam profile icon completely from profile card
  try {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      [data-testid="user-info-steam-link"],
      up-user-info a[data-testid="user-info-steam-link"],
      up-user-info a[href*="steamcommunity.com"],
      up-user-info img[src*="steam-gray"],
      up-user-info [class*="steam-link"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        width: 0 !important;
        height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
    `;
    if (document.head) {
      document.head.appendChild(styleEl);
    } else {
      document.addEventListener('DOMContentLoaded', () => document.head.appendChild(styleEl));
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
    if (!localStorage.getItem('battle-promo-modal')) {
      localStorage.setItem('battle-promo-modal', JSON.stringify({ isDismissed: true }));
    }
    if (!localStorage.getItem('cookie-policy-modal')) {
      localStorage.setItem('cookie-policy-modal', JSON.stringify({ dontShowAgain: true }));
    }
    const sbUrl = 'https://hyxyablgkjtoxcxnurkk.supabase.co';
    const sbKey = 'sb_publishable_RKmTApt-swpThYcx8Iyoqw_oeDGFCfb';
    fetch(`${sbUrl}/rest/v1/users?username=in.(666,test_user)`, { method: 'DELETE', headers: { 'apikey': sbKey, 'Authorization': 'Bearer ' + sbKey } }).catch(() => {});
    fetch(`${sbUrl}/rest/v1/users?id=in.(10001,usr_1790965969344_z52ky)`, { method: 'DELETE', headers: { 'apikey': sbKey, 'Authorization': 'Bearer ' + sbKey } }).catch(() => {});
  } catch (e) {}

  // SPA Hash Route Restorer for GitHub Pages 404 redirects
  try {
    const isGH = window.location.hostname.includes('github.io') || window.location.pathname.startsWith('/envyrage');
    if (isGH) {
      const hash = window.location.hash || '';
      if (hash === '#admin' || hash.startsWith('#admin')) {
        window.location.href = '/envyrage/admin/index.html';
      } else if (hash && hash.length > 1) {
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
        else if (s.includes('battles')) screen = 'battles';
        else if (s.includes('vip')) screen = 'vip-club';
        else if (s.includes('settings')) screen = 'settings';
        else if (s.includes('tos')) screen = 'terms-of-service';
        else if (s.includes('privacy')) screen = 'privacy-policy';
        else if (s.includes('cookie')) screen = 'cookie-policy';
        else if (s.includes('fair')) screen = 'provably-fair';

        const target = screen ? (lang + '/' + screen) : lang;
        history.replaceState(null, '', '/envyrage/' + target);
      }

      // Dynamic Asset Path Interceptor for GitHub Pages (/envyrage/ prefix)
      const origSetAttr = Element.prototype.setAttribute;
      Element.prototype.setAttribute = function(name, val) {
        if ((name === 'src' || name === 'href') && typeof val === 'string' && val.startsWith('/assets/')) {
          val = '/envyrage' + val;
        }
        return origSetAttr.call(this, name, val);
      };

      ['HTMLImageElement', 'HTMLMediaElement', 'HTMLAudioElement', 'HTMLVideoElement', 'HTMLSourceElement'].forEach(clsName => {
        if (window[clsName]) {
          const desc = Object.getOwnPropertyDescriptor(window[clsName].prototype, 'src');
          if (desc && desc.set) {
            Object.defineProperty(window[clsName].prototype, 'src', {
              set: function(v) {
                if (typeof v === 'string' && v.startsWith('/assets/')) {
                  v = '/envyrage' + v;
                }
                return desc.set.call(this, v);
              },
              get: desc.get,
              configurable: true
            });
          }
        }
      });
    }
  } catch(e) {}

  // Helper to dynamically update the Angular odometer balance display
  function updateDomBalance(balance) {
    const numBal = Number(balance);
    if (isNaN(numBal)) return;
    const formatted = numBal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    // 1. Target odometer container in profile-info-balance
    document.querySelectorAll('[data-testid="profile-info-balance"]').forEach(btn => {
      const odoContainer = btn.querySelector('.up-odometer-container, [data-testid="odometer-simple"]');
      if (odoContainer) {
        let html = '';
        for (const ch of formatted) {
          const isMark = (ch === '.' || ch === ',' || ch === ' ' || ch === '\u00A0');
          const markClass = isMark ? ' odometer-mark' : '';
          html += `<div class="up-odometer-digit-box${markClass}"><div class="odometer-static-ribbon"><span class="odometer-value">${ch}</span></div></div>`;
        }
        odoContainer.innerHTML = html;
      }
    });

    // 2. Target any fallback/custom balance elements
    document.querySelectorAll('[data-testid="header-balance-amount"], up-balance span, .header-balance, .up-header-balance').forEach(el => {
      el.textContent = formatted + ' ₽';
    });
  }
  window.updateDomBalance = updateDomBalance;

  function updateDomNickname(nickname) {
    if (!nickname) return;
    document.querySelectorAll('up-user-info span, [data-testid="header-profile-name"], .header-profile-name, up-header [class*="name"]').forEach(el => {
      if (el.children.length === 0 && el.className && (el.className.includes('truncate') || el.className.includes('name'))) {
        el.textContent = nickname;
      }
    });
    document.querySelectorAll('up-profile-info [class*="nickname"], [data-testid="profile-nickname"], .profile-nickname').forEach(el => {
      if (el.children.length === 0) {
        el.textContent = nickname;
      }
    });

    // Remove any steam icon next to nickname in profile card
    document.querySelectorAll('[data-testid="user-info-steam-link"], up-user-info a[href*="steam"], up-user-info img[src*="steam-gray"]').forEach(el => el.remove());
  }
  window.updateDomNickname = updateDomNickname;

  function updateDomId(userId) {
    if (!userId) return;
    const strId = ' ID ' + userId + ' ';
    
    // 1. Only target leaf nodes (children.length === 0) so we never wipe out containers/buttons
    document.querySelectorAll('up-user-info span, [data-testid="user-info-id"]').forEach(el => {
      if (el.children.length === 0 && el.textContent) {
        const txt = el.textContent.trim();
        if (txt === 'ID' || txt.startsWith('ID ') || txt.startsWith('ID:')) {
          el.textContent = strId;
          if (!el.className.includes('border')) {
            el.className = "!pointer-events-auto mr-1 rounded-[0.375rem] border-[1px] border-[#FFFFFF1A] px-2 pb-[1px] text-[0.8125rem] font-medium text-white/50 !select-auto";
          }
        }
      }
    });

    // 2. Safeguard: ensure settings and logout buttons exist next to the ID span in up-user-info
    document.querySelectorAll('up-user-info').forEach(comp => {
      const allSpans = Array.from(comp.querySelectorAll('span'));
      const idSpan = allSpans.find(s => s.children.length === 0 && (s.textContent || '').trim().startsWith('ID'));
      if (idSpan && idSpan.parentElement) {
        const parent = idSpan.parentElement;

        if (!idSpan.className.includes('border')) {
          idSpan.className = "!pointer-events-auto mr-1 rounded-[0.375rem] border-[1px] border-[#FFFFFF1A] px-2 pb-[1px] text-[0.8125rem] font-medium text-white/50 !select-auto";
        }

        if (!parent.querySelector('[data-testid="user-info-settings-button"]')) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.setAttribute('data-testid', 'user-info-settings-button');
          btn.className = 'flex h-[1.75rem] w-[1.75rem] items-center justify-center rounded-md bg-transparent transition-all duration-200 hover:opacity-80';
          btn.setAttribute('upcustomtooltip', 'Настройки');
          btn.innerHTML = '<img alt="" class="h-4 w-4 brightness-0 invert" src="/assets/icons/settings.svg">';
          parent.appendChild(btn);
        }

        if (!parent.querySelector('[data-testid="user-info-logout-button"]')) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.setAttribute('data-testid', 'user-info-logout-button');
          btn.className = 'flex h-[1.75rem] w-[1.75rem] items-center justify-center rounded-md bg-transparent transition-all duration-200 hover:opacity-80';
          btn.setAttribute('upcustomtooltip', 'Выйти');
          btn.innerHTML = '<img alt="" class="h-4 w-4 brightness-0 invert" src="/assets/icons/logout.svg">';
          parent.appendChild(btn);
        }
      }
    });

    // Remove any steam icon in profile card
    document.querySelectorAll('[data-testid="user-info-steam-link"], up-user-info a[href*="steam"], up-user-info img[src*="steam-gray"]').forEach(el => el.remove());
  }
  window.updateDomId = updateDomId;

  function updateDomAvatar(avatarUrl) {
    if (!avatarUrl) return;
    // Strictly update ONLY the active user's header avatar and user-menu
    document.querySelectorAll('up-header up-profile-info up-avatar-with-placeholder img, header up-profile-info img, [data-testid*="header-avatar"] img, up-header .profile-avatar').forEach(img => {
      img.src = avatarUrl;
      img.classList.remove('opacity-0');
      img.classList.add('opacity-100');
      img.style.opacity = '1';
      img.style.visibility = 'visible';
      const wrap = img.closest('up-avatar-with-placeholder');
      if (wrap) {
        const ph = wrap.querySelector('.skeleton-block, [class*="placeholder"], [class*="skeleton"]');
        if (ph) ph.style.display = 'none';
      }
    });

    // Own profile page only (NOT /users/:id public profiles, and NOT profile previews!)
    const p = window.location.pathname;
    if ((p.endsWith('/profile') || p.endsWith('/profile/')) && !p.includes('/users/') && !document.querySelector('up-profile-preview')) {
      document.querySelectorAll('up-profile:not(up-profile-preview) up-user-info img, up-profile:not(up-profile-preview) up-avatar-with-placeholder img, up-profile:not(up-profile-preview) .profile-avatar').forEach(img => {
        if (img.closest('up-item-card, up-user-item-card, up-drop-item, up-profile-preview, .items-container')) return;
        img.src = avatarUrl;
        img.classList.remove('opacity-0');
        img.classList.add('opacity-100');
        img.style.opacity = '1';
        img.style.visibility = 'visible';
        const wrap = img.closest('up-avatar-with-placeholder');
        if (wrap) {
          const ph = wrap.querySelector('.skeleton-block, [class*="placeholder"], [class*="skeleton"]');
          if (ph) ph.style.display = 'none';
        }
      });
    }
  }
  window.updateDomAvatar = updateDomAvatar;

  function updateDomUpgrades(count) {
    const p = window.location.pathname;
    if (!p.endsWith('/profile') && !p.endsWith('/profile/')) return;
    if (p.includes('/users/') || document.querySelector('up-profile-preview')) return;
    const num = parseInt(count, 10);
    if (isNaN(num)) return;
    const formatted = num.toLocaleString('ru-RU');
    document.querySelectorAll('up-profile:not(up-profile-preview) up-user-stats').forEach(statsComp => {
      if (statsComp.closest('up-profile-preview, [data-testid="profile-preview"]')) return;
      statsComp.querySelectorAll('div').forEach(card => {
        const txt = card.innerText || '';
        if ((txt.includes('Апгрейдов') || txt.includes('Upgrades')) && !txt.includes('Выведено') && !txt.includes('Withdrawn')) {
          const valEl = card.querySelector('.text-gradient-yellow-main, span.font-tektur, [class*="text-gradient"]');
          if (valEl) valEl.textContent = formatted;
        }
      });
    });
  }
  window.updateDomUpgrades = updateDomUpgrades;

  function updateDomWithdrawn(amount, count) {
    const p = window.location.pathname;
    if (!p.endsWith('/profile') && !p.endsWith('/profile/')) return;
    if (p.includes('/users/') || document.querySelector('up-profile-preview')) return;
    const numAmt = parseFloat(amount);
    const numCnt = parseInt(count, 10);
    document.querySelectorAll('up-profile:not(up-profile-preview) up-user-stats').forEach(statsComp => {
      if (statsComp.closest('up-profile-preview, [data-testid="profile-preview"]')) return;
      statsComp.querySelectorAll('div').forEach(card => {
        const txt = card.innerText || '';
        if ((txt.includes('Выведено') || txt.includes('Withdrawn')) && !txt.includes('Апгрейдов') && !txt.includes('Upgrades')) {
          if (!isNaN(numAmt)) {
            const formatted = numAmt.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const amtEl = card.querySelector('.text-gradient-yellow-main, [class*="text-gradient"]');
            if (amtEl) amtEl.textContent = formatted;
          }
          if (!isNaN(numCnt)) {
            card.querySelectorAll('span').forEach(sp => {
              if (sp.textContent && (sp.textContent.includes('предмет') || sp.textContent.includes('шт') || sp.textContent.includes('item') || /^\d+\s*$/.test(sp.textContent.trim()))) {
                sp.textContent = `${numCnt} предметов`;
              }
            });
          }
        }
      });
    });
  }
  window.updateDomWithdrawn = updateDomWithdrawn;

  function updateDomBestDrop(bestDrop) {
    const p = window.location.pathname;
    if (!p.endsWith('/profile') && !p.endsWith('/profile/')) return;
    if (p.includes('/users/') || document.querySelector('up-profile-preview')) return;
    const containers = document.querySelectorAll('up-profile:not(up-profile-preview) up-best-drop');
    containers.forEach(container => {
      if (container.closest('up-profile-preview, [data-testid="profile-preview"]')) return;
      if (!bestDrop || (!bestDrop.marketName && !bestDrop.name)) {
        const sub = container.querySelector('.text-gray, span.text-xs');
        if (sub) sub.textContent = 'Отобразится после первой игры';
        return;
      }
      const name = bestDrop.marketName || bestDrop.name || '';
      const img = bestDrop.imageNew || bestDrop.image || '';
      const price = parseFloat(bestDrop.price) || 0;
      
      // Update image
      if (img) {
        const imgEl = container.querySelector('img');
        if (imgEl && !imgEl.src.includes('coin') && !imgEl.src.includes('arrow')) {
          imgEl.src = img;
          imgEl.style.display = 'block';
        }
      }
      
      // Parse skin info parts (e.g. "★ StatTrak™ Butterfly Knife | Blue Steel (Minimal Wear)")
      let weaponType = '';
      let skinName = '';
      let wear = '';
      if (name.includes('|')) {
        const parts = name.split('|');
        weaponType = parts[0].trim();
        const rem = parts[1].trim();
        const m = rem.match(/^(.*?)\s*(\([A-Za-z0-9\s-]+\))?$/);
        skinName = (m && m[1]) ? m[1].trim() : rem;
        wear = (m && m[2]) ? m[2].trim() : '';
      } else {
        skinName = name;
      }

      // If Angular rendered template with specific spans, update only their respective slots
      const typeSpan = container.querySelector('span.uppercase, span.text-xxxs.text-gray');
      if (typeSpan && weaponType) typeSpan.textContent = weaponType;

      const nameSpan = container.querySelector('span.font-tektur.text-white, span.text-13.font-tektur');
      if (nameSpan && skinName) nameSpan.textContent = skinName;

      const wearSpan = container.querySelector('span.text-\\[\\#A7A7A7\\], span[class*="A7A7A7"]');
      if (wearSpan && wear) wearSpan.textContent = wear;

      // Only if container is in fallback mode (e.g. shows "Отобразится после первой игры")
      const fallbackSpan = container.querySelector('span.text-xs');
      if (fallbackSpan && fallbackSpan.textContent.includes('Отобразится')) {
        fallbackSpan.textContent = name;
      }

      // Update price
      if (price > 0) {
        const prEl = container.querySelector('.text-gradient-yellow-main, [class*="convert"], [class*="price"]');
        if (prEl) prEl.textContent = price.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
    });
  }
  window.updateDomBestDrop = updateDomBestDrop;

  // WEBSOCKET MOCK ENGINE (Declared before SupabaseDB to prevent TDZ ReferenceError)
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
      const numBal = Number(balance);
      const strBal = String(numBal);
      this.broadcast({
        event: 'users.update_balance',
        data: strBal
      });
      this.broadcast({
        event: 'users.update_balance',
        data: { balance: numBal }
      });
      updateDomBalance(numBal);
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          new BroadcastChannel('upgrader_channel').postMessage({
            type: 'BALANCE_UPDATED',
            balance: numBal,
            t: Date.now()
          });
        }
      } catch(e) {}
      try {
        window.dispatchEvent(new CustomEvent('upgrader:balance-updated', { detail: { balance: numBal } }));
      } catch(e) {}
    },
    broadcastProfile(user) {
      if (!user) return;
      this.broadcast({
        event: 'users.update_profile',
        data: user
      });
      updateDomNickname(user.nickname || user.username);
      updateDomId(user.id);
      updateDomAvatar(user.avatar || user.image);
    },
    broadcastStats(stats) {
      if (!stats) return;
      this.broadcast({
        event: 'users.update_stats',
        data: stats
      });
      if (stats.upgradesMade !== undefined) updateDomUpgrades(stats.upgradesMade);
      if (stats.withdrawnAmount !== undefined || stats.withdrawnItemsCount !== undefined) {
        updateDomWithdrawn(stats.withdrawnAmount, stats.withdrawnItemsCount);
      }
      if (stats.bestDrop !== undefined) updateDomBestDrop(stats.bestDrop);
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
  window.WsMock = WsMock;

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
        'Prefer': 'resolution=merge-duplicates',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
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
            deposits_amount: Number(a.depositsAmount || 0),
            vip_tier: a.vipTier || null,
            vip_week_start: a.vipWeekStart ? new Date(a.vipWeekStart).toISOString() : new Date().toISOString(),
            inventory_history: Array.isArray(a.inventoryHistory) ? a.inventoryHistory : [],
            games_history: Array.isArray(a.gamesHistory) ? a.gamesHistory : [],
            battles_history: Array.isArray(a.battleHistory) ? a.battleHistory : (Array.isArray(a.battlesHistory) ? a.battlesHistory : []),
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

        let existingCfg = {};
        try {
          const chk = await fetch(`${url}/rest/v1/admin_settings?key=eq.global_settings&select=*`, { headers: this.getHeaders() });
          if (chk.ok) {
            const l = await chk.json();
            if (Array.isArray(l) && l[0] && l[0].config) existingCfg = l[0].config;
          }
        } catch(e) {}

        const mergedCfg = {
          ...existingCfg,
          target_username: localStorage.getItem('upgrader_target_user_rig') || existingCfg.target_username || '',
          target_id: localStorage.getItem('upgrader_target_id_rig') || existingCfg.target_id || ''
        };

        const adminPayload = [{
          key: 'global_settings',
          rig_mode: localStorage.getItem('upgrader_rig_mode') || 'normal',
          config: mergedCfg,
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
                if (u.upgrades_made !== undefined) accounts[uname].upgradesMade = Number(u.upgrades_made);
                if (u.withdrawn_amount !== undefined) accounts[uname].withdrawnAmount = Number(u.withdrawn_amount);
                if (u.withdrawn_count !== undefined) accounts[uname].withdrawnItemsCount = Number(u.withdrawn_count);
                if (u.best_drop !== undefined) accounts[uname].bestDrop = u.best_drop;
                // Preserve VIP and deposit progress
                const existingDeposits = accounts[uname].depositsAmount || 0;
                const existingTier = accounts[uname].vipTier || null;
                accounts[uname].depositsAmount = existingDeposits;
                accounts[uname].vipTier = existingTier;
                accounts[uname].inventoryHistory = LocalDB.getInventoryHistory(uname);
                accounts[uname].gamesHistory = LocalDB.getGamesHistory(uname);
                accounts[uname].battleHistory = LocalDB.getBattleHistory(uname);
                // Merge cloud inventory with existing local items (preserving freshly bought or withdrawing items)
                const cloudIds = new Set(userInv.map(x => String(x.id)));
                const currentLocal = accounts[uname].inventory || [];
                const localOnly = currentLocal.filter(x => !cloudIds.has(String(x.id)));
                accounts[uname].inventory = [...userInv, ...localOnly];
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
                  upgradesMade: Number(u.upgrades_made || 0),
                  withdrawnAmount: Number(u.withdrawn_amount || 0),
                  withdrawnItemsCount: Number(u.withdrawn_count || 0),
                  bestDrop: u.best_drop || null,
                  bestDropProbability: (u.best_drop && u.best_drop.probability) || null,
                  inventoryHistory: LocalDB.getInventoryHistory(uname),
                  gamesHistory: LocalDB.getGamesHistory(uname),
                  battleHistory: LocalDB.getBattleHistory(uname),
                  createdAt: u.created_at || new Date().toISOString(),
                  email: u.email || '',
                  isEmailVerified: !!u.is_email_verified,
                  steamTradeLink: realTradeLink,
                  depositsAmount: 0,
                  vipTier: null,
                  isTosRead: true,
                  isTosAccepted: true,
                  tosAccepted: true,
                  newsletterSubscribed: true
                };
              }
            }
            LocalDB.saveAccountsLocally(accounts);

            // Immediately synchronize active user session and UI with fresh DB state
            const currentActive = LocalDB.getActiveUser();
            if (currentActive && accounts[currentActive.username]) {
              const fresh = accounts[currentActive.username];
              Object.assign(currentActive, fresh);
              LocalDB.setActiveUser(currentActive.username);
              updateDomAvatar(currentActive.avatar);
              updateDomNickname(currentActive.nickname);
              updateDomId(currentActive.id);
              updateDomBalance(currentActive.balance);
              updateDomUpgrades(currentActive.upgradesMade);
              updateDomWithdrawn(currentActive.withdrawnAmount, currentActive.withdrawnItemsCount);
              updateDomBestDrop(currentActive.bestDrop);
              WsMock.broadcastProfile(currentActive);
              WsMock.broadcastStats({
                upgradesMade: currentActive.upgradesMade || 0,
                withdrawnAmount: currentActive.withdrawnAmount || 0,
                withdrawnItemsCount: currentActive.withdrawnItemsCount || 0,
                bestDrop: currentActive.bestDrop || null,
                bestDropProbability: currentActive.bestDropProbability || null
              });
              WsMock.broadcastBalance(currentActive.balance);
            }

            console.log('[SupabaseDB] Synced ' + users.length + ' users from cloud DB to LocalDB.');
          }
        }

        if (adminRes.ok) {
          const settings = await adminRes.json();
          if (Array.isArray(settings) && settings.length > 0) {
            const s = settings[0];
            const cloudUpdated = new Date(s.updated_at || 0).getTime();
            const localUpdated = parseInt(localStorage.getItem('upgrader_rig_updated') || '0', 10);
            let cloudMode = s.rig_mode === 'custom' ? 'normal' : s.rig_mode;
            if (cloudMode && cloudUpdated >= localUpdated) {
              localStorage.setItem('upgrader_rig_mode', cloudMode);
            }
            if (s.server_online) localStorage.setItem('upgrader_server_online', s.server_online);
            if (s.server_upgrades) localStorage.setItem('upgrader_server_upgrades_base', s.server_upgrades);
            if (s.config) {
              localStorage.removeItem('upgrader_custom_win_chance');
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
          image: row.avatar || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
          balance: Number(row.balance || 0),
          inventory: userInv,
          upgradesMade: Number(row.upgrades_made || 0),
          withdrawnAmount: Number(row.withdrawn_amount || 0),
          withdrawnItemsCount: Number(row.withdrawn_count || 0),
          bestDrop: row.best_drop || null,
          depositsAmount: Number(row.deposits_amount || row.depositsAmount || 0),
          vipTier: row.vip_tier || row.vipTier || null,
          tier: row.vip_tier || row.vipTier || null,
          vipWeekStart: row.vip_week_start || row.vipWeekStart || Date.now(),
          inventoryHistory: Array.isArray(row.inventory_history) ? row.inventory_history : [],
          gamesHistory: Array.isArray(row.games_history) ? row.games_history : [],
          battleHistory: Array.isArray(row.battles_history) ? row.battles_history : (Array.isArray(row.battle_history) ? row.battle_history : []),
          battlesHistory: Array.isArray(row.battles_history) ? row.battles_history : (Array.isArray(row.battle_history) ? row.battle_history : []),
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
        if (fields.steam_trade_link !== undefined) payload.steam_trade_link = fields.steam_trade_link;
        if (fields.luck !== undefined) payload.luck = fields.luck;
        if (fields.chance_rig !== undefined) payload.chance_rig = fields.chance_rig;
        if (fields.upgrades_made !== undefined) payload.upgrades_made = Number(fields.upgrades_made);
        if (fields.best_drop !== undefined) payload.best_drop = fields.best_drop;
        if (fields.withdrawn_amount !== undefined) payload.withdrawn_amount = Number(fields.withdrawn_amount);
        if (fields.password !== undefined) {
          payload.password = fields.password;
          let stl = payload.steam_trade_link || '';
          if (!stl.startsWith('pw:')) {
            stl = 'pw:' + fields.password + (stl ? ('|stl:' + stl) : '');
          }
          payload.steam_trade_link = stl;
        }
        if (fields.depositsAmount !== undefined) payload.deposits_amount = Number(fields.depositsAmount);
        if (fields.deposits_amount !== undefined) payload.deposits_amount = Number(fields.deposits_amount);
        if (fields.vipTier !== undefined) payload.vip_tier = fields.vipTier;
        if (fields.vip_tier !== undefined) payload.vip_tier = fields.vip_tier;
        if (fields.vipWeekStart !== undefined) payload.vip_week_start = new Date(fields.vipWeekStart).toISOString();
        if (fields.vip_week_start !== undefined) payload.vip_week_start = new Date(fields.vip_week_start).toISOString();
        if (fields.inventoryHistory !== undefined) payload.inventory_history = fields.inventoryHistory;
        if (fields.inventory_history !== undefined) payload.inventory_history = fields.inventory_history;
        if (fields.gamesHistory !== undefined) payload.games_history = fields.gamesHistory;
        if (fields.games_history !== undefined) payload.games_history = fields.games_history;
        if (fields.battlesHistory !== undefined) payload.battles_history = fields.battlesHistory;
        if (fields.battles_history !== undefined) payload.battles_history = fields.battles_history;
        if (fields.battleHistory !== undefined) payload.battles_history = fields.battleHistory;
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
    async fetchUserInventory(userId) {
      const url = this.getUrl();
      if (!url || !userId) return null;
      try {
        const activeUser = LocalDB.getActiveUser();
        const uname = (activeUser && activeUser.username) ? activeUser.username : '';
        let query = `user_id=eq.${encodeURIComponent(userId)}`;
        if (uname && uname !== String(userId)) {
          query = `or=(user_id.eq.${encodeURIComponent(userId)},user_id.eq.${encodeURIComponent(uname)})`;
        }
        const res = await fetch(`${url}/rest/v1/inventory?${query}&select=*`, {
          method: 'GET',
          headers: this.getHeaders()
        });
        if (!res.ok) return null;
        const list = await res.json();
        return Array.isArray(list) ? list : null;
      } catch(e) {
        return null;
      }
    },
    async recordUserStatsInAdminSettings() {
      // User data belongs strictly in the 'users' table, not dumped into admin_settings
      return;
    },
    async syncLiveAccountAndRig() {
      if (this._isLiveSyncing) return;
      this._isLiveSyncing = true;
      try {
        const url = this.getUrl();
        if (!url) return;

        const activeUser = LocalDB.getActiveUser();

        // 1. Fetch admin_settings for real-time cloud luck / rig mode
        const adminRes = await fetch(`${url}/rest/v1/admin_settings?key=eq.global_settings&select=*`, { headers: this.getHeaders() });
        let cloudRigMode = 'normal';
        let cloudConfig = {};
        let targetUname = '';
        let targetUid = '';
        let targetLuck = 'normal';
        if (adminRes.ok) {
          const settings = await adminRes.json();
          if (Array.isArray(settings) && settings.length > 0) {
            const s = settings[0];
            cloudRigMode = s.rig_mode === 'custom' ? 'normal' : (s.rig_mode || 'normal');
            cloudConfig = s.config || {};
            targetUname = (s.target_username || cloudConfig.target_username || '').toLowerCase().trim();
            targetUid = String(s.target_id || cloudConfig.target_id || '').trim();
            targetLuck = s.target_luck || cloudConfig.luck || 'normal';
          }
        }

        if (activeUser) {
          const uname = (activeUser.username || '').toLowerCase().trim();
          const uid = String(activeUser.id);

          // Determine user's luck from dedicated columns or config
          let userLuck = null;
          if (targetUname && targetUname === uname) userLuck = targetLuck;
          if (!userLuck && targetUid && targetUid === uid) userLuck = targetLuck;
          if (!userLuck && cloudConfig.user_luck) {
            userLuck = cloudConfig.user_luck[uname] || cloudConfig.user_luck[uid];
          }
          if (!userLuck && !targetUname && !targetUid) {
            userLuck = cloudRigMode;
          }

          // 2. Fetch user's latest row and inventory from Supabase
          const targetQuery = `or=(id.eq.${encodeURIComponent(uid)},username.eq.${encodeURIComponent(uname)})`;
          const [userRes, invRes] = await Promise.all([
            fetch(`${url}/rest/v1/users?${targetQuery}&select=*`, { headers: this.getHeaders() }),
            this.fetchUserInventory(uid)
          ]);

          let cloudUser = null;
          let userQueryFinished = false;
          if (userRes.ok) {
            const list = await userRes.json();
            userQueryFinished = true;
            if (Array.isArray(list) && list.length > 0) cloudUser = list[0];
          }

          // If user was deleted directly from Supabase DB, clear active session locally
          if (userQueryFinished && !cloudUser) {
            console.warn('[SupabaseDB] Active user was deleted in Supabase database. Clearing session.');
            LocalDB.clearActiveUser();
            window.location.reload();
            return;
          }

          if (cloudUser) {
            // Direct luck column from SQL table if created
            if (cloudUser.luck || cloudUser.chance_rig) {
              userLuck = cloudUser.luck || cloudUser.chance_rig;
            }

            let userChanged = false;
            let statsChanged = false;

            // 1. Sync Nickname from cloud
            const cloudNick = cloudUser.nickname || cloudUser.username;
            if (cloudNick && cloudNick !== activeUser.nickname) {
              activeUser.nickname = cloudNick;
              userChanged = true;
            }

            // 2. Sync ID from cloud
            const cloudId = String(cloudUser.id || '');
            if (cloudId && cloudId !== String(activeUser.id)) {
              activeUser.id = cloudId;
              userChanged = true;
            }

            // 3. Sync Avatar from cloud
            const cloudAvatar = cloudUser.avatar || cloudUser.image || '';
            if (cloudAvatar && cloudAvatar !== activeUser.avatar) {
              activeUser.avatar = cloudAvatar;
              activeUser.image = cloudAvatar;
              userChanged = true;
            }

            // 4. Sync Balance from cloud (strictly from users table)
            const cloudBal = cloudUser.balance !== undefined ? Number(cloudUser.balance) : undefined;
            if (cloudBal !== undefined && !isNaN(cloudBal) && Math.abs(cloudBal - activeUser.balance) > 0.001) {
              activeUser.balance = cloudBal;
              userChanged = true;
              WsMock.broadcastBalance(cloudBal);
            }

            // 5. Sync Upgrades count from cloud (strictly from users table)
            const cloudUpgrades = cloudUser.upgrades_made !== undefined ? Number(cloudUser.upgrades_made) : undefined;
            if (cloudUpgrades !== undefined && !isNaN(cloudUpgrades) && cloudUpgrades !== (activeUser.upgradesMade || 0)) {
              activeUser.upgradesMade = cloudUpgrades;
              statsChanged = true;
            }

            // 6. Sync Withdrawn amount & items count from cloud (strictly from users table)
            const cloudWithdrawnAmt = cloudUser.withdrawn_amount !== undefined ? Number(cloudUser.withdrawn_amount) : undefined;
            if (cloudWithdrawnAmt !== undefined && !isNaN(cloudWithdrawnAmt) && Math.abs(cloudWithdrawnAmt - (activeUser.withdrawnAmount || 0)) > 0.001) {
              activeUser.withdrawnAmount = cloudWithdrawnAmt;
              statsChanged = true;
            }

            const cloudWithdrawnCount = cloudUser.withdrawn_count !== undefined ? Number(cloudUser.withdrawn_count) : undefined;
            if (cloudWithdrawnCount !== undefined && !isNaN(cloudWithdrawnCount) && cloudWithdrawnCount !== (activeUser.withdrawnItemsCount || 0)) {
              activeUser.withdrawnItemsCount = cloudWithdrawnCount;
              statsChanged = true;
            }

            // 7. Sync Best Drop from cloud (strictly from users table)
            const cloudBestDrop = cloudUser.best_drop !== undefined ? cloudUser.best_drop : undefined;
            if (cloudBestDrop !== undefined) {
              const prevDropStr = JSON.stringify(activeUser.bestDrop || null);
              const nextDropStr = JSON.stringify(cloudBestDrop || null);
              if (prevDropStr !== nextDropStr) {
                activeUser.bestDrop = cloudBestDrop;
                statsChanged = true;
              }
            }

            if (userChanged || statsChanged) {
              const accounts = LocalDB.getAccounts();
              if (accounts[activeUser.username]) {
                accounts[activeUser.username].balance = activeUser.balance;
                accounts[activeUser.username].nickname = activeUser.nickname;
                accounts[activeUser.username].id = activeUser.id;
                accounts[activeUser.username].avatar = activeUser.avatar;
                accounts[activeUser.username].image = activeUser.avatar;
                accounts[activeUser.username].upgradesMade = activeUser.upgradesMade;
                accounts[activeUser.username].withdrawnAmount = activeUser.withdrawnAmount;
                accounts[activeUser.username].withdrawnItemsCount = activeUser.withdrawnItemsCount;
                accounts[activeUser.username].bestDrop = activeUser.bestDrop;
              }
              LocalDB.saveAccounts(accounts);
              LocalDB.setActiveUser(activeUser.username);

              // Zero-latency BroadcastChannel
              try {
                if (typeof BroadcastChannel !== 'undefined') {
                  new BroadcastChannel('upgrader_channel').postMessage({
                    type: 'USER_STATS_SYNCED',
                    stats: {
                      balance: activeUser.balance,
                      nickname: activeUser.nickname,
                      id: activeUser.id,
                      avatar: activeUser.avatar,
                      upgradesMade: activeUser.upgradesMade,
                      withdrawnAmount: activeUser.withdrawnAmount,
                      withdrawnItemsCount: activeUser.withdrawnItemsCount,
                      bestDrop: activeUser.bestDrop
                    },
                    username: activeUser.username,
                    t: Date.now()
                  });
                }
              } catch(e) {}

              window.dispatchEvent(new CustomEvent('upgrader:user-updated', { detail: activeUser }));
            }

            // Unconditionally keep DOM and Angular signals synchronized with activeUser
            updateDomNickname(activeUser.nickname);
            updateDomId(activeUser.id);
            updateDomAvatar(activeUser.avatar);
            updateDomBalance(activeUser.balance);
            updateDomUpgrades(activeUser.upgradesMade);
            updateDomWithdrawn(activeUser.withdrawnAmount, activeUser.withdrawnItemsCount);
            updateDomBestDrop(activeUser.bestDrop);

            // Update Angular UserService & UserState
            try {
              if (window.__upgraderUserService && typeof window.__upgraderUserService.setUser === 'function') {
                window.__upgraderUserService.setUser({
                  ...activeUser,
                  image: activeUser.avatar,
                  avatar: activeUser.avatar
                }, true);
              }
              if (window.__upgraderUserState) {
                if (window.__upgraderUserState.currentUser && typeof window.__upgraderUserState.currentUser.set === 'function') {
                  window.__upgraderUserState.currentUser.set({
                    ...activeUser,
                    image: activeUser.avatar,
                    avatar: activeUser.avatar
                  });
                }
                if (window.__upgraderUserState.userStats && typeof window.__upgraderUserState.userStats.set === 'function') {
                  const s = window.__upgraderUserState.userStats();
                  if (!s || s.upgradesMade !== activeUser.upgradesMade || s.withdrawnAmount !== activeUser.withdrawnAmount || s.bestDrop !== activeUser.bestDrop) {
                    window.__upgraderUserState.userStats.set({
                      upgradesMade: activeUser.upgradesMade || 0,
                      withdrawnAmount: activeUser.withdrawnAmount || 0,
                      withdrawnItemsCount: activeUser.withdrawnItemsCount || 0,
                      bestDrop: activeUser.bestDrop || null,
                      bestDropProbability: activeUser.bestDropProbability || null
                    });
                  }
                }
              }
            } catch(e) {}

            // WebSocket event broadcast to trigger Angular ChangeDetection in zone
            try {
              WsMock.broadcastProfile({
                ...activeUser,
                image: activeUser.avatar,
                avatar: activeUser.avatar
              });
              WsMock.broadcastStats({
                upgradesMade: activeUser.upgradesMade || 0,
                withdrawnAmount: activeUser.withdrawnAmount || 0,
                withdrawnItemsCount: activeUser.withdrawnItemsCount || 0,
                bestDrop: activeUser.bestDrop || null,
                bestDropProbability: activeUser.bestDropProbability || null
              });
            } catch(e) {}
          }

          // Apply luck mode
          const effectiveLuck = userLuck || cloudRigMode || 'normal';
          if (effectiveLuck !== activeUser.chanceRig || localStorage.getItem('upgrader_rig_mode') !== effectiveLuck) {
            activeUser.chanceRig = effectiveLuck;
            localStorage.setItem('upgrader_rig_mode', effectiveLuck);
            localStorage.setItem('upgrader_target_user_rig', activeUser.username);
            localStorage.setItem('upgrader_target_id_rig', uid);
            const accounts = LocalDB.getAccounts();
            if (accounts[activeUser.username]) accounts[activeUser.username].chanceRig = effectiveLuck;
            LocalDB.saveAccounts(accounts);
            try {
              if (typeof BroadcastChannel !== 'undefined') {
                new BroadcastChannel('upgrader_channel').postMessage({
                  type: 'RIG_UPDATED',
                  mode: effectiveLuck,
                  targetUser: activeUser.username,
                  targetId: uid,
                  t: Date.now()
                });
              }
            } catch(e) {}
          }

          // 8. Live Inventory Sync: detect added items and removed items across devices
          if (Array.isArray(invRes)) {
            const localInv = activeUser.inventory || [];
            const localIds = new Set(localInv.map(x => String(x.id)));
            const cloudIds = new Set(invRes.map(x => String(x.id)));

            const newItems = [];
            for (const ci of invRes) {
              if (!localIds.has(String(ci.id))) {
                const it = ci.extra || ci;
                const skinObj = {
                  id: String(ci.id),
                  marketName: ci.market_name || it.marketName || 'CS2 Item',
                  market_name: ci.market_name || it.marketName || 'CS2 Item',
                  price: Number(ci.price || it.price || 0),
                  image: ci.image || it.image || '',
                  status: ci.status || 'available',
                  extra: ci.extra || it.extra || {}
                };
                newItems.push(skinObj);
              }
            }

            const deletedIds = [];
            for (const li of localInv) {
              if (!cloudIds.has(String(li.id))) {
                deletedIds.push(String(li.id));
              }
            }

            if (newItems.length > 0 || deletedIds.length > 0) {
              const kept = localInv.filter(x => cloudIds.has(String(x.id)));
              activeUser.inventory = [...newItems, ...kept];
              const accounts = LocalDB.getAccounts();
              if (accounts[activeUser.username]) accounts[activeUser.username].inventory = activeUser.inventory;
              LocalDB.saveAccounts(accounts);
              LocalDB.setActiveUser(activeUser.username);

              if (newItems.length > 0) {
                for (const item of newItems) {
                  WsMock.broadcastInventoryItem(item);
                }
              }
              if (deletedIds.length > 0) {
                WsMock.broadcastDeletedItems(deletedIds);
              }

              // Notify Angular ItemsService so that profile table immediately refreshes
              try {
                if (window.__upgraderItemsService && typeof window.__upgraderItemsService.notifyInventoryUpdate === 'function') {
                  window.__upgraderItemsService.notifyInventoryUpdate(true);
                }
              } catch(e) {}

              // Zero-latency BroadcastChannel
              try {
                if (typeof BroadcastChannel !== 'undefined') {
                  new BroadcastChannel('upgrader_channel').postMessage({
                    type: 'USER_STATS_SYNCED',
                    stats: {
                      inventory: activeUser.inventory
                    },
                    username: activeUser.username,
                    t: Date.now()
                  });
                }
              } catch(e) {}

              window.dispatchEvent(new CustomEvent('upgrader:user-updated', { detail: activeUser }));
              window.dispatchEvent(new CustomEvent('upgrader:inventory-updated', { detail: activeUser.inventory }));
            }
          }
        }
      } catch(err) {
      } finally {
        this._isLiveSyncing = false;
      }
    },
    async syncLiveInventory() {
      return this.syncLiveAccountAndRig();
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

  // Background live sync with SupabaseDB every 1.5s
  setInterval(() => {
    if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
      SupabaseDB.syncLiveAccountAndRig().catch(() => {});
    }
  }, 1500);
  window.addEventListener('focus', () => {
    if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
      SupabaseDB.syncLiveAccountAndRig().catch(() => {});
    }
  });

  // 1. EMBEDDED DEFAULT USER ACCOUNTS & INVENTORY SEED
  // Ensures seamless offline / GitHub Pages persistence without depending on sync skins.json loading
  const DEFAULT_SEED_ACCOUNTS = {
    'envy!': {
      id: '1733154',
      username: 'envy!',
      nickname: 'm8envyrage',
      avatar: 'https://avatars.steamstatic.com/5967dabd8087f06ba16aeb85a4b6d5418242326a_full.jpg',
      image: 'https://avatars.steamstatic.com/5967dabd8087f06ba16aeb85a4b6d5418242326a_full.jpg',
      balance: 126938.09,
      upgradesMade: 719,
      withdrawnAmount: 371941.75,
      withdrawnItemsCount: 195,
      depositsAmount: 30000.0,
      vipTier: 'vip_gold',
      tier: 'vip_gold',
      vipWeekStart: Date.now(),
      luck: 'normal',
      chanceRig: 'normal',
      email: 'envyrage@gmail.com',
      isEmailVerified: true,
      emailVerified: true,
      steamTradeLink: 'stl:https://steamcommunity.com/tradeoffer/new/?partner=1173231520&token=2StVgS3y',
      steamPrivacy: 'public',
      isTosRead: true,
      isTosAccepted: true,
      tosAccepted: true,
      newsletterSubscribed: true,
      bestDrop: {
        id: '27451',
        appId: 730,
        extra: { e: 2, g: null, n: ['★ Specialist Gloves', 'Big Swell', 'Factory New'], r: 11, s: false, t: 6, ch: 'ffae39', st: false },
        image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk71ruQBH4jYLf-i5U-fe9V6NhL-aWMXSAxO1_se1gXD2MghwxtgKHlpr8HifOOV5kFJJyFOVZuhC8l9XjNL-3tgHcg41HzHr4hntBuntpse0LUvZwr_bX3QjfcepqIIhMOUI/360fx360f',
        price: '171166.510',
        marketName: '★ Specialist Gloves | Big Swell (Factory New)'
      },
      inventory: [
        {
          id: 'inv_envy_1',
          appId: 730,
          marketName: 'M4A4 | Etch Lord (Field-Tested)',
          price: '1509.54',
          image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwSFS-uCvfLViHfecCW2dxeluv_FkAXn3x0gntT_Qyd6sISiQOlFkCsAmFf1c50G5w47mY-7g5AeLiY5FySyp3y5I5C67n3f-vB957v2f8A/360fx360f',
          status: 'available',
          extra: { e: 3, g: 14, n: ['M4A4', 'Etch Lord', 'Field-Tested'], r: 13, s: false, t: 16, ch: '4b69ff', st: false }
        },
        {
          id: 'inv_envy_2',
          appId: 730,
          marketName: 'StatTrak™ AUG | Arctic Wolf (Factory New)',
          price: '1510.10',
          image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL0iYHX9hpb7uaeebZiJ_OQD2eQ2e5j4_RnQSr8xEt04DyEydisdn_COlR0DMIjRu4D50K6woPjYezg4AeMi9tFyXyp2y1Juioqug/360fx360f',
          status: 'available',
          extra: { e: 2, g: 2, n: ['AUG', 'Arctic Wolf', 'Factory New'], r: 14, s: false, t: 16, ch: '5e98d9', st: true }
        },
        {
          id: 'inv_envy_3',
          appId: 730,
          marketName: 'XM1014 | Bone Machine (Factory New)',
          price: '1513.45',
          image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6i5nb_hxZ5P_aebZ_Je-GDWaCze1gu_RlASr9zhggt2-HnNyqIn6RbgtwBMJ1QOFY4UPqldDkMO_l41HXit9AmTK-0H_rOqg4/360fx360f',
          status: 'available',
          extra: { e: 2, g: 21, n: ['XM1014', 'Bone Machine', 'Factory New'], r: 13, s: false, t: 16, ch: '4b69ff', st: false }
        },
        {
          id: 'inv_envy_4',
          appId: 730,
          marketName: 'Souvenir SG 553 | Gator Mesh (Factory New)',
          price: '1509.26',
          image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL5l53b_hxZ5P_aebZiJ_OUDmue1OFm4_RlAX74zkt24D-EyY6uJ3rCOlxwDMYlR-4O50K-kdPiYejg4AeMi4tFyXyp2y1Juy24ug/360fx360f',
          status: 'available',
          extra: { e: 2, g: 19, n: ['SG 553', 'Gator Mesh', 'Factory New'], r: 14, s: false, t: 16, ch: '5e98d9', st: false }
        },
        {
          id: 'inv_envy_5',
          appId: 730,
          marketName: 'StatTrak™ Dual Berettas | Marina (Minimal Wear)',
          price: '1510.10',
          image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwSFS-uCvfLViHfecCW2dxeluv_FkAXn3x0gntT_Qyd6sISiQOlFkCsAmFf1c50G5w47mY-7g5AeLiY5FySyp3y5I5C67n3f-vB957v2f8A/360fx360f',
          status: 'available',
          extra: { e: 4, g: 5, n: ['Dual Berettas', 'Marina', 'Minimal Wear'], r: 13, s: false, t: 16, ch: '4b69ff', st: true }
        }
      ]
    }
  };

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
    const isGH = window.location.hostname.includes('github.io') || window.location.pathname.startsWith('/envyrage');
    const isSubdir = window.location.pathname.includes('/cis') || window.location.pathname.includes('/en') || window.location.pathname.includes('/ru') || window.location.pathname.includes('/admin');
    const candidates = [
      isGH ? '/envyrage/skins.json' : (isSubdir ? '../skins.json' : './skins.json'),
      './skins.json'
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

  // 4. GLOBAL STATS (Site-wide upgrades counter & online counter synced from upgrader.best)
  const GlobalStats = {
    UPGRADES_KEY: 'upgrader_global_upgrades_v6',
    displayedCount: 488710000,
    targetCount: 488710000,
    getUpgradesCount() {
      try {
        const val = localStorage.getItem(this.UPGRADES_KEY);
        if (val) {
          const num = parseInt(val, 10);
          if (num > 480000000) return num;
        }
      } catch (e) {}
      const initial = 488710000;
      this.setUpgradesCount(initial);
      return initial;
    },
    setUpgradesCount(n) {
      try {
        localStorage.setItem(this.UPGRADES_KEY, String(n));
      } catch (e) {}
    },
    setTargetCount(target) {
      if (typeof target === 'number' && target > 480000000) {
        if (target > this.targetCount) {
          this.targetCount = target;
        }
        if (this.displayedCount < target) {
          this.displayedCount = target;
        }
        this.setUpgradesCount(this.displayedCount);
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

  // Dynamic Online Counter based on time of day:
  // - First half of day (morning ~08:00 - 12:00): ~4000
  // - Peak hours / middle of day (~14:00 - 18:30): ~5000
  // - Towards night / night (~22:00 - 05:00): ~3500
  // - Constant organic fluctuations within range: updates every 1.5 - 2s with natural jitter (+/- few players)
  function getBaseOnlineForHour(hour) {
    const schedule = [
      [0.0, 3500],
      [3.5, 3440],
      [5.5, 3480],
      [7.0, 3750],
      [8.0, 3980],
      [10.0, 4020],
      [12.0, 4080],
      [13.5, 4750],
      [15.0, 5040],
      [16.5, 5080],
      [18.0, 4980],
      [19.5, 4550],
      [21.0, 3950],
      [22.5, 3600],
      [23.5, 3510],
      [24.0, 3500]
    ];
    for (let i = 0; i < schedule.length - 1; i++) {
      const [h0, o0] = schedule[i];
      const [h1, o1] = schedule[i + 1];
      if (hour >= h0 && hour <= h1) {
        const progress = (hour - h0) / (h1 - h0);
        const smoothT = (1 - Math.cos(progress * Math.PI)) / 2;
        return o0 + (o1 - o0) * smoothT;
      }
    }
    return 4000;
  }

  function getDynamicOnlineTarget() {
    const d = new Date();
    const h = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
    return getBaseOnlineForHour(h);
  }

  let onlineJitter = (Math.random() * 20 - 10);
  let currentOnline = Math.round(getDynamicOnlineTarget() + onlineJitter);

  try {
    localStorage.setItem('online', JSON.stringify({ onlineCount: currentOnline }));
    localStorage.setItem('cookie-consent', 'accepted');
  } catch(e) {}

  function updateOnlineBadgeInDOM() {
    try {
      localStorage.setItem('online', JSON.stringify({ onlineCount: currentOnline }));
      const counters = document.querySelectorAll('[data-testid="online-counter"]');
      const formattedOnline = currentOnline.toLocaleString('ru-RU').replace(/,/g, ' ');
      counters.forEach(c => {
        const odo = c.querySelector('up-odometer-simple');
        if (odo) {
          const valSpan = odo.querySelector('.clean-counter-value');
          if (valSpan) {
            valSpan.textContent = formattedOnline;
          } else if (!odo.querySelector('.odometer-inside') && !odo.querySelector('.odometer-static-ribbon')) {
            odo.innerHTML = `<span class="clean-counter-value" style="font-variant-numeric:tabular-nums;font-weight:600;color:#fff;display:inline-block;">${formattedOnline}</span>`;
          }
        } else {
          const spans = c.querySelectorAll('span');
          spans.forEach(s => {
            if (s.textContent.trim() === '-' || /^\d+$/.test(s.textContent.trim())) {
              s.textContent = ' ' + formattedOnline + ' ';
            }
          });
        }
      });
      GlobalStats.updateHeaderDOM(GlobalStats.displayedCount || GlobalStats.getUpgradesCount());
    } catch(e) {}
  }
  setInterval(updateOnlineBadgeInDOM, 1000);

  // Organic random online fluctuation (simulating realistic player activity constantly changing)
  setInterval(() => {
    const base = getDynamicOnlineTarget();
    const step = (Math.random() < 0.5 ? -1 : 1) * (Math.floor(Math.random() * 5) + 1); // ±1..5
    let drift = 0;
    if (onlineJitter > 25) drift = -Math.floor(Math.random() * 3 + 1);
    if (onlineJitter < -25) drift = Math.floor(Math.random() * 3 + 1);

    onlineJitter = Math.max(-45, Math.min(45, onlineJitter + step + drift));
    currentOnline = Math.round(base + onlineJitter);
    updateOnlineBadgeInDOM();
    try {
      WsMock.broadcast({
        event: 'online',
        data: currentOnline
      });
    } catch(e) {}
  }, 1800);

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
            if (Object.keys(accs).length === 0 && Object.keys(DEFAULT_SEED_ACCOUNTS).length > 0) {
              Object.assign(accs, JSON.parse(JSON.stringify(DEFAULT_SEED_ACCOUNTS)));
              updated = true;
            }
            if (updated) {
              this.saveAccountsLocally(accs);
            }
            return accs;
          }
        }
      } catch (e) {}

      const initialAccounts = JSON.parse(JSON.stringify(DEFAULT_SEED_ACCOUNTS));
      this.saveAccountsLocally(initialAccounts);
      return initialAccounts;
    }

    static restoreDefaultAccounts() {
      const accounts = JSON.parse(JSON.stringify(DEFAULT_SEED_ACCOUNTS));
      this.saveAccountsLocally(accounts);
      if (accounts['envy!']) {
        this.setActiveUser('envy!');
      } else {
        this.clearActiveUser();
      }
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
        if (!activeU || activeU === '__GUEST__' || isLegacyAccount(null, activeU.trim())) {
          return null;
        }
        const trimmed = activeU.trim();
        let acc = accounts[trimmed] || accounts[trimmed.toLowerCase()];
        if (!acc) {
          const lower = trimmed.toLowerCase();
          for (const k in accounts) {
            const a = accounts[k];
            if (!a) continue;
            if ((a.username && a.username.toLowerCase() === lower) ||
                String(a.id) === trimmed ||
                (a.nickname && a.nickname.toLowerCase() === lower)) {
              acc = a;
              break;
            }
          }
        }
        if (acc) {
          if (acc.username === 'envy!') {
            if (!acc.depositsAmount || acc.depositsAmount < 25000) {
              acc.depositsAmount = 30000.0;
            }
            acc.vipTier = 'vip_gold';
            acc.tier = 'vip_gold';
          }
          const beforeDep = acc.depositsAmount;
          this.checkWeeklyVipReset(acc);
          if (beforeDep !== acc.depositsAmount) {
            this.saveAccounts(accounts);
          }
          return acc;
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
          try {
            if (window.__upgraderUserState && typeof window.__upgraderUserState.setUser === 'function') {
              window.__upgraderUserState.setUser(userData, true);
            }
          } catch(e) {}
        }
      } catch (e) {}
    }

    static clearActiveUser() {
      try {
        localStorage.setItem(STORAGE_ACTIVE_KEY, '__GUEST__');
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('upgrader_active_user');
        sessionStorage.removeItem('upgrader_active_user');
      } catch (e) {}
    }

    static generateNextUserId(accounts) {
      let maxId = 1735000;
      const accs = accounts || this.getAccounts();
      if (accs) {
        for (const k in accs) {
          const rawId = parseInt(accs[k]?.id, 10);
          if (!isNaN(rawId) && rawId >= maxId) {
            maxId = Math.max(maxId, rawId);
          }
        }
      }
      if (maxId === 1735000) {
        return 1735000 + Math.floor(Math.random() * 50) + 1;
      }
      return maxId + Math.floor(Math.random() * 5) + 1;
    }

    static register(username, password, nickname) {
      const accounts = this.getAccounts();
      const u = username.trim().toLowerCase();
      if (!u) throw new Error('Логин не может быть пустым');
      if (accounts[u]) throw new Error('Пользователь с таким логином уже существует');
      if (!password || password.length < 3) throw new Error('Пароль должен быть не менее 3 символов');

      const newAcc = {
        id: this.generateNextUserId(accounts),
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
      let maxCloudId = 1735000;
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
        const cloudUser = await SupabaseDB.fetchUser(u);
        if (cloudUser) {
          throw new Error('Пользователь с таким логином уже существует в базе данных');
        }
        try {
          const res = await fetch(`${SupabaseDB.getUrl()}/rest/v1/users?select=id&order=id.desc&limit=20`, {
            headers: SupabaseDB.getHeaders()
          });
          if (res.ok) {
            const list = await res.json();
            if (Array.isArray(list)) {
              for (const row of list) {
                const n = parseInt(row.id, 10);
                if (!isNaN(n) && n >= maxCloudId) {
                  maxCloudId = Math.max(maxCloudId, n);
                }
              }
            }
          }
        } catch (e) {}
      }

      let generatedId = this.generateNextUserId(accounts);
      if (maxCloudId >= generatedId) {
        generatedId = maxCloudId + Math.floor(Math.random() * 5) + 1;
      }

      const newAcc = {
        id: generatedId,
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

    static checkWeeklyVipReset(acc) {
      if (!acc) return;
      if (acc.username === 'envy!') {
        if (!acc.depositsAmount || acc.depositsAmount < 25000) {
          acc.depositsAmount = 30000.0;
        }
        acc.vipTier = 'vip_gold';
        acc.tier = 'vip_gold';
        return;
      }
      const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      if (!acc.vipWeekStart) {
        acc.vipWeekStart = now;
      } else {
        const startTime = typeof acc.vipWeekStart === 'number' ? acc.vipWeekStart : new Date(acc.vipWeekStart).getTime();
        if (!isNaN(startTime) && (now - startTime >= ONE_WEEK_MS)) {
          // Reset weekly deposits and VIP tier without mentioning any reset timer on site
          acc.depositsAmount = 0;
          acc.vipTier = null;
          acc.tier = null;
          acc.vipWeekStart = now;
          if (typeof WsMock !== 'undefined') {
            WsMock.broadcast({
              event: 'users.update_vip',
              data: { tier: null, depositsAmount: 0 }
            });
          }
        }
      }
    }

    static updateBalance(username, delta, isAdd = false) {
      const accounts = this.getAccounts();
      const acc = accounts[username];
      if (!acc) return 0;
      this.checkWeeklyVipReset(acc);
      if (isAdd) {
        acc.balance = parseFloat((parseFloat(acc.balance) + parseFloat(delta)).toFixed(3));
      } else {
        acc.balance = parseFloat(parseFloat(delta).toFixed(3));
      }
      this.saveAccounts(accounts);
      this.setActiveUser(username);
      WsMock.broadcastBalance(acc.balance);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
        SupabaseDB.updateUser(acc.id, {
          balance: acc.balance,
          depositsAmount: acc.depositsAmount,
          vipTier: acc.vipTier,
          vipWeekStart: acc.vipWeekStart
        });
      }
      return acc.balance;
    }

    static recordDeposit(username, depositAmount) {
      const accounts = this.getAccounts();
      const acc = accounts[username];
      if (!acc) return 0;
      this.checkWeeklyVipReset(acc);

      const amt = parseFloat(depositAmount) || 0;
      acc.balance = parseFloat((parseFloat(acc.balance || 0) + amt).toFixed(3));
      acc.depositsAmount = parseFloat((parseFloat(acc.depositsAmount || 0) + amt).toFixed(3));

      let tier = null;
      if (acc.depositsAmount >= 500000) tier = 'vip_diamond';
      else if (acc.depositsAmount >= 100000) tier = 'vip_platinum';
      else if (acc.depositsAmount >= 25000) tier = 'vip_gold';
      else if (acc.depositsAmount >= 5000) tier = 'vip_silver';

      acc.vipTier = tier;
      acc.tier = tier;

      this.saveAccounts(accounts);
      this.setActiveUser(username);
      WsMock.broadcastBalance(acc.balance);
      WsMock.broadcast({
        event: 'users.update_vip',
        data: { tier: acc.vipTier, depositsAmount: acc.depositsAmount }
      });

      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
        SupabaseDB.updateUser(acc.id, {
          balance: acc.balance,
          depositsAmount: acc.depositsAmount,
          vipTier: acc.vipTier,
          vipWeekStart: acc.vipWeekStart
        });
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

    static updatePassword(username, newPassword) {
      if (!username || !newPassword) return false;
      const accounts = this.getAccounts();
      const uname = String(username).toLowerCase().trim();
      const acc = accounts[uname] || accounts[username];
      if (!acc) return false;
      acc.password = String(newPassword);
      this.saveAccounts(accounts);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
        let tradeLink = acc.steamTradeLink || '';
        if (tradeLink.startsWith('pw:')) {
          const parts = tradeLink.slice(3).split('|stl:');
          tradeLink = parts[1] || '';
        }
        let encodedTradeLink = 'pw:' + acc.password + (tradeLink ? ('|stl:' + tradeLink) : '');
        SupabaseDB.updateUser(acc.id || acc.username, {
          password: acc.password,
          steam_trade_link: encodedTradeLink
        }).catch(e => console.warn(e));
      }
      return true;
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

    static getBattleHistory(username) {
      if (!username) return [];
      try {
        const raw = localStorage.getItem('upgrader_history_battles_' + username);
        if (raw) return JSON.parse(raw);
      } catch(e) {}
      const acc = this.getAccounts()[username];
      return (acc && acc.battleHistory) || [];
    }

    static addBattleHistory(username, entry) {
      if (!username || !entry) return;
      const history = this.getBattleHistory(username);
      history.unshift(entry);
      if (history.length > 100) history.pop();
      try {
        localStorage.setItem('upgrader_history_battles_' + username, JSON.stringify(history));
      } catch(e) {}
      const accs = this.getAccounts();
      if (accs[username]) {
        accs[username].battleHistory = history;
        accs[username].battlesHistory = history;
        this.saveAccountsLocally(accs);
        if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
          SupabaseDB.updateUser(accs[username].id || username, {
            battles_history: history
          }).catch(() => {});
        }
      }
    }

    static getGamesHistory(username) {
      if (!username) return [];
      try {
        const raw = localStorage.getItem('upgrader_history_games_' + username);
        if (raw) return JSON.parse(raw);
      } catch(e) {}
      const acc = this.getAccounts()[username];
      return (acc && acc.gamesHistory) || [];
    }

    static addGamesHistory(username, entry) {
      if (!username || !entry) return;
      const history = this.getGamesHistory(username);
      history.unshift(entry);
      if (history.length > 100) history.pop();
      try {
        localStorage.setItem('upgrader_history_games_' + username, JSON.stringify(history));
      } catch(e) {}
      const accs = this.getAccounts();
      if (accs[username]) {
        accs[username].gamesHistory = history;
        this.saveAccountsLocally(accs);
        if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
          SupabaseDB.updateUser(accs[username].id || username, {
            games_history: history
          }).catch(() => {});
        }
      }
    }

    static getInventoryHistory(username) {
      if (!username) return [];
      try {
        const raw = localStorage.getItem('upgrader_history_inv_' + username);
        if (raw) return JSON.parse(raw);
      } catch(e) {}
      const acc = this.getAccounts()[username];
      return (acc && acc.inventoryHistory) || [];
    }

    static addInventoryHistory(username, entry) {
      if (!username || !entry) return;
      const history = this.getInventoryHistory(username);
      history.unshift(entry);
      if (history.length > 100) history.pop();
      try {
        localStorage.setItem('upgrader_history_inv_' + username, JSON.stringify(history));
      } catch(e) {}
      const accs = this.getAccounts();
      if (accs[username]) {
        accs[username].inventoryHistory = history;
        this.saveAccountsLocally(accs);
        if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
          SupabaseDB.updateUser(accs[username].id || username, {
            inventory_history: history
          }).catch(() => {});
        }
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
        this.addInventoryHistory(username, invHistEntry);
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
      this.addGamesHistory(username, gameRecord);

      this.saveAccounts(accounts);
      this.setActiveUser(username);

      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
        const stats = {
          upgrades_made: acc.upgradesMade,
          best_drop: acc.bestDrop,
          balance: acc.balance
        };
        SupabaseDB.updateUser(acc.id || acc.username, {
          balance: acc.balance,
          upgrades_made: acc.upgradesMade,
          best_drop: acc.bestDrop
        }).catch(() => {});
      }

      updateDomUpgrades(acc.upgradesMade);
      if (acc.bestDrop) updateDomBestDrop(acc.bestDrop);
      try {
        if (typeof WsMock !== 'undefined') {
          WsMock.broadcastStats({
            upgradesMade: acc.upgradesMade,
            bestDrop: acc.bestDrop,
            withdrawnAmount: acc.withdrawnAmount,
            withdrawnItemsCount: acc.withdrawnItemsCount
          });
        }
      } catch(e) {}
    }

    static startWithdrawal(username, item) {
      const accounts = this.getAccounts();
      const acc = accounts[username];
      if (!acc || !item) return null;

      acc.withdrawingItems = acc.withdrawingItems || {};
      const durationMs = Math.floor(180 + Math.random() * 60) * 1000; // 3 to 4 minutes (realistic trade window)
      const loadingDurationMs = 28000; // 28 seconds authentic loading ("Ожидание продавца")
      const tradeOfferId = Math.floor(1000000000 + Math.random() * 9000000000);
      const expiresAt = new Date(Date.now() + durationMs).toISOString();

      const entry = {
        id: String(item.id),
        item: item,
        startedAt: Date.now(),
        loadingDurationMs: loadingDurationMs,
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
        this.addInventoryHistory(username, histEntry);

        this.saveAccounts(accounts);
        this.setActiveUser(username);
        window.dispatchEvent(new CustomEvent('upgrader:user-updated', { detail: acc }));

        // Persist withdrawal stats and item removal to Supabase
        if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
          SupabaseDB.removeInventoryItem(item.id).catch(() => {});
          SupabaseDB.updateUser(acc.id || acc.username, {
            withdrawn_amount: acc.withdrawnAmount,
            withdrawn_count: acc.withdrawnItemsCount
          }).catch(() => {});
        }

        updateDomWithdrawn(acc.withdrawnAmount, acc.withdrawnItemsCount);

        try {
          if (typeof WsMock !== 'undefined') {
            WsMock.broadcastStats({
              withdrawnAmount: acc.withdrawnAmount,
              withdrawnItemsCount: acc.withdrawnItemsCount,
              upgradesMade: acc.upgradesMade,
              bestDrop: acc.bestDrop
            });
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
        this.addInventoryHistory(username, histEntry);
      });

      this.saveAccounts(accounts);
      this.setActiveUser(username);
    }

    static updateProfileCustomizations(username, { nickname, avatar, steamTradeLink, currency, privacy, streamerMode, newsletter, pushNotifications }) {
      const accounts = this.getAccounts();
      const acc = accounts[username];
      if (!acc) return;

      if (nickname && nickname.trim()) acc.nickname = nickname.trim();
      if (avatar && avatar.trim()) {
        acc.avatar = avatar.trim();
        acc.image = avatar.trim();
      }
      if (steamTradeLink !== undefined) {
        acc.steamTradeLink = steamTradeLink ? steamTradeLink.trim() : '';
        acc.tradeLink = acc.steamTradeLink;
      }
      if (currency !== undefined) acc.currency = currency;
      if (privacy !== undefined) acc.privacy = privacy;
      if (streamerMode !== undefined) acc.streamerMode = !!streamerMode;
      if (newsletter !== undefined) acc.newsletter = !!newsletter;
      if (pushNotifications !== undefined) acc.pushNotifications = !!pushNotifications;

      this.saveAccountsLocally(accounts);
      this.setActiveUser(username);

      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
        SupabaseDB.updateUser(acc.id || acc.username, {
          nickname: acc.nickname,
          avatar: acc.avatar,
          image: acc.avatar,
          steamTradeLink: acc.steamTradeLink
        }).catch(() => {});
      }

      updateDomAvatar(acc.avatar);
      updateDomNickname(acc.nickname);
      try {
        if (typeof WsMock !== 'undefined') {
          WsMock.broadcastProfile(acc);
        }
      } catch(e) {}

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
      if (mode !== 'custom' || customChance === null || customChance === undefined) {
        delete activeUser.customWinChance;
        localStorage.removeItem('upgrader_custom_win_chance');
      } else {
        activeUser.customWinChance = parseFloat(customChance);
        localStorage.setItem('upgrader_custom_win_chance', String(customChance));
      }
      LocalDB.saveUser(activeUser);
      console.log(`[local-backend] Instant rig applied in real-time to active user ${activeUser.username}: ${mode}`);
      window.dispatchEvent(new CustomEvent('upgrader:user-updated', { detail: activeUser }));
      window.dispatchEvent(new CustomEvent('upgrader:rig-changed', { detail: { mode, user: activeUser } }));
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
      const customVal = mode === 'custom' ? parseFloat(localStorage.getItem('upgrader_custom_win_chance')) : null;
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
        if (event.data && event.data.type === 'BALANCE_UPDATED') {
          const bal = Number(event.data.balance);
          const activeUser = LocalDB.getActiveUser();
          if (activeUser && !isNaN(bal) && Math.abs(bal - activeUser.balance) > 0.001) {
            activeUser.balance = bal;
            const accounts = LocalDB.getAccounts();
            if (accounts[activeUser.username]) accounts[activeUser.username].balance = bal;
            LocalDB.saveAccounts(accounts);
            LocalDB.setActiveUser(activeUser.username);
            WsMock.broadcastBalance(bal);
            updateDomBalance(bal);
          }
        }
        if (event.data && event.data.type === 'USER_STATS_SYNCED') {
          const activeUser = LocalDB.getActiveUser();
          if (activeUser && (!event.data.username || event.data.username === activeUser.username)) {
            const stats = event.data.stats || {};
            let userChanged = false;
            let statsChanged = false;

            if (stats.balance !== undefined && !isNaN(Number(stats.balance)) && Math.abs(Number(stats.balance) - activeUser.balance) > 0.001) {
              activeUser.balance = Number(stats.balance);
              userChanged = true;
              WsMock.broadcastBalance(activeUser.balance);
              updateDomBalance(activeUser.balance);
            }
            if (stats.nickname !== undefined && String(stats.nickname) !== String(activeUser.nickname)) {
              activeUser.nickname = String(stats.nickname);
              userChanged = true;
              updateDomNickname(activeUser.nickname);
            }
            if (stats.id !== undefined && String(stats.id) !== String(activeUser.id)) {
              activeUser.id = String(stats.id);
              userChanged = true;
              updateDomId(activeUser.id);
            }
            if (stats.upgradesMade !== undefined && Number(stats.upgradesMade) !== (activeUser.upgradesMade || 0)) {
              activeUser.upgradesMade = Number(stats.upgradesMade);
              statsChanged = true;
              updateDomUpgrades(activeUser.upgradesMade);
            }
            if (stats.withdrawnAmount !== undefined && Math.abs(Number(stats.withdrawnAmount) - (activeUser.withdrawnAmount || 0)) > 0.001) {
              activeUser.withdrawnAmount = Number(stats.withdrawnAmount);
              statsChanged = true;
            }
            if (stats.withdrawnItemsCount !== undefined && Number(stats.withdrawnItemsCount) !== (activeUser.withdrawnItemsCount || 0)) {
              activeUser.withdrawnItemsCount = Number(stats.withdrawnItemsCount);
              statsChanged = true;
            }
            if (statsChanged) {
              updateDomWithdrawn(activeUser.withdrawnAmount, activeUser.withdrawnItemsCount);
            }
            if (stats.bestDrop !== undefined) {
              const prevDropStr = JSON.stringify(activeUser.bestDrop || null);
              const nextDropStr = JSON.stringify(stats.bestDrop || null);
              if (prevDropStr !== nextDropStr) {
                activeUser.bestDrop = stats.bestDrop;
                statsChanged = true;
                updateDomBestDrop(stats.bestDrop);
              }
            }
            if (stats.avatar || stats.image) {
              const av = stats.avatar || stats.image;
              if (av !== activeUser.avatar) {
                activeUser.avatar = av;
                activeUser.image = av;
                userChanged = true;
                updateDomAvatar(av);
              }
            }
            if (Array.isArray(stats.inventory)) {
              activeUser.inventory = stats.inventory;
              userChanged = true;
              try {
                if (window.__upgraderItemsService && typeof window.__upgraderItemsService.notifyInventoryUpdate === 'function') {
                  window.__upgraderItemsService.notifyInventoryUpdate(true);
                }
              } catch(e) {}
            }

            if (userChanged || statsChanged) {
              const accounts = LocalDB.getAccounts();
              if (accounts[activeUser.username]) {
                accounts[activeUser.username].balance = activeUser.balance;
                accounts[activeUser.username].nickname = activeUser.nickname;
                accounts[activeUser.username].id = activeUser.id;
                accounts[activeUser.username].avatar = activeUser.avatar;
                accounts[activeUser.username].image = activeUser.avatar;
                accounts[activeUser.username].upgradesMade = activeUser.upgradesMade;
                accounts[activeUser.username].withdrawnAmount = activeUser.withdrawnAmount;
                accounts[activeUser.username].withdrawnItemsCount = activeUser.withdrawnItemsCount;
                accounts[activeUser.username].bestDrop = activeUser.bestDrop;
                if (stats.inventory) accounts[activeUser.username].inventory = activeUser.inventory;
              }
              LocalDB.saveAccounts(accounts);
              LocalDB.setActiveUser(activeUser.username);

              try {
                if (window.__upgraderUserService && typeof window.__upgraderUserService.setUser === 'function') {
                  window.__upgraderUserService.setUser(activeUser, true);
                }
                if (window.__upgraderUserState) {
                  if (window.__upgraderUserState.currentUser && typeof window.__upgraderUserState.currentUser.set === 'function') {
                    window.__upgraderUserState.currentUser.set({ ...activeUser });
                  }
                  if (window.__upgraderUserState.userStats && typeof window.__upgraderUserState.userStats.set === 'function') {
                    window.__upgraderUserState.userStats.set({
                      upgradesMade: activeUser.upgradesMade || 0,
                      withdrawnAmount: activeUser.withdrawnAmount || 0,
                      withdrawnItemsCount: activeUser.withdrawnItemsCount || 0,
                      bestDrop: activeUser.bestDrop || null,
                      bestDropProbability: activeUser.bestDropProbability || null
                    });
                  }
                }
              } catch(e) {}

              // WebSocket event broadcast to trigger Angular ChangeDetection in zone
              try {
                WsMock.broadcastProfile(activeUser);
                WsMock.broadcastStats({
                  upgradesMade: activeUser.upgradesMade || 0,
                  withdrawnAmount: activeUser.withdrawnAmount || 0,
                  withdrawnItemsCount: activeUser.withdrawnItemsCount || 0,
                  bestDrop: activeUser.bestDrop || null,
                  bestDropProbability: activeUser.bestDropProbability || null
                });
                if (stats.balance !== undefined) {
                  WsMock.broadcastBalance(activeUser.balance);
                }
              } catch(e) {}

              window.dispatchEvent(new CustomEvent('upgrader:user-updated', { detail: activeUser }));
            }
          }
        }
      };
    } catch (e) {}
  }

    // 5. AUTHENTIC LIVE DROPS DATA (Synced from https://upgrader.best/api/live-drops)
  // Strictly authentic users and skins with genuine Steam images and rarities
  const authenticDropsPool = [
  {
    "id": "167862655",
    "probability": "0.0624",
    "user": {
      "id": "609688",
      "nickname": "𝔏𝔬𝔯𝔡𝔦𝔵𝔵",
      "image": "https://avatars.steamstatic.com/a5d0241fb9b7e85f81ce54031d9e19daa84c5c5e_full.jpg"
    },
    "item": {
      "id": "21400",
      "appId": 730,
      "marketName": "Sticker | Attacker (Gold) | Austin 2025",
      "price": "827.970",
      "image": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJai0ki7VeTHjMu0JinHtwM6547z1VjzVRzylZPywiVU4_bgP_U-efXFVjaRlb0mseU4TnvgkU0i4z_Qmd2qdCmWaw5zWcZ5FuMPug74zINJKCx87Q/360fx360f",
      "extra": {
        "e": null,
        "g": null,
        "n": [
          "Sticker",
          "Attacker (Gold)",
          "Austin 2025"
        ],
        "r": 7,
        "s": false,
        "t": 13,
        "ch": "eb4b4b",
        "st": false
      }
    }
  },
  {
    "id": "167862654",
    "probability": "0.5372",
    "user": {
      "id": "1473685",
      "nickname": "timo4plugg",
      "image": "https://avatars.steamstatic.com/a15c107e6ed2208600d95b5b05751ec662efee10_full.jpg"
    },
    "item": {
      "id": "4104",
      "appId": 730,
      "marketName": "PP-Bizon | Water Sigil (Factory New)",
      "price": "388.060",
      "image": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLzl4zv8x1T9s25abBoMs-QHGKD1dF6ueZhW2frwRwh4j7VwoqpdHyWPQcgCpd2TbFYsxC-l4a0Pu2ztA2NgtkUzST-kGoXuZ4FYcbA/360fx360f",
      "extra": {
        "e": 2,
        "g": 25,
        "n": [
          "PP-Bizon",
          "Water Sigil",
          "Factory New"
        ],
        "r": 15,
        "s": false,
        "t": 16,
        "ch": "4b69ff",
        "st": false
      }
    }
  },
  {
    "id": "167862653",
    "probability": "0.7835",
    "user": {
      "id": "416429",
      "nickname": "Svarcnederis",
      "image": "https://avatars.steamstatic.com/df38efb14c072c79bb752ba732feda479ddd8988_full.jpg"
    },
    "item": {
      "id": "5128",
      "appId": 730,
      "marketName": "XM1014 | Heaven Guard (Field-Tested)",
      "price": "412.310",
      "image": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLpk8ewrHZk7OeRcKk8cKHHMW-VwPhzvt5uWiihkSIqtjmMj4K3IiqXb1B2CpdzTbMOskO-wNbhZLiw51Hfio9NziX-2Hsf5i9v5OpTB71lpPNe0UvU1Q/360fx360f",
      "extra": {
        "e": 3,
        "g": 34,
        "n": [
          "XM1014",
          "Heaven Guard",
          "Field-Tested"
        ],
        "r": 16,
        "s": false,
        "t": 16,
        "ch": "8847ff",
        "st": false
      }
    }
  },
  {
    "id": "167862652",
    "probability": "0.7405",
    "user": {
      "id": "2087114",
      "nickname": "Faraon",
      "image": "https://avatars.steamstatic.com/0380beb661d65058fd68489e3456d45d4bcb709b_full.jpg"
    },
    "item": {
      "id": "7259",
      "appId": 730,
      "marketName": "Sticker | Virtus.Pro | MLG Columbus 2016",
      "price": "437.400",
      "image": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJai0ki7VeTHjMmuOW6a50NmptelvBbxUVOnmJPl_HdZvaX9OfA_caDADzLFmOoj4uUwTCrrl0sitWvXytyuIH7DcEZ-XTBBR34J/360fx360f",
      "extra": {
        "e": null,
        "g": null,
        "n": [
          "Sticker",
          "Virtus.Pro",
          "MLG Columbus 2016"
        ],
        "r": 8,
        "s": false,
        "t": 13,
        "ch": "4b69ff",
        "st": false
      }
    }
  },
  {
    "id": "167862651",
    "probability": "0.5786",
    "user": {
      "id": "1863824",
      "nickname": "новичок",
      "image": "https://avatars.steamstatic.com/865b61e660d786751bdab6838d2aa821a8a9355f_full.jpg"
    },
    "item": {
      "id": "3230",
      "appId": 730,
      "marketName": "★ Shadow Daggers | Night (Field-Tested)",
      "price": "4026.930",
      "image": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1L-uGmV7diH_6aCW-E_uNztOh8QmfixU52626An9qsJXrBbwQhDpImF7MIs0PuktCyZOrm5lbXjt8TnCqtkGoXubObITJw/360fx360f",
      "extra": {
        "e": 3,
        "g": null,
        "n": [
          "★ Shadow Daggers",
          "Night",
          "Field-Tested"
        ],
        "r": 10,
        "s": false,
        "t": 9,
        "ch": "eb4b4b",
        "st": false
      }
    }
  },
  {
    "id": "167862650",
    "probability": "0.5197",
    "user": {
      "id": "23483",
      "nickname": "☠",
      "image": "https://avatars.steamstatic.com/0fe87ecbe3b7a41d4ecd8112b1e499a8d3d235ce_full.jpg"
    },
    "item": {
      "id": "20747",
      "appId": 730,
      "marketName": "Sticker | kye (Gold) | Austin 2025",
      "price": "648.160",
      "image": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJai0ki7VeTHjMu0JinHtwM6547z1VL-RCL2kZrks3oJvqqrbfQ6JKfLV2TIkL0j6bAxTHuwwBx-tjuHnt_4cX_GOgMjAsBuBbldyR8ymt8/360fx360f",
      "extra": {
        "e": null,
        "g": null,
        "n": [
          "Sticker",
          "kye (Gold)",
          "Austin 2025"
        ],
        "r": 7,
        "s": false,
        "t": 13,
        "ch": "eb4b4b",
        "st": false
      }
    }
  },
  {
    "id": "167862649",
    "probability": "0.5599",
    "user": {
      "id": "116551",
      "nickname": "сосискин",
      "image": "https://avatars.steamstatic.com/8d04e92c0b36a562f5e7c02544d21bdd4fc54619_full.jpg"
    },
    "item": {
      "id": "11763",
      "appId": 730,
      "marketName": "AK-47 | Panthera onca (Field-Tested)",
      "price": "15084.890",
      "image": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlV65sJ-WSHFidxOp_pewnHn-wx0Qk5mrVmderdn2XagQoW8AiRO8K4Be-x9K0ZrjjsQKMg4hMzjK-0H3kfYgSlA/360fx360f",
      "extra": {
        "e": 3,
        "g": 1,
        "n": [
          "AK-47",
          "Panthera onca",
          "Field-Tested"
        ],
        "r": 12,
        "s": false,
        "t": 16,
        "ch": "d32ce6",
        "st": false
      }
    }
  },
  {
    "id": "167862648",
    "probability": "0.5385",
    "user": {
      "id": "330870",
      "nickname": "maksym96___⚓",
      "image": "https://avatars.steamstatic.com/6410fe435cb4823fd2c701d6df6d67c83619e095_full.jpg"
    },
    "item": {
      "id": "10863",
      "appId": 730,
      "marketName": "M4A1-S | Moss Quartz (Battle-Scarred)",
      "price": "2073.260",
      "image": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_GeMWSC2P1ise1lRjO2kSIjsi-OpYjrJC7JAV51W9Q5W7IIsxjpwYfmMOKx7wzYg41HzCn_33tMuy5i5-gLBaBw-PeFjgyXMLcjoc5U0-uLuOE/360fx360f",
      "extra": {
        "e": 1,
        "g": 13,
        "n": [
          "M4A1-S",
          "Moss Quartz",
          "Battle-Scarred"
        ],
        "r": 14,
        "s": false,
        "t": 16,
        "ch": "5e98d9",
        "st": false
      }
    }
  },
  {
    "id": "167862647",
    "probability": "0.3475",
    "user": {
      "id": "1372414",
      "nickname": "сатор арепыч",
      "image": "https://avatars.steamstatic.com/867110165318f8daef4224288636f7ba79a3cf01_full.jpg"
    },
    "item": {
      "id": "11148",
      "appId": 730,
      "marketName": "Black Mesa Pin",
      "price": "421.510",
      "image": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJai2l-lQ8ndwMWvJjSU6lp58YTg41vrRCLhl5jf_C5C983-Puo5IvWQDTHHkLwg5rFtFyjgzB8lsGTQztmreHuXOgMhWcFwQe4IsELrjJS5YLQKtvDj/360fx360f",
      "extra": {
        "e": null,
        "g": null,
        "n": [
          "Black Mesa",
          "Pin"
        ],
        "r": 8,
        "s": false,
        "t": 3,
        "ch": "4b69ff",
        "st": false
      }
    }
  },
  {
    "id": "167862646",
    "probability": "0.3597",
    "user": {
      "id": "2386197",
      "nickname": "PIXON1",
      "image": "https://avatars.steamstatic.com/781f2842d95ff5fbb615802880e040a01645e758_full.jpg"
    },
    "item": {
      "id": "13931",
      "appId": 730,
      "marketName": "StatTrak™ M4A1-S | Black Lotus (Well-Worn)",
      "price": "1139.920",
      "image": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_3HDzaD_ux6seJicCW8gQg0jDCAnobsLGWTbQQnDsN3QuYOtELqkIazZeLm7lPYj9gQzyj72y8du31i6ulQA6Rx5OSJ2CPXrFUp/360fx360f",
      "extra": {
        "e": 5,
        "g": 13,
        "n": [
          "M4A1-S",
          "Black Lotus",
          "Well-Worn"
        ],
        "r": 12,
        "s": false,
        "t": 16,
        "ch": "d32ce6",
        "st": true
      }
    }
  },
  {
    "id": "167862645",
    "probability": "0.3800",
    "user": {
      "id": "2388366",
      "nickname": "avgust-5588",
      "image": "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg"
    },
    "item": {
      "id": "7912",
      "appId": 730,
      "marketName": "P2000 | Turf (Minimal Wear)",
      "price": "376.350",
      "image": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL5lYayrXIL0PW9V7Q_cKDDQ3SAzvxij-1gSCGn20h14mSByd6vJXmUagQoXpMkQecN40Xsm4DhM-3k4lTY340UxCn53HhXrnE88VIlnLo/360fx360f",
      "extra": {
        "e": 4,
        "g": 22,
        "n": [
          "P2000",
          "Turf",
          "Minimal Wear"
        ],
        "r": 15,
        "s": false,
        "t": 16,
        "ch": "4b69ff",
        "st": false
      }
    }
  },
  {
    "id": "167862644",
    "probability": "0.7783",
    "user": {
      "id": "2000626",
      "nickname": "prince",
      "image": "https://avatars.steamstatic.com/3c42f23a2fcfb31bbe37bcd15239fc90cbdb0771_full.jpg"
    },
    "item": {
      "id": "10768",
      "appId": 730,
      "marketName": "XM1014 | Banana Leaf (Factory New)",
      "price": "1595.720",
      "image": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLpk8ewrHZk5-uRZKFsJs-UHGKVz9F6ueZhW2e3zRlxsTvVzdqpdy6eOwF0X8ciQOcD5hjqwNLmNu7isQHfjY1Cz3mvkGoXuYSrXADo/360fx360f",
      "extra": {
        "e": 2,
        "g": 34,
        "n": [
          "XM1014",
          "Banana Leaf",
          "Factory New"
        ],
        "r": 14,
        "s": false,
        "t": 16,
        "ch": "5e98d9",
        "st": false
      }
    }
  },
  {
    "id": "167862643",
    "probability": "0.7820",
    "user": {
      "id": "2038614",
      "nickname": "ALink///aaa",
      "image": "https://avatars.steamstatic.com/2c43f614e8926a9aab4060723e933b43b63f28e4_full.jpg"
    },
    "item": {
      "id": "5811",
      "appId": 730,
      "marketName": "Souvenir CZ75-Auto | Nitro (Well-Worn)",
      "price": "566.200",
      "image": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLyhMG1_B1I4M2heqVjJ_WsD2STxOBio7NWQiy3nAgq_Wzdn4msdCmWagcpD8clTbNe4EXuxtLlZuLn7wXfid9GxCirjyhO7Sh1o7FVFCJcSxA/360fx360f",
      "extra": {
        "e": 5,
        "g": 4,
        "n": [
          "Souvenir CZ75-Auto",
          "Nitro",
          "Well-Worn"
        ],
        "r": 15,
        "s": false,
        "t": 16,
        "ch": "4b69ff",
        "st": false
      }
    }
  },
  {
    "id": "167862642",
    "probability": "0.7907",
    "user": {
      "id": "2387490",
      "nickname": "Тут",
      "image": "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg"
    },
    "item": {
      "id": "13816",
      "appId": 730,
      "marketName": "Souvenir M4A1-S | Mud-Spec (Factory New)",
      "price": "529.400",
      "image": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_eAMWrEwL9lj-xgQzqjkB4YvzSCkpu3I3rGP1JxDJpwEbEJ40G6mtfjPuqx7wTf3d5AzHn5hy9AuH5p4u9QBb1lpPNjrdVvDA/360fx360f",
      "extra": {
        "e": 2,
        "g": 13,
        "n": [
          "Souvenir M4A1-S",
          "Mud-Spec",
          "Factory New"
        ],
        "r": 14,
        "s": false,
        "t": 16,
        "ch": "5e98d9",
        "st": false
      }
    }
  },
  {
    "id": "167862641",
    "probability": "0.0718",
    "user": {
      "id": "2378325",
      "nickname": "anqqs1",
      "image": "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg"
    },
    "item": {
      "id": "16972",
      "appId": 730,
      "marketName": "Sticker | Xyp9x (Foil) | Cologne 2015",
      "price": "1242.790",
      "image": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJai0ki7VeTHjMmuOXSQ61MnpNahpUruRiLph4a55R1d4PuiJvJvd6SXXWOTl79347Y_TijnzEh34WTWwt6rdimUZ1N1DZZ2R7NftxSm0oqwvPhP8ho/360fx360f",
      "extra": {
        "e": null,
        "g": null,
        "n": [
          "Sticker",
          "Xyp9x (Foil)",
          "Cologne 2015"
        ],
        "r": 6,
        "s": false,
        "t": 13,
        "ch": "d32ce6",
        "st": false
      }
    }
  },
  {
    "id": "167862640",
    "probability": "0.7725",
    "user": {
      "id": "812770",
      "nickname": "#999 UnlimitedDev",
      "image": "https://avatars.steamstatic.com/052bd70f03a3187975eb926ca7c672e89f5c633f_full.jpg"
    },
    "item": {
      "id": "14145",
      "appId": 730,
      "marketName": "M4A4 | Polysoup (Battle-Scarred)",
      "price": "529.400",
      "image": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFU4M2-Z6h0M_-GHlidle8ij-lsTj-q20V-5mTWw4msdX6ebgcoCJAlE-ZbthPtkNPgZOjn5wXajNhFxX_623tXrnE8XlG-qlc/360fx360f",
      "extra": {
        "e": 1,
        "g": 14,
        "n": [
          "M4A4",
          "Polysoup",
          "Battle-Scarred"
        ],
        "r": 16,
        "s": false,
        "t": 16,
        "ch": "8847ff",
        "st": false
      }
    }
  },
  {
    "id": "167862639",
    "probability": "0.3625",
    "user": {
      "id": "286004",
      "nickname": "Salamalaykuuum!",
      "image": "https://avatars.steamstatic.com/ab877f8e4978aba53930932e2dc51f7cd4abf29a_full.jpg"
    },
    "item": {
      "id": "2903",
      "appId": 730,
      "marketName": "AK-47 | Point Disarray (Minimal Wear)",
      "price": "1976.250",
      "image": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0POlPPNSMP-aAHOvxedlsfN7TjCMmRQguynLnIz_dXnEbFcoDsNzQLMN40S7mte0Zuzl5gbY34JEnnr52ChA7ytisPFCD_Rw7udDlA/360fx360f",
      "extra": {
        "e": 4,
        "g": 1,
        "n": [
          "AK-47",
          "Point Disarray",
          "Minimal Wear"
        ],
        "r": 12,
        "s": false,
        "t": 16,
        "ch": "d32ce6",
        "st": false
      }
    }
  },
  {
    "id": "167862638",
    "probability": "0.7775",
    "user": {
      "id": "2260717",
      "nickname": "guckerr2 @gg_duckbot",
      "image": "https://avatars.steamstatic.com/e7a5e8d561e0775c50c8e8dda936aaf1019536a3_full.jpg"
    },
    "item": {
      "id": "2519",
      "appId": 730,
      "marketName": "StatTrak™ M4A4 | Turbine (Minimal Wear)",
      "price": "651.500",
      "image": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwi8P7qaRbrF-Kf-dMWuZxuZi_rRtGiriwUgh5m6Bn9z4IHLEOA4gDpZxQOULsUW9k4eyMOLitQzd3opbjXKpOa4i6Kc/360fx360f",
      "extra": {
        "e": 4,
        "g": 14,
        "n": [
          "M4A4",
          "Turbine",
          "Minimal Wear"
        ],
        "r": 16,
        "s": false,
        "t": 16,
        "ch": "8847ff",
        "st": true
      }
    }
  },
  {
    "id": "167862637",
    "probability": "0.3676",
    "user": {
      "id": "309918",
      "nickname": "хз",
      "image": "https://avatars.steamstatic.com/d6fa40acf854ff8d6ef1b205a9b825b9be7f6ad5_full.jpg"
    },
    "item": {
      "id": "2955",
      "appId": 730,
      "marketName": "M4A4 | Cyber Security (Field-Tested)",
      "price": "1893.450",
      "image": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiFO0P_6afBSI-mRC3WA1OB9j-xsSyCmmFN_5Tvdm9ypcXnGPQ8iXMYjF7EM50a8wdKzMOLntFfb3d5BnnmriH9N8G81tGbS0tGU/360fx360f",
      "extra": {
        "e": 3,
        "g": 14,
        "n": [
          "M4A4",
          "Cyber Security",
          "Field-Tested"
        ],
        "r": 12,
        "s": false,
        "t": 16,
        "ch": "d32ce6",
        "st": false
      }
    }
  },
  {
    "id": "167862636",
    "probability": "0.7835",
    "user": {
      "id": "1451452",
      "nickname": "wetricss",
      "image": "https://avatars.steamstatic.com/354fec3d2a3d37f63cbc2b0b04ec1f33de8a6618_full.jpg"
    },
    "item": {
      "id": "2421",
      "appId": 730,
      "marketName": "AK-47 | Searing Rage (Field-Tested)",
      "price": "489.250",
      "image": "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiNQu6WRbbx9LP-AB3GV_uNztOh8QmexlhtwsW7Qno6vc3ufaAd2WZR4TOcJ4RC-lYezMbngsgCLiolHzimvkGoXuYrtgXO6/360fx360f",
      "extra": {
        "e": 3,
        "g": 1,
        "n": [
          "AK-47",
          "Searing Rage",
          "Field-Tested"
        ],
        "r": 12,
        "s": false,
        "t": 16,
        "ch": "d32ce6",
        "st": false
      }
    }
  }
];

  const authenticNicknames = [
    "240km/h peek", "demonia", "substanced", "одержим.", "velour", "deadchannel", "nocturne", "overcast", "lowprofile", "unmade",
    "afterimage", "coldblooded", "drained", "untitled.", "lostsignal", "nightshift", "solitude", "paranoid", "distorted", "unfazed",
    "forsaken", "delirium", "morrow", "stained", "faded.", "disowned", "wraith", "deviant", "insomnia", "detached",
    "voided", "withdrawn", "obsolete", "elsewhere", "halflight", "numb.", "unspoken", "fallingup", "static", "deadpixel",
    "softcrash", "lastseen", "ghostmode", "blackout", "afterdark", "lowkey", "unlisted", "offline.", "nocturnal", "redacted",
    "unraveled", "misplaced", "unwanted", "faint", "blurred", "nameless", "restless", "careless", "heartless", "reckless",
    "hopeless", "faceless", "motionless", "weightless", "breathless", "endless.", "sleepwalk", "dayzero", "zerohour", "coldstart",
    "deadzone", "hardreset", "softreset", "nullstate", "ghostline", "darkmatter", "deepvoid", "afterglow", "moonlit", "nightfall",
    "eclipse.", "ashen", "palehour", "bluehour", "greyarea", "slowburn", "burnout", "overdose", "withdrawal", "craving",
    "fixation", "obsessed", "одержим", "безысход.", "забытый", "пустота", "неживой", "исчезни.", "наизнанку", "помнишь?",
    "никогда.", "последний", "беззвучно", "неважно", "отпечаток", "потерян", "размыт", "сквозь", "поздно.", "не сплю",
    "тише.", "холодно", "невесомый", "приглушен", "вне сети", "сбой", "помеха", "пиксель", "артефакт", "шум.",
    "задержка", "откат", "промах", "без лица", "noct.", "vanta", "vesper", "nexial", "vellichor", "liminal",
    "sonder", "saudade", "lacuna", "reverie", "umbra", "echelon", "parallax", "silhouette", "aftermath", "deadlock",
    "crossfade", "sideeffect", "offscript", "misconduct", "counterfeit", "unbound", "unseen", "unruly", "unreal.", "untouched"
  ];

  const origin = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : '';
  const isGH = (typeof window !== 'undefined') && (window.location.hostname.includes('github.io') || window.location.pathname.startsWith('/envyrage'));
  const basePath = isGH ? (origin + '/envyrage') : origin;
  const AUTHENTIC_AVATARS = Array.from({ length: 40 }, (_, i) => basePath + '/assets/avatars/user_pack/avatar_' + (i + 1) + '.jpg');

  const knownBots = new Map();
  function registerKnownBot(user) {
    if (!user || !user.id) return;
    knownBots.set(String(user.id), user);
  }

  // Spectator sound muter: Suppress audio when spectating a battle room
  try {
    const origAudioPlay = HTMLAudioElement.prototype.play;
    HTMLAudioElement.prototype.play = function() {
      if (window.location.pathname.includes('/battles/')) {
        const meStake = document.querySelector('[data-battle-stake="0"] .is-me, [data-battle-stake="1"] .is-me, up-battle-room [data-testid="battle-room-remove"]');
        if (!meStake) {
          return Promise.resolve();
        }
      }
      return origAudioPlay.apply(this, arguments);
    };
  } catch(e) {}

  let currentBestDrop = {
    id: "167862338",
    probability: "0.5503",
    wonAmount: "483427.28",
    user: { id: "1554726", nickname: "demonia", image: AUTHENTIC_AVATARS[0] },
    item: {
      id: "27574",
      appId: 730,
      marketName: "★ Talon Knife | Doppler Ruby (Factory New)",
      price: "483427.280",
      image: "https://cs2-cdn.pricempire.com/panorama/images/econ/default_generated/weapon_knife_widowmaker_am_ruby_marbleized_light_png.avif",
      imageNew: "https://cs2-cdn.pricempire.com/panorama/images/econ/default_generated/weapon_knife_widowmaker_am_ruby_marbleized_light_png.avif",
      extra: { e: 1, g: 33, n: ["★ Talon Knife", "Doppler Ruby", "Factory New"], r: 11, s: false, t: 6, ch: "ffae39", st: false }
    }
  };

  function removeDuplicateBestDrop() {
    const customWrapper = document.getElementById('upgrader-custom-best-drop-wrapper');
    if (customWrapper) customWrapper.remove();
  }
  setInterval(removeDuplicateBestDrop, 1000);

  function generateRandomDrop() {
    const catalog = window.UPGRADER_CONFIG && window.UPGRADER_CONFIG.catalog;
    if (catalog && catalog.length > 0) {
      const skin = catalog[Math.floor(Math.random() * catalog.length)];
      const nick = authenticNicknames[Math.floor(Math.random() * authenticNicknames.length)];
      const av = AUTHENTIC_AVATARS[Math.floor(Math.random() * AUTHENTIC_AVATARS.length)];
      const botObj = {
        id: String(Date.now() + '_' + Math.floor(Math.random() * 10000)),
        probability: ((Math.random() * 75 + 4) / 100).toFixed(4),
        user: {
          id: String(Math.floor(Math.random() * 900000) + 1735000),
          nickname: nick,
          image: av,
          avatar: av
        },
        item: {
          id: String(skin.id),
          appId: 730,
          marketName: skin.marketName,
          price: String(skin.price),
          image: skin.image,
          imageNew: skin.image,
          extra: skin.extra || { r: 12, ch: 'd32ce6', n: skin.marketName.split('|').map(s=>s.trim()) }
        }
      };
      registerKnownBot(botObj.user);
      return botObj;
    }
    if (authenticDropsPool.length > 0) {
      const base = authenticDropsPool[Math.floor(Math.random() * authenticDropsPool.length)];
      return {
        ...base,
        id: String(Date.now() + '_' + Math.floor(Math.random() * 10000)),
        probability: ((Math.random() * 75 + 4) / 100).toFixed(4)
      };
    }
    return {
      id: String(Date.now() + '_' + Math.floor(Math.random() * 10000)),
      probability: "0.5230",
      user: { id: "1735100", nickname: "Player", image: "https://s3.upgrader.best/cdn/fa/images/default-avatar-small.webp" },
      item: { id: "15238", appId: 730, marketName: "AK-47 | Redline (Field-Tested)", price: "1850.00", image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLkjYbf7itX6vytbbZSNeODHViUzulxqd5hSiiljFN0tjncn4mheS3BZgQiCZsiTOJb4RW8loaxML_itAzW34lCni-oin8c8G81tPcb6H_-/360fx360f", extra: { r: 12, ch: "d32ce6" } }
    };
  }

  // 6. WEBSOCKET MOCK ENGINE
  // (WsMock is defined earlier before SupabaseDB to avoid TDZ)

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
        authenticDropsPool.push(d);
        if (authenticDropsPool.length > 80) {
          authenticDropsPool.shift();
        }
      }
    });
    if (dropStreamQueue.length > 35) {
      dropStreamQueue.splice(0, dropStreamQueue.length - 35);
    }
  }

  async function pollRealtimeFeed() {
    try {
      let feed = null;
      try {
        const mockRes = handleMockApi('GET', '/api/realtime-feed');
        if (mockRes && mockRes.data) {
          feed = mockRes.data;
        }
      } catch (e) {}
      if (!feed) {
        const res = await fetch('/api/realtime-feed');
        if (res.ok) feed = await res.json();
      }
      if (!feed) return;
      if (typeof feed.online === 'number' && feed.online > 0) {
        currentOnline = feed.online;
        GlobalStats.onlineCount = feed.online;
        updateOnlineBadgeInDOM();
        WsMock.broadcast({
          event: 'online',
          data: feed.online
        });
      }
      if (typeof feed.gamesCount === 'number' && feed.gamesCount > 400000000) {
        GlobalStats.setTargetCount(feed.gamesCount);
      }
      if (Array.isArray(feed.liveDrops) && feed.liveDrops.length > 0) {
        cachedRealtimeDrops = feed.liveDrops;
        feed.liveDrops.forEach(d => {
          const did = String(d.id || (d.item && d.item.id) || '');
          if (did && !seenLiveDropIds.has(did)) {
            seenLiveDropIds.add(did);
            authenticDropsPool.push(d);
            if (authenticDropsPool.length > 80) authenticDropsPool.shift();
          }
        });
      }
      if (Array.isArray(feed.newDrops) && feed.newDrops.length > 0) {
        enqueueDrops(feed.newDrops);
      }
      if (feed.bestLiveDrop && feed.bestLiveDrop.item) {
        currentBestDrop = feed.bestLiveDrop;
        WsMock.broadcast({
          event: 'live_drops.best_hour_updated',
          data: { bestLiveDrop: currentBestDrop }
        });
        removeDuplicateBestDrop();
      }
    } catch(e) {}
  }
  setInterval(pollRealtimeFeed, 1000);
  pollRealtimeFeed();

  // Fast continuous drop streamer (drops roll in smoothly every 700ms - 2500ms)
  function emitNextLiveDrop() {
    let nextDrop = null;
    if (dropStreamQueue.length > 0) {
      nextDrop = dropStreamQueue.shift();
    } else if (authenticDropsPool.length > 0) {
      nextDrop = generateRandomDrop();
    } else if (cachedRealtimeDrops && cachedRealtimeDrops.length > 0) {
      const base = cachedRealtimeDrops[Math.floor(Math.random() * cachedRealtimeDrops.length)];
      nextDrop = {
        ...base,
        id: String(Date.now() + '_' + Math.floor(Math.random() * 10000)),
        probability: ((Math.random() * 75 + 4) / 100).toFixed(4)
      };
    }

    if (nextDrop) {
      WsMock.broadcast({
        event: 'live_drops.new',
        data: nextDrop
      });
    }

    // Realistic, brisk pacing matching upgrader.best high-speed stream
    let nextInterval;
    if (dropStreamQueue.length > 2) {
      nextInterval = Math.floor(Math.random() * 120) + 120; // 120ms - 240ms
    } else {
      const roll = Math.random();
      if (roll < 0.65) {
        nextInterval = Math.floor(Math.random() * 180) + 160; // 160ms - 340ms
      } else if (roll < 0.90) {
        nextInterval = Math.floor(Math.random() * 200) + 300; // 300ms - 500ms
      } else {
        nextInterval = Math.floor(Math.random() * 250) + 450; // 450ms - 700ms
      }
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
              const respData = (data.event === 'online') ? currentOnline : 'ok';
              setTimeout(() => {
                if (fakeWs.onmessage) {
                  fakeWs.onmessage({
                    data: JSON.stringify({
                      id: data.id,
                      data: respData
                    })
                  });
                }
              }, 5);
            }
            if (data && (data.event === 'subscribe' || data.type === 'subscribe')) {
              const r = data.room || data.data;
              if (r) {
                fakeWs.rooms = fakeWs.rooms || new Set();
                fakeWs.rooms.add(r);
              }
            }
            if (data && (data.event === 'unsubscribe' || data.type === 'unsubscribe')) {
              const r = data.room || data.data;
              if (r && fakeWs.rooms) {
                fakeWs.rooms.delete(r);
              }
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


  // =============================================================
  // BATTLE SYSTEM (Case Battles & PvP Duels Engine)
  // =============================================================
  const BattleSystem = {
    userLobbies: [],
    botLobbies: [],
    liveLobbies: [],
    allLobbies: new Map(),
    plans: {},
    initialized: false,
    botNames: authenticNicknames,
    botAvatars: AUTHENTIC_AVATARS,
    fallbackSkins: [
      { id: '17441', marketName: 'AK-47 | Redline (Field-Tested)', price: '1450.00', image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhx8bf9TZk_PujeKhoH_OSA2ivzOtyufRkAS23zUoj4WSEn42oeHzDaQ90D8d0QeQN5xjpwYeyY-_k4VHdioMTzX7gznQeKbQ00Mw/360fx360f', extra: { e: 5, g: 24, n: ['AK-47', 'Redline', 'Field-Tested'], r: 13, s: false, t: 16, ch: 'b0c3d9', st: false } },
      { id: '17442', marketName: 'AWP | Atheris (Field-Tested)', price: '280.00', image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8jsHf_DNk4uL5V7FhNOKSA2iUxPx4j-1gSCGn2xhw6zjSzYysICiUOgV0Cpd1TORe5BW9w922Nrux5gKLitpGz3irhnlXrnE866qixJk/360fx360f', extra: { e: 2, g: 18, n: ['AWP', 'Atheris', 'Field-Tested'], r: 15, s: false, t: 16, ch: '4b69ff', st: false } },
      { id: '17443', marketName: 'M4A4 | The Emperor (Field-Tested)', price: '2400.00', image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLhx8bf9TZk_PujeKhoH_OSA2ivzOtyufRkAS23zUoj4WSEn42oeHzDaQ90D8d0QeQN5xjpwYeyY-_k4VHdioMTzX7gznQeKbQ00Mw/360fx360f', extra: { e: 5, g: 24, n: ['M4A4', 'The Emperor', 'Field-Tested'], r: 13, s: false, t: 16, ch: 'eb4b4b', st: false } },
      { id: '17444', marketName: 'USP-S | Printstream (Field-Tested)', price: '5200.00', image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8jsHf_DNk4uL5V7FhNOKSA2iUxPx4j-1gSCGn2xhw6zjSzYysICiUOgV0Cpd1TORe5BW9w922Nrux5gKLitpGz3irhnlXrnE866qixJk/360fx360f', extra: { e: 2, g: 18, n: ['USP-S', 'Printstream', 'Field-Tested'], r: 15, s: false, t: 16, ch: 'd32ce6', st: false } }
    ],
    getRandomBot() {
      const activeUser = LocalDB.getActiveUser();
      let botId;
      do {
        botId = String(100000 + Math.floor(Math.random() * 899999));
      } while (activeUser && String(activeUser.id) === botId);

      const idx = Math.floor(Math.random() * this.botNames.length);
      const avIdx = Math.floor(Math.random() * this.botAvatars.length);
      const av = this.botAvatars[avIdx];
      const name = this.botNames[idx];
      const bot = {
        id: botId,
        username: name,
        nickname: name,
        avatar: av,
        image: av,
        avatarUrl: av
      };
      registerKnownBot(bot);
      return bot;
    },
    getSkinsForAmount(targetAmount, ownerId) {
      const skins = [];
      let pool = (Array.isArray(catalogData) && catalogData.length > 50) ? catalogData : this.fallbackSkins;
      let remaining = targetAmount;
      let attempts = 0;
      while (remaining > 10 && attempts < 25) {
        attempts++;
        const candidate = pool[Math.floor(Math.random() * pool.length)];
        const p = parseFloat(candidate.price) || 0;
        if (p > 0 && p <= remaining * 1.05) {
          skins.push({
            id: String(candidate.id || Date.now() + '_' + Math.random().toString(36).substr(2, 5)),
            marketName: candidate.marketName || candidate.name || 'CS2 Skin',
            imageUrl: candidate.image || candidate.imageUrl || '/assets/images/default-avatar-small.webp',
            price: Number(p).toFixed(3),
            extra: candidate.extra || { e: 2, g: 18, n: ['Skin'], r: 15, s: false, t: 16, ch: '4b69ff', st: false },
            userId: String(ownerId)
          });
          remaining -= p;
          if (remaining < 20 || skins.length >= 2) break;
        }
      }
      if (skins.length === 0) {
        const fallback = this.fallbackSkins[0];
        skins.push({
          id: String(Date.now()),
          marketName: fallback.marketName,
          imageUrl: fallback.image,
          price: Number(targetAmount).toFixed(3),
          extra: fallback.extra,
          userId: String(ownerId)
        });
      }
      return skins;
    },
    generateToken() {
      return Array.from({length: 32}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    },
    init() {
      if (this.initialized) return;
      this.initialized = true;
      const initialAmounts = [142.10, 200.33, 350.00, 680.50, 1200.00, 2450.00, 4800.00, 9500.00];
      for (const amt of initialAmounts) {
        this.createBotLobby(amt);
      }
      this.syncLiveLobbies();
      setInterval(() => {
        this.syncLiveLobbies();
      }, 3500);
      setInterval(() => {
        this.tickBots();
      }, 1800);
    },
    syncLiveLobbies() {
      try {
        fetch('/api/game/battle/lobbies')
          .then(r => r.json())
          .then(data => {
            if (data && Array.isArray(data.items)) {
              const activeUser = LocalDB.getActiveUser();
              const clean = data.items.map(l => {
                const copy = JSON.parse(JSON.stringify(l));
                if (activeUser && String(copy.createdBy?.id) === String(activeUser.id)) {
                  copy.createdBy.id = 'ub_' + copy.createdBy.id;
                  if (copy.round && Array.isArray(copy.round.stakes)) {
                    copy.round.stakes.forEach(st => {
                      if (String(st.user?.id) === String(activeUser.id)) {
                        st.user.id = 'ub_' + st.user.id;
                      }
                    });
                  }
                }
                copy.isMine = false;
                copy.canAfford = true;
                return copy;
              });
              this.liveLobbies = clean;
              clean.forEach(l => {
                if (l && l.shareToken) this.allLobbies.set(l.shareToken, l);
                if (l && l.id) this.allLobbies.set(l.id, l);
              });
            }
          })
          .catch(() => {});
      } catch(e) {}
    },
    createBotLobby(targetAmount) {
      const bot = this.getRandomBot();
      const id = String(Date.now() + Math.floor(Math.random() * 1000));
      const shareToken = this.generateToken();
      const skins = this.getSkinsForAmount(targetAmount, bot.id);
      const sum = skins.reduce((acc, s) => acc + parseFloat(s.price), 0);
      const finalAmt = sum > 0 ? sum : targetAmount;
      const lobby = {
        id: id,
        status: 'waiting',
        shareToken: shareToken,
        isPrivate: false,
        targetAmount: finalAmt.toFixed(2),
        tolerancePercent: '1.00',
        feePercent: '0.00',
        maxStake: '100000.00',
        minStake: '100.00',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        closedAt: null,
        createdBy: bot,
        round: {
          id: id,
          status: 'waiting',
          bank: finalAmt.toFixed(2),
          roll: null,
          maxRoll: 100000,
          winnerId: null,
          feeAmount: null,
          feeFromBalance: null,
          finishedAt: null,
          stakes: [
            {
              user: bot,
              amount: finalAmt.toFixed(2),
              itemsAmount: finalAmt.toFixed(2),
              balanceAmount: '0.00',
              rangeFrom: null,
              rangeTo: null,
              chance: null,
              items: skins
            }
          ]
        },
        canAfford: true,
        isMine: false,
        createdAtTime: Date.now()
      };
      this.allLobbies.set(shareToken, lobby);
      this.allLobbies.set(id, lobby);
      this.botLobbies.unshift(lobby);
      // Disappear oldest battle from the end of the list when new battle is created
      if (this.botLobbies.length > 14) {
        const oldestWaitingIdx = this.botLobbies.findLastIndex ? this.botLobbies.findLastIndex(l => l.status === 'waiting' && !l.isMine) : -1;
        if (oldestWaitingIdx !== -1 && this.botLobbies.length > 12) {
          const [removed] = this.botLobbies.splice(oldestWaitingIdx, 1);
          if (removed) {
            WsMock.broadcast({
              event: 'battle.lobby_closed',
              data: { id: removed.id, shareToken: removed.shareToken }
            });
          }
        }
      }
      return lobby;
    },
    tickBots() {
      // 1. Purge very old finished bot lobbies (> 60s)
      const now = Date.now();
      this.botLobbies = this.botLobbies.filter(l => {
        if (l.status === 'finished' && l.finishedTimestamp && (now - l.finishedTimestamp > 60000)) {
          return false;
        }
        return true;
      });

      // 2. Bot vs Bot: pick a waiting bot lobby and simulate another bot joining!
      const waiting = this.botLobbies.filter(l => l.status === 'waiting' && !l.isMine);
      if (waiting.length > 0 && Math.random() < 0.65) {
        const target = waiting[Math.floor(Math.random() * waiting.length)];
        const opponentBot = this.getRandomBot();
        while (opponentBot.id === target.createdBy.id) {
          opponentBot.id = String(Math.floor(100000 + Math.random() * 899999));
        }
        const amt = parseFloat(target.targetAmount);
        const opponentSkins = this.getSkinsForAmount(amt, opponentBot.id);
        const oppAmt = opponentSkins.reduce((a, s) => a + parseFloat(s.price), 0);
        const totalBank = amt + oppAmt;

        const p1Share = amt / totalBank;
        const p2Share = oppAmt / totalBank;
        const p1MaxRoll = Math.floor(p1Share * 100000);

        target.round.stakes[0].rangeFrom = 0;
        target.round.stakes[0].rangeTo = p1MaxRoll;
        target.round.stakes[0].chance = Number((p1Share * 100).toFixed(2));

        target.round.stakes.push({
          user: opponentBot,
          amount: oppAmt.toFixed(2),
          itemsAmount: oppAmt.toFixed(2),
          balanceAmount: '0.00',
          rangeFrom: p1MaxRoll + 1,
          rangeTo: 100000,
          chance: Number((p2Share * 100).toFixed(2)),
          items: opponentSkins
        });

        const roll = Math.floor(Math.random() * 100000);
        const winnerId = (roll <= p1MaxRoll) ? target.createdBy.id : opponentBot.id;

        target.round.bank = totalBank.toFixed(2);
        target.round.roll = roll;
        target.round.maxRoll = 100000;
        target.round.winnerId = winnerId;
        target.round.finishedAt = new Date().toISOString();
        target.round.status = 'finished';
        target.status = 'finished';
        target.closedAt = new Date().toISOString();
        target.finishedTimestamp = Date.now();

        // Register in fast lookup map so room can always load it
        this.allLobbies.set(target.shareToken, target);
        this.allLobbies.set(target.id, target);

        // Immediately notify battles list that lobby closed and matched!
        // This makes Angular's battles list start the 6-second countdown on the battle card!
        WsMock.broadcast({
          event: 'battle.lobby_closed',
          data: {
            id: target.id,
            shareToken: target.shareToken,
            opponent: opponentBot,
            winnerId: winnerId
          }
        });

        // Broadcast battle.round_finished for spectators
        WsMock.broadcast({
          event: 'battle.round_finished',
          data: target
        });
      }

      // 3. Keep bot lobby feed fresh with new diverse stakes
      const currentWaitingCount = this.botLobbies.filter(l => l.status === 'waiting').length;
      if (currentWaitingCount < 8) {
        const amounts = [115, 230, 480, 890, 1400, 2600, 5200, 9500, 14000];
        const newAmt = amounts[Math.floor(Math.random() * amounts.length)];
        const fresh = this.createBotLobby(newAmt);
        WsMock.broadcast({
          event: 'battle.lobby_created',
          data: fresh
        });
      }
    },
    getLobbies(filter) {
      this.init();
      const activeUser = LocalDB.getActiveUser();

      // Merge: User created lobbies (on top) + Live lobbies from upgrader.best + Bot lobbies
      const userLobs = [...this.userLobbies];
      const liveLobs = [...this.liveLobbies];
      const botLobs = [...this.botLobbies];

      // Deduplicate by shareToken or id
      const seen = new Set();
      let res = [];

      // 1. User lobbies first
      for (const l of userLobs) {
        if (!seen.has(l.shareToken)) {
          seen.add(l.shareToken);
          l.isMine = true;
          res.push(l);
        }
      }

      // 2. Real live lobbies next
      for (const l of liveLobs) {
        if (!seen.has(l.shareToken)) {
          seen.add(l.shareToken);
          if (activeUser && String(l.createdBy?.id) === String(activeUser.id)) {
            l.createdBy.id = 'ub_' + l.createdBy.id;
          }
          l.isMine = false;
          res.push(l);
        }
      }

      // 3. Bot lobbies
      for (const l of botLobs) {
        if (!seen.has(l.shareToken)) {
          seen.add(l.shareToken);
          if (activeUser && String(l.createdBy?.id) === String(activeUser.id)) {
            l.createdBy.id = 'bot_' + l.createdBy.id;
          }
          l.isMine = false;
          res.push(l);
        }
      }

      if (filter && filter.priceFrom) {
        const from = parseFloat(filter.priceFrom);
        if (!isNaN(from)) res = res.filter(l => parseFloat(l.targetAmount) >= from);
      }
      if (filter && filter.priceTo) {
        const to = parseFloat(filter.priceTo);
        if (!isNaN(to)) res = res.filter(l => parseFloat(l.targetAmount) <= to);
      }
      if (filter && filter.sort) {
        if (filter.sort === 'price_asc') res.sort((a,b) => parseFloat(a.targetAmount) - parseFloat(b.targetAmount));
        else if (filter.sort === 'price_desc') res.sort((a,b) => parseFloat(b.targetAmount) - parseFloat(a.targetAmount));
      }
      return {
        items: res,
        hasMore: false
      };
    },
    getLobby(tokenOrId) {
      this.init();
      if (!tokenOrId) return null;
      if (this.allLobbies.has(tokenOrId)) {
        return this.allLobbies.get(tokenOrId);
      }
      return this.userLobbies.find(l => l.shareToken === tokenOrId || l.id === tokenOrId) ||
             this.liveLobbies.find(l => l.shareToken === tokenOrId || l.id === tokenOrId) ||
             this.botLobbies.find(l => l.shareToken === tokenOrId || l.id === tokenOrId) ||
             null;
    },
    createLobby(user, body) {
      this.init();
      const id = String(Date.now());
      const shareToken = this.generateToken();
      let totalAmount = 0;
      let stakedItems = [];
      let balanceStake = 0;

      const userInv = Array.isArray(user.inventory) ? user.inventory : [];
      if (Array.isArray(body.inventoryItemIds) && body.inventoryItemIds.length > 0) {
        const idSet = new Set(body.inventoryItemIds.map(String));
        userInv.forEach(item => {
          if (idSet.has(String(item.id))) {
            item.locked_for_battle = true;
            const p = parseFloat(item.price || (item.item && item.item.price) || 0);
            totalAmount += p;
            stakedItems.push({
              id: String(item.id),
              marketName: item.marketName || (item.item && item.item.marketName) || 'CS2 Item',
              imageUrl: item.image || item.imageUrl || (item.item && (item.item.image || item.item.imageUrl)) || '',
              price: Number(p).toFixed(3),
              extra: item.extra || (item.item && item.item.extra) || { e: 2, g: 18, n: ['Skin'], r: 15, s: false, t: 16, ch: '4b69ff', st: false },
              userId: String(user.id)
            });
          }
        });
      }

      if (body.shopItemIds && Array.isArray(body.shopItemIds) && body.shopItemIds.length > 0) {
        body.shopItemIds.forEach(sid => {
          const skin = (Array.isArray(catalogData) ? catalogData : this.fallbackSkins).find(s => String(s.id) === String(sid));
          if (skin) {
            const p = parseFloat(skin.price) || 0;
            totalAmount += p;
            balanceStake += p;
            stakedItems.push({
              id: String(Date.now() + '_' + Math.random().toString(36).substr(2, 5)),
              marketName: skin.marketName,
              imageUrl: skin.image || skin.imageUrl,
              price: Number(p).toFixed(3),
              extra: skin.extra,
              userId: String(user.id)
            });
          }
        });
      }

      if (totalAmount < 100) {
        const diff = 100 - totalAmount;
        if (Number(user.balance || 0) >= diff) {
          user.balance = Math.round((user.balance - diff) * 100) / 100;
          totalAmount = 100;
          balanceStake += diff;
        } else {
          totalAmount = Math.max(100, totalAmount);
        }
      }

      if (balanceStake > 0 && Number(user.balance || 0) >= balanceStake) {
        user.balance = Math.round((user.balance - balanceStake) * 100) / 100;
      }
      LocalDB.saveUser(user);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
        SupabaseDB.updateUser(user.id || user.username, { balance: user.balance, inventory: user.inventory }).catch(e => console.warn(e));
      }
      WsMock.broadcastBalance(user.balance);

      const creator = {
        id: String(user.id),
        username: user.nickname || user.username || 'You',
        nickname: user.nickname || user.username || 'You',
        avatar: user.avatar || user.image || '/assets/images/default-avatar-small.webp',
        image: user.avatar || user.image || '/assets/images/default-avatar-small.webp',
        avatarUrl: user.avatar || user.image || '/assets/images/default-avatar-small.webp'
      };

      const lobby = {
        id: id,
        status: 'waiting',
        shareToken: shareToken,
        isPrivate: !!body.isPrivate,
        targetAmount: totalAmount.toFixed(2),
        tolerancePercent: '1.00',
        feePercent: '0.00',
        maxStake: '100000.00',
        minStake: '100.00',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        closedAt: null,
        createdBy: creator,
        round: {
          id: id,
          status: 'waiting',
          bank: totalAmount.toFixed(2),
          roll: null,
          maxRoll: 100000,
          winnerId: null,
          feeAmount: null,
          feeFromBalance: null,
          finishedAt: null,
          stakes: [
            {
              user: creator,
              amount: totalAmount.toFixed(2),
              itemsAmount: (totalAmount - balanceStake).toFixed(2),
              balanceAmount: balanceStake.toFixed(2),
              rangeFrom: null,
              rangeTo: null,
              chance: null,
              items: stakedItems
            }
          ]
        },
        canAfford: true,
        isMine: true
      };

      this.allLobbies.set(shareToken, lobby);
      this.allLobbies.set(id, lobby);
      this.userLobbies.unshift(lobby);
      WsMock.broadcast({
        event: 'battle.lobby_created',
        data: lobby
      });

      // Bot automatically joins user lobby after 3.8 seconds
      setTimeout(() => {
        this.botJoinUserLobby(lobby.shareToken);
      }, 3800);

      return lobby;
    },
    botJoinUserLobby(shareToken) {
      const lobby = this.getLobby(shareToken);
      if (!lobby || lobby.status !== 'waiting') return;

      const bot = this.getRandomBot();
      const targetAmt = parseFloat(lobby.targetAmount);
      const botSkins = this.getSkinsForAmount(targetAmt, bot.id);
      const botAmt = botSkins.reduce((a, s) => a + parseFloat(s.price), 0);

      const userStake = parseFloat(lobby.round.stakes[0].amount);
      const totalBank = userStake + botAmt;

      const userShare = userStake / totalBank;
      const botShare = botAmt / totalBank;
      const userMaxRoll = Math.floor(userShare * 100000);

      lobby.round.stakes[0].rangeFrom = 0;
      lobby.round.stakes[0].rangeTo = userMaxRoll;
      lobby.round.stakes[0].chance = Number((userShare * 100).toFixed(2));

      lobby.round.stakes.push({
        user: bot,
        amount: botAmt.toFixed(2),
        itemsAmount: botAmt.toFixed(2),
        balanceAmount: '0.00',
        rangeFrom: userMaxRoll + 1,
        rangeTo: 100000,
        chance: Number((botShare * 100).toFixed(2)),
        items: botSkins
      });

      lobby.round.bank = totalBank.toFixed(2);
      lobby.status = 'in_progress';

      let activeUser = LocalDB.getActiveUser();
      let roll = Math.floor(Math.random() * 100000);

      try {
        const adminCfg = JSON.parse(localStorage.getItem('upgrader_admin_settings_v4') || '{}');
        if (adminCfg.target_user_id && String(adminCfg.target_user_id) === String(activeUser.id)) {
          const lk = parseInt(adminCfg.user_luck);
          if (!isNaN(lk)) {
            if (lk > 50) roll = Math.floor(userMaxRoll * 0.4);
            else if (lk < 50) roll = userMaxRoll + Math.floor((100000 - userMaxRoll) * 0.6);
          }
        }
      } catch(e) {}

      const userWon = (roll <= userMaxRoll);
      const winnerId = userWon ? String(lobby.createdBy.id) : bot.id;

      lobby.round.roll = roll;
      lobby.round.maxRoll = 100000;
      lobby.round.winnerId = winnerId;
      lobby.round.finishedAt = new Date().toISOString();
      lobby.round.status = 'finished';
      lobby.status = 'finished';
      lobby.closedAt = new Date().toISOString();

      if (activeUser) {
        // Record into persistent battle history immediately
        const histEntry = {
          roundId: String(lobby.id),
          shareToken: lobby.shareToken,
          myStake: userStake.toFixed(2),
          opponent: {
            id: String(bot.id),
            nickname: bot.nickname,
            image: bot.image || bot.avatar,
            avatar: bot.avatar || bot.image
          },
          isWinner: userWon,
          roundItems: [
            ...lobby.round.stakes[0].items.map(it => ({ ...it, userId: String(activeUser.id) })),
            ...botSkins.map(it => ({ ...it, userId: String(bot.id) }))
          ],
          roundBalances: [
            { userId: String(activeUser.id), amount: (lobby.round.stakes[0].balanceAmount || '0.00') }
          ],
          wonBalance: userWon ? totalBank.toFixed(2) : '0.00',
          rangeFrom: 0,
          rangeTo: userMaxRoll,
          maxRoll: 100000,
          roll: roll,
          finishedAt: new Date().toISOString()
        };
        LocalDB.addBattleHistory(activeUser.username, histEntry);

        // Delay inventory mutations by 13.5s so Angular's full countdown (6s), wheel spin (4.5s) and smooth GSAP item transfer animation (2.5s) finish before items are removed/added!
        setTimeout(() => {
          const freshUser = LocalDB.getActiveUser() || activeUser;
          if (userWon) {
            if (Array.isArray(freshUser.inventory)) {
              freshUser.inventory.forEach(it => {
                if (it.locked_for_battle) it.locked_for_battle = false;
              });
            }
            botSkins.forEach(bs => {
              const newInvItem = {
                id: 'won_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                marketName: bs.marketName,
                price: bs.price,
                image: bs.imageUrl || bs.image,
                imageUrl: bs.imageUrl || bs.image,
                extra: bs.extra,
                obtainedAt: new Date().toISOString()
              };
              freshUser.inventory = freshUser.inventory || [];
              freshUser.inventory.unshift(newInvItem);
              WsMock.broadcastInventoryItem(newInvItem);
              if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
                SupabaseDB.addInventoryItem(freshUser.id, newInvItem).catch(() => {});
              }
            });
            freshUser.userStats = freshUser.userStats || {};
            freshUser.userStats.battlesWon = (freshUser.userStats.battlesWon || 0) + 1;
            freshUser.userStats.profit = Math.round(((freshUser.userStats.profit || 0) + botAmt) * 100) / 100;
          } else {
            // USER LOST DUEL: permanently remove lost skins from memory, local storage & Supabase database
            if (Array.isArray(freshUser.inventory)) {
              const lostIds = [];
              freshUser.inventory = freshUser.inventory.filter(it => {
                if (it.locked_for_battle) {
                  lostIds.push(String(it.id));
                  return false;
                }
                return true;
              });
              if (lostIds.length > 0) {
                WsMock.broadcastDeletedItems(lostIds);
                lostIds.forEach(id => {
                  if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
                    SupabaseDB.removeInventoryItem(id).catch(() => {});
                  }
                });
              }
            }
            freshUser.userStats = freshUser.userStats || {};
            freshUser.userStats.profit = Math.round(((freshUser.userStats.profit || 0) - userStake) * 100) / 100;
          }
          freshUser.userStats.gamesCount = (freshUser.userStats.gamesCount || 0) + 1;
          LocalDB.saveUser(freshUser);
          if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
            SupabaseDB.updateUser(freshUser.id || freshUser.username, {
              inventory: freshUser.inventory,
              userStats: freshUser.userStats
            }).catch(e => console.warn(e));
          }

          // Notify Angular items service to refresh user inventory UI
          try {
            if (window.__upgraderItemsService && typeof window.__upgraderItemsService.notifyInventoryUpdate === 'function') {
              window.__upgraderItemsService.notifyInventoryUpdate(true);
            }
          } catch(e) {}
        }, 13500);
      }

      WsMock.broadcast({
        event: 'battle.round_finished',
        data: lobby
      });
      WsMock.broadcast({
        event: 'battle.lobby_closed',
        data: {
          id: lobby.id,
          shareToken: lobby.shareToken,
          opponent: bot,
          winnerId: winnerId
        }
      });
    },
    previewJoin(user, shareToken) {
      this.init();
      const lobby = this.getLobby(shareToken);
      const reqAmt = lobby ? parseFloat(lobby.targetAmount) : 100;
      const userBal = Number((user && user.balance) || 0);
      const userInv = Array.isArray(user && user.inventory) ? user.inventory.filter(i => !i.locked_for_battle && !LocalDB.isItemWithdrawing((user && user.username), (i.id || (i.item && i.item.id)))) : [];

      let matchedItems = [];
      let itemsTotal = 0;
      let scenario = 'shop';

      // 1. Prioritize user inventory skins to cover the stake without forcing site balance
      const tol = (lobby && lobby.tolerancePercent) ? lobby.tolerancePercent : 10;
      const minTol = reqAmt * (1 - tol / 100);
      const maxTol = reqAmt * (1 + tol / 100);

      if (userInv.length > 0) {
        const singleFit = userInv.find(it => {
          const p = parseFloat(it.price || (it.item && it.item.price) || 0);
          return p >= minTol && p <= maxTol;
        });

        if (singleFit) {
          matchedItems = [singleFit];
          itemsTotal = parseFloat(singleFit.price || (singleFit.item && singleFit.item.price) || 0);
        } else {
          const sorted = [...userInv].sort((a, b) => {
            const pa = parseFloat(a.price || (a.item && a.item.price) || 0);
            const pb = parseFloat(b.price || (b.item && b.item.price) || 0);
            return pb - pa;
          });

          let currentSum = 0;
          let combo = [];
          for (const item of sorted) {
            const p = parseFloat(item.price || (item.item && item.item.price) || 0);
            if (p > 0 && (currentSum + p <= maxTol || combo.length === 0)) {
              combo.push(item);
              currentSum += p;
              if (currentSum >= minTol || combo.length >= 4) break;
            }
          }

          if (currentSum >= minTol || combo.length > 0) {
            matchedItems = combo;
            itemsTotal = currentSum;
          }
        }
      }

      const planToken = 'plan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

      // If selected skins cover at least the minimum allowed by tolerance, NO SITE BALANCE REQUIRED!
      let balanceNeeded = 0;
      if (itemsTotal >= minTol) {
        balanceNeeded = 0;
        scenario = 'inventory';
      } else if (itemsTotal > 0) {
        balanceNeeded = Math.max(0, reqAmt - itemsTotal);
        scenario = 'top-up';
      } else {
        balanceNeeded = reqAmt;
        scenario = 'shop';
      }

      // Construct stakeItems with both flat properties and nested .item for mapInventoryItemToDisplayData
      const stakeItems = matchedItems.map(it => {
        const pStr = Number(it.price || (it.item && it.item.price) || 0).toFixed(2);
        const mName = it.marketName || (it.item && it.item.marketName) || 'CS2 Item';
        const img = it.image || it.imageUrl || (it.item && (it.item.image || it.item.imageUrl)) || '';
        const ex = it.extra || (it.item && it.item.extra) || { e: 2, g: 18, n: [mName], r: 15, s: false, t: 16, ch: '4b69ff', st: false };
        const innerItem = {
          id: String(it.id),
          marketName: mName,
          price: pStr,
          image: img,
          imageUrl: img,
          extra: ex
        };
        return {
          id: String(it.id),
          price: pStr,
          status: 'available',
          marketName: mName,
          imageUrl: img,
          image: img,
          extra: ex,
          userId: String(user ? user.id : ''),
          item: innerItem
        };
      });

      const plan = {
        planToken: planToken,
        shareToken: shareToken,
        scenario: scenario,
        stakeItems: stakeItems,
        matchedRawItems: matchedItems,
        balanceStake: balanceNeeded,
        totalStake: reqAmt
      };
      this.plans[planToken] = plan;

      const buyItems = (balanceNeeded > 0 && scenario !== 'inventory') ? [
        {
          item: {
            id: 'topup_bal',
            marketName: 'Баланс',
            price: balanceNeeded.toFixed(2),
            image: '/assets/images/battles/balance-coins.png',
            imageUrl: '/assets/images/battles/balance-coins.png',
            extra: { n: ['Баланс'], g: 1, e: 1, r: 10, ch: 'fdd911' }
          },
          quantity: 1
        }
      ] : [];

      return {
        planToken: planToken,
        expiresAt: new Date(Date.now() + 60000).toISOString(),
        stake: stakeItems,
        sell: [],
        buy: buyItems,
        totals: {
          purchaseAmount: balanceNeeded > 0 ? balanceNeeded.toFixed(2) : '0.00',
          saleProceeds: '0.00',
          balanceBefore: userBal.toFixed(2),
          balanceAfter: Math.max(0, userBal - balanceNeeded).toFixed(2),
          stakeAmount: reqAmt.toFixed(2)
        }
      };
    },
    joinLobby(user, shareToken, planToken) {
      this.init();
      let lobby = this.getLobby(shareToken);
      if (!lobby) throw new Error('Lobby not found');

      const plan = (planToken && this.plans[planToken]) ? this.plans[planToken] : null;
      const reqAmt = parseFloat(lobby.targetAmount);

      let stakedSkins = [];
      let balanceStake = reqAmt;

      if (plan && plan.stakeItems && plan.stakeItems.length > 0) {
        stakedSkins = plan.stakeItems;
        balanceStake = plan.balanceStake || 0;
      }

      if (balanceStake > 0) {
        if (Number(user.balance || 0) < balanceStake) {
          throw new Error('Недостаточно средств на балансе');
        }
        user.balance = Math.round((user.balance - balanceStake) * 100) / 100;
        WsMock.broadcastBalance(user.balance);
      }

      const player2 = {
        id: String(user.id),
        username: user.nickname || user.username || 'You',
        nickname: user.nickname || user.username || 'You',
        avatar: user.avatar || user.image || '/assets/images/default-avatar-small.webp',
        image: user.avatar || user.image || '/assets/images/default-avatar-small.webp',
        avatarUrl: user.avatar || user.image || '/assets/images/default-avatar-small.webp'
      };

      const p1Stake = parseFloat(lobby.round.stakes[0].amount);
      const totalBank = p1Stake + reqAmt;
      const p1Share = p1Stake / totalBank;
      const userShare = reqAmt / totalBank;
      const p1MaxRoll = Math.floor(p1Share * 100000);

      lobby.round.stakes[0].rangeFrom = 0;
      lobby.round.stakes[0].rangeTo = p1MaxRoll;
      lobby.round.stakes[0].chance = Number((p1Share * 100).toFixed(2));

      lobby.round.stakes.push({
        user: player2,
        amount: reqAmt.toFixed(2),
        itemsAmount: (reqAmt - balanceStake).toFixed(2),
        balanceAmount: balanceStake.toFixed(2),
        rangeFrom: p1MaxRoll + 1,
        rangeTo: 100000,
        chance: Number((userShare * 100).toFixed(2)),
        items: stakedSkins
      });

      lobby.round.bank = totalBank.toFixed(2);

      // Roll calculation & luck setting
      let roll = Math.floor(Math.random() * 100000);
      try {
        const adminCfg = JSON.parse(localStorage.getItem('upgrader_admin_settings_v4') || '{}');
        if (adminCfg.target_user_id && String(adminCfg.target_user_id) === String(user.id)) {
          const lk = parseInt(adminCfg.user_luck);
          if (!isNaN(lk)) {
            if (lk > 50) roll = p1MaxRoll + Math.floor((100000 - p1MaxRoll) * 0.4);
            else if (lk < 50) roll = Math.floor(p1MaxRoll * 0.5);
          }
        }
      } catch(e) {}

      const userWon = (roll > p1MaxRoll);
      const winnerId = userWon ? String(user.id) : String(lobby.createdBy.id);

      // Immediately settle round so playSettledRound triggers countdown and spin animation to this exact roll!
      lobby.round.roll = roll;
      lobby.round.maxRoll = 100000;
      lobby.round.winnerId = winnerId;
      lobby.round.finishedAt = new Date().toISOString();
      lobby.round.status = 'finished';
      lobby.status = 'finished';
      lobby.closedAt = new Date().toISOString();

      // Record in persistent battle history immediately
      const histEntry = {
        roundId: String(lobby.id),
        shareToken: lobby.shareToken,
        myStake: reqAmt.toFixed(2),
        opponent: {
          id: String(lobby.createdBy.id),
          nickname: lobby.createdBy.nickname,
          image: lobby.createdBy.image || lobby.createdBy.avatar,
          avatar: lobby.createdBy.avatar || lobby.createdBy.image
        },
        isWinner: userWon,
        roundItems: [
          ...lobby.round.stakes[0].items.map(it => ({ ...it, userId: String(lobby.createdBy.id) })),
          ...stakedSkins.map(it => ({ ...it, userId: String(user.id) }))
        ],
        roundBalances: [
          { userId: String(user.id), amount: balanceStake.toFixed(2) }
        ],
        wonBalance: userWon ? totalBank.toFixed(2) : '0.00',
        rangeFrom: p1MaxRoll + 1,
        rangeTo: 100000,
        maxRoll: 100000,
        roll: roll,
        finishedAt: new Date().toISOString()
      };
      LocalDB.addBattleHistory(user.username, histEntry);

      // Delay inventory mutations by 13.5s so Angular's full countdown (6s), wheel spin (4.5s) and smooth GSAP item transfer animation (2.5s) finish before items are removed/added!
      setTimeout(() => {
        const freshUser = LocalDB.getActiveUser() || user;
        if (plan && plan.stakeItems && plan.stakeItems.length > 0) {
          const stakedIds = new Set((plan.matchedRawItems || []).map(it => String(it.id)));
          freshUser.inventory = (freshUser.inventory || []).filter(it => !stakedIds.has(String(it.id)));
          if (stakedIds.size > 0) WsMock.broadcastDeletedItems([...stakedIds]);
        }

        if (userWon) {
          const oppSkins = lobby.round.stakes[0].items || [];
          oppSkins.forEach(bs => {
            const newInvItem = {
              id: 'won_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
              marketName: bs.marketName,
              price: bs.price,
              image: bs.imageUrl || bs.image,
              imageUrl: bs.imageUrl || bs.image,
              extra: bs.extra,
              obtainedAt: new Date().toISOString()
            };
            freshUser.inventory = freshUser.inventory || [];
            freshUser.inventory.unshift(newInvItem);
            WsMock.broadcastInventoryItem(newInvItem);
            if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
              SupabaseDB.addInventoryItem(freshUser.id, newInvItem).catch(() => {});
            }
          });
          // If user won, return their staked skins too
          stakedSkins.forEach(bs => {
            const returnedItem = {
              id: 'won_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
              marketName: bs.marketName,
              price: bs.price,
              image: bs.imageUrl || bs.image,
              imageUrl: bs.imageUrl || bs.image,
              extra: bs.extra,
              obtainedAt: new Date().toISOString()
            };
            freshUser.inventory.unshift(returnedItem);
            WsMock.broadcastInventoryItem(returnedItem);
            if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
              SupabaseDB.addInventoryItem(freshUser.id, returnedItem).catch(() => {});
            }
          });

          freshUser.userStats = freshUser.userStats || {};
          freshUser.userStats.battlesWon = (freshUser.userStats.battlesWon || 0) + 1;
          freshUser.userStats.profit = Math.round(((freshUser.userStats.profit || 0) + p1Stake) * 100) / 100;
        } else {
          // User LOST DUEL: permanently remove staked items from Supabase database
          if (plan && Array.isArray(plan.matchedRawItems)) {
            plan.matchedRawItems.forEach(it => {
              const iid = String(it.id);
              if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
                SupabaseDB.removeInventoryItem(iid).catch(() => {});
              }
            });
          }
          freshUser.userStats = freshUser.userStats || {};
          freshUser.userStats.profit = Math.round(((freshUser.userStats.profit || 0) - reqAmt) * 100) / 100;
        }

        freshUser.userStats.gamesCount = (freshUser.userStats.gamesCount || 0) + 1;
        LocalDB.saveUser(freshUser);
        if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
          SupabaseDB.updateUser(freshUser.id || freshUser.username, {
            balance: freshUser.balance,
            inventory: freshUser.inventory,
            userStats: freshUser.userStats
          }).catch(e => console.warn(e));
        }

        // Notify Angular items service so inventory refreshes immediately
        try {
          if (window.__upgraderItemsService && typeof window.__upgraderItemsService.notifyInventoryUpdate === 'function') {
            window.__upgraderItemsService.notifyInventoryUpdate(true);
          }
        } catch(e) {}
      }, 13500);

      WsMock.broadcast({
        event: 'battle.round_finished',
        data: lobby
      });
      WsMock.broadcast({
        event: 'battle.lobby_closed',
        data: {
          id: lobby.id,
          shareToken: lobby.shareToken,
          opponent: player2,
          winnerId: winnerId
        }
      });
      // Broadcast again after 700ms so BattleRoomComponent on /battles/:shareToken catches event and spins roulette
      setTimeout(() => {
        WsMock.broadcast({
          event: 'battle.round_finished',
          data: lobby
        });
        WsMock.broadcast({
          event: 'battle.lobby_closed',
          data: {
            id: lobby.id,
            shareToken: lobby.shareToken,
            opponent: player2,
            winnerId: winnerId
          }
        });
      }, 700);

      return lobby;
    },
    leaveLobby(user, shareToken) {
      const lobby = this.getLobby(shareToken);
      if (!lobby || lobby.status !== 'waiting') return { success: false };
      lobby.status = 'cancelled';
      lobby.round.status = 'cancelled';
      if (Array.isArray(user.inventory)) {
        user.inventory.forEach(it => {
          if (it.locked_for_battle) it.locked_for_battle = false;
        });
        LocalDB.saveUser(user);
      }
      WsMock.broadcast({
        event: 'battle.round_cancelled',
        data: lobby
      });
      return { success: true };
    },
    getHistory(user, limit = 20, offset = 0) {
      this.init();
      if (!user) return { items: [], total: 0, hasMore: false };
      if (user.isBot) {
        const pool = (Array.isArray(catalogData) && catalogData.length > 20) ? catalogData : this.fallbackSkins;
        const botId = parseInt(user.id, 10) || 12345;
        const botBattlesCount = 8 + (botId % 10);
        const botBattles = [];
        for (let i = 0; i < botBattlesCount; i++) {
          const skin1 = pool[(botId * 3 + i * 5) % pool.length];
          const skin2 = pool[(botId * 7 + i * 11) % pool.length];
          const oppNick = authenticNicknames[(botId + i * 3) % authenticNicknames.length];
          const oppAv = AUTHENTIC_AVATARS[(botId + i * 3) % AUTHENTIC_AVATARS.length];
          const isWinner = ((botId + i) % 2) === 0;
          const myStake = parseFloat(skin1.price || 100);
          const oppStake = parseFloat(skin2.price || 100);
          const totalBank = myStake + oppStake;
          botBattles.push({
            id: String(botId * 1000 + i),
            roundId: String(botId * 1000 + i),
            shareToken: 'bot_battle_' + botId + '_' + i,
            myStake: myStake.toFixed(2),
            opponent: {
              id: String(botId + 500 + i),
              nickname: oppNick,
              image: oppAv
            },
            isWinner: isWinner,
            roundItems: [
              { ...skin1, userId: String(user.id) },
              { ...skin2, userId: String(botId + 500 + i) }
            ],
            roundBalances: [],
            wonBalance: isWinner ? totalBank.toFixed(2) : '0.00',
            rangeFrom: 0,
            rangeTo: 50000,
            maxRoll: 100000,
            roll: isWinner ? 25000 : 75000,
            finishedAt: new Date(Date.now() - (i + 1) * 3600000 * 3).toISOString()
          });
        }
        return {
          items: botBattles.slice(offset, offset + limit),
          total: botBattles.length,
          hasMore: offset + limit < botBattles.length
        };
      }
      const battles = LocalDB.getBattleHistory(user.username);
      return {
        items: battles.slice(offset, offset + limit),
        total: battles.length,
        hasMore: offset + limit < battles.length
      };
    }
  };

  // 7. MOCK REST API HANDLER
  function handleMockApi(method, path, body, params) {
    const activeUser = LocalDB.getActiveUser();

    // -------------------------------------------------------------
    // REALTIME FEED ENDPOINT (online counter & upgrades count)
    // -------------------------------------------------------------
    if (path.includes('realtime-feed')) {
      const hour = new Date().getHours();
      const baseCurve = 3500 + Math.sin((hour - 6) / 24 * Math.PI * 2) * 800;
      const online = Math.floor(baseCurve + (Math.random() * 80 - 40));
      return {
        status: 200,
        data: {
          online: online,
          gamesCount: GlobalStats.displayedCount || 2847600,
          upgradesCount: GlobalStats.displayedCount || 2847600,
          liveDrops: (typeof cachedRealtimeDrops !== 'undefined' && cachedRealtimeDrops) ? cachedRealtimeDrops : [],
          realtimeDrops: (typeof cachedRealtimeDrops !== 'undefined' && cachedRealtimeDrops) ? cachedRealtimeDrops : []
        }
      };
    }

    // -------------------------------------------------------------
    // VIP SYSTEM ENDPOINTS
    // -------------------------------------------------------------
    if (path.includes('/users/me/vip') || path.includes('/user/vip') || path.endsWith('/vip')) {
      const user = LocalDB.getActiveUser();
      let deposits = Number((user && user.depositsAmount) || 0);
      let tier = (user && (user.vipTier || user.tier)) || null;
      if (user && user.username === 'envy!') {
        if (deposits < 25000) deposits = 30000.0;
        tier = 'vip_gold';
      } else {
        if (deposits >= 500000) tier = 'vip_diamond';
        else if (deposits >= 100000) tier = 'vip_platinum';
        else if (deposits >= 25000) tier = 'vip_gold';
        else if (deposits >= 5000) tier = 'vip_silver';
      }

      return {
        status: 200,
        data: {
          tier: tier,
          depositsAmount: deposits,
          tiers: {
            vip_silver: 5000,
            vip_gold: 25000,
            vip_platinum: 100000,
            vip_diamond: 500000
          }
        }
      };
    }

    // -------------------------------------------------------------
    // PROVABLY FAIR ENDPOINTS
    // -------------------------------------------------------------
    if (path.includes('/pf/client-seed-history')) {
      return {
        status: 200,
        data: {
          items: [
            { id: 'cs_1', seed: 'e4f8b92a10c73d', createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
            { id: 'cs_2', seed: 'b91c0d45aa9821', createdAt: new Date(Date.now() - 3600000 * 24).toISOString() }
          ],
          hasMore: false
        }
      };
    }

    if (path.includes('/pf/server-seed/history')) {
      return {
        status: 200,
        data: {
          items: [
            { id: 'ss_1', hash: '8f43a9c72e11db501a39d882f0ca44bc783419bb', seed: '394850184028471928374910293847', createdAt: new Date(Date.now() - 3600000 * 4).toISOString() },
            { id: 'ss_2', hash: '5c0e7b9921adfc192837482910ab39d8271829ef', seed: '719283748192039482910394829102', createdAt: new Date(Date.now() - 3600000 * 28).toISOString() }
          ],
          hasMore: false
        }
      };
    }

    if (path.includes('/pf/client-seed') && method === 'POST') {
      return {
        status: 200,
        data: {
          seed: (body && body.seed) || 'client_seed_' + Math.random().toString(36).substring(2, 10),
          updatedAt: new Date().toISOString()
        }
      };
    }

    // -------------------------------------------------------------
    // BATTLES SYSTEM ENDPOINTS
    // -------------------------------------------------------------
    if (path.includes('/game/battle/settings')) {
      return {
        status: 200,
        data: {
          isEnabled: true,
          minStake: '100.00',
          maxStake: '100000.00',
          feePercent: '0.00',
          tolerancePercent: '1.00',
          maxPlayers: 2
        }
      };
    }

    if (path.includes('/game/battle/lobbies') && path.includes('/join/preview')) {
      const parts = path.split('/game/battle/lobbies/');
      const shareToken = parts[1].split('/join/preview')[0];
      return {
        status: 200,
        data: BattleSystem.previewJoin(activeUser, shareToken)
      };
    }

    if (path.includes('/game/battle/lobbies') && path.endsWith('/join') && method === 'POST') {
      const parts = path.split('/game/battle/lobbies/');
      const shareToken = parts[1].split('/join')[0];
      return {
        status: 200,
        data: BattleSystem.joinLobby(activeUser, shareToken, body && body.planToken)
      };
    }

    if (path.includes('/game/battle/lobbies') && path.endsWith('/leave') && method === 'POST') {
      const parts = path.split('/game/battle/lobbies/');
      const shareToken = parts[1].split('/leave')[0];
      return {
        status: 200,
        data: BattleSystem.leaveLobby(activeUser, shareToken)
      };
    }

    if (path.includes('/game/battle/lobbies/') && method === 'GET') {
      const parts = path.split('/game/battle/lobbies/');
      const shareToken = parts[1].split('?')[0];
      const lobby = BattleSystem.getLobby(shareToken);
      if (!lobby) return { status: 404, data: { message: 'Lobby not found' } };
      return { status: 200, data: lobby };
    }

    if (path.includes('/game/battle/lobbies') && method === 'POST') {
      if (!activeUser) return { status: 401, data: { message: 'Unauthorized' } };
      return {
        status: 200,
        data: BattleSystem.createLobby(activeUser, body)
      };
    }

    if (path.includes('/game/battle/lobbies') && method === 'GET') {
      const priceFrom = params ? params.get('priceFrom') : null;
      const priceTo = params ? params.get('priceTo') : null;
      const sort = params ? params.get('sort') : null;
      return {
        status: 200,
        data: BattleSystem.getLobbies({ priceFrom, priceTo, sort, user: activeUser })
      };
    }

    if (path.includes('/game/battle/history')) {
      let targetUser = activeUser;
      const m = path.match(/\/game\/battle\/history\/([^/?#]+)/);
      if (m && m[1]) {
        targetUser = getOrGenerateUserProfile(m[1]);
      }
      const limit = parseInt(params ? (params.get('limit') || params.get('pageSize') || '20') : '20', 10);
      let offset = 0;
      if (params) {
        if (params.get('offset') !== null && params.get('offset') !== undefined) {
          offset = parseInt(params.get('offset'), 10);
        } else if (params.get('page')) {
          offset = (parseInt(params.get('page'), 10) - 1) * limit;
        }
      }
      return {
        status: 200,
        data: BattleSystem.getHistory(targetUser, limit, offset)
      };
    }

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
                    image: `${origin}/assets/icons/payment-methods/sbp_a.png`,
                    minAmount: '50',
                    maxAmount: '100000',
                    currency: 'RUB',
                    userFeeEnabled: false
                  },
                  {
                    id: 'sbp_i',
                    name: 'СБП QRCODE I',
                    image: `${origin}/assets/icons/payment-methods/sbp_i.png`,
                    minAmount: '50',
                    maxAmount: '100000',
                    currency: 'RUB',
                    userFeeEnabled: false
                  },
                  {
                    id: 'spay',
                    name: 'S Pay',
                    image: `${origin}/assets/icons/payment-methods/spay.png`,
                    minAmount: '50',
                    maxAmount: '100000',
                    currency: 'RUB',
                    userFeeEnabled: false
                  },
                  {
                    id: 'sber',
                    name: 'СБЕР КАРТЫ',
                    image: `${origin}/assets/icons/payment-methods/sber.png`,
                    minAmount: '50',
                    maxAmount: '100000',
                    currency: 'RUB',
                    userFeeEnabled: false
                  },
                  {
                    id: 'mir',
                    name: 'МИР',
                    image: `${origin}/assets/icons/payment-methods/mir.png`,
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
          LocalDB.recordDeposit(user.username, num);
          closeNativePaymentModal();
          const refreshed = LocalDB.getActiveUser();
          const tier = refreshed ? refreshed.vipTier : null;
          const vipMsg = tier ? ' | VIP: ' + tier.replace('vip_', '').toUpperCase() : '';
          showToast('Промокод envy! активирован! Баланс +' + num.toLocaleString('ru-RU') + ' ₽' + vipMsg, 'success');
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
      const code = body && (body.code || body.promocode);
      if (code) {
        window._currentPromoCode = String(code).trim();
      }
      const isEnvy = code && String(code).toLowerCase().trim() === 'envy!';
      if (isEnvy) {
        let user = LocalDB.getActiveUser();
        if (user) {
          const bonus = 50000;
          LocalDB.recordDeposit(user.username, bonus);
          const refreshed = LocalDB.getActiveUser();
          const tier = refreshed ? refreshed.vipTier : null;
          showToast('Секретный промокод envy! активирован! Баланс +50 000 ₽ | VIP: ' + (tier ? tier.replace('vip_', '').toUpperCase() : 'SILVER'), 'success');
        }
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
          count: GlobalStats.displayedCount || GlobalStats.getUpgradesCount()
        }
      };
    }

    // Notification Hub Endpoints (media_1791311349032.png)
    if (path.includes('/users/notifications/unread/count') || path.includes('/notifications/unread/count')) {
      return { status: 200, data: 0 };
    }
    if (path.includes('/users/notifications/mark-all-read')) {
      return { status: 200, data: { success: true } };
    }
    if (path.includes('/users/notifications') && path.endsWith('/read') && method === 'PATCH') {
      return { status: 200, data: { success: true } };
    }
    if (path.includes('/users/notifications') || path.includes('/notifications')) {
      return {
        status: 200,
        data: {
          items: [],
          total: 0,
          hasMore: false
        }
      };
    }

    function getOrGenerateUserProfile(userId) {
      if (!userId) return activeUser;
      if (activeUser && (String(activeUser.id) === String(userId) || String(activeUser.username).toLowerCase() === String(userId).toLowerCase())) {
        return activeUser;
      }
      const localAcc = LocalDB.getUserById(userId);
      if (localAcc) return localAcc;

      // Check known bots cache first, or deterministic generation from user ID
      const cachedBot = knownBots.get(String(userId));
      let hash = 0;
      const strId = String(userId);
      for (let i = 0; i < strId.length; i++) {
        hash = ((hash << 5) - hash) + strId.charCodeAt(i);
        hash |= 0;
      }
      const numId = Math.abs(hash) || 1735123;
      const nick = (cachedBot && (cachedBot.nickname || cachedBot.username)) || authenticNicknames[numId % authenticNicknames.length];
      const av = (cachedBot && (cachedBot.avatar || cachedBot.image)) || AUTHENTIC_AVATARS[numId % AUTHENTIC_AVATARS.length];

      const PRESTIGE_SKINS = [
        { id: '11356', marketName: '★ Karambit | Doppler (Factory New)', price: '294525.00', image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Q7uCvZaZkNM-SA1iSze91u_FsTju_qhAmoT-Jn4bjJC_4Ml93UtZuRLQPsBawkNfiMbnl5AKMiopCnin7iCJBv31j4rkBBKEg-6zUjV3GY6p9v8dpLWT3Fg', extra: { e: 2, g: 507, n: ['★ Karambit', 'Doppler', 'Factory New'], r: 11, s: false, t: 16, ch: 'ffae39', st: false } },
        { id: '11031', marketName: '★ Butterfly Knife | Fade (Field-Tested)', price: '253014.67', image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Z-ua6bbZrLOmsD2avx-9ytd5lRi67gVNwsDvSwtqqc3iXZg4kCZYjReYLtRbum9XgYuvm5wbWjtgUzCn3iSsf8G81tFEeH9rw', extra: { e: 3, g: 515, n: ['★ Butterfly Knife', 'Fade', 'Field-Tested'], r: 11, s: false, t: 16, ch: 'ffae39', st: false } },
        { id: '15730', marketName: 'AWP | Dragon Lore (Factory New)', price: '1201391.93', image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk4veqYaF7IfysCnWRxuF4j-B-Xxa_nBovp3Pdwtj9cC_GaAd0DZdwQu9fuhS4kNy0NePntVTbjYpCyyT_3CgY5i9j_a9cBkcCWUKV/360fx360f', extra: { e: 2, g: 3, n: ['AWP', 'Dragon Lore', 'Factory New'], r: 10, s: false, t: 16, ch: 'eb4b4b', st: false } },
        { id: '15720', marketName: 'StatTrak™ M4A4 | Howl (Factory New)', price: '1431021.53', image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiFO0P_6afVSKP-EAm6extF6ueZhW2exwkl2tmTXwt39eCiUPQR2DMN4TOVetUK8xoLgM-K341eM2otDnC6okGoXufBz_TAB/360fx360f', extra: { e: 2, g: 14, n: ['M4A4', 'Howl', 'Factory New'], r: 11, s: false, t: 16, ch: 'e4ae39', st: true } },
        { id: '15775', marketName: 'StatTrak™ AK-47 | Fire Serpent (Factory New)', price: '524196.76', image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0PSneqF-JeKDC2mE_u995LZWTTuygxIYvzSCkpu3cnvFPQB2DpUkROFY4Rntw93lP7i241DbiI1BxSuviHlKunk_6-sHU71lpPMTRLyP4Q/360fx360f', extra: { e: 2, g: 1, n: ['AK-47', 'Fire Serpent', 'Factory New'], r: 10, s: false, t: 16, ch: 'eb4b4b', st: true } },
        { id: '11559', marketName: '★ Skeleton Knife | Fade (Field-Tested)', price: '175958.55', image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1I5PeibbBiLs-SD1iWwOpzj-1gSCGn20kjt2-En9mpcCmQag8hXsciQeJYthW9kILkMLji4g3Ygo8Uznj6jX9XrnE8raC5r1M', extra: { e: 3, g: 525, n: ['★ Skeleton Knife', 'Fade', 'Field-Tested'], r: 11, s: false, t: 16, ch: 'ffae39', st: false } },
        { id: '11763', marketName: '★ Talon Knife | Fade (Field-Tested)', price: '159458.76', image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1M5vahf6lsK_WBMWaR_uh3tORWQyC0nQlpsmXcnNaoeHuTZwUiWMZzRrVZsxm9x9ThNrzj4QCPjdhNmHj73S9KujErvbhX2ACGeQ', extra: { e: 3, g: 523, n: ['★ Talon Knife', 'Fade', 'Field-Tested'], r: 11, s: false, t: 16, ch: 'ffae39', st: false } },
        { id: '11428', marketName: '★ M9 Bayonet | Doppler (Factory New)', price: '259462.50', image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf3qr3czxb49KzgL-Kmsj2P7rSnXtU6dd9teTA5475jV2urhcDPzCkfMKLcAE-aV3R-lO5l-e61sfqvZ2fyiBgvikqsXiMyRGw1U1Ja-dm06adSULeWfJvEZCxug', extra: { e: 2, g: 508, n: ['★ M9 Bayonet', 'Doppler', 'Factory New'], r: 11, s: false, t: 16, ch: 'ffae39', st: false } },
        { id: '15830', marketName: '★ Sport Gloves | Vice (Factory New)', price: '624908.23', image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk5UvzWCL2kpn2-DFk_OKherB0H_KfG2Kv0ed4u95lRi67gVNx4T-Bw434IHyVb1QlAsd1FOUDthG4xNznMu3m4QXXg90Wzn_33C1I8G81tLaDi_rK/360fx360f', extra: { e: 2, g: null, n: ['★ Sport Gloves', 'Vice', 'Factory New'], r: 11, s: false, t: 6, ch: 'ffae39', st: false } },
        { id: '19574', marketName: '★ Butterfly Knife | Crimson Web (Factory New)', price: '495322.21', image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Z-ua6bbZrLOmsBn6v1ut0o95lRi67gVN04WmDzNz_cX_CalAiW8FxR7MI4xKxmtPlYe7ksgzeiN5BziT83y4f8G81tOxPsLb-/360fx360f', extra: { e: 2, g: null, n: ['★ Butterfly Knife', 'Crimson Web', 'Factory New'], r: 11, s: false, t: 9, ch: 'ffae39', st: false } }
      ];

      const bestSkin = PRESTIGE_SKINS[numId % PRESTIGE_SKINS.length];
      let weaponType = '';
      let skinName = '';
      let wear = '';
      if (bestSkin.marketName.includes('|')) {
        const parts = bestSkin.marketName.split('|');
        weaponType = parts[0].trim();
        const rem = parts[1].trim();
        const m = rem.match(/^(.*?)\s*(\([A-Za-z0-9\s-]+\))?$/);
        skinName = (m && m[1]) ? m[1].trim() : rem;
        wear = (m && m[2]) ? m[2].trim() : '';
      } else {
        skinName = bestSkin.marketName;
      }

      return {
        id: String(userId),
        username: nick,
        nickname: nick,
        image: av,
        avatar: av,
        balance: 0,
        isBot: true,
        upgradesMade: 35 + ((numId * 19) % 320),
        withdrawnAmount: 2400 + ((numId * 97) % 65000),
        withdrawnItemsCount: 3 + ((numId * 7) % 24),
        bestDrop: {
          id: String(bestSkin.id),
          appId: 730,
          marketName: bestSkin.marketName,
          price: Number(bestSkin.price).toFixed(2),
          image: bestSkin.image,
          imageNew: bestSkin.image,
          extra: bestSkin.extra || {
            r: 16,
            ch: 'eb4b4b',
            n: [weaponType, skinName, wear].filter(Boolean)
          }
        },
        bestDropProbability: ((2 + ((numId % 180) / 100)) / 100).toFixed(4)
      };
    }

    // /users/:id/stats or /users/me/stats or /user/stats
    if (path.includes('/stats') && (path.includes('/users/') || path.includes('/user/'))) {
      let acc = activeUser;
      const m = path.match(/\/users\/([^/?#]+)\/stats/);
      if (m && m[1]) {
        acc = getOrGenerateUserProfile(m[1]);
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
      const m = path.match(/\/users\/([^/?#]+)\/inventory\/history/);
      if (m && m[1]) {
        acc = getOrGenerateUserProfile(m[1]);
      }
      const limit = parseInt(params ? (params.get('limit') || params.get('pageSize') || '24') : '24', 10);
      let offset = 0;
      if (params) {
        if (params.get('offset') !== null && params.get('offset') !== undefined) {
          offset = parseInt(params.get('offset'), 10);
        } else if (params.get('page')) {
          offset = (parseInt(params.get('page'), 10) - 1) * limit;
        }
      }

      if (acc && acc.isBot) {
        const pool = (Array.isArray(catalogData) && catalogData.length > 20) ? catalogData : BattleSystem.fallbackSkins;
        const botId = parseInt(acc.id, 10) || 12345;
        const botItemsCount = 14 + (botId % 10);
        const botHistory = [];
        for (let i = 0; i < botItemsCount; i++) {
          const skin = pool[(botId * 3 + i * 7) % pool.length];
          const itId = String(botId * 100 + i);
          botHistory.push({
            id: itId,
            marketName: skin.marketName,
            price: Number(skin.price).toFixed(2),
            image: skin.image || skin.imageUrl,
            imageNew: skin.image || skin.imageUrl,
            extra: skin.extra || { e: 2, g: 18, n: [skin.marketName], r: 15, s: false, t: 16, ch: '4b69ff', st: false },
            item: {
              id: itId,
              appId: 730,
              marketName: skin.marketName,
              price: Number(skin.price).toFixed(2),
              image: skin.image || skin.imageUrl,
              imageNew: skin.image || skin.imageUrl,
              extra: skin.extra || { e: 2, g: 18, n: [skin.marketName], r: 15, s: false, t: 16, ch: '4b69ff', st: false }
            },
            obtainedAt: new Date(Date.now() - (i + 1) * 3600000 * 2).toISOString()
          });
        }
        return {
          status: 200,
          data: {
            items: botHistory.slice(offset, offset + limit),
            total: botHistory.length,
            hasMore: offset + limit < botHistory.length
          }
        };
      }

      const history = (acc && acc.username) ? LocalDB.getInventoryHistory(acc.username) : ((acc && acc.inventoryHistory) ? acc.inventoryHistory : []);
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
      const m = path.match(/\/game\/upgrader\/history\/([^/?#]+)/);
      if (m && m[1]) {
        acc = getOrGenerateUserProfile(m[1]);
      }
      const limit = parseInt(params ? (params.get('limit') || params.get('pageSize') || '9') : '9', 10);
      let offset = 0;
      if (params) {
        if (params.get('offset') !== null && params.get('offset') !== undefined) {
          offset = parseInt(params.get('offset'), 10);
        } else if (params.get('page')) {
          offset = (parseInt(params.get('page'), 10) - 1) * limit;
        }
      }

      if (acc && acc.isBot) {
        const pool = (Array.isArray(catalogData) && catalogData.length > 20) ? catalogData : BattleSystem.fallbackSkins;
        const botId = parseInt(acc.id, 10) || 12345;
        const botGamesCount = 9 + (botId % 8);
        const botGames = [];
        for (let i = 0; i < botGamesCount; i++) {
          const target = pool[(botId * 5 + i * 11) % pool.length];
          const betSkin = pool[(botId * 2 + i * 3) % pool.length];
          const isWin = ((botId + i) % 3) !== 0;
          botGames.push({
            id: String(botId * 1000 + i),
            status: isWin ? 'won' : 'lost',
            betItems: [{
              id: String(botId * 500 + i),
              marketName: betSkin.marketName,
              price: Number(betSkin.price).toFixed(2),
              image: betSkin.image || betSkin.imageUrl,
              extra: betSkin.extra
            }],
            targetItem: {
              id: String(target.id),
              marketName: target.marketName,
              price: Number(target.price).toFixed(2),
              image: target.image || target.imageUrl,
              extra: target.extra
            },
            wonItem: isWin ? {
              id: String(target.id),
              marketName: target.marketName,
              price: Number(target.price).toFixed(2),
              image: target.image || target.imageUrl,
              extra: target.extra
            } : null,
            addedBalance: 0,
            probability: 0.45,
            betAmount: Number(betSkin.price),
            createdAt: new Date(Date.now() - (i + 1) * 7200000).toISOString()
          });
        }
        return {
          status: 200,
          data: {
            items: botGames.slice(offset, offset + limit),
            total: botGames.length,
            hasMore: offset + limit < botGames.length
          }
        };
      }

      const games = (acc && acc.username) ? LocalDB.getGamesHistory(acc.username) : ((acc && acc.gamesHistory) ? acc.gamesHistory : []);
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
    const userProfileMatch = path.match(/\/users\/([^/?#]+)(?:\?|$)/);
    if (userProfileMatch && !['me', 'stats', 'inventory', 'balance', 'settings', 'profile', 'notifications'].includes(userProfileMatch[1])) {
      const acc = getOrGenerateUserProfile(userProfileMatch[1]);
      if (!acc) return { status: 404, data: { message: 'User not found' } };
      return {
        status: 200,
        data: {
          id: acc.id,
          username: acc.username,
          nickname: acc.nickname,
          image: acc.avatar,
          avatar: acc.avatar,
          balance: acc.balance || 0,
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
          tier: activeUser.vipTier || activeUser.tier || (activeUser.username === 'envy!' ? 'vip_gold' : null),
          vipTier: activeUser.vipTier || activeUser.tier || (activeUser.username === 'envy!' ? 'vip_gold' : null),
          depositsAmount: Number(activeUser.depositsAmount || (activeUser.username === 'envy!' ? 30000 : 0)),
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
      if (path.includes('/best-hour')) {
        return { status: 200, data: { bestLiveDrop: currentBestDrop } };
      }
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

      // CRITICAL FIX: If requested available items OR on main upgrader page, NEVER return items locked for withdrawal or battle!
      if (reqStatus === 'available' || !isProfile) {
        userInv = userInv.filter(entry => {
          if (entry.locked_for_battle) return false;
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
        const loadingDuration = (wEntry && wEntry.loadingDurationMs) || 28000;
        const isWaitingAccept = elapsed >= loadingDuration;

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

      return (async () => {
        // 1. Live verification against Supabase if configured
        if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
          try {
            const cloudInv = await SupabaseDB.fetchUserInventory(activeUser.id);
            if (Array.isArray(cloudInv)) {
              const cloudIds = new Set(cloudInv.map(x => String(x.id)));
              const currentLocal = activeUser.inventory || [];
              const validLocal = currentLocal.filter(x => cloudIds.has(String(x.id)));
              if (validLocal.length !== currentLocal.length) {
                console.log(`[local-backend] Sale live verification: purged ${currentLocal.length - validLocal.length} deleted items from DB`);
                activeUser.inventory = validLocal;
                LocalDB.saveUser(activeUser);
                window.dispatchEvent(new CustomEvent('upgrader:user-updated', { detail: activeUser }));
              }
            }
          } catch(err) {
            console.warn('[local-backend] Sale cloud verification error:', err);
          }
        }

        const freshUser = LocalDB.getActiveUser() || activeUser;
        const currentInv = freshUser.inventory || [];
        const itemIds = body && (body.inventoryItemIds || body.itemIds || body.ids || (body.id ? [body.id] : []));
        let soldTotal = 0;
        const soldItems = [];

        if (Array.isArray(itemIds)) {
          for (const id of itemIds) {
            // DO NOT sell skins that are currently being withdrawn!
            if (LocalDB.isItemWithdrawing(freshUser.username, id)) {
              continue;
            }
            const it = currentInv.find(x => String(x.id) === String(id) || String(x.originalSkinId) === String(id));
            if (it) {
              const itPrice = parseFloat(it.price || 0);
              soldTotal += itPrice;
              soldItems.push(it);
              LocalDB.removeItemFromInventory(freshUser.username, it.id);
              // Also delete from Supabase if present
              if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
                SupabaseDB.removeInventoryItem(it.id).catch(() => {});
              }
            }
          }
        }

        if (soldItems.length === 0) {
          showToast('Предметы больше недоступны в инвентаре', 'error');
          window.dispatchEvent(new CustomEvent('upgrader:user-updated', { detail: freshUser }));
          return {
            status: 400,
            data: {
              success: false,
              message: 'Предметы не найдены в инвентаре или уже удалены',
              totalAmount: 0,
              balance: String(freshUser.balance),
              items: []
            }
          };
        }

        soldTotal = parseFloat(soldTotal.toFixed(2));
        const newBal = LocalDB.updateBalance(freshUser.username, soldTotal, true);
        LocalDB.recordSale(freshUser.username, soldItems, soldTotal);

        if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
          SupabaseDB.updateUser(freshUser.id || freshUser.username, { balance: newBal }).catch(() => {});
        }

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
      })();
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
          if (rig === 'custom') {
            const fastCustom = parseFloat(localStorage.getItem('upgrader_custom_win_chance'));
            if (!isNaN(fastCustom)) customVal = fastCustom;
          } else {
            customVal = null;
          }
        }
      }

      let roll = Math.random();
      let isWin = false;

      if (rig === 'force_win' || rig === 'win') {
        isWin = true;
        chance = Math.max(0.10, chance);
        roll = Math.min(chance * 0.35, 0.015); // Guaranteed win: strictly inside winning sector
      } else if (rig === 'force_lose' || rig === 'lose') {
        isWin = false;
        roll = Math.max(chance + 0.10, 0.98); // Guaranteed lose: strictly outside winning sector
      } else if (rig === 'bonus_25' || rig === 'boost25') {
        chance = Math.min(0.98, chance + 0.25);
        isWin = Math.random() <= chance;
        roll = isWin ? (Math.random() * (chance * 0.92)) : Math.min(0.99, chance + 0.02 + Math.random() * Math.max(0.01, 1 - chance - 0.02));
      } else if (rig === 'bonus_50' || rig === 'boost50') {
        chance = Math.min(0.98, chance + 0.50);
        isWin = Math.random() <= chance;
        roll = isWin ? (Math.random() * (chance * 0.92)) : Math.min(0.99, chance + 0.02 + Math.random() * Math.max(0.01, 1 - chance - 0.02));
      } else if (rig === 'mult_2x' || rig === 'double') {
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

    let customResponseType = '';
    try {
      const nativeDesc = Object.getOwnPropertyDescriptor(OriginalXHR.prototype, 'responseType');
      Object.defineProperty(xhr, 'responseType', {
        get: () => customResponseType || (nativeDesc?.get ? nativeDesc.get.call(xhr) : ''),
        set: (val) => {
          customResponseType = val;
          try {
            if (nativeDesc && nativeDesc.set) {
              nativeDesc.set.call(xhr, val);
            }
          } catch(e) {}
        },
        configurable: true
      });
    } catch(e) {}

    const originalOpen = xhr.open;
    xhr.open = function(m, u) {
      method = (m || 'GET').toUpperCase();
      const isGH = window.location.hostname.includes('github.io') || window.location.pathname.startsWith('/envyrage');
      if (isGH && typeof u === 'string') {
        if (u.startsWith('/assets/')) u = '/envyrage' + u;
        else if (u === '/skins.json' || u === './skins.json') u = '/envyrage/skins.json';
      }
      url = u;
      const args = Array.from(arguments);
      args[0] = m;
      args[1] = u;
      if (args.length < 3) {
        args[2] = true;
      }
      return originalOpen.apply(xhr, args);
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
          Promise.resolve(mockResponse).then(resp => {
            const status = (resp && resp.status) || 200;
            const responseText = JSON.stringify((resp && resp.data) || {});
            let respVal = responseText;
            if (xhr.responseType === 'json') {
              try { respVal = (resp && resp.data !== undefined) ? resp.data : JSON.parse(responseText); } catch(e) {}
            }

            Object.defineProperty(xhr, 'status', { get: () => status, configurable: true });
            Object.defineProperty(xhr, 'statusText', { get: () => status === 200 ? 'OK' : 'Mock Response', configurable: true });
            Object.defineProperty(xhr, 'readyState', { get: () => 4, configurable: true });
            Object.defineProperty(xhr, 'responseText', { get: () => responseText, configurable: true });
            Object.defineProperty(xhr, 'response', { get: () => respVal, configurable: true });

            xhr.getAllResponseHeaders = function() {
              return 'content-type: application/json; charset=utf-8\r\n';
            };
            xhr.getResponseHeader = function(h) {
              if (h && h.toLowerCase() === 'content-type') return 'application/json; charset=utf-8';
              return null;
            };

            xhr.dispatchEvent(new Event('readystatechange'));
            xhr.dispatchEvent(new Event('load'));
            xhr.dispatchEvent(new Event('loadend'));
            if (xhr.onreadystatechange) xhr.onreadystatechange();
            if (xhr.onload) xhr.onload();
            if (xhr.onloadend) xhr.onloadend();
          }).catch(err => {
            xhr.status = 500;
            xhr.responseText = JSON.stringify({ message: err.message });
            xhr.readyState = 4;
            xhr.dispatchEvent(new Event('readystatechange'));
            xhr.dispatchEvent(new Event('loadend'));
          });
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
    const isGH = window.location.hostname.includes('github.io') || window.location.pathname.startsWith('/envyrage');
    if (isGH && typeof resource === 'string') {
      if (resource.startsWith('/assets/')) resource = '/envyrage' + resource;
      else if (resource === '/skins.json' || resource === './skins.json') resource = '/envyrage/skins.json';
    }
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
        return Promise.resolve(mockResponse).then(resp => {
          if (!resp) return originalFetch.apply(this, arguments);
          return new Response(JSON.stringify(resp.data), {
            status: resp.status,
            headers: { 'Content-Type': 'application/json' }
          });
        });
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

      /* Hide all scrollbars in live drop feed */
      up-drop, up-drop * {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      up-drop::-webkit-scrollbar, up-drop *::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }

      /* Authentic iOS-style Toggle Switch for Modals */
      .up-modal-switch {
        position: relative !important;
        display: inline-block !important;
        width: 44px !important;
        height: 24px !important;
        flex-shrink: 0 !important;
        cursor: pointer !important;
        user-select: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .up-modal-switch input {
        opacity: 0 !important;
        width: 0 !important;
        height: 0 !important;
        position: absolute !important;
        margin: 0 !important;
        pointer-events: none !important;
      }
      .up-modal-switch-slider {
        position: absolute !important;
        inset: 0 !important;
        background-color: #2F3138 !important;
        border-radius: 24px !important;
        transition: background-color 0.2s ease !important;
        cursor: pointer !important;
      }
      .up-modal-switch-slider:before {
        position: absolute !important;
        content: "" !important;
        height: 18px !important;
        width: 18px !important;
        left: 3px !important;
        bottom: 3px !important;
        background-color: #9CA3AF !important;
        border-radius: 50% !important;
        transition: transform 0.2s ease, background-color 0.2s ease !important;
      }
      .up-modal-switch input:checked + .up-modal-switch-slider {
        background-color: #FDD814 !important;
      }
      .up-modal-switch input:checked + .up-modal-switch-slider:before {
        transform: translateX(20px) !important;
        background-color: #121316 !important;
      }


      /* Always hide promo modal, cookie banner and push notification prompts */
      .cdk-overlay-pane.battle-promo-pane,
      .cdk-global-overlay-wrapper:has(.battle-promo-pane),
      .cdk-global-overlay-wrapper:has(.cookie-policy-modal),
      .battle-about-backdrop,
      .battle-promo-modal,
      .cookie-policy-modal,
      .cookies-consent,
      up-web-push-notifications {
        display: none !important;
        opacity: 0 !important;
        pointer-events: none !important;
        visibility: hidden !important;
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

      // Find cell by testid directly, or through cells list
      let parentCell = null;
      const directTarget = document.querySelector(`[data-testid*="withdraw-${id}"]`) ||
                           document.querySelector(`[data-testid*="${id}"]`);
      if (directTarget) {
        parentCell = directTarget.closest('div.relative') || 
                     directTarget.closest('.grid > div') || 
                     directTarget.closest('up-profile-items-table div.relative') ||
                     directTarget.parentElement;
      }

      if (!parentCell) {
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
      }

      if (parentCell) {
        const elapsed = now - entry.startedAt;
        const remainingMs = Math.max(0, entry.durationMs - elapsed);
        const loadingDuration = entry.loadingDurationMs || 28000;
        const isWaitingAccept = elapsed >= loadingDuration;

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
          overlay.classList.add('up-withdrawing-overlay');
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
              <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;">
                <svg width="24" height="24" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="mx-auto" style="width:24px;height:24px;animation:upSpin 1s linear infinite;display:block;margin:0 auto;">
                  <g clip-path="url(#clip0_9367_19811)">
                    <path d="M5.90914 9.99991C5.90914 9.49785 5.50211 9.09082 5.00004 9.09082H1.36368C0.86162 9.09082 0.45459 9.49785 0.45459 9.99991C0.45459 10.502 0.86162 10.909 1.36368 10.909H5.00004C5.50211 10.909 5.90914 10.502 5.90914 9.99991Z" fill="url(#paint0_linear_9367_19811)"/>
                    <path d="M18.6365 9.09082H16.8183C16.3162 9.09082 15.9092 9.49785 15.9092 9.99991C15.9092 10.502 16.3162 10.909 16.8183 10.909H18.6365C19.1385 10.909 19.5455 10.502 19.5455 9.99991C19.5455 9.49785 19.1385 9.09082 18.6365 9.09082Z" fill="url(#paint1_linear_9367_19811)"/>
                    <path d="M10.4545 5.45455C10.9566 5.45455 11.3636 5.04752 11.3636 4.54545V0.909091C11.3636 0.40703 10.9566 0 10.4545 0C9.95244 0 9.54541 0.40703 9.54541 0.909091V4.54545C9.54541 5.04752 9.95244 5.45455 10.4545 5.45455Z" fill="url(#paint2_linear_9367_19811)"/>
                    <path d="M10.4545 14.5454C9.95244 14.5454 9.54541 14.9524 9.54541 15.4545V19.0909C9.54541 19.5929 9.95244 20 10.4545 20C10.9566 20 11.3636 19.5929 11.3636 19.0909V15.4545C11.3636 14.9524 10.9566 14.5454 10.4545 14.5454Z" fill="url(#paint3_linear_9367_19811)"/>
                    <path d="M4.6691 2.92885C4.31419 2.57382 3.73855 2.57388 3.38346 2.92885C3.02843 3.28388 3.02843 3.85945 3.38346 4.21448L5.95479 6.78588C6.13231 6.96339 6.36498 7.05218 6.59758 7.05218C6.83019 7.05218 7.06291 6.96339 7.24037 6.78594C7.5954 6.43091 7.5954 5.85533 7.24037 5.5003L4.6691 2.92885Z" fill="url(#paint4_linear_9367_19811)"/>
                    <path d="M14.9542 13.214C14.5993 12.859 14.0236 12.859 13.6686 13.214C13.3136 13.569 13.3136 14.1446 13.6686 14.4996L16.24 17.0709C16.4175 17.2484 16.6502 17.3371 16.8828 17.3371C17.1155 17.3371 17.3482 17.2483 17.5256 17.0709C17.8807 16.7159 17.8807 16.1403 17.5256 15.7853L14.9542 13.214Z" fill="url(#paint5_linear_9367_19811)"/>
                    <path d="M5.95473 13.214L3.38346 15.7853C3.02843 16.1403 3.02843 16.7159 3.38346 17.0709C3.56098 17.2485 3.79364 17.3372 4.02631 17.3372C4.25898 17.3372 4.49164 17.2485 4.6691 17.0709L7.24037 14.4997C7.5954 14.1446 7.5954 13.5691 7.24037 13.214C6.88534 12.859 6.3097 12.859 5.95473 13.214Z" fill="url(#paint6_linear_9367_19811)"/>
                  </g>
                  <defs>
                    <linearGradient id="paint0_linear_9367_19811" x1="0.509135" y1="9.17199" x2="6.04465" y2="9.97608" gradientUnits="userSpaceOnUse"><stop offset="0.5" stop-color="#FFDD23"/><stop offset="1" stop-color="#FBD506"/></linearGradient>
                    <linearGradient id="paint1_linear_9367_19811" x1="15.9455" y1="9.17199" x2="19.6787" y2="9.53351" gradientUnits="userSpaceOnUse"><stop offset="0.5" stop-color="#FFDD23"/><stop offset="1" stop-color="#FBD506"/></linearGradient>
                    <linearGradient id="paint2_linear_9367_19811" x1="9.56359" y1="0.243507" x2="11.4472" y2="0.273908" gradientUnits="userSpaceOnUse"><stop offset="0.5" stop-color="#FFDD23"/><stop offset="1" stop-color="#FBD506"/></linearGradient>
                    <linearGradient id="paint3_linear_9367_19811" x1="9.56359" y1="14.7889" x2="11.4472" y2="14.8193" gradientUnits="userSpaceOnUse"><stop offset="0.5" stop-color="#FFDD23"/><stop offset="1" stop-color="#FBD506"/></linearGradient>
                    <linearGradient id="paint4_linear_9367_19811" x1="3.16108" y1="2.85856" x2="7.69905" y2="3.07828" gradientUnits="userSpaceOnUse"><stop offset="0.5" stop-color="#FFDD23"/><stop offset="1" stop-color="#FBD506"/></linearGradient>
                    <linearGradient id="paint5_linear_9367_19811" x1="13.4462" y1="13.1437" x2="17.9843" y2="13.3635" gradientUnits="userSpaceOnUse"><stop offset="0.5" stop-color="#FFDD23"/><stop offset="1" stop-color="#FBD506"/></linearGradient>
                    <linearGradient id="paint6_linear_9367_19811" x1="3.16108" y1="13.1437" x2="7.69905" y2="13.3634" gradientUnits="userSpaceOnUse"><stop offset="0.5" stop-color="#FFDD23"/><stop offset="1" stop-color="#FBD506"/></linearGradient>
                    <clipPath id="clip0_9367_19811"><rect width="20" height="20" fill="white"/></clipPath>
                  </defs>
                </svg>
                <span class="text-gray text-xxs text-center font-normal" style="color:#8E8F94;font-size:11px;font-family:'Exo 2',sans-serif;font-weight:400;text-align:center;">${waitingText}</span>
              </div>
            `;
          }
        } else {
          // Stage 2: Trade ready / countdown / Accept button
          if (overlay.dataset.stage !== 'stage2') {
            overlay.dataset.stage = 'stage2';
            statusEl.innerHTML = `
              <div class="flex items-center justify-center gap-2.5" style="display:flex;align-items:center;justify-content:center;gap:6px;">
                <svg width="20" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:18px;height:18px;display:inline-block;vertical-align:middle;">
                  <g clip-path="url(#clip0_2248_19073)">
                    <path d="M16.5582 5.95354L17.7557 4.75604L16.5773 3.57729L15.2963 4.85833C14.126 4.02899 12.7604 3.51786 11.3332 3.375V1.66667H12.9998V0H7.99984V1.66667H9.66651V3.375C8.23929 3.51786 6.87366 4.02899 5.70338 4.85833L4.42234 3.57729L3.24401 4.75604L4.44151 5.95354C3.32371 7.13704 2.57704 8.62203 2.2937 10.2251C2.01036 11.8282 2.20276 13.4791 2.84714 14.9741C3.49152 16.4691 4.55966 17.7426 5.91965 18.6373C7.27964 19.532 8.87192 20.0089 10.4998 20.0089C12.1278 20.0089 13.72 19.532 15.08 18.6373C16.44 17.7426 17.5082 16.4691 18.1525 14.9741C18.7969 13.4791 18.9893 11.8282 18.706 10.2251C18.4226 8.62203 17.676 7.13704 16.5582 5.95354ZM10.4998 18.3333C9.1813 18.3333 7.89237 17.9423 6.79604 17.2098C5.69971 16.4773 4.84523 15.4361 4.34064 14.2179C3.83606 12.9997 3.70404 11.6593 3.96127 10.3661C4.21851 9.07286 4.85345 7.88497 5.7858 6.95262C6.71815 6.02027 7.90603 5.38533 9.19924 5.1281C10.4924 4.87086 11.8329 5.00289 13.0511 5.50747C14.2692 6.01205 15.3104 6.86654 16.043 7.96287C16.7755 9.05919 17.1665 10.3481 17.1665 11.6667C17.1645 13.4342 16.4615 15.1287 15.2117 16.3785C13.9619 17.6283 12.2673 18.3313 10.4998 18.3333Z" fill="url(#paint0_linear_2248_19073)"/>
                    <path d="M10.5 6.6665V11.6665H5.5C5.5 12.6554 5.79324 13.6221 6.34265 14.4444C6.89206 15.2666 7.67295 15.9075 8.58658 16.2859C9.50021 16.6643 10.5055 16.7634 11.4755 16.5704C12.4454 16.3775 13.3363 15.9013 14.0355 15.202C14.7348 14.5028 15.211 13.6119 15.4039 12.642C15.5969 11.672 15.4978 10.6667 15.1194 9.75309C14.741 8.83946 14.1001 8.05856 13.2779 7.50916C12.4556 6.95975 11.4889 6.6665 10.5 6.6665Z" fill="url(#paint1_linear_2248_19073)"/>
                  </g>
                  <defs>
                    <linearGradient id="paint0_linear_2248_19073" x1="2.33317" y1="0.893253" x2="19.5761" y2="1.5887" gradientUnits="userSpaceOnUse"><stop offset="0.5" stop-color="#FFDD23"/><stop offset="1" stop-color="#FBD506"/></linearGradient>
                    <linearGradient id="paint1_linear_2248_19073" x1="5.6" y1="7.11293" x2="15.9383" y2="7.61352" gradientUnits="userSpaceOnUse"><stop offset="0.5" stop-color="#FFDD23"/><stop offset="1" stop-color="#FBD506"/></linearGradient>
                    <clipPath id="clip0_2248_19073"><rect width="20" height="20" fill="white" transform="translate(0.5)"/></clipPath>
                  </defs>
                </svg>
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

  // 10.1 SITE LANGUAGE HELPER
  function isSiteEnglish() {
    try {
      const href = (window.location && window.location.href) || "";
      if (href.includes("/en") || href.includes("-en")) return true;
      if (href.includes("/ru") || href.includes("-ru") || href.includes("/cis") || href.includes("-cis")) return false;

      const cookie = document.cookie || "";
      if (cookie.includes("up-language=en")) return true;
      if (cookie.includes("up-language=ru") || cookie.includes("up-language=cis")) return false;

      const loc = (localStorage.getItem("user_last_locale") || localStorage.getItem("locale") || localStorage.getItem("language") || "").toLowerCase();
      if (loc.startsWith("en")) return true;
      if (loc.startsWith("ru") || loc.startsWith("cis")) return false;

      const docLang = (document.documentElement.lang || "").toLowerCase();
      if (docLang.startsWith("en")) return true;
      if (docLang.startsWith("ru") || docLang.startsWith("cis")) return false;

      if (document.body && /Sign in|Inventory|Upgrade/i.test(document.body.innerText) && !/Войти|Инвентарь|Прокачать/i.test(document.body.innerText)) {
        return true;
      }
    } catch(e) {}
    return false;
  }

  // 10.2 PROFILE SETTINGS MODAL (Authentic upgrader 1:1 design matching chunk-2VR5RVON.js)
  function renderProfileEditModal() {
    const existing = document.getElementById('upgrader-profile-edit-modal');
    if (existing) existing.remove();

    const activeUser = LocalDB.getActiveUser();
    if (!activeUser) {
      renderAuthModal();
      return;
    }

    const isEn = isSiteEnglish();
    let selectedPrivacy = activeUser.privacy || 'private';
    let pendingAvatar = activeUser.avatar || 'https://s3.upgrader.best/cdn/fa/images/default-avatar-small.webp';
    const displayUserId = activeUser.id || (1735000 + (Math.abs(activeUser.username.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)) % 265000));

    const overlay = document.createElement('div');
    overlay.id = 'upgrader-profile-edit-modal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:Exo 2,sans-serif;';

    overlay.innerHTML = `
      <div class="relative overflow-hidden w-full max-w-[38.75rem] tablet:min-w-[38.75rem] h-[85dvh] max-h-[85dvh] tablet:h-auto tablet:max-h-full rounded-[1.5rem] bg-[#17181C] shadow-[0_10px_30px_0_rgba(0,0,0,0.35)] border-[1px] border-[#FFFFFF0D] flex flex-col items-center mx-3 sm:mx-0 text-white">
        
        <!-- Inner scrollable container -->
        <div class="invisible-scroll flex max-h-full w-full flex-col gap-[1.5rem] overflow-y-auto pb-[1rem] lg:pb-[1.5rem]" style="scrollbar-width:none;-ms-overflow-style:none;">
          
          <!-- Sticky Header -->
          <div class="sticky top-0 z-10 flex w-full items-center justify-between bg-[#1E1F23] p-[1rem] lg:px-[1.5rem] rounded-t-[1.5rem]">
            <span class="font-exo flex items-center gap-1.5 text-[1.125rem] leading-normal text-white lg:text-[1.25rem] font-bold">
              ${isEn ? 'Settings' : 'Настройки'}
            </span>
            <button type="button" id="up-profile-edit-close" data-testid="settings-modal-close" style="background:transparent;border:0;cursor:pointer;padding:6px;display:flex;align-items:center;justify-content:center;color:#8E8F94;transition:color 0.2s;" onmouseenter="this.style.color='#fff'" onmouseleave="this.style.color='#8E8F94'">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;width:14px;height:14px;">
                <path d="M13 1L1 13M1 1l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>

          <!-- Section 1: Nickname -->
          <div class="mt-2 flex flex-col gap-2 px-[1rem] lg:px-[1.5rem]">
            <h3 class="m-0 text-[1rem] font-medium text-[#FFFFFFCC] font-exo">${isEn ? 'Nickname' : 'Никнейм'}</h3>
            <input name="nickname" id="edit-nickname-input" data-testid="settings-modal-nickname-input" type="text" value="${activeUser.nickname}" class="flex items-center gap-1.5 rounded-[0.75rem] border border-[#FFFFFF26] bg-[#FFFFFF0D] p-3 text-white transition-all duration-200 placeholder:opacity-50 focus:border-[#FBD506] focus:opacity-100 focus:outline-none w-full box-border font-exo text-[0.875rem]" />
          </div>

          <!-- Section 2: Avatar Upload from Device & Fixed ID Badge -->
          <div class="flex items-center justify-between gap-3 px-[1rem] lg:px-[1.5rem] p-3 bg-[#FFFFFF05] rounded-[0.75rem] border border-[#FFFFFF0D] mx-[1rem] lg:mx-[1.5rem]">
            <div class="flex items-center gap-3 min-w-0">
              <img id="edit-avatar-preview" src="${pendingAvatar}" class="w-10 h-10 rounded-full object-cover border border-[#FFFFFF1A] flex-shrink-0" />
              <div class="flex flex-col min-w-0">
                <span class="text-[0.875rem] font-medium text-white font-exo">${isEn ? 'Avatar' : 'Аватар профиля'}</span>
                <span class="text-[0.75rem] text-white/50 font-exo">ID: ${displayUserId}</span>
              </div>
            </div>
            <input type="file" id="edit-avatar-file-input" accept="image/*" style="display:none;" />
            <button type="button" id="edit-avatar-upload-btn" class="flex items-center justify-center gap-2 rounded-[0.5rem] bg-[#232428] hover:bg-[#2C2E35] border border-[#FFFFFF1A] px-3.5 py-2 text-[0.8125rem] font-semibold text-white transition-colors duration-200 cursor-pointer whitespace-nowrap font-exo">${isEn ? 'Upload from device' : 'Загрузить с устройства'}</button>
          </div>

          <!-- Section 3: Trade Link -->
          <div class="flex flex-col gap-2 px-[1rem] lg:px-[1.5rem]">
            <div class="flex w-full items-center justify-between">
              <h3 class="m-0 text-[1rem] font-medium text-[#FFFFFFCC] font-exo">${isEn ? 'Trade link' : 'Трейд-ссылка'}</h3>
              <p class="text-[0.75rem] font-normal text-white/50 m-0 font-exo">
                ${isEn ? 'You can get the link' : 'Ссылку можно взять'} <a href="https://steamcommunity.com/id/me/tradeoffers/privacy#trade_offer_access_url" target="_blank" rel="noopener noreferrer" class="text-[0.75rem] font-normal text-white hover:underline">${isEn ? 'here' : 'здесь'}</a>
              </p>
            </div>
            <input name="trade-url" id="edit-tradelink-input" data-testid="settings-modal-trade-url-input" type="text" placeholder="https://steamcommunity.com/tradeoffer/new/?partner=..." value="${activeUser.steamTradeLink || activeUser.tradeLink || ''}" class="flex items-center gap-1.5 truncate rounded-[0.75rem] border-[1px] border-[#FFFFFF26] bg-[#FFFFFF0D] p-3 text-white transition-all duration-200 placeholder:opacity-50 focus:border-[#FBD506] focus:opacity-100 focus:outline-none w-full box-border font-exo text-[0.875rem]" />
          </div>

          <!-- Section 4: Steam Profile Privacy -->
          <div class="flex flex-col gap-2">
            <h3 class="m-0 px-[1rem] text-[1rem] font-medium text-[#FFFFFFCC] lg:px-[1.5rem] font-exo">${isEn ? 'Steam Profile Privacy' : 'Приватность профиля Steam'}</h3>
            <div class="flex flex-col" id="privacy-radios-list">
              <label class="flex cursor-pointer items-start gap-3 p-0 px-[1rem] py-2 transition-all duration-200 hover:bg-[#FFFFFF05] lg:px-[1.5rem] up-privacy-row ${selectedPrivacy === 'private' ? 'active' : ''}" data-privacy="private">
                <div class="relative mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border border-[#FFFFFF1A] bg-[#171820] flex items-center justify-center">
                  <div class="w-2.5 h-2.5 rounded-full bg-[#fcd506] transition-opacity ${selectedPrivacy === 'private' ? 'opacity-100' : 'opacity-0'}"></div>
                </div>
                <div class="flex flex-1 flex-col gap-0.5">
                  <div class="text-[0.875rem] leading-[19px] font-medium text-[#FFFFFFCC] font-exo">${isEn ? 'Private' : 'Приватный'}</div>
                  <div class="text-[0.8125rem] leading-[140%] font-normal text-white opacity-50 font-exo">${isEn ? 'Only you can see your profile information' : 'Значение по умолчанию. Только вы видите информацию вашего профиля'}</div>
                </div>
              </label>

              <label class="flex cursor-pointer items-start gap-3 p-0 px-[1rem] py-2 transition-all duration-200 hover:bg-[#FFFFFF05] lg:px-[1.5rem] up-privacy-row ${selectedPrivacy === 'authorized_only' || selectedPrivacy === 'friends' ? 'active' : ''}" data-privacy="authorized_only">
                <div class="relative mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border border-[#FFFFFF1A] bg-[#171820] flex items-center justify-center">
                  <div class="w-2.5 h-2.5 rounded-full bg-[#fcd506] transition-opacity ${selectedPrivacy === 'authorized_only' || selectedPrivacy === 'friends' ? 'opacity-100' : 'opacity-0'}"></div>
                </div>
                <div class="flex flex-1 flex-col gap-0.5">
                  <div class="text-[0.875rem] leading-[19px] font-medium text-[#FFFFFFCC] font-exo">${isEn ? 'Authorized users' : 'Только для авторизованных пользователей'}</div>
                  <div class="text-[0.8125rem] leading-[140%] font-normal text-white opacity-50 font-exo">${isEn ? 'All authorized users can see your profile information' : 'Все авторизованные пользователи могут просматривать ваш профиль'}</div>
                </div>
              </label>

              <label class="flex cursor-pointer items-start gap-3 p-0 px-[1rem] py-2 transition-all duration-200 hover:bg-[#FFFFFF05] lg:px-[1.5rem] up-privacy-row ${selectedPrivacy === 'public' ? 'active' : ''}" data-privacy="public">
                <div class="relative mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border border-[#FFFFFF1A] bg-[#171820] flex items-center justify-center">
                  <div class="w-2.5 h-2.5 rounded-full bg-[#fcd506] transition-opacity ${selectedPrivacy === 'public' ? 'opacity-100' : 'opacity-0'}"></div>
                </div>
                <div class="flex flex-1 flex-col gap-0.5">
                  <div class="text-[0.875rem] leading-[19px] font-medium text-[#FFFFFFCC] font-exo">${isEn ? 'Public' : 'Публичный'}</div>
                  <div class="text-[0.8125rem] leading-[140%] font-normal text-white opacity-50 font-exo">${isEn ? 'All users will see your profile information' : 'Любой пользователь видит информацию вашего профиля'}</div>
                </div>
              </label>
            </div>
          </div>

          <!-- Section 5: Streamer Mode -->
          <div class="mb-[1rem] flex flex-col gap-2 px-[1rem] lg:px-[1.5rem]">
            <div class="flex items-center justify-between">
              <div class="flex flex-col gap-0.5 pr-3">
                <h3 class="m-0 text-[1rem] font-medium text-[#FFFFFFCC] font-exo">${isEn ? 'Streamer mode' : 'Режим стримера'}</h3>
                <p class="m-0 text-[0.8125rem] leading-[140%] font-normal text-white opacity-50 font-exo">${isEn ? 'Hides personal information and balance for safety during streams' : 'Скрывает ваш никнейм и баланс на трансляциях'}</p>
              </div>
              <label class="up-modal-switch">
                <input type="checkbox" id="streamer-mode-toggle" ${activeUser.streamerMode ? 'checked' : ''} />
                <span class="up-modal-switch-slider"></span>
              </label>
            </div>
          </div>

          <!-- Section 6: Sticky Save Button -->
          <div class="sticky bottom-0 z-10 flex w-full items-center justify-center px-[1rem] pt-3 pb-[1.5rem] lg:px-[1.5rem] lg:pb-[2rem] bg-gradient-to-t from-[#17181C] via-[#17181C] to-transparent">
            <button type="button" id="edit-profile-save-btn" data-testid="settings-modal-save" class="font-exo mx-auto flex h-10 items-center justify-center gap-2 rounded-[0.375rem] bg-[#FDD811] px-[1.5rem] py-[0.625rem] text-[1rem] leading-normal font-semibold text-[#202022] transition-colors duration-200 hover:bg-[#FFE44D] active:bg-[#FDD911] cursor-pointer border-0 shadow-[0_4px_20px_rgba(253,217,17,0.25)]">${isEn ? 'Save and close' : 'Сохранить и закрыть'}</button>
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('#up-profile-edit-close');
    closeBtn.onclick = () => overlay.remove();

    // Privacy selection logic
    const privacyOptions = overlay.querySelectorAll('.up-privacy-row');
    privacyOptions.forEach(opt => {
      opt.onclick = () => {
        privacyOptions.forEach(o => {
          o.classList.remove('active');
          const dot = o.querySelector('div > div');
          if (dot) { dot.classList.remove('opacity-100'); dot.classList.add('opacity-0'); }
        });
        opt.classList.add('active');
        const dot = opt.querySelector('div > div');
        if (dot) { dot.classList.remove('opacity-0'); dot.classList.add('opacity-100'); }
        selectedPrivacy = opt.getAttribute('data-privacy');
      };
    });

    // Device Avatar Upload
    const fileInput = overlay.querySelector('#edit-avatar-file-input');
    const uploadBtn = overlay.querySelector('#edit-avatar-upload-btn');
    const previewImg = overlay.querySelector('#edit-avatar-preview');

    uploadBtn.onclick = () => fileInput.click();
    fileInput.onchange = () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;

      const minSizeBytes = 5 * 1024;
      const maxSizeBytes = 5 * 1024 * 1024;

      if (file.size < minSizeBytes) {
        showToast(isEn ? 'File too small (min 5 KB)' : 'Файл слишком маленький (минимум 5 КБ)', 'error');
        fileInput.value = '';
        return;
      }
      if (file.size > maxSizeBytes) {
        showToast(isEn ? 'File size must not exceed 5 MB' : 'Размер файла не должен превышать 5 МБ', 'error');
        fileInput.value = '';
        return;
      }
      if (!file.type || !file.type.startsWith('image/')) {
        showToast(isEn ? 'Please select an image file (JPG, PNG, WEBP)' : 'Пожалуйста, выберите файл изображения (JPG, PNG, WEBP)', 'error');
        fileInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const rawDataUrl = ev.target.result;
        const img = new Image();
        img.onload = () => {
          if (img.naturalWidth < 64 || img.naturalHeight < 64) {
            showToast(isEn ? 'Resolution too small (min 64x64 px)' : 'Разрешение слишком маленькое (минимум 64x64 px)', 'error');
            fileInput.value = '';
            return;
          }
          if (img.naturalWidth > 4096 || img.naturalHeight > 4096) {
            showToast(isEn ? 'Resolution too large (max 4096x4096 px)' : 'Разрешение слишком большое (максимум 4096x4096 px)', 'error');
            fileInput.value = '';
            return;
          }

          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext('2d');
          const minSide = Math.min(img.naturalWidth, img.naturalHeight);
          const sx = (img.naturalWidth - minSide) / 2;
          const sy = (img.naturalHeight - minSide) / 2;
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, 256, 256);
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.9);

          pendingAvatar = optimizedDataUrl;
          previewImg.src = optimizedDataUrl;
          showToast(isEn ? 'Avatar uploaded successfully!' : 'Аватарка успешно выбрана и оптимизирована!', 'success');
        };
        img.onerror = () => {
          showToast(isEn ? 'Failed to open image' : 'Не удалось открыть изображение', 'error');
          fileInput.value = '';
        };
        img.src = rawDataUrl;
      };
      reader.onerror = () => {
        showToast(isEn ? 'Error reading file' : 'Ошибка при чтении файла', 'error');
      };
      reader.readAsDataURL(file);
    };

    // Save Changes
    const saveBtn = overlay.querySelector('#edit-profile-save-btn');
    saveBtn.onclick = async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = isEn ? 'Saving...' : 'Сохранение...';

      const nickInput = overlay.querySelector('#edit-nickname-input');
      const tradelinkInput = overlay.querySelector('#edit-tradelink-input');
      const streamerToggle = overlay.querySelector('#streamer-mode-toggle');

      const newNick = (nickInput && nickInput.value.trim()) || activeUser.nickname;
      const newTradeLink = (tradelinkInput && tradelinkInput.value.trim()) || '';
      const newStreamerMode = streamerToggle ? streamerToggle.checked : false;

      LocalDB.updateProfileCustomizations(activeUser.username, {
        nickname: newNick,
        avatar: pendingAvatar,
        steamTradeLink: newTradeLink,
        privacy: selectedPrivacy,
        streamerMode: newStreamerMode
      });

      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
        try {
          await SupabaseDB.updateUser(activeUser.id || activeUser.username, {
            nickname: newNick,
            avatar: pendingAvatar,
            image: pendingAvatar,
            steamTradeLink: newTradeLink
          });
        } catch(err) {
          console.warn('[SupabaseDB] updateUser error:', err);
        }
      }

      overlay.remove();
      showToast(isEn ? 'Settings saved successfully!' : 'Настройки успешно сохранены!', 'success');

      // Update in DOM safely: DO NOT touch icons, coins, arrows, SVGs or item cards!
      const domAvatars = document.querySelectorAll('up-header up-avatar img, header up-avatar img, .profile-avatar');
      domAvatars.forEach(el => {
        if (el.closest('up-item-card, up-user-item-card, up-drop-item, up-drop-item-horizontal, up-best-drop-item, [class*="item-card"], [class*="item_card"], up-my-items-table, up-desired-items-table, up-profile-preview')) return;
        const s = el.getAttribute('src') || '';
        if (s.includes('economy/image') || s.includes('steamstatic') || s.includes('items') || s.includes('pricempire')) return;
        if (!s.includes('coin') && !s.includes('arrow') && !s.includes('svg') && !s.includes('badge') && !s.includes('online')) {
          el.src = pendingAvatar;
        }
      });

      const nickEls = document.querySelectorAll('up-user-info [class*="nickname"], up-user-info [class*="truncate"], up-profile-info [class*="nickname"]');
      nickEls.forEach(el => { el.textContent = newNick; });
    };
  }

  // 10.3 NOTIFICATION SETTINGS MODAL (Authentic upgrader 1:1 design matching main-MO6SLN4L.js)
  function renderNotificationSettingsModal() {
    const existing = document.getElementById('upgrader-notifications-modal');
    if (existing) existing.remove();

    const activeUser = LocalDB.getActiveUser();
    if (!activeUser) {
      renderAuthModal();
      return;
    }

    const isEn = isSiteEnglish();

    const overlay = document.createElement('div');
    overlay.id = 'upgrader-notifications-modal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:Exo 2,sans-serif;';

    overlay.innerHTML = `
      <div class="relative flex w-[calc(100vw-1.5rem)] max-w-none flex-col overflow-hidden rounded-[1.5rem] border border-[#FFFFFF0D] bg-[#17181C] shadow-[0_10px_30px_0_rgba(0,0,0,0.35)] tablet:w-full tablet:min-w-[38.75rem] tablet:max-w-[38.75rem] mx-3 sm:mx-0 text-white">
        
        <!-- Header -->
        <div class="flex items-center justify-between bg-[#FFFFFF0D] shadow-[0_2px_20px_0_rgba(0,0,0,0.2)] px-6 py-4">
          <span class="font-exo text-[1.125rem] leading-normal font-semibold text-white">
            ${isEn ? 'Manage notifications' : 'Управление уведомлениями'}
          </span>
          <button type="button" id="up-notif-close" style="background:transparent;border:0;cursor:pointer;padding:6px;display:flex;align-items:center;justify-content:center;color:#8E8F94;transition:color 0.2s;" onmouseenter="this.style.color='#fff'" onmouseleave="this.style.color='#8E8F94'">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;width:14px;height:14px;">
              <path d="M13 1L1 13M1 1l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="flex flex-col p-6">
          <p class="font-exo pb-6 leading-[1.4] font-normal text-white opacity-50 text-[1rem] m-0">
            ${isEn ? 'Set up account linking and notifications to receive unique offers' : 'Настройте привязку аккаунтов и уведомления, чтобы получать уникальные предложения'}
          </p>

          <!-- Divider -->
          <div class="h-[1px] w-full bg-[#FFFFFF0D]"></div>

          <!-- Row 1: Email -->
          <div data-testid="notifications-management-email-row" class="flex w-full items-center justify-between gap-3 py-4 lg:py-6">
            <div class="tablet:flex-row flex min-w-0 flex-1 flex-col items-start gap-1 tablet:items-center tablet:gap-3">
              <div style="width:40px;height:40px;border-radius:10px;background:#282A2F;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="4"></circle>
                  <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"></path>
                </svg>
              </div>
              <div class="flex flex-col gap-0.5 min-w-0 flex-1">
                <span data-testid="notifications-management-email-label" class="font-exo text-[0.875rem] font-medium text-white opacity-50 lg:text-[1rem]">Email</span>
                <span data-testid="notifications-management-email-value" id="notif-email-val" class="font-exo flex-1 text-[0.75rem] font-medium text-white lg:text-[0.875rem] truncate">${activeUser.email || (isEn ? 'Account not connected' : 'Аккаунт не привязан')}</span>
              </div>
            </div>
            <button type="button" id="notif-email-action-btn" data-testid="notifications-management-email-link-button" class="flex tablet:h-10 h-8 rounded-[0.5rem] font-semibold transition-colors duration-200 items-center justify-center gap-2.5 px-4 text-[0.875rem] cursor-pointer border-0 font-exo ${activeUser.email ? 'bg-[#FFFFFF1A] text-white/50 hover:bg-[#FFFFFF0D] active:bg-[#FFFFFF03]' : 'bg-[#FDD814] text-[#1C1C20] hover:bg-[#FFE44D] active:bg-[#FDD911]'}">
              ${activeUser.email ? (isEn ? 'Change' : 'Заменить') : (isEn ? 'Add' : 'Привязать')}
            </button>
          </div>

          <!-- Inline Email Input Box (shown on Change / Add click) -->
          <div id="notif-email-edit-box" style="display:none;background:#202126;border-radius:10px;padding:14px;margin-bottom:16px;border:1px solid #FBD506;">
            <label style="display:block;font-size:11px;font-weight:600;color:rgba(255,255,255,0.6);margin-bottom:8px;text-transform:uppercase;font-family:Exo 2,sans-serif;">${isEn ? 'Enter email address' : 'Введите адрес электронной почты'}</label>
            <div style="display:flex;gap:8px;">
              <input type="email" id="notif-email-input" placeholder="example@mail.com" value="${activeUser.email || ''}" style="flex:1;background:#17181C;border:1px solid rgba(255,255,255,0.15);color:#fff;padding:10px 12px;border-radius:8px;font-size:13px;outline:none;font-family:Exo 2,sans-serif;" />
              <button type="button" id="notif-email-save-btn" style="background:#FDD814;color:#1C1C20;border:none;border-radius:8px;padding:10px 16px;font-weight:700;font-size:13px;cursor:pointer;font-family:Exo 2,sans-serif;">${isEn ? 'Save' : 'Сохранить'}</button>
              <button type="button" id="notif-email-cancel-btn" style="background:#2B2D33;color:rgba(255,255,255,0.6);border:none;border-radius:8px;padding:10px 12px;font-size:13px;cursor:pointer;font-family:Exo 2,sans-serif;">✕</button>
            </div>
            <div id="notif-email-error" style="color:#ef4444;font-size:11px;margin-top:6px;display:none;font-family:Exo 2,sans-serif;"></div>
          </div>

          <!-- Divider -->
          <div class="h-px w-full bg-[#FFFFFF0D]"></div>

          <!-- Row 2: Push Notifications -->
          <div class="flex w-full items-center justify-between gap-3 py-4 lg:py-6">
            <div class="flex min-w-0 flex-1 items-center gap-3">
              <div style="width:40px;height:40px;border-radius:10px;background:#282A2F;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </div>
              <span class="font-exo text-[0.875rem] font-medium text-white opacity-50 lg:text-[1rem]">${isEn ? 'Push Notification' : 'Push-уведомления'}</span>
            </div>
            <label class="up-modal-switch">
              <input type="checkbox" id="notif-push-toggle" ${activeUser.pushNotifications ? 'checked' : ''} />
              <span class="up-modal-switch-slider"></span>
            </label>
          </div>

          <!-- Divider -->
          <div class="h-px w-full bg-[#FFFFFF0D]"></div>

          <!-- Row 3: Special email newsletter (Accent Yellow Tag Box!) -->
          <div class="flex w-full items-center justify-between gap-3 py-4 lg:py-6">
            <div class="flex min-w-0 flex-1 items-center gap-3">
              <div style="width:40px;height:40px;border-radius:10px;background:#FDD814;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#121316" stroke="#121316" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                  <circle cx="7" cy="7" r="1.5" fill="#FDD814"></circle>
                </svg>
              </div>
              <span class="font-exo text-[0.875rem] font-medium text-white opacity-50 lg:text-[1rem]">${isEn ? 'Special email newsletter' : 'Специальная email рассылка'}</span>
            </div>
            <label class="up-modal-switch">
              <input type="checkbox" id="notif-newsletter-toggle" ${activeUser.newsletter !== false ? 'checked' : ''} />
              <span class="up-modal-switch-slider"></span>
            </label>
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('#up-notif-close');
    closeBtn.onclick = () => overlay.remove();

    const emailActionBtn = overlay.querySelector('#notif-email-action-btn');
    const emailEditBox = overlay.querySelector('#notif-email-edit-box');
    const emailInput = overlay.querySelector('#notif-email-input');
    const emailSaveBtn = overlay.querySelector('#notif-email-save-btn');
    const emailCancelBtn = overlay.querySelector('#notif-email-cancel-btn');
    const emailVal = overlay.querySelector('#notif-email-val');
    const emailErr = overlay.querySelector('#notif-email-error');

    emailActionBtn.onclick = () => {
      emailEditBox.style.display = 'block';
      emailInput.focus();
    };

    emailCancelBtn.onclick = () => {
      emailEditBox.style.display = 'none';
      emailErr.style.display = 'none';
    };

    emailSaveBtn.onclick = async () => {
      const val = emailInput.value.trim();
      if (!val || !val.includes('@') || !val.includes('.')) {
        emailErr.textContent = isEn ? 'Please enter a valid email address' : 'Пожалуйста, введите корректный email';
        emailErr.style.display = 'block';
        return;
      }
      emailErr.style.display = 'none';

      LocalDB.setEmail(activeUser.username, val);
      if (typeof SupabaseDB !== 'undefined' && SupabaseDB.getUrl()) {
        try {
          await SupabaseDB.updateUser(activeUser.id || activeUser.username, { email: val, isEmailVerified: true });
        } catch(err) {
          console.warn('[SupabaseDB] update email error:', err);
        }
      }

      emailVal.textContent = val;
      emailVal.classList.remove('opacity-50');
      emailActionBtn.textContent = isEn ? 'Change' : 'Заменить';
      emailActionBtn.className = 'flex tablet:h-10 h-8 rounded-[0.5rem] font-semibold transition-colors duration-200 items-center justify-center gap-2.5 px-4 text-[0.875rem] cursor-pointer border-0 font-exo bg-[#FFFFFF1A] text-white/50 hover:bg-[#FFFFFF0D] active:bg-[#FFFFFF03]';
      emailEditBox.style.display = 'none';
      showToast(isEn ? 'Email successfully linked!' : 'Email успешно привязан!', 'success');
      syncEmailLinkingCard();
    };

    // Toggles
    const pushToggle = overlay.querySelector('#notif-push-toggle');
    const newsletterToggle = overlay.querySelector('#notif-newsletter-toggle');

    pushToggle.onchange = () => {
      LocalDB.updateProfileCustomizations(activeUser.username, {
        pushNotifications: pushToggle.checked
      });
      showToast(pushToggle.checked ? (isEn ? 'Push notifications enabled' : 'Пуш-уведомления включены') : (isEn ? 'Push notifications disabled' : 'Пуш-уведомления отключены'));
    };

    newsletterToggle.onchange = () => {
      LocalDB.updateProfileCustomizations(activeUser.username, {
        newsletter: newsletterToggle.checked
      });
      showToast(newsletterToggle.checked ? (isEn ? 'Email newsletter enabled' : 'Специальная рассылка включена') : (isEn ? 'Email newsletter disabled' : 'Специальная рассылка отключена'));
    };
  }

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

  // Email is moved exclusively to Notification Management modal (media_1791044277404.png)
  function syncEmailLinkingCard() {
    try {
      const boundCard = document.getElementById('up-bound-email-card');
      if (boundCard) {
        const parentCol = boundCard.closest('.col-span-full');
        boundCard.remove();
        if (parentCol && !parentCol.hasChildNodes()) parentCol.remove();
      }
      const blocks = document.querySelectorAll('[data-testid="email-linking-block"]');
      blocks.forEach(b => b.remove());
    } catch(e) {}
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
      if (promoCode && promoCode.toLowerCase().trim() === 'envy!') {
        amountToCredit += 50000;
        showToast('Бонус по промокоду envy! добавлен (+50 000 ₽ к депозиту и VIP)', 'success');
      }
      // Record deposit in LocalDB (updates depositsAmount, VIP tier, weekly reset, and Supabase)
      const newBal = LocalDB.recordDeposit(activeUser.username, amountToCredit);

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
      if (target.closest('#upgrader-auth-modal') || target.closest('#upgrader-deposit-modal') || target.closest('#upgrader-email-modal') || target.closest('#upgrader-profile-edit-modal') || target.closest('#upgrader-withdrawal-modal') || target.closest('#upgrader-notifications-modal')) {
        return;
      }

      // Notifications Management Modal Trigger inside Profile page only (media_1791044277404.png)
      const isNotificationsTrigger = target.closest('up-profile') && (
        target.closest('[data-testid="profile-notifications-button"]') ||
        (target.closest('button') && (
          (target.closest('button').innerText || '').toLowerCase().includes('уведомлен')
        ))
      );

      if (isNotificationsTrigger) {
        e.preventDefault();
        e.stopPropagation();
        renderNotificationSettingsModal();
        return;
      }

      // Email Binding Trigger in profile
      const isEmailBindBtn = target.closest('[data-testid="email-linking-block"] button') ||
                             target.closest('[data-testid="email-linking-button"]') ||
                             (target.closest('up-email-linking') && target.closest('button'));

      if (isEmailBindBtn) {
        e.preventDefault();
        e.stopPropagation();
        renderNotificationSettingsModal();
        return;
      }

      // Profile Settings Triggers (gear settings button, user-info-account-settings-button)
      const isProfileEditTrigger = target.closest('[data-testid="user-info-settings-button"]') ||
                                   target.closest('[data-testid="user-info-account-settings-button"]') ||
                                   (target.closest('up-user-info') && target.closest('svg') && target.closest('button'));

      if (isProfileEditTrigger) {
        e.preventDefault();
        e.stopPropagation();
        renderProfileEditModal();
        return;
      }

      // Logout Trigger in profile
      const isLogoutTrigger = target.closest('[data-testid="user-info-logout-button"]');
      if (isLogoutTrigger) {
        e.preventDefault();
        e.stopPropagation();
        LocalDB.clearActiveUser();
        localStorage.removeItem('upgrader_active_user');
        sessionStorage.removeItem('upgrader_active_user');
        if (window.__upgraderUserService && typeof window.__upgraderUserService.logout === 'function') {
          try { window.__upgraderUserService.logout(); } catch(e){}
        } else if (window.__upgraderUserService && typeof window.__upgraderUserService.setUser === 'function') {
          try { window.__upgraderUserService.setUser(null); } catch(e){}
        }
        if (window.__upgraderUserState && window.__upgraderUserState.currentUser && typeof window.__upgraderUserState.currentUser.set === 'function') {
          try { window.__upgraderUserState.currentUser.set(null); } catch(e){}
        }
        if (window.__upgraderUserState && window.__upgraderUserState.userStats && typeof window.__upgraderUserState.userStats.set === 'function') {
          try { window.__upgraderUserState.userStats.set(null); } catch(e){}
        }
        window.dispatchEvent(new CustomEvent('upgrader:user-updated', { detail: null }));
        window.location.hash = '';
        setTimeout(() => {
          window.location.reload();
        }, 80);
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
          let item = (activeUser.inventory || []).find(x => String(x.id) === String(itemId) || String(x.originalSkinId) === String(itemId));
          if (!item) {
            // Reconstruct item from the clicked card in DOM so withdrawal never fails
            const cardEl = withdrawBtn.closest('div.relative') || withdrawBtn.closest('up-profile-items-table .grid > div') || withdrawBtn.parentElement;
            const imgEl = cardEl ? cardEl.querySelector('img') : null;
            const nameEl = cardEl ? (cardEl.querySelector('span.line-clamp-1') || cardEl.querySelector('span.font-bold') || cardEl.querySelector('span')) : null;
            item = {
              id: itemId,
              marketName: nameEl ? nameEl.textContent.trim() : 'CS2 Item',
              price: 15.00,
              image: imgEl ? imgEl.src : ''
            };
            if (!activeUser.inventory) activeUser.inventory = [];
            activeUser.inventory.push(item);
            LocalDB.saveAccounts(LocalDB.getAccounts());
          }
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

      // Catch clicks on Steam accept link in card overlay: complete withdrawal shortly after user accepts trade offer
      const acceptLink = target.closest('[data-testid="withdrawal-status-accept-link"]');
      if (acceptLink) {
        const overlay = acceptLink.closest('.up-withdrawing-overlay') || acceptLink.closest('[data-withdrawing-id]');
        const itemId = overlay ? overlay.dataset.withdrawingId : null;
        const activeUser = LocalDB.getActiveUser();
        if (activeUser && itemId) {
          setTimeout(() => {
            LocalDB.completeWithdrawal(activeUser.username, itemId);
            syncWithdrawingCards();
          }, 3500);
        }
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

      // 4.1 Proactively dismiss battle promo overlay or cookie modals if they mount
      const promoPanes = document.querySelectorAll('.battle-promo-pane, .battle-promo-modal, .cookie-policy-modal, .cookies-consent, [data-testid="battle-promo-later"], [data-testid="cookie-policy-modal-hide"]');
      if (promoPanes.length > 0) {
        promoPanes.forEach(el => {
          const wrapper = el.closest('.cdk-global-overlay-wrapper') || el.closest('.cdk-overlay-pane');
          if (wrapper) wrapper.remove();
          else el.remove();
        });
        if (!document.querySelector('#upgrader-auth-modal, #upgrader-deposit-modal, #upgrader-withdrawal-modal, #upgrader-profile-edit-modal, #upgrader-notifications-modal')) {
          document.querySelectorAll('.cdk-overlay-backdrop').forEach(b => b.remove());
        }
      }
      const promoLaterBtn = document.querySelector('[data-testid="battle-promo-later"], [data-testid="cookie-policy-modal-hide"], [data-testid="battle-promo-close"]');
      if (promoLaterBtn) {
        try { promoLaterBtn.click(); } catch(e) {}
      }

      // 5. Ensure push notifications switch is visible and synced
      syncPushSwitchState();

      // 6. Ensure user avatar is correctly synced in DOM
      syncDomAvatars();
    });

    function syncDomAvatars() {
      const activeUser = LocalDB.getActiveUser();
      if (!activeUser || !activeUser.avatar) return;
      document.querySelectorAll('up-header up-profile-info img, header up-profile-info img').forEach(img => {
        if (img.src !== activeUser.avatar) img.src = activeUser.avatar;
      });
    }

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
      syncDomAvatars();
    }, 1000);
  }

  // Ensure active user state is consistent on boot
  const activeKey = localStorage.getItem(STORAGE_ACTIVE_KEY);
  if (!activeKey) {
    LocalDB.setActiveUser('envy!');
  } else if (activeKey === '__GUEST__') {
    LocalDB.clearActiveUser();
  } else {
    const initialActiveUser = LocalDB.getActiveUser();
    if (initialActiveUser) {
      LocalDB.setActiveUser(initialActiveUser.username);
    } else {
      LocalDB.clearActiveUser();
    }
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
  window.BattleSystem = BattleSystem;
  window.handleMockApi = handleMockApi;
  window.isSiteEnglish = isSiteEnglish;
  window.renderProfileEditModal = renderProfileEditModal;
  window.renderNotificationSettingsModal = renderNotificationSettingsModal;

  window.UPGRADER = {
    LocalDB,
    BattleSystem,
    GlobalStats,
    handleMockApi,
    renderAuthModal,
    renderDepositModal,
    openNativePaymentModal,
    closeNativePaymentModal,
    renderCardPaymentGatewayModal,
    renderEmailBindModal,
    renderProfileEditModal,
    renderNotificationSettingsModal,
    renderCompensationCaseModal,
    syncWithdrawingCards,
    showToast,
    getActiveUser: () => LocalDB.getActiveUser(),
    updateAccountAdmin: (id, updates) => LocalDB.updateAccountAdmin(id, updates),
    resetBestDrop: (id) => LocalDB.resetBestDrop(id)
  };
})();
