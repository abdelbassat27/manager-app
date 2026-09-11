/* =========================================================
   Manager App — Finance Module
   ========================================================= */
(function () {
  'use strict';

  const { Storage, Utils } = window.App;
  const KEY = 'finance:transactions';
  const esc = Utils.escapeHtml;

  const getAll = () => Storage.get(KEY, []);
  const saveAll = (arr) => Storage.set(KEY, arr);

  let editId = null;

  function render() {
    const body = document.getElementById('txBody');
    const filterType = document.getElementById('filterType')?.value || 'all';
    const q = (document.getElementById('searchTx')?.value || '').trim().toLowerCase();
    if (!body) return;

    let list = getAll().slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    if (filterType !== 'all') list = list.filter(t => t.type === filterType);
    if (q) {
      list = list.filter(t =>
        (t.description || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q)
      );
    }

    // summary
    let income = 0, expense = 0;
    getAll().forEach(t => {
      if (t.type === 'in') income += Utils.num(t.amount);
      else expense += Utils.num(t.amount);
    });
    const elIn = document.getElementById('sumIncome');
    const elOut = document.getElementById('sumExpense');
    const elNet = document.getElementById('sumNet');
    if (elIn) elIn.textContent = Utils.money(income);
    if (elOut) elOut.textContent = Utils.money(expense);
    if (elNet) elNet.textContent = Utils.money(income - expense);

    if (!list.length) {
      body.innerHTML = `<tr><td colspan="6" class="table-empty"><p>لا توجد عمليات</p></td></tr>`;
      return;
    }

    body.innerHTML = list.map(t => `
      <tr>
        <td><span class="badge ${t.type === 'in' ? 'badge--success' : 'badge--danger'}">${t.type === 'in' ? 'مدخول' : 'مصروف'}</span></td>
        <td class="cell-strong">${esc(t.description || '—')}</td>
        <td>${esc(t.category || '—')}</td>
        <td>${Utils.date(t.date)}</td>
        <td class="t-end"><span class="amount ${t.type === 'in' ? 'amount--in' : 'amount--out'}">${t.type === 'in' ? '+' : '−'} ${Utils.money(t.amount)}</span></td>
        <td class="t-end">
          <div class="row-actions">
            <button type="button" class="btn btn--ghost btn--sm" data-edit="${esc(t.id)}">تعديل</button>
            <button type="button" class="btn btn--danger-ghost btn--sm" data-del="${esc(t.id)}">حذف</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function openModal(item) {
    editId = item ? item.id : null;
    document.getElementById('modalTitle').textContent = item ? 'تعديل عملية' : 'عملية جديدة';
    document.getElementById('txType').value = item?.type || 'in';
    document.getElementById('txDesc').value = item?.description || '';
    document.getElementById('txCategory').value = item?.category || '';
    document.getElementById('txAmount').value = item?.amount ?? '';
    document.getElementById('txDate').value = item?.date || Utils.todayISO();
    document.getElementById('txModal').classList.add('is-open');
  }

  function closeModal() {
    document.getElementById('txModal').classList.remove('is-open');
    editId = null;
  }

  function save() {
    const type = document.getElementById('txType').value;
    const description = document.getElementById('txDesc').value.trim();
    const category = document.getElementById('txCategory').value.trim();
    const amount = Utils.num(document.getElementById('txAmount').value);
    const date = document.getElementById('txDate').value;

    if (!description || !amount || !date) {
      alert('الرجاء تعبئة جميع الحقول المطلوبة');
      return;
    }

    const list = getAll();
    if (editId) {
      const i = list.findIndex(t => t.id === editId);
      if (i >= 0) list[i] = { ...list[i], type, description, category, amount, date };
    } else {
      list.push({ id: Utils.uid('TX'), type, description, category, amount, date });
    }
    saveAll(list);
    closeModal();
    render();
  }

  function remove(id) {
    if (!confirm('هل تريد حذف هذه العملية؟')) return;
    saveAll(getAll().filter(t => t.id !== id));
    render();
  }

  function init() {
    if (!App.Auth.guard()) return;
    render();

    document.getElementById('btnAddTx')?.addEventListener('click', () => openModal(null));
    document.getElementById('btnSaveTx')?.addEventListener('click', save);
    document.getElementById('btnCancelTx')?.addEventListener('click', closeModal);
    document.getElementById('txModal')?.addEventListener('click', e => {
      if (e.target.id === 'txModal') closeModal();
    });
    document.getElementById('filterType')?.addEventListener('change', render);
    document.getElementById('searchTx')?.addEventListener('input', render);

    document.getElementById('txBody')?.addEventListener('click', e => {
      const edit = e.target.closest('[data-edit]');
      const del = e.target.closest('[data-del]');
      if (edit) {
        const item = getAll().find(t => t.id === edit.dataset.edit);
        if (item) openModal(item);
      }
      if (del) remove(del.dataset.del);
    });

    // open modal if hash #new
    if (location.hash === '#new') openModal(null);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
