/* =========================================================
   Manager App — Dashboard (بدون بيانات تجريبية)
   ========================================================= */
(function () {
  'use strict';

  const Storage = window.App.Storage;
  const Utils = window.App.Utils;
  const Access = window.App.Access;
  const Chart = window.App.Chart;

  const KEYS = {
    tx: 'finance:transactions',
    products: 'shops:products',
    animals: 'sheep:animals',
    workers: 'hr:workers',
  };

  const ICONS = {
    income:  '<path d="M12 19V5"/><path d="M5 12l7-7 7 7"/>',
    expense: '<path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/>',
    profit:  '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
    workers: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    sheep:   '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1"/><circle cx="15" cy="10" r="1"/><path d="M9 15c1 1 2 1.5 3 1.5s2-.5 3-1.5"/>',
    store:   '<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9"/>',
    warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    shield:  '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    bell:    '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  };

  function svgIcon(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || '') + '</svg>';
  }

  function escapeHtml(str) {
    return Utils.escapeHtml(str);
  }

  const getTx = function () { return Storage.get(KEYS.tx, []); };
  const getProducts = function () { return Storage.get(KEYS.products, []); };
  const getAnimals = function () { return Storage.get(KEYS.animals, []); };
  const getWorkers = function () { return Storage.get(KEYS.workers, []); };

  function toISODate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function computeStats() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    let income = 0, expense = 0;
    getTx().forEach(function (t) {
      const d = new Date(t.date);
      if (d.getFullYear() === y && d.getMonth() === m) {
        if (t.type === 'in') income += Utils.num(t.amount);
        else expense += Utils.num(t.amount);
      }
    });
    return {
      income: income,
      expense: expense,
      profit: income - expense,
      workers: getWorkers().length,
      animals: getAnimals().length,
      products: getProducts().length,
    };
  }

  function renderStats() {
    const grid = document.getElementById('statsGrid');
    if (!grid) return;
    const s = computeStats();
    const monthName = new Intl.DateTimeFormat('ar-DZ', { month: 'long' }).format(new Date());
    const cards = [];

    if (Access.has('finance')) {
      cards.push({ tone: 'success', icon: 'income', label: 'مداخيل الشهر', value: Utils.money(s.income), sub: monthName });
      cards.push({ tone: 'danger', icon: 'expense', label: 'مصاريف الشهر', value: Utils.money(s.expense), sub: monthName });
      cards.push({
        tone: s.profit >= 0 ? 'primary' : 'danger',
        icon: 'profit',
        label: 'صافي الربح',
        value: Utils.money(s.profit),
        sub: s.profit >= 0 ? 'ربح إيجابي' : 'خسارة',
      });
    }
    if (Access.has('shops')) {
      cards.push({ tone: 'primary', icon: 'store', label: 'المنتجات', value: String(s.products), sub: 'صنف مسجّل' });
    }
    if (Access.has('hr')) {
      cards.push({ tone: 'info', icon: 'workers', label: 'عدد العمال', value: String(s.workers), sub: 'موظف مسجل' });
    }
    if (Access.has('sheep')) {
      cards.push({ tone: 'purple', icon: 'sheep', label: 'عدد المواشي', value: String(s.animals), sub: 'رأس مسجل' });
    }

    if (!cards.length) {
      grid.innerHTML = '<div class="card" style="grid-column:1/-1"><p class="muted">لم تختر أي اختصاص بعد. <a class="link" href="specialty.html">اختر اختصاصك</a></p></div>';
      return;
    }

    grid.innerHTML = cards.map(function (c) {
      return (
        '<div class="stat-card stat-card--' + c.tone + '">' +
          '<div class="stat-card__icon">' + svgIcon(c.icon) + '</div>' +
          '<span class="stat-card__label">' + c.label + '</span>' +
          '<span class="stat-card__value">' + c.value + '</span>' +
          '<span class="stat-card__sub">' + c.sub + '</span>' +
        '</div>'
      );
    }).join('');
  }

  function collectLast7Days() {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    const labels = days.map(function (d) {
      return new Intl.DateTimeFormat('ar-DZ', { weekday: 'short' }).format(d);
    });
    const income = [];
    const expense = [];
    const tx = getTx();
    days.forEach(function (d) {
      const iso = toISODate(d);
      let inc = 0, exp = 0;
      tx.forEach(function (t) {
        if ((t.date || '').slice(0, 10) === iso) {
          if (t.type === 'in') inc += Utils.num(t.amount);
          else exp += Utils.num(t.amount);
        }
      });
      income.push(inc);
      expense.push(exp);
    });
    return { labels: labels, income: income, expense: expense };
  }

  function renderChart() {
    const section = document.getElementById('chartSection');
    if (!Access.has('finance')) {
      if (section) section.style.display = 'none';
      return;
    }
    if (section) section.style.display = '';
    const canvas = document.getElementById('financeChart');
    if (!canvas || !Chart || !Chart.drawLine) return;
    const data = collectLast7Days();
    Chart.drawLine(canvas, {
      labels: data.labels,
      series: [
        { name: 'مداخيل', values: data.income, color: '#16a34a' },
        { name: 'مصاريف', values: data.expense, color: '#dc2626' },
      ],
    });
    if (!canvas.parentElement.querySelector('.chart-legend')) {
      const legend = document.createElement('div');
      legend.className = 'chart-legend';
      legend.innerHTML =
        '<span class="chart-legend__item"><span class="chart-legend__dot" style="background:#16a34a"></span> مداخيل</span>' +
        '<span class="chart-legend__item"><span class="chart-legend__dot" style="background:#dc2626"></span> مصاريف</span>';
      canvas.parentElement.appendChild(legend);
    }
  }

  function renderAlerts() {
    const list = document.getElementById('alertsList');
    const count = document.getElementById('alertsCount');
    const wrap = document.getElementById('alertsCard');
    if (!list) return;

    const showShops = Access.has('shops');
    const showSheep = Access.has('sheep');
    if (!showShops && !showSheep) {
      if (wrap) wrap.style.display = 'none';
      return;
    }
    if (wrap) wrap.style.display = '';

    const items = [];

    if (showShops) {
      getProducts().forEach(function (p) {
        const q = Utils.num(p.quantity);
        const min = Utils.num(p.minQuantity);
        if (min > 0 && q <= min) {
          items.push({
            tone: q === 0 ? 'danger' : 'warning',
            icon: 'warning',
            title: q === 0 ? 'نفذ مخزون: ' + (p.name || '') : 'مخزون منخفض: ' + (p.name || ''),
            sub: 'الكمية المتبقية: ' + q + ' ' + (p.unit || 'وحدة') + ' (الحد الأدنى: ' + min + ')',
          });
        }
      });
    }

    if (showSheep) {
      const now = Date.now();
      getAnimals().forEach(function (a) {
        if (!a.nextVaccine) return;
        const diff = (new Date(a.nextVaccine).getTime() - now) / 86400000;
        if (diff <= 7) {
          items.push({
            tone: diff < 0 ? 'danger' : 'info',
            icon: 'shield',
            title: 'تلقيح: ' + (a.tag || a.id),
            sub: diff < 0 ? 'متأخر — راجع الطبيب البيطري' : 'مستحق بعد ' + Math.ceil(diff) + ' يوم',
          });
        }
      });
    }

    if (!items.length) {
      list.innerHTML =
        '<li class="alert-item">' +
          '<span class="alert-item__icon alert-item__icon--info">' + svgIcon('bell') + '</span>' +
          '<div class="alert-item__body"><strong>لا توجد تنبيهات حالياً</strong><small>أضف بياناتك لتظهر التنبيهات هنا</small></div>' +
        '</li>';
      if (count) count.textContent = '0';
      return;
    }

    list.innerHTML = items.map(function (it) {
      return (
        '<li class="alert-item">' +
          '<span class="alert-item__icon alert-item__icon--' + it.tone + '">' + svgIcon(it.icon) + '</span>' +
          '<div class="alert-item__body"><strong>' + escapeHtml(it.title) + '</strong><small>' + escapeHtml(it.sub) + '</small></div>' +
        '</li>'
      );
    }).join('');
    if (count) count.textContent = String(items.length);
  }

  function renderRecent() {
    const section = document.getElementById('recentSection');
    if (!Access.has('finance')) {
      if (section) section.style.display = 'none';
      return;
    }
    if (section) section.style.display = '';

    const body = document.getElementById('recentBody');
    if (!body) return;

    const tx = getTx().slice().sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    }).slice(0, 6);

    if (!tx.length) {
      body.innerHTML =
        '<tr><td colspan="5" class="table-empty">' +
          '<p>لا توجد عمليات مسجّلة بعد</p>' +
          '<a href="pages/finance.html" class="btn btn--primary" style="margin-top:12px;display:inline-flex;">+ إضافة أول عملية</a>' +
        '</td></tr>';
      return;
    }

    body.innerHTML = tx.map(function (t) {
      return (
        '<tr>' +
          '<td><span class="badge ' + (t.type === 'in' ? 'badge--success' : 'badge--danger') + '">' + (t.type === 'in' ? 'مدخول' : 'مصروف') + '</span></td>' +
          '<td class="cell-strong">' + escapeHtml(t.description || '—') + '</td>' +
          '<td>' + escapeHtml(t.category || '—') + '</td>' +
          '<td>' + Utils.date(t.date) + '</td>' +
          '<td class="t-end"><span class="amount ' + (t.type === 'in' ? 'amount--in' : 'amount--out') + '">' +
            (t.type === 'in' ? '+' : '−') + ' ' + Utils.money(t.amount) +
          '</span></td>' +
        '</tr>'
      );
    }).join('');
  }

  function renderQuickLinks() {
    const el = document.getElementById('quickLinks');
    if (!el) return;
    const mods = Access.getModules();
    if (!mods.length) {
      el.innerHTML = '';
      return;
    }
    el.innerHTML = mods.map(function (id) {
      const m = App.MODULES.find(function (x) { return x.id === id; });
      if (!m) return '';
      return '<a class="btn btn--ghost" href="' + m.href + '">' + m.label + '</a>';
    }).join('');
  }

  function renderAll() {
    renderStats();
    renderChart();
    renderAlerts();
    renderRecent();
    renderQuickLinks();
  }

  function init() {
    renderAll();
    let t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(renderChart, 140);
    });
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        setTimeout(renderChart, 60);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
  window.Dashboard = { refresh: renderAll };
})();
