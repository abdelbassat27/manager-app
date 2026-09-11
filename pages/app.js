/* =========================================================
   Manager App — Core Engine v2
   تخزين محلي · اختصاصات · تصدير/استيراد · حماية
   ========================================================= */

(function (window, document) {
  'use strict';

  const MODULES = [
    {
      id: 'shops',
      label: 'محلات ومخزون',
      desc: 'إدارة المنتجات والكميات والتنبيهات',
      icon: 'store',
      href: 'pages/shops.html',
      color: '#2563eb',
    },
    {
      id: 'sheep',
      label: 'تربية الأغنام',
      desc: 'سجل المواشي والتلقيحات والأوزان',
      icon: 'sheep',
      href: 'pages/sheep.html',
      color: '#7c3aed',
    },
    {
      id: 'hr',
      label: 'الموارد البشرية',
      desc: 'العمال والرواتب والمناصب',
      icon: 'users',
      href: 'pages/hr.html',
      color: '#0891b2',
    },
    {
      id: 'finance',
      label: 'الإدارة المالية',
      desc: 'المداخيل والمصاريف والتقارير',
      icon: 'wallet',
      href: 'pages/finance.html',
      color: '#16a34a',
    },
  ];

  const MODULE_IDS = MODULES.map(m => m.id);

  const ICONS = {
    grid:   '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    store:  '<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/>',
    sheep:  '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1"/><circle cx="15" cy="10" r="1"/><path d="M9 15c1 1 2 1.5 3 1.5s2-.5 3-1.5"/>',
    users:  '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    wallet: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  };

  function icon(name, cls) {
    const path = ICONS[name] || ICONS.grid;
    return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg>';
  }

  const NS = 'managerapp:';
  const DATA_KEYS = [
    'finance:transactions',
    'shops:products',
    'sheep:animals',
    'hr:workers',
  ];

  const Storage = {
    get(key, fallback) {
      if (fallback === undefined) fallback = null;
      try {
        const raw = localStorage.getItem(NS + key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(NS + key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.error('[Storage]', e);
        alert('تعذّر الحفظ. قد تكون مساحة التخزين ممتلئة.');
        return false;
      }
    },
    remove(key) {
      localStorage.removeItem(NS + key);
    },
    clearData() {
      DATA_KEYS.forEach(function (k) {
        localStorage.removeItem(NS + k);
      });
    },
    exportAll() {
      const data = {
        version: 2,
        exportedAt: new Date().toISOString(),
        session: this.get('session'),
        modules: this.get('modules'),
        theme: this.get('theme'),
        records: {},
      };
      DATA_KEYS.forEach(function (k) {
        data.records[k] = Storage.get(k, []);
      });
      return data;
    },
    importAll(payload, opts) {
      opts = opts || {};
      const merge = !!opts.merge;
      if (!payload || typeof payload !== 'object') {
        throw new Error('ملف غير صالح');
      }
      const records = payload.records || payload;
      if (!merge) {
        this.clearData();
      }
      DATA_KEYS.forEach(function (k) {
        if (Array.isArray(records[k])) {
          if (merge) {
            const existing = Storage.get(k, []);
            const ids = {};
            existing.forEach(function (x) {
              if (x && x.id) ids[x.id] = true;
            });
            const extra = records[k].filter(function (x) {
              return x && x.id && !ids[x.id];
            });
            Storage.set(k, existing.concat(extra));
          } else {
            Storage.set(k, records[k]);
          }
        }
      });
      if (payload.modules && Array.isArray(payload.modules)) {
        Storage.set(
          'modules',
          payload.modules.filter(function (id) {
            return MODULE_IDS.indexOf(id) !== -1;
          })
        );
      }
      return true;
    },
  };

  const Theme = {
    init() {
      const saved = Storage.get('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = saved || (prefersDark ? 'dark' : 'light');
      this.apply(theme);
      const btn = document.getElementById('themeBtn');
      if (btn) {
        btn.addEventListener('click', function () {
          Theme.toggle();
        });
      }
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        if (!Storage.get('theme')) Theme.apply(e.matches ? 'dark' : 'light');
      });
    },
    apply(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', theme === 'dark' ? '#0c1424' : '#2563eb');
    },
    toggle() {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      this.apply(next);
      Storage.set('theme', next);
    },
  };

  const Access = {
    getModules() {
      const m = Storage.get('modules');
      if (Array.isArray(m) && m.length) {
        return m.filter(function (id) {
          return MODULE_IDS.indexOf(id) !== -1;
        });
      }
      return [];
    },
    setModules(ids) {
      const clean = [];
      const seen = {};
      (ids || []).forEach(function (id) {
        if (MODULE_IDS.indexOf(id) !== -1 && !seen[id]) {
          seen[id] = true;
          clean.push(id);
        }
      });
      Storage.set('modules', clean);
      return clean;
    },
    has(moduleId) {
      if (moduleId === 'dashboard' || moduleId === 'settings' || moduleId === 'specialty') return true;
      return this.getModules().indexOf(moduleId) !== -1;
    },
    hasAny() {
      return this.getModules().length > 0;
    },
    canOpenPage(pageId) {
      if (!pageId || pageId === 'dashboard' || pageId === 'settings' || pageId === 'specialty') return true;
      return this.has(pageId);
    },
  };

  const Auth = {
    SESSION_KEY: 'session',

    isLoggedIn() {
      const s = Storage.get(this.SESSION_KEY);
      return !!(s && s.user);
    },

    getUser() {
      const s = Storage.get(this.SESSION_KEY);
      return (s && s.user) || null;
    },

    login(user) {
      Storage.set(this.SESSION_KEY, {
        user: user,
        loginAt: new Date().toISOString(),
      });
    },

    logout() {
      Storage.remove(this.SESSION_KEY);
    },

    guard() {
      if (!this.isLoggedIn()) {
        const path = window.location.pathname;
        const isSub = path.indexOf('/pages/') !== -1;
        window.location.replace(isSub ? '../index.html' : 'index.html');
        return false;
      }

      if (!Access.hasAny()) {
        const page = document.body.dataset.page;
        if (page !== 'specialty') {
          const path = window.location.pathname;
          const isSub = path.indexOf('/pages/') !== -1;
          window.location.replace(isSub ? '../specialty.html' : 'specialty.html');
          return false;
        }
      }

      const page = document.body.dataset.page;
      if (page && !Access.canOpenPage(page)) {
        const path = window.location.pathname;
        const isSub = path.indexOf('/pages/') !== -1;
        window.location.replace(isSub ? '../dashboard.html' : 'dashboard.html');
        return false;
      }

      return true;
    },

    bindUI() {
      const user = this.getUser();
      const avatar = document.querySelector('.avatar');
      if (avatar && user) {
        const name = user.name || user.id || 'م';
        avatar.textContent = name.charAt(0);
        avatar.title = name;
      }
      const btn = document.getElementById('logoutBtn');
      if (btn) {
        btn.addEventListener('click', function () {
          Auth.logout();
          const path = window.location.pathname;
          const isSub = path.indexOf('/pages/') !== -1;
          window.location.replace(isSub ? '../index.html' : 'index.html');
        });
      }
    },
  };

  const Sidebar = {
    init() {
      const nav = document.getElementById('sidebarNav');
      if (nav) this.build(nav);
      this.bindMobile();
      this.markActive();
    },

    build(container) {
      const isRoot = !document.body.classList.contains('is-subpage');
      const allowed = Access.getModules();
      let html = '';

      html += '<div class="nav-section">الرئيسية</div>';
      html +=
        '<a class="nav-link" href="' +
        (isRoot ? 'dashboard.html' : '../dashboard.html') +
        '" data-nav="dashboard">' +
        icon('grid') +
        '<span>لوحة القيادة</span></a>';

      if (allowed.length) {
        html += '<div class="nav-section">أقسامي</div>';
        MODULES.forEach(function (m) {
          if (allowed.indexOf(m.id) === -1) return;
          const href = isRoot ? m.href : '../' + m.href;
          html +=
            '<a class="nav-link" href="' +
            href +
            '" data-nav="' +
            m.id +
            '">' +
            icon(m.icon) +
            '<span>' +
            m.label +
            '</span></a>';
        });
      }

      html += '<div class="nav-section">الحساب</div>';
      html +=
        '<a class="nav-link" href="' +
        (isRoot ? 'specialty.html' : '../specialty.html') +
        '" data-nav="specialty">' +
        icon('settings') +
        '<span>تغيير الاختصاص</span></a>';
      html +=
        '<a class="nav-link" href="' +
        (isRoot ? 'settings.html' : '../settings.html') +
        '" data-nav="settings">' +
        icon('download') +
        '<span>نسخ احتياطي</span></a>';

      container.innerHTML = html;
    },

    markActive() {
      const page = document.body.dataset.page;
      if (!page) return;
      document.querySelectorAll('.nav-link').forEach(function (link) {
        link.classList.toggle('is-active', link.dataset.nav === page);
      });
    },

    bindMobile() {
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('overlay');
      const btn = document.getElementById('menuBtn');
      if (!sidebar || !btn) return;

      function close() {
        sidebar.classList.remove('is-open');
        if (overlay) overlay.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }

      btn.addEventListener('click', function () {
        const open = sidebar.classList.toggle('is-open');
        if (overlay) overlay.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
      });

      if (overlay) overlay.addEventListener('click', close);
      sidebar.querySelectorAll('.nav-link').forEach(function (a) {
        a.addEventListener('click', close);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') close();
      });
      window.addEventListener('resize', function () {
        if (window.innerWidth > 900) close();
      });
    },
  };

  const Utils = {
    money(value, currency) {
      currency = currency || 'دج';
      const n = Number(value) || 0;
      return (
        new Intl.NumberFormat('ar-DZ', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(n) +
        ' ' +
        currency
      );
    },
    date(value, opts) {
      if (!value) return '—';
      const d = new Date(value);
      if (isNaN(d.getTime())) return '—';
      return new Intl.DateTimeFormat(
        'ar-DZ',
        opts || { year: 'numeric', month: '2-digit', day: '2-digit' }
      ).format(d);
    },
    shortDate(value) {
      return this.date(value, { month: '2-digit', day: '2-digit' });
    },
    uid(prefix) {
      prefix = prefix || 'ID';
      return (
        prefix +
        '-' +
        Date.now().toString(36).toUpperCase() +
        Math.random().toString(36).slice(2, 6).toUpperCase()
      );
    },
    num(v) {
      return Number(v) || 0;
    },
    toggle(el, show) {
      if (!el) return;
      el.style.display = show ? '' : 'none';
    },
    escapeHtml(str) {
      return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    },
    todayISO() {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return y + '-' + m + '-' + day;
    },
    downloadJSON(filename, data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    readJSONFile(file) {
      return new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.onload = function () {
          try {
            resolve(JSON.parse(reader.result));
          } catch (e) {
            reject(new Error('ملف JSON غير صالح'));
          }
        };
        reader.onerror = function () {
          reject(new Error('فشل قراءة الملف'));
        };
        reader.readAsText(file);
      });
    },
  };

  const App = {
    MODULES: MODULES,
    MODULE_IDS: MODULE_IDS,
    Storage: Storage,
    Theme: Theme,
    Access: Access,
    Sidebar: Sidebar,
    Auth: Auth,
    Utils: Utils,
    icon: icon,
  };

  window.App = App;

  document.addEventListener('DOMContentLoaded', function () {
    Theme.init();
    if (document.body.dataset.page) {
      Sidebar.init();
      Auth.bindUI();
    }
  });
})(window, document);
