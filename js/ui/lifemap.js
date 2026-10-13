/* UI · 인생 지도 — 엔딩에서 한 사람의 생애를 그래프로.
   위: 행복 · 관계 · 건강 (0~100, 한 축) / 아래: 순자산 (따로 그린다 — 단위가 다른 값을 한 그래프에 두 축으로 겹치지 않는다)
   그래프 아래 줄에는 인생의 큰 순간(결혼·출산·내 집·사별·은퇴·갈림길)을 아이콘으로 찍는다.
   색: 3계열 범주 팔레트(파랑·주황·청록, 밝은 종이 배경에서 색각 이상 구분 검증) + 선 모양(실선·파선·점선)과 끝 라벨로 이중 표시 */
(function (LG) {
  'use strict';
  const K = LG.UIK;
  const U = LG.U;
  const esc = s => K.esc(s);

  const SERIES = [
    { k: 'h', name: '행복', color: '#2a78d6', dash: '' },
    { k: 'r', name: '관계', color: '#eb6834', dash: '6 4' },
    { k: 'hl', name: '건강', color: '#1baf7a', dash: '1.5 3.5' }
  ];
  const MONEY_POS = '#6250d6', MONEY_NEG = '#e34948';
  const VB = { w: 320, h: 180, l: 26, r: 256, t: 12, b: 118 };

  // 생애의 큰 순간 — 연표에서 뽑는다 (같은 해 같은 종류는 하나만)
  function moments(p) {
    const out = [], seen = {};
    const add = (a, ic, t) => { const key = a + ic; if (seen[key]) return; seen[key] = 1; out.push({ a, ic, t }); };
    (p.history || []).forEach(h => {
      const t = h.t || '';
      if (h.k === 'birth') return;
      if (/결혼|청혼을 받아|혼인신고/.test(t) && !/결혼식에서|결혼식 사회|결혼했다\. 식장|자녀|이혼/.test(t) && (h.k === 'choice' || h.k === 'major')) add(h.a, '💍', t);
      else if (/^(첫째|둘째|셋째|넷째|다섯째).*태어났다|출생$/.test(t)) add(h.a, '👶', t);
      else if (/이혼/.test(t) && h.k !== 'minor') add(h.a, '💔', t);
      else if (/내 집 마련|집 마련|청약 당첨/.test(t)) add(h.a, '🏠', t);
      else if (/세상을 떠나셨다|먼저 세상을 떠났다|먼저 떠났다/.test(t)) add(h.a, '🕯️', t);
      else if (/^은퇴$|은퇴했|일을 내려놓았다|마지막 퇴근/.test(t)) add(h.a, '🌅', t);
      else if (/입사|취업|채용|임용|합격/.test(t) && h.k === 'choice' && !/불합격/.test(t)) add(h.a, '💼', t);
    });
    return out.sort((x, y) => x.a - y.a);
  }

  const smooth = (arr, k) => arr.map((v, i) => { const w = arr.slice(Math.max(0, i - k), i + k + 1); return w.reduce((a, b) => a + b, 0) / w.length; });

  function geometry(p) {
    const tr = (p.trace || []).filter(t => t.a != null);
    const a0 = tr.length ? tr[0].a : 0, a1 = Math.max(p.age, a0 + 1);
    const x = a => VB.l + (a - a0) / (a1 - a0) * (VB.r - VB.l);
    const y = v => VB.b - U.clamp(v, 0, 100) / 100 * (VB.b - VB.t);
    return { tr, a0, a1, x, y };
  }

  // 그래프 HTML (엔딩 카드 안)
  function html(p, e) {
    const G = geometry(p);
    if (G.tr.length < 3) return '';
    const { tr, a0, a1, x, y } = G;
    const ages = tr.map(t => t.a);
    // 축: 나이 눈금(20년마다) · 0/50/100 가로 보조선(옅게)
    const ticks = [];
    for (let a = Math.ceil(a0 / 20) * 20; a <= a1; a += 20) ticks.push(a);
    const grid = [0, 50, 100].map(v => `<line x1="${VB.l}" x2="${VB.r}" y1="${y(v)}" y2="${y(v)}" class="lm-grid"/><text x="${VB.l - 5}" y="${y(v) + 3}" class="lm-ax" text-anchor="end">${v}</text>`).join('') +
      ticks.map(a => `<text x="${x(a)}" y="${VB.b + 13}" class="lm-ax" text-anchor="middle">${a}세</text>`).join('');
    // 선 + 끝 라벨(겹치지 않게 위아래로 밀어 낸다)
    const ends = [];
    const lines = SERIES.map(s => {
      const vals = smooth(tr.map(t => t[s.k]), 1);
      const d = vals.map((v, i) => `${i ? 'L' : 'M'}${x(ages[i]).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
      ends.push({ s, y: y(vals[vals.length - 1]), v: Math.round(tr[tr.length - 1][s.k]) });
      return `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" ${s.dash ? `stroke-dasharray="${s.dash}"` : ''}/>`;
    }).join('');
    ends.sort((a, b) => a.y - b.y);
    for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 12) ends[i].y = ends[i - 1].y + 12;
    const labels = ends.map(o => `<g transform="translate(${VB.r + 6} ${o.y.toFixed(1)})"><line x1="0" x2="9" y1="0" y2="0" stroke="${o.s.color}" stroke-width="2" ${o.s.dash ? `stroke-dasharray="${o.s.dash === '6 4' ? '4 2' : '1.5 2'}"` : ''}/><text x="12" y="3.5" class="lm-lab">${o.s.name} ${o.v}</text></g>`).join('');
    // 큰 순간 아이콘 (같은 나이에 여러 개면 살짝 옆으로)
    const ms = moments(p).filter(m => m.a >= a0 && m.a <= a1);
    // 가까운 나이의 아이콘은 겹치지 않게 아랫줄로 내린다
    const rows = [[], [], []];
    const icons = ms.map(m => { const X = x(m.a); let r = rows.findIndex(row => row.every(v => Math.abs(v - X) >= 12)); if (r < 0) r = 2; rows[r].push(X); return `<text x="${X.toFixed(1)}" y="${VB.b + 32 + r * 14}" class="lm-ic" text-anchor="middle">${m.ic}</text>`; }).join('') +
      ms.map(m => `<line x1="${x(m.a)}" x2="${x(m.a)}" y1="${VB.t}" y2="${VB.b}" class="lm-mk"/>`).join('');
    // 갈림길: 그래프 위에 작은 점
    const cross = (e.cross || []).filter(c => c.a >= a0 && c.a <= a1).map(c => { const t = tr.find(z => z.a === c.a) || tr[tr.length - 1]; return `<circle cx="${x(c.a)}" cy="${y(t.h)}" r="4" fill="#fff" stroke="#2a2230" stroke-width="1.6"/>`; }).join('');
    // 순자산: 해마다 막대 (0 기준, 플러스·마이너스 다른 색)
    const ws = tr.map(t => t.w), MH = 54;
    const hiW = Math.max(0, ...ws), loW = Math.min(0, ...ws), sc = MH / ((hiW - loW) || 1);
    const zero = 18 + hiW * sc;
    const bw = Math.max(1.2, (VB.r - VB.l) / tr.length - 1);
    const bars = tr.map(t => { const h = Math.abs(t.w) * sc; return `<rect x="${(x(t.a) - bw / 2).toFixed(1)}" y="${(t.w >= 0 ? zero - h : zero).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0.5, h).toFixed(1)}" rx="${Math.min(2, bw / 2)}" fill="${t.w >= 0 ? MONEY_POS : MONEY_NEG}"/>`; }).join('');
    const peak = tr.reduce((m, t) => (t.w > m.w ? t : m), tr[0]);
    const moneySvg = `<svg class="lm-money" viewBox="0 0 ${VB.w} ${MH + 38}" role="img" aria-label="나이별 순자산">
      <line x1="${VB.l}" x2="${VB.r}" y1="${zero}" y2="${zero}" class="lm-zero"/>${bars}
      <text x="${VB.r + 6}" y="${zero + 3}" class="lm-ax">0</text>
      <text x="${x(peak.a)}" y="${Math.max(9, zero - Math.abs(peak.w) * sc - 5)}" class="lm-lab" text-anchor="middle">최고 ${esc(U.money(peak.w))}</text>
      <text x="${VB.l}" y="${MH + 34}" class="lm-ax">${a0}세</text><text x="${VB.r}" y="${MH + 34}" class="lm-ax" text-anchor="end">${a1}세 · ${esc(U.money(tr[tr.length - 1].w))}</text>
    </svg>`;
    const legend = SERIES.map(s => `<span><svg width="18" height="6"><line x1="1" x2="17" y1="3" y2="3" stroke="${s.color}" stroke-width="2.4" ${s.dash ? `stroke-dasharray="${s.dash === '6 4' ? '5 3' : '1.5 2.5'}"` : ''} stroke-linecap="round"/></svg>${s.name}</span>`).join('') + '<span><svg width="10" height="10"><circle cx="5" cy="5" r="3.5" fill="#fff" stroke="#2a2230" stroke-width="1.4"/></svg>갈림길</span>';
    return `<div class="lifemap" data-a0="${a0}" data-a1="${a1}">
      <p class="r-sec">인생 지도</p>
      <div class="lm-legend">${legend}</div>
      <div class="lm-plot">
        <svg class="lm-main" viewBox="0 0 ${VB.w} ${VB.h}" role="img" aria-label="나이별 행복·관계·건강">
          ${grid}${icons}${lines}${cross}${labels}
          <line class="lm-cross" x1="0" x2="0" y1="${VB.t}" y2="${VB.b}" style="display:none"/>
          <rect class="lm-hit" x="${VB.l - 6}" y="0" width="${VB.r - VB.l + 12}" height="${VB.b + 40}" fill="transparent"/>
        </svg>
        <div class="lm-tip" hidden></div>
      </div>
      <p class="lm-sub">순자산</p>
      ${moneySvg}
    </div>`;
  }

  // 손가락·마우스로 짚으면 그 나이의 숫자와 그해의 일
  function bind(root, p) {
    const box = root.querySelector('.lifemap'); if (!box) return;
    const svg = box.querySelector('.lm-main'), tip = box.querySelector('.lm-tip'), line = box.querySelector('.lm-cross'), hit = box.querySelector('.lm-hit');
    const G = geometry(p), ms = moments(p);
    const show = ev => {
      const r = svg.getBoundingClientRect();
      const vx = (ev.clientX - r.left) / r.width * VB.w;
      const a = Math.round(G.a0 + (vx - VB.l) / (VB.r - VB.l) * (G.a1 - G.a0));
      const t = G.tr.reduce((m, z) => (Math.abs(z.a - a) < Math.abs(m.a - a) ? z : m), G.tr[0]);
      const X = G.x(t.a);
      line.setAttribute('x1', X); line.setAttribute('x2', X); line.style.display = '';
      const m = ms.filter(z => z.a === t.a).map(z => `${z.ic} ${esc(z.t.slice(0, 26))}`);
      const h = (p.history || []).find(z => z.a === t.a && (z.k === 'major' || z.k === 'choice'));
      tip.innerHTML = `<b>${t.a}세</b>` + SERIES.map(s => `<span><i style="background:${s.color}"></i>${s.name} ${t[s.k]}</span>`).join('') + `<span>순자산 ${esc(U.money(t.w))}</span>` +
        (m.length ? `<em>${m.join('<br>')}</em>` : h ? `<em>${esc(h.t.slice(0, 30))}</em>` : '');
      tip.hidden = false;
      const px = X / VB.w * r.width;
      tip.style.left = Math.max(0, Math.min(r.width - tip.offsetWidth, px - tip.offsetWidth / 2)) + 'px';
    };
    const hide = () => { tip.hidden = true; line.style.display = 'none'; };
    hit.addEventListener('pointermove', show);
    hit.addEventListener('pointerdown', show);
    hit.addEventListener('pointerleave', hide);
  }

  // 공유 이미지(캔버스)에 같은 그래프를 그린다
  function canvas(x, p, X, Y, Wd, Ht, font) {
    const G = geometry(p);
    if (G.tr.length < 3) return false;
    const { tr, a0, a1 } = G;
    const px = a => X + (a - a0) / (a1 - a0) * (Wd - 120);
    const py = v => Y + Ht - U.clamp(v, 0, 100) / 100 * Ht;
    x.save();
    x.strokeStyle = 'rgba(42,34,48,.12)'; x.lineWidth = 2;
    [0, 50, 100].forEach(v => { x.beginPath(); x.moveTo(X, py(v)); x.lineTo(X + Wd - 120, py(v)); x.stroke(); });
    const ends = [];
    SERIES.forEach(s => {
      const vals = smooth(tr.map(t => t[s.k]), 1);
      x.beginPath(); x.strokeStyle = s.color; x.lineWidth = 5; x.lineJoin = 'round'; x.lineCap = 'round';
      x.setLineDash(s.dash ? s.dash.split(' ').map(n => n * 2.4) : []);
      vals.forEach((v, i) => { const xx = px(tr[i].a), yy = py(v); if (i) x.lineTo(xx, yy); else x.moveTo(xx, yy); });
      x.stroke();
      ends.push({ s, y: py(vals[vals.length - 1]), v: Math.round(tr[tr.length - 1][s.k]) });
    });
    x.setLineDash([]);
    ends.sort((a, b) => a.y - b.y);
    for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 30) ends[i].y = ends[i - 1].y + 30;
    x.font = `700 24px ${font}`; x.textAlign = 'left';
    ends.forEach(o => { x.fillStyle = o.s.color; x.fillRect(X + Wd - 110, o.y - 3, 20, 6); x.fillStyle = '#2a2230'; x.fillText(`${o.s.name} ${o.v}`, X + Wd - 84, o.y + 8); });
    x.font = `22px ${font}`; x.textAlign = 'center';
    const rows = [[], []];
    moments(p).forEach(m => { if (m.a < a0 || m.a > a1) return; const X = px(m.a); let r = rows.findIndex(row => row.every(v => Math.abs(v - X) >= 30)); if (r < 0) r = 1; rows[r].push(X); x.fillText(m.ic, X, Y + Ht + 34 + r * 30); });
    x.fillStyle = '#6b6070'; x.font = `500 20px ${font}`;
    x.textAlign = 'left'; x.fillText(`${a0}세`, X, Y + Ht + 92); x.textAlign = 'right'; x.fillText(`${a1}세`, X + Wd - 120, Y + Ht + 92);
    x.restore();
    return true;
  }

  K.lifemap = { html, bind, canvas, moments };
})(window.LG = window.LG || {});
