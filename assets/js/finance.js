/* =========================================================
   Manager App — Finance Module
   إدارة المداخيل والمصاريف + صافي الربح + تصدير CSV
   ========================================================= */

(function () {
  'use strict';

  const { Storage, Utils, Chart } = window.App;

  const KEY_TX = 'finance:transactions';

  const CATEGORIES = {
    in:  ['مبيعات', 'مبيعات أغنام', 'خدمات', 'أخرى'],
    out: ['سلع', 'أعلاف', 'رواتب', 'سلفيات', 'كهرباء', 'ماء', 'إيجار', 'صيانة', 'أدوية بيطرية', 'أخرى'],
  };

  /* حالة الفلاتر الحالية */
  const state = {
    filterType: 'all',
    filterMonth: currentMonth(),
    filterCategory: 'all',
    query: '',
  };

  /* ---------------------------------------------------------
     أدوات
     --------------------------------------------------------- */
  const getTx = () => Storage.get(KEY_TX, []);
  const setTx = (arr) => Storage.set(KEY_TX, arr);

  function currentMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  function monthOptions() {
    const set = new Set();
    const d = new Date();
    for (let i = 0; i < 12; i++) {
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      d.setMonth(d.getMonth() - 1);
    }
    return Array.from(set);
  }

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  /* ---------------------------------------------------------
     1. الفلترة
     --------------------------------------------------------- */
  function applyFilters() {
    let list = getTx();

    if (state.filterMonth !== 'all') {
      list = list.filter(t => (t.date || '').slice(0, 7) === state.filterMonth);
    }
    if (state.filterType !== 'all') {
      list = list.filter(t => t.type === state.filterType);
    }
    if (state.filterCategory !== 'all') {
      list = list.filter(t => t.category === state.filterCategory);
    }
    if (state.query.trim()) {
      const q = state.query.trim().toLowerCase();
      list = list.filter(t =>
        (t.description || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  /* ---------------------------------------------------------
     2. بطاقات الملخص
     --------------------------------------------------------- */
  function renderSummary() {
    const list = applyFilters();
    let income = 0, expense = 0;
    list.forEach(t => {
      if (t.type === 'in') income += Utils.num(t.amount);
      else expense += Utils.num(t.amount);
    });
    const profit = income - expense;

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    set('sumIncome',  Utils.money(income));
    set('sumExpense', Utils.money(expense));
    set('sumProfit',  Utils.money(profit));
    set('sumCount',   String(list.length));

    const profitEl = document.getElementById('sumProfit');
    if (profitEl) {
      profitEl.style.color = profit >= 0
        ? 'var(--success)'
        : 'var(--danger)';
    }
  }

  /* ---------------------------------------------------------
     3. الجدول
     --------------------------------------------------------- */
  function renderTable() {
    const body = document.getElementById('txBody');
    if (!body) return;

    const list = applyFilters();

    if (!list.length) {
      body.innerHTML = `
        <tr><td colspan="6" class="table-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
               stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <p>لا توجد عمليات مطابقة</p>
        </td></tr>`;
      return;
    }

    body.innerHTML = list.map(t => `
      <tr data-id="${t.id}">
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
        <td class="t-end">
          <button class="icon-btn icon-btn--sm js-delete" data-id="${t.id}" title="حذف">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </td>
      </tr>
    `).join('');

    body.querySelectorAll('.js-delete').forEach(btn => {
      btn.addEventListener('click', () => deleteTx(btn.dataset.id));
    });
  }

  /* ---------------------------------------------------------
     4. الرسم البياني (حسب الفلتر الحالي، مجمّع يومياً)
     --------------------------------------------------------- */
  function renderChart() {
    const canvas = document.getElementById('financeChart');
    if (!canvas) return;

    const list = applyFilters();

    /* نجمع حسب اليوم */
    const groups = new Map(); // date -> {in, out}
    list.forEach(t => {
      const d = (t.date || '').slice(0, 10);
      if (!d) return;
      if (!groups.has(d)) groups.set(d, { in: 0, out: 0 });
      const g = groups.get(d);
      if (t.type === 'in') g.in += Utils.num(t.amount);
      else g.out += Utils.num(t.amount);
    });

    const dates = Array.from(groups.keys()).sort();
    const labels = dates.map(d => Utils.shortDate(d));
    const income = dates.map(d => groups.get(d).in);
    const expense = dates.map(d => groups.get(d).out);

    if (!dates.length) {
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--muted');
      ctx.font = '13px Cairo, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('لا توجد بيانات لعرضها', rect.width / 2, rect.height / 2);
      return;
    }

    Chart.drawLine(canvas, {
      labels,
      series: [
        { name: 'مداخيل', values: income,  color: '#16a34a' },
        { name: 'مصاريف', values: expense, color: '#dc2626' },
      ],
    });
  }

  /* ---------------------------------------------------------
     5. العمليات على المعاملات
     --------------------------------------------------------- */
  function addTx(data) {
    const list = getTx();
    list.push({
      id: Utils.uid('TX'),
      type: data.type,
      amount: Utils.num(data.amount),
      category: data.category,
      description: data.description.trim(),
      date: data.date || new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    });
    setTx(list);
  }

  function deleteTx(id) {
    if (!confirm('هل أنت متأكد من حذف هذه العملية؟')) return;
    setTx(getTx().filter(t => t.id !== id));
    refreshAll();
  }

  /* ---------------------------------------------------------
     6. تصدير CSV
     --------------------------------------------------------- */
  function exportCSV() {
    const list = applyFilters();
    if (!list.length) {
      alert('لا توجد بيانات للتصدير');
      return;
    }

    const header = ['التاريخ', 'النوع', 'التصنيف', 'البيان', 'المبلغ'];
    const rows = list.map(t => [
      t.date,
      t.type === 'in' ? 'مدخول' : 'مصروف',
      t.category || '',
      (t.description || '').replace(/"/g, '""'),
      t.amount,
    ]);

    const csv = '\uFEFF' + [header, ...rows]
      .map(r => r.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ---------------------------------------------------------
     7. النافذة المنبثقة (Modal)
     --------------------------------------------------------- */
  function openModal(type) {
    const modal = document.getElementById('txModal');
    if (!modal) return;

    const form = modal.querySelector('form');
    form.reset();

    const typeInput = form.querySelector('[name="type"]');
    typeInput.value = type || 'in';
    updateCategoryOptions(typeInput.value);
    updateTypeToggle(typeInput.value);

    form.querySelector('[name="date"]').value = new Date().toISOString().slice(0, 10);

    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => form.querySelector('[name="amount"]').focus(), 120);
  }

  function closeModal() {
    const modal = document.getElementById('txModal');
    modal?.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function updateCategoryOptions(type) {
    const select = document.querySelector('#txModal [name="category"]');
    if (!select) return;
    const list = CATEGORIES[type] || [];
    select.innerHTML = list.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  function updateTypeToggle(type) {
    document.querySelectorAll('#txModal .type-toggle__btn').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.type === type);
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
      type: form.querySelector('[name="type"]').value,
      amount: form.querySelector('[name="amount"]').value,
      category: form.querySelector('[name="category"]').value,
      description: form.querySelector('[name="description"]').value,
      date: form.querySelector('[name="date"]').value,
    };

    if (!data.amount || Utils.num(data.amount) <= 0) {
      alert('الرجاء إدخال مبلغ صحيح');
      return;
    }
    if (!data.description.trim()) {
      alert('الرجاء إدخال بيان العملية');
      return;
    }

    addTx(data);
    closeModal();
    refreshAll();
  }

  /* ---------------------------------------------------------
     8. ربط الأحداث
     --------------------------------------------------------- */
  function bindEvents() {
    /* فتح النافذة */
    document.querySelectorAll('.js-open-modal').forEach(btn => {
      btn.addEventListener('click', () => openModal(btn.dataset.type || 'in'));
    });

    /* إغلاق النافذة */
    document.querySelectorAll('.js-close-modal').forEach(btn => {
      btn.addEventListener('click', closeModal);
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeModal();
    });

    /* تبديل النوع داخل النافذة */
    document.querySelectorAll('#txModal .type-toggle__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        document.querySelector('#txModal [name="type"]').value = type;
        updateCategoryOptions(type);
        updateTypeToggle(type);
      });
    });

    /* تقديم النموذج */
    const form = document.querySelector('#txModal form');
    if (form) form.addEventListener('submit', handleSubmit);

    /* الفلاتر */
    document.getElementById('filterType')?.addEventListener('change', e => {
      state.filterType = e.target.value;
      refreshAll();
    });
    document.getElementById('filterMonth')?.addEventListener('change', e => {
      state.filterMonth = e.target.value;
      refreshAll();
    });
    document.getElementById('filterCategory')?.addEventListener('change', e => {
      state.filterCategory = e.target.value;
      refreshAll();
    });
    document.getElementById('filterSearch')?.addEventListener('input', e => {
      state.query = e.target.value;
      refreshAll();
    });

    /* تصدير */
    document.getElementById('btnExport')?.addEventListener('click', exportCSV);

    /* إعادة الرسم عند تغيير الحجم */
    let t;
    window.addEventListener('resize', () => {
      clearTimeout(t);
      t = setTimeout(renderChart, 140);
    });
  }

  /* ---------------------------------------------------------
     9. تعبئة الفلاتر
     --------------------------------------------------------- */
  function fillFilters() {
    const monthSel = document.getElementById('filterMonth');
    if (monthSel) {
      const months = monthOptions();
      monthSel.innerHTML =
        `<option value="all">كل الفترات</option>` +
        months.map(m => {
          const [y, mm] = m.split('-');
          const name = new Intl.DateTimeFormat('ar-DZ', { month: 'long', year: 'numeric' })
            .format(new Date(Number(y), Number(mm) - 1, 1));
          return `<option value="${m}">${name}</option>`;
        }).join('');
      monthSel.value = state.filterMonth;
    }

    const catSel = document.getElementById('filterCategory');
    if (catSel) {
      const all = [...new Set([...CATEGORIES.in, ...CATEGORIES.out])];
      catSel.innerHTML =
        `<option value="all">كل التصنيفات</option>` +
        all.map(c => `<option value="${c}">${c}</option>`).join('');
      catSel.value = state.filterCategory;
    }
  }

  /* ---------------------------------------------------------
     التشغيل
     --------------------------------------------------------- */
  function refreshAll() {
    renderSummary();
    renderTable();
    renderChart();
  }

  function init() {
    fillFilters();
    bindEvents();
    refreshAll();
  }

  document.addEventListener('DOMContentLoaded', init);

  window.Finance = { refresh: refreshAll, add: addTx, export: exportCSV };
})();