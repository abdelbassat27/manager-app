/* =========================================================
   Manager App — Sheep Module
   ========================================================= */
(function () {
  'use strict';

  const { Storage, Utils } = window.App;
  const KEY = 'sheep:animals';
  const esc = Utils.escapeHtml;

  const getAll = () => Storage.get(KEY, []);
  const saveAll = (arr) => Storage.set(KEY, arr);

  let editId = null;

  function render() {
    const body = document.getElementById('sheepBody');
    const q = (document.getElementById('searchSheep')?.value || '').trim().toLowerCase();
    if (!body) return;

    let list = getAll().slice();
    if (q) {
      list = list.filter(a =>
        (a.tag || '').toLowerCase().includes(q) ||
        (a.breed || '').toLowerCase().includes(q)
      );
    }

    const elCount = document.getElementById('sheepCount');
    if (elCount) elCount.textContent = String(getAll().length);

    if (!list.length) {
      body.innerHTML = `<tr><td colspan="7" class="table-empty"><p>لا توجد مواشي مسجّلة</p></td></tr>`;
      return;
    }

    body.innerHTML = list.map(a => {
      let vac = '—';
      if (a.nextVaccine) {
        const diff = (new Date(a.nextVaccine).getTime() - Date.now()) / 86400000;
        if (diff < 0) vac = `<span class="badge badge--danger">متأخر</span> ${Utils.date(a.nextVaccine)}`;
        else if (diff <= 7) vac = `<span class="badge badge--warning">قريب</span> ${Utils.date(a.nextVaccine)}`;
        else vac = Utils.date(a.nextVaccine);
      }
      return `
      <tr>
        <td class="cell-strong">${esc(a.tag || a.id)}</td>
        <td>${esc(a.breed || '—')}</td>
        <td>${esc(a.gender || '—')}</td>
        <td>${Utils.date(a.birthDate)}</td>
        <td>${a.weight != null ? Utils.num(a.weight) + ' كغ' : '—'}</td>
        <td>${vac}</td>
        <td class="t-end">
          <div class="row-actions">
            <button type="button" class="btn btn--ghost btn--sm" data-edit="${esc(a.id)}">تعديل</button>
            <button type="button" class="btn btn--danger-ghost btn--sm" data-del="${esc(a.id)}">حذف</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  function openModal(item) {
    editId = item ? item.id : null;
    document.getElementById('modalTitle').textContent = item ? 'تعديل رأس' : 'إضافة رأس';
    document.getElementById('sTag').value = item?.tag || '';
    document.getElementById('sBreed').value = item?.breed || '';
    document.getElementById('sGender').value = item?.gender || 'أنثى';
    document.getElementById('sBirth').value = item?.birthDate || '';
    document.getElementById('sWeight').value = item?.weight ?? '';
    document.getElementById('sVaccine').value = item?.nextVaccine || '';
    document.getElementById('sheepModal').classList.add('is-open');
  }

  function closeModal() {
    document.getElementById('sheepModal').classList.remove('is-open');
    editId = null;
  }

  function save() {
    const tag = document.getElementById('sTag').value.trim();
    const breed = document.getElementById('sBreed').value.trim();
    const gender = document.getElementById('sGender').value;
    const birthDate = document.getElementById('sBirth').value;
    const weight = Utils.num(document.getElementById('sWeight').value);
    const nextVaccine = document.getElementById('sVaccine').value || null;

    if (!tag) {
      alert('رقم الوسم مطلوب');
      return;
    }

    const list = getAll();
    if (editId) {
      const i = list.findIndex(a => a.id === editId);
      if (i >= 0) list[i] = { ...list[i], tag, breed, gender, birthDate, weight, nextVaccine };
    } else {
      list.push({ id: Utils.uid('S'), tag, breed, gender, birthDate, weight, nextVaccine });
    }
    saveAll(list);
    closeModal();
    render();
  }

  function remove(id) {
    if (!confirm('حذف هذا السجل؟')) return;
    saveAll(getAll().filter(a => a.id !== id));
    render();
  }

  function init() {
    if (!App.Auth.guard()) return;
    render();

    document.getElementById('btnAddSheep')?.addEventListener('click', () => openModal(null));
    document.getElementById('btnSaveSheep')?.addEventListener('click', save);
    document.getElementById('btnCancelSheep')?.addEventListener('click', closeModal);
    document.getElementById('sheepModal')?.addEventListener('click', e => {
      if (e.target.id === 'sheepModal') closeModal();
    });
    document.getElementById('searchSheep')?.addEventListener('input', render);

    document.getElementById('sheepBody')?.addEventListener('click', e => {
      const edit = e.target.closest('[data-edit]');
      const del = e.target.closest('[data-del]');
      if (edit) {
        const item = getAll().find(a => a.id === edit.dataset.edit);
        if (item) openModal(item);
      }
      if (del) remove(del.dataset.del);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
