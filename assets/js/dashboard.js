/* =========================================================
   Manager App — Dashboard Module
   ========================================================= */

(function () {
  'use strict';

  const { Storage, Utils, Chart } = window.App;

  /* ---------------------------------------------------------
     مفاتيح التخزين — نفس المفاتيح المستعملة في باقي الأقسام
     --------------------------------------------------------- */
  const KEYS = {
    tx:       'finance:transactions',
    products: 'shops:products',
    animals:  'sheep:animals',
    workers:  'hr:workers',
    seeded:   'seeded',
  };

  /* ---------------------------------------------------------
     أيقونات محلية
     --------------------------------------------------------- */
  const ICONS = {
    income:  '<path d="M12 19V5"/><path d="M5 12l7-7 7 7"/>',
    expense: '<path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/>',
    profit:  '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
    workers: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    sheep:   '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1"/><circle cx="15" cy="10" r="1"/><path d="M9 15c1 1 2 1.5 3 1.5s2-.5 3-1.5"/>',
    warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    shield:  '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    bell:    '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  };

  function svgIcon(name) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
  }

  /* ---------------------------------------------------------
     قراءة البيانات
     --------------------------------------------------------- */
  const getTx       = () => Storage.get(KEYS.tx, []);
  const getProducts = () => Storage.get(KEYS.products, []);
  const getAnimals  = () => Storage.get(KEYS.animals, []);
  const getWorkers  = () => Storage.get(KEYS.workers, []);

  /* ---------------------------------------------------------
     1. البطاقات الإحصائية
     --------------------------------------------------------- */
  function computeStats() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    let income = 0, expense = 0;
    getTx().forEach(t => {
      const d = new Date(t.date);
      if (d.getFullYear() === y && d.getMonth() === m) {
        if (t.type === 'in') income += Utils.num(t.amount);
        else expense += Utils.num(t.amount);
      }
    });

    return {
      income,
      expense,
      profit: income - expense,
      workers: getWorkers().length,
      animals: getAnimals().length,
    };
  }

  function renderStats() {
    const grid = document.getElementById('statsGrid');
    if (!grid) return;

    const s = computeStats();
    const monthName = new Intl.DateTimeFormat('ar-DZ', { month: 'long' }).format(new Date());

    const cards = [
      {
        tone: 'success', icon: 'income', label: 'مداخيل الشهر',
        value: Utils.money(s.income), sub: monthName,
      },
      {
        tone: 'danger', icon: 'expense', label: 'مصاريف الشهر',
        value: Utils.money(s.expense), sub: monthName,
      },
      {
        tone: s.profit >= 0 ? 'primary' : 'danger', icon: 'profit',
        label: 'صافي الربح',
        value: Utils.money(s.profit),
        sub: s.profit >= 0 ? 'ربح إيجابي' : 'خسارة',
      },
      {
        tone: 'info', icon: 'workers', label: 'عدد العمال',
        value: String(s.workers), sub: 'موظف مسجل',
      },
      {
        tone: 'purple', icon: 'sheep', label: 'عدد المواشي',
        value: String(s.animals), sub: 'رأس مسجل',
      },
    ];

    grid.innerHTML = cards.map(c => `
      <div class="stat-card stat-card--${c.tone}">
        <div class="stat-card__icon">${svgIcon(c.icon)}</div>
        <span class="stat-card__label">${c.label}</span>
        <span class="stat-card__value">${c.value}</span>
        <span class="stat-card__sub">${c.sub}</span>
      </div>
    `).join('');
  }

  /* ---------------------------------------------------------
     2. الرسم البياني (آخر 7 أيام)
     --------------------------------------------------------- */
  function collectLast7Days() {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d);
    }

    const labels  = days.map(d =>
      new Intl.DateTimeFormat('ar-DZ', { weekday: 'short' }).format(d)
    );
    const income  = [];
    const expense = [];
    const tx = getTx();

    days.forEach(d => {
      const iso = toISODate(d);
      let inc = 0, exp = 0;
      tx.forEach(t => {
        if ((t.date || '').slice(0, 10) === iso) {
          if (t.type === 'in') inc += Utils.num(t.amount);
          else exp += Utils.num(t.amount);
        }
      });
      income.push(inc);
      expense.push(exp);
    });

    return { labels, income, expense };
  }

  function renderChart() {
    const canvas = document.getElementById('financeChart');
    if (!canvas) return;

    const { labels, income, expense } = collectLast7Days();

    Chart.drawLine(canvas, {
      labels,
      series: [
        { name: 'مداخيل', values: income,  color: '#16a34a' },
        { name: 'مصاريف', values: expense, color: '#dc2626' },
      ],
    });

    /* legend تحت الرسم */
    if (!canvas.parentElement.querySelector('.chart-legend')) {
      const legend = document.createElement('div');
      legend.className = 'chart-legend';
      legend.innerHTML = `
        <span class="chart-legend__item">
          <span class="chart-legend__dot" style="background:#16a34a"></span> مداخيل
        </span>
        <span class="chart-legend__item">
          <span class="chart-legend__dot" style="background:#dc2626"></span> مصاريف
        </span>
      `;
      canvas.parentElement.appendChild(legend);
    }
  }

  /* ---------------------------------------------------------
     3. التنبيهات السريعة
     --------------------------------------------------------- */
  function renderAlerts() {
    const list  = document.getElementById('alertsList');
    const count = document.getElementById('alertsCount');
    if (!list) return;

    const items = [];

    /* نفاذ المخزون */
    getProducts().forEach(p => {
      const q   = Utils.num(p.quantity);
      const min = Utils.num(p.minQuantity);
      if (min > 0 && q <= min) {
        items.push({
          tone: q === 0 ? 'danger' : 'warning',
          icon: 'warning',
          title: q === 0 ? `نفذ مخزون: ${p.name}` : `مخزون منخفض: ${p.name}`,
          sub: `الكمية المتبقية: ${q} ${p.unit || 'وحدة'} (الحد الأدنى: ${min})`,
        });
      }
    });

    /* تلقيحات قريبة (خلال 7 أيام) */
    const now = Date.now();
    getAnimals().forEach(a => {
      if (!a.nextVaccine) return;
      const diff = (new Date(a.nextVaccine).getTime() - now) / 86400000;
      if (diff <= 7) {
        items.push({
          tone: diff < 0 ? 'danger' : 'info',
          icon: 'shield',
          title: `تلقيح: ${a.tag || a.id}`,
          sub: diff < 0 ? 'متأخر — راجع الطبيب البيطري' : `مستحق بعد ${Math.ceil(diff)} يوم`,
        });
      }
    });

    if (!items.length) {
      list.innerHTML = `
        <li class="alert-item">
          <span class="alert-item__icon alert-item__icon--info">${svgIcon('bell')}</span>
          <div class="alert-item__body">
            <strong>لا توجد تنبيهات حالياً</strong>
            <small>كل شيء تحت السيطرة ✅</small>
          </div>
        </li>`;
      if (count) count.textContent = '0';
      return;
    }

    list.innerHTML = items.map(it => `
      <li class="alert-item">
        <span class="alert-item__icon alert-item__icon--${it.tone}">${svgIcon(it.icon)}</span>
        <div class="alert-item__body">
          <strong>${escapeHtml(it.title)}</strong>
          <small>${escapeHtml(it.sub)}</small>
        </div>
      </li>
    `).join('');

    if (count) count.textContent = String(items.length);
  }

  /* ---------------------------------------------------------
     4. آخر العمليات
     --------------------------------------------------------- */
  function renderRecent() {
    const body = document.getElementById('recentBody');
    if (!body) return;

    const tx = getTx()
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6);

    if (!tx.length) {
      body.innerHTML = `
        <tr><td colspan="5" class="table-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <p>لا توجد عمليات مسجّلة بعد</p>
          <a href="pages/finance.html" class="btn btn--primary" style="margin-top:12px;display:inline-flex;">
            + إضافة أول عملية
          </a>
        </td></tr>`;
      return;
    }

    body.innerHTML = tx.map(t => `
      <tr>
        <td>
          <span class="badge ${t.type === 'in' ? 'badge--success' : 'badge--danger'}">
            ${t.type === 'in' ? 'مدخول' : 'مصروف'}
          </span>
        </td>
        <td class="cell-strong">${escapeHtml(t.description || '—')}</td>
        <td>${escapeHtml(t.category || '—')}</td>
        <td>${Utils.date(t.date)}</td>
        <td class="t-end">
          <span class="amount ${t.type === 'in' ? 'amount--in' : 'amount--out'}">
            ${t.type === 'in' ? '+' : '−'} ${Utils.money(t.amount)}
          </span>
        </td>
      </tr>
    `).join('');
  }

  /* ---------------------------------------------------------
     5. بيانات تجريبية (مرة واحدة فقط)
     --------------------------------------------------------- */
  function seedDemo() {
    const today = new Date();
    const tx = [];
    const catsIn  = ['مبيعات', 'مبيعات أغنام', 'خدمات'];
    const catsOut = ['سلع', 'أعلاف', 'رواتب', 'كهرباء', 'إيجار'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = toISODate(d);

      tx.push({
        id: Utils.uid('TX'),
        type: 'in',
        amount: 3500 + Math.floor(Math.random() * 8000),
        category: catsIn[Math.floor(Math.random() * catsIn.length)],
        description: 'عملية بيع',
        date: iso,
      });

      if (Math.random() > 0.35) {
        tx.push({
          id: Utils.uid('TX'),
          type: 'out',
          amount: 1200 + Math.floor(Math.random() * 4200),
          category: catsOut[Math.floor(Math.random() * catsOut.length)],
          description: 'مصروف يومي',
          date: iso,
        });
      }
    }

    Storage.set(KEYS.tx, tx);

    Storage.set(KEYS.products, [
      { id: Utils.uid('P'), name: 'زيت 5 لتر',   buyPrice: 800,  sellPrice: 1000, quantity: 3,  minQuantity: 5,  unit: 'عبوة' },
      { id: Utils.uid('P'), name: 'سكر 1 كغ',    buyPrice: 100,  sellPrice: 130,  quantity: 42, minQuantity: 10, unit: 'كيس' },
      { id: Utils.uid('P'), name: 'دقيق 5 كغ',   buyPrice: 450,  sellPrice: 550,  quantity: 2,  minQuantity: 4,  unit: 'كيس' },
    ]);

    Storage.set(KEYS.workers, [
      { id: Utils.uid('W'), name: 'محمد الأمين', position: 'بائع', salary: 30000 },
      { id: Utils.uid('W'), name: 'علي بن عمر',  position: 'عامل', salary: 25000 },
      { id: Utils.uid('W'), name: 'سعيد مرابط',  position: 'راعي', salary: 22000 },
    ]);

    const nextWeek = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
    Storage.set(KEYS.animals, [
      { id: Utils.uid('S'), tag: 'S-001', breed: 'أولاد جلال',   gender: 'أنثى', birthDate: '2023-03-10', weight: 45 },
      { id: Utils.uid('S'), tag: 'S-002', breed: 'أولاد جلال',   gender: 'ذكر',  birthDate: '2023-05-22', weight: 52 },
      { id: Utils.uid('S'), tag: 'S-003', breed: 'سلالة محلية', gender: 'أنثى', birthDate: '2022-11-01', weight: 48, nextVaccine: nextWeek },
    ]);
  }

  function maybeAutoSeed() {
    const hasData =
      getTx().length || getProducts().length ||
      getAnimals().length || getWorkers().length;
    if (!hasData) {
      seedDemo();
      Storage.set(KEYS.seeded, true);
    }
  }

  /* ---------------------------------------------------------
     أدوات صغيرة
     --------------------------------------------------------- */
  function toISODate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  /* ---------------------------------------------------------
     التشغيل
     --------------------------------------------------------- */
  function renderAll() {
    renderStats();
    renderChart();
    renderAlerts();
    renderRecent();
  }

  function init() {
    maybeAutoSeed();
    renderAll();

    /* إعادة الرسم عند تغيير حجم الشاشة (debounced) */
    let t;
    window.addEventListener('resize', () => {
      clearTimeout(t);
      t = setTimeout(renderChart, 140);
    });

    /* إعادة الرسم عند تغيير الثيم */
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) themeBtn.addEventListener('click', () => setTimeout(renderChart, 60));
  }

  document.addEventListener('DOMContentLoaded', init);

  /* واجهة عامة للاستخدام من صفحات أخرى */
  window.Dashboard = { refresh: renderAll, seed: seedDemo };
})();
