/* =========================================================
   Manager App — Lightweight Canvas Chart
   بديل خفيف عن Chart.js بدون أي تبعيات خارجية
   الاستخدام:
     App.Chart.drawLine(canvas, {
       labels: ['السبت','الأحد', ...],
       series: [{ name:'مداخيل', values:[...], color:'#16a34a' }]
     });
   ========================================================= */

(function (window) {
  'use strict';

  function drawLine(canvas, opts) {
    if (!canvas || !canvas.getContext) return;

    const {
      labels = [],
      series = [],
      padL = 52, padR = 16, padT = 20, padB = 34,
    } = opts || {};

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width  = Math.round(rect.width  * dpr);
    canvas.height = Math.round(rect.height * dpr);

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const W = rect.width, H = rect.height;
    const cw = W - padL - padR;
    const ch = H - padT - padB;

    /* ---- الألوان من الثيم الحالي ---- */
    const css     = getComputedStyle(document.documentElement);
    const border  = css.getPropertyValue('--border').trim()       || '#e5e7eb';
    const muted   = css.getPropertyValue('--muted').trim()         || '#8794a8';
    const bgElev  = css.getPropertyValue('--bg-elev').trim()       || '#fff';

    /* ---- حساب النطاق ---- */
    let max = 0, min = 0;
    series.forEach(s => s.values.forEach(v => {
      if (v > max) max = v;
      if (v < min) min = v;
    }));
    if (max === 0 && min === 0) max = 100;

    const pad = (max - min) * 0.12 || 10;
    max += pad;
    if (min < 0) min -= pad;

    const range = (max - min) || 1;
    const N = labels.length;

    const X = i => padL + (N > 1 ? (cw * i) / (N - 1) : cw / 2);
    const Y = v => padT + ch - ((v - min) / range) * ch;

    /* ---- الشبكة الأفقية + محور Y ---- */
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.font = '11px Cairo, sans-serif';
    ctx.fillStyle = muted;
    ctx.textAlign = 'end';
    ctx.textBaseline = 'middle';

    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const v = min + (range * (steps - i)) / steps;
      const y = padT + (ch * i) / steps;

      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + cw, y);
      ctx.stroke();

      ctx.fillText(formatShort(v), padL - 8, y);
    }

    /* ---- محور X ---- */
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    labels.forEach((lbl, i) => {
      ctx.fillText(lbl, X(i), padT + ch + 9);
    });

    /* ---- خط الصفر عند وجود قيم سالبة ---- */
    if (min < 0 && max > 0) {
      const y0 = Y(0);
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = muted;
      ctx.beginPath();
      ctx.moveTo(padL, y0);
      ctx.lineTo(padL + cw, y0);
      ctx.stroke();
      ctx.restore();
    }

    /* ---- رسم كل سلسلة ---- */
    series.forEach(s => {
      const color = s.color || '#2563eb';
      const values = s.values;

      /* تعبئة متدرجة */
      const grad = ctx.createLinearGradient(0, padT, 0, padT + ch);
      grad.addColorStop(0, hexA(color, 0.28));
      grad.addColorStop(1, hexA(color, 0));

      /* المسار */
      ctx.beginPath();
      values.forEach((v, i) => {
        const x = X(i), y = Y(v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = color;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();

      /* تعبئة أسفل الخط */
      if (s.fill !== false && values.length > 1) {
        const last = values.length - 1;
        ctx.lineTo(X(last), padT + ch);
        ctx.lineTo(X(0), padT + ch);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
      }

      /* النقاط */
      values.forEach((v, i) => {
        const x = X(i), y = Y(v);
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = bgElev;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        ctx.stroke();
      });
    });
  }

  /* ---- تحويل لون HEX إلى RGBA بشفافية ---- */
  function hexA(hex, a) {
    if (!hex) return `rgba(37,99,235,${a})`;
    if (hex.startsWith('rgb')) return hex;
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const n = parseInt(full, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8)  & 255;
    const b = n & 255;
    return `rgba(${r},${g},${b},${a})`;
  }

  /* ---- تنسيق مختصر للأرقام على المحور ---- */
  function formatShort(v) {
    const abs = Math.abs(v);
    if (abs >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (abs >= 1000)      return (v / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return Math.round(v).toString();
  }

  window.App = window.App || {};
  window.App.Chart = { drawLine };

})(window);