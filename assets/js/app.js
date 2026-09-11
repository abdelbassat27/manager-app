/* =========================================================
   Manager App — Core Engine
   يوفّر: التخزين، الثيم، القائمة الجانبية، الحماية، الأدوات
   ========================================================= */

(function (window, document) {
  'use strict';

  /* ---------------------------------------------------------
     1. الإعدادات العامة + خريطة الصفحات (Routes)
     --------------------------------------------------------- */
  const ROUTES = [
    {
      section: 'الرئيسية',
      items: [
        { id: 'dashboard', label: 'لوحة القيادة', href: 'dashboard.html', icon: 'grid', root: true },
      ],
    },
    {
      section: 'الأقسام',
      items: [
        { id: 'shops', label: 'المحلات والمخزون', href: 'pages/shops.html', icon: 'store' },
        { id: 'sheep', label: 'تربية الأغنام',    href: 'pages/sheep.html', icon: 'sheep' },
        { id: 'hr',    label: 'الموارد البشرية', href: 'pages/hr.html',    icon: 'users' },
        { id: 'finance', label: 'الإدارة المالية', href: 'pages/finance.html', icon: 'wallet' },
      ],
    },
  ];

  /* ---------------------------------------------------------
     2. مكتبة الأيقونات (SVG Inline)
     --------------------------------------------------------- */
  const ICONS = {
    grid:   '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    store:  '<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/>',
    sheep:  '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1"/><circle cx="15" cy="10" r="1"/><path d="M9 15c1 1 2 1.5 3 1.5s2-.5 3-1.5"/>',
    users:  '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    wallet: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  };

  function icon(name, cls) {
    const path = ICONS[name] || ICONS.grid;
    return `<svg class="${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
  }

  /* ---------------------------------------------------------
     3. طبقة التخزين (Storage) — قابلة للاستبدال بـ Backend
     --------------------------------------------------------- */
  const NS = 'managerapp:'; // Namespace موحّد

  const Storage = {
    get(key, fallback = null) {
      try {
        const raw = localStorage.getItem(NS + key);
        return raw ? JSON.parse(raw) : fallback;
      } catch { return fallback; }
    },
    set(key, value) {
      try {
        localStorage.setItem(NS + key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.error('[Storage] فشل الحفظ:', e);
        return false;
      }
    },
    remove(key) { localStorage.removeItem(NS + key); },
    clear() {
      Object.keys(localStorage)
        .filter(k => k.startsWith(NS))
        .forEach(k => localStorage.removeItem(k));
    },
  };

  /* ---------------------------------------------------------
     4. إدارة الثيم (Dark / Light)
     --------------------------------------------------------- */
  const Theme = {
    init() {
      const saved = Storage.get('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = saved || (prefersDark ? 'dark' : 'light');
      this.apply(theme);

      const btn = document.getElementById('themeBtn');
      if (btn) btn.addEventListener('click', () => this.toggle());

      window.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', (e) => {
          if (!Storage.get('theme')) this.apply(e.matches ? 'dark' : 'light');
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

  /* ---------------------------------------------------------
     5. القائمة الجانبية (Sidebar)
     --------------------------------------------------------- */
  const Sidebar = {
    init() {
      const nav = document.getElementById('sidebarNav');
      if (nav) this.build(nav);
      this.bindMobile();
      this.markActive();
    },

    build(container) {
      const isRoot = !document.body.classList.contains('is-subpage');
      let html = '';

      ROUTES.forEach(group => {
        html += `<div class="nav-section">${group.section}</div>`;
        group.items.forEach(item => {
          const href = isRoot ? item.href : '../' + item.href;
          html += `
            <a class="nav-link" href="${href}" data-nav="${item.id}">
              ${icon(item.icon)}
              <span>${item.label}</span>
            </a>`;
        });
      });

      container.innerHTML = html;
    },

    markActive() {
      const page = document.body.dataset.page;
      if (!page) return;
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('is-active', link.dataset.nav === page);
      });
    },

    bindMobile() {
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('overlay');
      const btn     = document.getElementById('menuBtn');
      if (!sidebar || !btn) return;

      const close = () => {
        sidebar.classList.remove('is-open');
        overlay?.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      };

      btn.addEventListener('click', () => {
        const open = sidebar.classList.toggle('is-open');
        overlay?.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
      });

      overlay?.addEventListener('click', close);

      // إغلاق عند التنقل
      sidebar.querySelectorAll('.nav-link').forEach(a =>
        a.addEventListener('click', close)
      );

      // إغلاق بزر Escape
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') close();
      });

      // إغلاق عند تكبير الشاشة
      window.addEventListener('resize', () => {
        if (window.innerWidth > 900) close();
      });
    },
  };

  /* ---------------------------------------------------------
     6. الحماية (Auth Guard) — حماية بسيطة عبر الجلسة
     --------------------------------------------------------- */
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
        user,
        loginAt: new Date().toISOString(),
      });
    },

    logout() {
      Storage.remove(this.SESSION_KEY);
    },

    // يجب استدعاؤها في كل صفحة محمية
    guard() {
      if (!this.isLoggedIn()) {
        const path = window.location.pathname;
        const isSub = path.includes('/pages/');
        window.location.replace(isSub ? '../index.html' : 'index.html');
        return false;
      }
      return true;
    },

    /** ربط زر الخروج + تحديث الأفاتار */
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
        btn.addEventListener('click', () => {
          this.logout();
          const path = window.location.pathname;
          const isSub = path.includes('/pages/');
          window.location.replace(isSub ? '../index.html' : 'index.html');
        });
      }
    },
  };

  /* ---------------------------------------------------------
     7. أدوات مساعدة (Helpers)
     --------------------------------------------------------- */
  const Utils = {
    /** تنسيق العملة */
    money(value, currency = 'دج') {
      const n = Number(value) || 0;
      return new Intl.NumberFormat('ar-DZ', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(n) + ' ' + currency;
    },

    /** تنسيق التاريخ */
    date(value, opts) {
      if (!value) return '—';
      const d = new Date(value);
      if (isNaN(d)) return '—';
      return new Intl.DateTimeFormat('ar-DZ', opts || {
        year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(d);
    },

    /** تاريخ مختصر */
    shortDate(value) {
      return this.date(value, { month: '2-digit', day: '2-digit' });
    },

    /** معرّف فريد */
    uid(prefix = 'ID') {
      return prefix + '-' + Date.now().toString(36).toUpperCase() +
             Math.random().toString(36).slice(2, 6).toUpperCase();
    },

    /** فلترة الأرقام */
    num(v) { return Number(v) || 0; },

    /** إظهار/إخفاء عنصر */
    toggle(el, show) {
      if (!el) return;
      el.style.display = show ? '' : 'none';
    },

    /** تهريب HTML لمنع XSS */
    escapeHtml(str) {
      return String(str ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
      }[c]));
    },

    /** تاريخ اليوم بصيغة ISO */
    todayISO() {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    },
  };

  /* ---------------------------------------------------------
     8. الإقلاع (Boot)
     --------------------------------------------------------- */
  const App = {
    ROUTES, Storage, Theme, Sidebar, Auth, Utils, icon,
  };

  window.App = App; // تصدير عالمي

  // تشغيل تلقائي عند جاهزية DOM
  document.addEventListener('DOMContentLoaded', () => {
    Theme.init();
    Sidebar.init();
    if (document.body.dataset.page) {
      Auth.bindUI();
    }
  });

})(window, document);