/* =========================================================
   Manager App — Shops / Inventory Module
   ========================================================= */
(function () {
  'use strict';

  const { Storage, Utils } = window.App;
  const KEY = 'shops:products';
  const esc = Utils.escapeHtml;

  const getAll = () => Storage.get(KEY, []);
  const saveAll = (arr) => Storage.set(KEY, arr);

  let editId = null;

  function stockBadge(p) {
    const q = Utils.num(p.quantity);
    const min = Utils.num(p.minQuantity);
    if (min > 0 && q === 0) return '<span class="badge badge--danger">نفذ</span>';
    if (min > 0 && q <= min) return '<span class="badge badge--warning">منخفض</span>';
    return '<span class="badge badge--success">متوفر</span>';
  }

  function render() {
    const body = document.getElementById('prodBody');
    const q = (document.getElementById('searchProd')?.value || '').trim().toLowerCase();
    if (!body) return;

    let list = getAll().slice();
    if (q) list = list.filter(p => (p.name || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q));

    const low = getAll().filter(p => Utils.num(p.minQuantity) > 0 && Utils.num(p.quantity) <= Utils.num(p.minQuantity)).length;
    const elCount = document.getElementById('prodCount');
    const elLow = document.getElementById('lowCount');
    if (elCount) elCount.textContent = String(getAll().length);
    if (elLow) elLow.textContent = String(low);

    if (!list.length) {
      body.innerHTML = `<tr><td colspan="7" class="table-empty"><p>لا توجد منتجات</p></td></tr>`;
      return;
    }

    body.innerHTML = list.map(p => `
      <tr>
        <td class="cell-strong">${esc(p.name)}</td>
        <td>${esc(p.category || '—')}</td>
        <td>${Utils.num(p.quantity)}</td>
        <td>${esc(p.unit || 'وحدة')}</td>
        <td>${Utils.num(p.minQuantity)}</td>
        <td>${stockBadge(p)}</td>
        <td class="t-end">
          <div class="row-actions">
            <button type="button" class="btn btn--ghost btn--sm" data-edit="${esc(p.id)}">تعديل</button>
            <button type="button" class="btn btn--danger-ghost btn--sm" data-del="${esc(p.id)}">حذف</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function openModal(item) {
    editId = item ? item.id : null;
    document.getElementById('modalTitle').textContent = item ? 'تعديل منتج' : 'منتج جديد';
    document.getElementById('pName').value = item?.name || '';
    document.getElementById('pCategory').value = item?.category || '';
    document.getElementById('pQty').value = item?.quantity ?? '';
    document.getElementById('pUnit').value = item?.unit || 'وحدة';
    document.getElementById('pMin').value = item?.minQuantity ?? 0;
    document.getElementById('prodModal').classList.add('is-open');
  }

  function closeModal() {
    document.getElementById('prodModal').classList.remove('is-open');
    editId = null;
  }

  function save() {
    const name = document.getElementById('pName').value.trim();
    const category = document.getElementById('pCategory').value.trim();
    const quantity = Utils.num(document.getElementById('pQty').value);
    const unit = document.getElementById('pUnit').value.trim() || 'وحدة';
    const minQuantity = Utils.num(document.getElementById('pMin').value);

    if (!name) {
      alert('اسم المنتج مطلوب');
      return;
    }

    const list = getAll();
    if (editId) {
      const i = list.findIndex(p => p.id === editId);
      if (i >= 0) list[i] = { ...list[i], name, category, quantity, unit, minQuantity };
    } else {
      list.push({ id: Utils.uid('P'), name, category, quantity, unit, minQuantity });
    }
    saveAll(list);
    closeModal();
    render();
  }

  function remove(id) {
    if (!confirm('حذف هذا المنتج؟')) return;
    saveAll(getAll().filter(p => p.id !== id));
    render();
  }

  function init() {
    if (!App.Auth.guard()) return;
    render();

    document.getElementById('btnAddProd')?.addEventListener('click', () => openModal(null));
    document.getElementById('btnSaveProd')?.addEventListener('click', save);
    document.getElementById('btnCancelProd')?.addEventListener('click', closeModal);
    document.getElementById('prodModal')?.addEventListener('click', e => {
      if (e.target.id === 'prodModal') closeModal();
    });
    document.getElementById('searchProd')?.addEventListener('input', render);

    document.getElementById('prodBody')?.addEventListener('click', e => {
      const edit = e.target.closest('[data-edit]');
      const del = e.target.closest('[data-del]');
      if (edit) {
        const item = getAll().find(p => p.id === edit.dataset.edit);
        if (item) openModal(item);
      }
      if (del) remove(del.dataset.del);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
