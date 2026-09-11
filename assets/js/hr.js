/* =========================================================
   Manager App — HR Module
   ========================================================= */
(function () {
  'use strict';

  const { Storage, Utils } = window.App;
  const KEY = 'hr:workers';
  const esc = Utils.escapeHtml;

  const getAll = () => Storage.get(KEY, []);
  const saveAll = (arr) => Storage.set(KEY, arr);

  let editId = null;

  function render() {
    const body = document.getElementById('hrBody');
    const q = (document.getElementById('searchHr')?.value || '').trim().toLowerCase();
    if (!body) return;

    let list = getAll().slice();
    if (q) {
      list = list.filter(w =>
        (w.name || '').toLowerCase().includes(q) ||
        (w.position || '').toLowerCase().includes(q)
      );
    }

    const totalSalary = getAll().reduce((s, w) => s + Utils.num(w.salary), 0);
    const elCount = document.getElementById('hrCount');
    const elSalary = document.getElementById('hrSalary');
    if (elCount) elCount.textContent = String(getAll().length);
    if (elSalary) elSalary.textContent = Utils.money(totalSalary);

    if (!list.length) {
      body.innerHTML = `<tr><td colspan="5" class="table-empty"><p>لا يوجد عمال مسجّلون</p></td></tr>`;
      return;
    }

    body.innerHTML = list.map(w => `
      <tr>
        <td class="cell-strong">${esc(w.name)}</td>
        <td>${esc(w.position || '—')}</td>
        <td class="t-end">${Utils.money(w.salary)}</td>
        <td>${esc(w.phone || '—')}</td>
        <td class="t-end">
          <div class="row-actions">
            <button type="button" class="btn btn--ghost btn--sm" data-edit="${esc(w.id)}">تعديل</button>
            <button type="button" class="btn btn--danger-ghost btn--sm" data-del="${esc(w.id)}">حذف</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function openModal(item) {
    editId = item ? item.id : null;
    document.getElementById('modalTitle').textContent = item ? 'تعديل عامل' : 'إضافة عامل';
    document.getElementById('wName').value = item?.name || '';
    document.getElementById('wPosition').value = item?.position || '';
    document.getElementById('wSalary').value = item?.salary ?? '';
    document.getElementById('wPhone').value = item?.phone || '';
    document.getElementById('hrModal').classList.add('is-open');
  }

  function closeModal() {
    document.getElementById('hrModal').classList.remove('is-open');
    editId = null;
  }

  function save() {
    const name = document.getElementById('wName').value.trim();
    const position = document.getElementById('wPosition').value.trim();
    const salary = Utils.num(document.getElementById('wSalary').value);
    const phone = document.getElementById('wPhone').value.trim();

    if (!name) {
      alert('اسم العامل مطلوب');
      return;
    }

    const list = getAll();
    if (editId) {
      const i = list.findIndex(w => w.id === editId);
      if (i >= 0) list[i] = { ...list[i], name, position, salary, phone };
    } else {
      list.push({ id: Utils.uid('W'), name, position, salary, phone });
    }
    saveAll(list);
    closeModal();
    render();
  }

  function remove(id) {
    if (!confirm('حذف هذا العامل؟')) return;
    saveAll(getAll().filter(w => w.id !== id));
    render();
  }

  function init() {
    if (!App.Auth.guard()) return;
    render();

    document.getElementById('btnAddHr')?.addEventListener('click', () => openModal(null));
    document.getElementById('btnSaveHr')?.addEventListener('click', save);
    document.getElementById('btnCancelHr')?.addEventListener('click', closeModal);
    document.getElementById('hrModal')?.addEventListener('click', e => {
      if (e.target.id === 'hrModal') closeModal();
    });
    document.getElementById('searchHr')?.addEventListener('input', render);

    document.getElementById('hrBody')?.addEventListener('click', e => {
      const edit = e.target.closest('[data-edit]');
      const del = e.target.closest('[data-del]');
      if (edit) {
        const item = getAll().find(w => w.id === edit.dataset.edit);
        if (item) openModal(item);
      }
      if (del) remove(del.dataset.del);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
