/* UI · 인생 무대 — 나와 함께 나이 드는 캐릭터.
   나이(아기→학생→어른→노인), 지금 하는 일(교복·정장·가운·작업복…), 있는 곳(집·학교·회사·병원·공원…),
   곁에 있는 사람(부모·연인·배우자·아이·반려동물), 기분(표정)을 그때그때의 상태에서 그린다.
   그림 파일 없이 SVG 부품을 조합한다. 결과가 나오면 반응(점프·주저앉기)과 짧은 연출(꽃가루·하트·비…)을 보여 준다. */
(function (LG) {
  'use strict';
  const K = LG.UIK;
  const { $ } = K;
  const S = LG.State;

  const W = 360, GROUND = 82;
  const SKIN = '#f3c9a5', SKIN_S = '#e2ad86';
  const HAIR = { young: '#2b2125', brown: '#4a3426', gray: '#b9b4b0', white: '#e6e2de' };

  // 시드로 정해지는 '나만의 색' (같은 인생은 같은 옷 색)
  const hue = p => { let h = 0; for (const c of String(p.seed)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 360; };

  // ───────────── 옷차림 ─────────────
  function outfitOf(p) {
    const a = p.age, j = p.job ? p.job.id : null, h = hue(p);
    const casual = `hsl(${h} 55% 58%)`;
    if (a < 7) return { top: `hsl(${h} 70% 70%)`, pants: `hsl(${(h + 40) % 360} 45% 55%)` };
    if (p.status === 'military') return { top: '#5b6b3e', pants: '#4b5833', hat: 'helmet' };
    if (a < 19 && !j) return { top: '#24345e', pants: '#2c2c3a', tie: '#b23a48', bag: true };
    if (p.status === 'college' || p.status === 'grad' || p.status === 'retake') return { top: casual, pants: '#3a4a6b', bag: true, hood: true };
    if (j) {
      if (['doctor', 'nurse'].indexOf(j) >= 0) return { top: '#f4f6f8', pants: '#5d86a8', coat: true, steth: true };
      if (['office_big', 'office_small', 'civil', 'lawyer', 'ceo'].indexOf(j) >= 0) return { top: '#2f3446', pants: '#262a38', shirt: true, tie: j === 'ceo' ? '#c79a3a' : '#3f6fb5' };
      if (['technician', 'factory', 'driver'].indexOf(j) >= 0) return { top: '#3d6fa8', pants: '#33557f', hat: j === 'technician' ? 'hardhat' : null, overall: true };
      if (['cook', 'service'].indexOf(j) >= 0) return { top: '#f1ece3', pants: '#33333f', apron: j === 'cook' ? '#ffffff' : '#c75b3a', hat: j === 'cook' ? 'chef' : null };
      if (j === 'farmer') return { top: '#8a6a3a', pants: '#4f5b3a', hat: 'straw' };
      if (['athlete', 'coach'].indexOf(j) >= 0) return { top: '#d64545', pants: '#f0f0f0', jersey: true };
      if (['artist', 'musician', 'writer', 'designer'].indexOf(j) >= 0) return { top: casual, pants: '#3a3240', hat: j === 'artist' ? 'beret' : null };
      if (['idol', 'entertainer'].indexOf(j) >= 0) return { top: '#c9a0ff', pants: '#2b2140', sparkle: true };
      if (j === 'teacher') return { top: `hsl(${h} 35% 60%)`, pants: '#3a3a48', shirt: true };
      if (j === 'homemaker') return { top: casual, pants: '#4a4a58', apron: '#f2b8a0' };
      return { top: casual, pants: '#34405a' };
    }
    if (p.status === 'retired' || a >= 65) return { top: `hsl(${h} 25% 62%)`, pants: '#585560', cardigan: true };
    if (p.status === 'recluse') return { top: '#3a3a44', pants: '#2d2d35', hood: true };
    if (p.status === 'idle') return { top: '#e8d8b0', pants: '#2b2b33', shirt: true };
    return { top: '#8b8f9c', pants: '#3b3f4c' };
  }

  // ───────────── 표정 ─────────────
  function face(mood, y, old, closed) {
    const ey = y - 1;
    const eyes = closed ? `<path d="M-5 ${ey}h3M2 ${ey}h3" stroke="#2a2230" stroke-width="1.3" stroke-linecap="round"/>`
      : `<circle cx="-3.5" cy="${ey}" r="1.3" fill="#2a2230"/><circle cx="3.5" cy="${ey}" r="1.3" fill="#2a2230"/>`;
    const m = mood === 'happy' ? `<path d="M-3 ${y + 3} Q0 ${y + 6} 3 ${y + 3}" stroke="#7a3b3b" stroke-width="1.3" fill="none" stroke-linecap="round"/>`
      : mood === 'sad' ? `<path d="M-3 ${y + 5} Q0 ${y + 2.5} 3 ${y + 5}" stroke="#5a3b3b" stroke-width="1.3" fill="none" stroke-linecap="round"/>`
        : `<path d="M-2.5 ${y + 4}h5" stroke="#5a3b3b" stroke-width="1.3" stroke-linecap="round"/>`;
    const blush = mood === 'happy' ? `<circle cx="-6" cy="${y + 2}" r="1.6" fill="#f08a8a" opacity=".45"/><circle cx="6" cy="${y + 2}" r="1.6" fill="#f08a8a" opacity=".45"/>` : '';
    const glasses = old ? `<g stroke="#5a5050" stroke-width=".9" fill="none"><circle cx="-3.5" cy="${ey}" r="2.6"/><circle cx="3.5" cy="${ey}" r="2.6"/><path d="M-1 ${ey}h2"/></g>` : '';
    return eyes + m + blush + glasses;
  }

  // ───────────── 사람 한 명 (발끝이 (0,0)) ─────────────
  // o: { g:'M'|'F', age, outfit, mood, hair, walk, me, sweat, sad }
  function person(o) {
    const a = o.age, of = o.outfit || { top: '#8b8f9c', pants: '#3b3f4c' };
    if (a < 3) return baby(o);
    const kid = a < 13, old = a >= 66;
    const s = a < 7 ? 0.6 : kid ? 0.74 : a < 16 ? 0.88 : 1;
    const hairC = old ? (a >= 80 ? HAIR.white : HAIR.gray) : a >= 52 ? '#6d625d' : o.g === 'F' ? HAIR.brown : HAIR.young;
    const bend = old && a >= 75 ? 6 : 0;
    const hy = -47;
    let hair;
    if (o.g === 'F') hair = old ? `<circle cx="0" cy="${hy - 9}" r="5" fill="${hairC}"/><path d="M-10 ${hy} Q-10 ${hy - 12} 0 ${hy - 12} Q10 ${hy - 12} 10 ${hy} L10 ${hy - 3} Q0 ${hy - 8} -10 ${hy - 3}Z" fill="${hairC}"/>`
      : `<path d="M-11 ${hy + 9} Q-12 ${hy - 13} 0 ${hy - 12} Q12 ${hy - 13} 11 ${hy + 9} L8 ${hy + 9} L8 ${hy - 2} Q0 ${hy - 7} -8 ${hy - 2} L-8 ${hy + 9}Z" fill="${hairC}"/>`;
    else hair = old && a >= 72 ? `<path d="M-10 ${hy - 1} Q-9 ${hy - 6} -6 ${hy - 6} L-6 ${hy - 2}Z M10 ${hy - 1} Q9 ${hy - 6} 6 ${hy - 6} L6 ${hy - 2}Z" fill="${hairC}"/>`
      : `<path d="M-10 ${hy - 1} Q-10 ${hy - 12} 0 ${hy - 11} Q10 ${hy - 12} 10 ${hy - 1} Q5 ${hy - 6} -3 ${hy - 6} Q-8 ${hy - 6} -10 ${hy - 1}Z" fill="${hairC}"/>`;
    const hat = of.hat === 'helmet' ? `<path d="M-11 ${hy - 2} Q-11 ${hy - 14} 0 ${hy - 14} Q11 ${hy - 14} 11 ${hy - 2}Z" fill="#4b5833"/>`
      : of.hat === 'hardhat' ? `<path d="M-11 ${hy - 3} Q-10 ${hy - 14} 0 ${hy - 14} Q10 ${hy - 14} 11 ${hy - 3}Z" fill="#f2c230"/><rect x="-13" y="${hy - 4}" width="26" height="2.5" rx="1" fill="#e0ad1c"/>`
        : of.hat === 'chef' ? `<rect x="-7" y="${hy - 20}" width="14" height="10" rx="5" fill="#fff"/><rect x="-8" y="${hy - 12}" width="16" height="4" fill="#f4f4f4"/>`
          : of.hat === 'straw' ? `<ellipse cx="0" cy="${hy - 7}" rx="15" ry="3" fill="#d9b765"/><path d="M-7 ${hy - 7} Q0 ${hy - 17} 7 ${hy - 7}Z" fill="#e3c57a"/>`
            : of.hat === 'beret' ? `<ellipse cx="2" cy="${hy - 10}" rx="10" ry="4" fill="#7a2d3c"/>` : '';
    const body = `<rect x="-9" y="-38" width="18" height="22" rx="6" fill="${of.top}"/>` +
      (of.coat ? `<path d="M-9 -34 L0 -22 L9 -34 L9 -16 L-9 -16Z" fill="#ffffff" opacity=".85"/><path d="M0 -38v22" stroke="#c9d2da" stroke-width="1"/>` : '') +
      (of.shirt ? `<path d="M-4 -38 L0 -32 L4 -38Z" fill="#f4f4f4"/>` : '') +
      (of.tie ? `<path d="M0 -36 L-1.6 -33 L0 -24 L1.6 -33Z" fill="${of.tie}"/>` : '') +
      (of.steth ? `<path d="M-5 -36 Q-6 -27 0 -27 Q6 -27 5 -36" stroke="#5b6b7a" stroke-width="1.2" fill="none"/>` : '') +
      (of.apron ? `<rect x="-7" y="-30" width="14" height="15" rx="2" fill="${of.apron}"/>` : '') +
      (of.overall ? `<rect x="-6" y="-31" width="12" height="9" rx="2" fill="#2c5486"/>` : '') +
      (of.jersey ? `<text x="0" y="-23" font-size="8" font-weight="800" text-anchor="middle" fill="#fff">${(hueNum(o) % 89) + 10}</text>` : '') +
      (of.cardigan ? `<path d="M0 -38v22" stroke="rgba(0,0,0,.18)" stroke-width="1.5"/><circle cx="1.8" cy="-31" r=".9" fill="#fff"/><circle cx="1.8" cy="-26" r=".9" fill="#fff"/>` : '') +
      (of.sparkle ? `<text x="0" y="-24" font-size="8" text-anchor="middle">✨</text>` : '') +
      (of.hood ? `<path d="M-9 -38 Q0 -33 9 -38" stroke="rgba(0,0,0,.2)" stroke-width="2" fill="none"/>` : '');
    const bag = of.bag ? `<rect x="-14" y="-36" width="7" height="13" rx="2.5" fill="${a < 19 ? '#e0574f' : '#4b4b5a'}"/>` : '';
    const legs = `<g class="legs"><rect class="leg l" x="-7" y="-18" width="5" height="18" rx="2.2" fill="${of.pants}"/><rect class="leg r" x="2" y="-18" width="5" height="18" rx="2.2" fill="${of.pants}"/></g>`;
    const arms = `<rect class="arm l" x="-13" y="-36" width="4.5" height="16" rx="2.2" fill="${of.top}"/><rect class="arm r" x="8.5" y="-36" width="4.5" height="16" rx="2.2" fill="${of.top}"/>`;
    const cane = old && a >= 72 ? `<path d="M15 -22 L17 0 M15 -22 Q15 -26 11 -25" stroke="#7a5a3a" stroke-width="2" fill="none" stroke-linecap="round"/>` : '';
    const sweat = o.sweat ? `<path d="M11 ${hy - 4} q2 3 0 5 q-2 -2 0 -5Z" fill="#8fd3ff"/>` : '';
    const head = `<g class="head"><circle cx="0" cy="${hy}" r="10" fill="${SKIN}"/>${hair}<circle cx="-10" cy="${hy + 1}" r="2" fill="${SKIN_S}"/><circle cx="10" cy="${hy + 1}" r="2" fill="${SKIN_S}"/>${face(o.mood, hy, old && a >= 70, o.closed)}${hat}${sweat}</g>`;
    const upper = `<g class="upper" transform="rotate(${bend} 0 -18)">${bag}${arms}${body}${head}</g>`;
    return `<g class="pz${o.me ? ' me' : ''}${o.walk ? ' walking' : ''}" transform="scale(${s})">${legs}${upper}${cane}</g>`;
  }
  const hueNum = o => (o.age * 7 + (o.g === 'F' ? 3 : 0));

  function baby(o) {
    // 유모차에 탄 아기 (0~2세)
    return `<g class="pz baby${o.me ? ' me' : ''}"><circle cx="-8" cy="-4" r="4" fill="#3b3b48"/><circle cx="10" cy="-4" r="4" fill="#3b3b48"/>
      <path d="M-14 -10 L16 -10 L12 -26 Q0 -34 -12 -26Z" fill="${(o.outfit || {}).top || '#9ad'}"/><path d="M-14 -10 Q-12 -32 6 -32" stroke="rgba(0,0,0,.2)" stroke-width="2" fill="none"/>
      <path d="M16 -10 L22 -26" stroke="#3b3b48" stroke-width="2"/>
      <g class="head"><circle cx="2" cy="-24" r="6.5" fill="${SKIN}"/><circle cx="0" cy="-25" r="1" fill="#2a2230"/><circle cx="4" cy="-25" r="1" fill="#2a2230"/>${o.mood === 'sad' ? `<path d="M0 -20.5 Q2 -22 4 -20.5" stroke="#7a3b3b" stroke-width="1" fill="none"/>` : `<path d="M0 -21.5 Q2 -19.5 4 -21.5" stroke="#7a3b3b" stroke-width="1" fill="none"/>`}</g></g>`;
  }

  function pet(kind) {
    if (kind === 'cat') return `<g class="pz pet"><ellipse cx="0" cy="-6" rx="9" ry="5" fill="#d9a066"/><circle cx="8" cy="-11" r="4.5" fill="#d9a066"/><path d="M5 -14 L6 -18 L8 -15Z M9 -15 L11 -18 L11.5 -14Z" fill="#d9a066"/><path d="M-9 -7 Q-15 -14 -11 -18" stroke="#d9a066" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="9.5" cy="-11.5" r=".8" fill="#2a2230"/></g>`;
    return `<g class="pz pet"><ellipse cx="0" cy="-7" rx="10" ry="5.5" fill="#f3e2c7"/><circle cx="9" cy="-12" r="5" fill="#f3e2c7"/><ellipse cx="6" cy="-13" rx="2" ry="4" fill="#c79a6a"/><rect x="-7" y="-4" width="3" height="4" fill="#f3e2c7"/><rect x="4" y="-4" width="3" height="4" fill="#f3e2c7"/><path d="M-10 -8 Q-15 -12 -13 -15" stroke="#f3e2c7" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="11" cy="-13" r=".9" fill="#2a2230"/></g>`;
  }

  // ───────────── 배경: 지금 있는 곳 ─────────────
  function placeOf(p) {
    const dz = p.dz || {};
    if ((dz.cancer && ['dx', 'untreated', 'partial', 'terminal'].indexOf(dz.cancer.status) >= 0) || (dz.stroke && dz.stroke.status === 'disabled') || p.stats.health < 25) return 'hospital';
    if (p.liveIn === 'abroad' || p.status === 'abroad') return 'abroad';
    if (p.status === 'military') return 'barracks';
    if (p.age < 7) return 'home';
    if (p.age < 19 && !p.job) return 'school';
    if (['college', 'grad', 'retake'].indexOf(p.status) >= 0) return 'campus';
    if (p.job) {
      const j = p.job.id;
      if (['doctor', 'nurse'].indexOf(j) >= 0) return 'hospital';
      if (['technician', 'factory'].indexOf(j) >= 0) return 'factory';
      if (j === 'farmer') return 'farm';
      if (['cook', 'service', 'selfemp'].indexOf(j) >= 0) return 'shop';
      if (['athlete', 'coach'].indexOf(j) >= 0) return 'field';
      return 'city';
    }
    if (p.status === 'retired' || p.age >= 65) return 'park';
    return 'street';
  }
  const SIL = 'rgba(255,255,255,.13)', SIL2 = 'rgba(255,255,255,.08)';
  function backdrop(place, p) {
    const g = `<path d="M0 ${GROUND} H${W}" stroke="rgba(255,255,255,.22)" stroke-width="1.5"/>`;
    const win = (x, y, w, h, n) => Array.from({ length: n }, (_, i) => `<rect x="${x + 4 + (i % 3) * ((w - 8) / 3)}" y="${y + 6 + Math.floor(i / 3) * 10}" width="${(w - 8) / 3 - 3}" height="5" rx="1" fill="rgba(255,248,200,.18)"/>`).join('');
    let b = '';
    switch (place) {
      case 'home': b = `<path d="M250 ${GROUND} V46 L280 26 L310 46 V${GROUND}Z" fill="${SIL}"/><rect x="270" y="58" width="14" height="24" fill="${SIL2}"/><rect x="290" y="52" width="12" height="10" fill="rgba(255,248,200,.2)"/>`; break;
      case 'school': b = `<rect x="215" y="34" width="120" height="48" fill="${SIL}"/><rect x="262" y="20" width="26" height="16" fill="${SIL}"/><circle cx="275" cy="28" r="5" fill="rgba(255,255,255,.25)"/>${win(215, 36, 120, 48, 9)}`; break;
      case 'campus': b = `<rect x="200" y="40" width="140" height="42" fill="${SIL}"/><path d="M200 40 L270 18 L340 40Z" fill="${SIL}"/>${[215, 245, 295, 325].map(x => `<rect x="${x}" y="44" width="6" height="38" fill="${SIL2}"/>`).join('')}`; break;
      case 'barracks': b = `<path d="M200 ${GROUND} L235 52 L270 ${GROUND}Z M260 ${GROUND} L295 52 L330 ${GROUND}Z" fill="${SIL}"/><path d="M340 ${GROUND} V24" stroke="${SIL}" stroke-width="2"/><rect x="340" y="24" width="16" height="10" fill="rgba(255,255,255,.18)"/>`; break;
      case 'city': b = `<rect x="190" y="30" width="38" height="52" fill="${SIL}"/>${win(190, 30, 38, 52, 12)}<rect x="234" y="12" width="44" height="70" fill="${SIL}"/>${win(234, 12, 44, 70, 18)}<rect x="284" y="38" width="34" height="44" fill="${SIL2}"/><rect x="322" y="24" width="30" height="58" fill="${SIL}"/>`; break;
      case 'factory': b = `<path d="M200 ${GROUND} V48 L230 36 V48 L260 36 V48 L290 36 V${GROUND}Z" fill="${SIL}"/><rect x="300" y="18" width="12" height="64" fill="${SIL}"/><circle class="smoke" cx="306" cy="12" r="5" fill="rgba(255,255,255,.12)"/>`; break;
      case 'hospital': b = `<rect x="220" y="26" width="110" height="56" fill="${SIL}"/>${win(220, 26, 110, 56, 12)}<rect x="267" y="8" width="16" height="16" rx="2" fill="rgba(255,255,255,.22)"/><path d="M275 11 v10 M270 16 h10" stroke="#e96a6a" stroke-width="3"/>`; break;
      case 'farm': b = `<path d="M180 ${GROUND} Q250 60 360 66 V${GROUND}Z" fill="${SIL2}"/>${[200, 222, 244, 266, 288, 310, 332].map(x => `<path d="M${x} ${GROUND} q2 -10 0 -16 M${x} ${GROUND - 8} q-5 -3 -6 -8 M${x} ${GROUND - 10} q5 -3 6 -8" stroke="rgba(170,230,150,.35)" stroke-width="1.6" fill="none"/>`).join('')}`; break;
      case 'shop': b = `<rect x="230" y="40" width="100" height="42" fill="${SIL}"/><path d="M226 40 h108 l-6 -12 h-96Z" fill="rgba(255,180,150,.22)"/><rect x="246" y="52" width="40" height="22" fill="rgba(255,248,200,.18)"/><rect x="296" y="52" width="18" height="30" fill="${SIL2}"/>`; break;
      case 'field': b = `<rect x="200" y="62" width="150" height="20" fill="rgba(140,220,140,.12)"/><path d="M220 ${GROUND} V40 h40 V${GROUND}" stroke="${SIL}" stroke-width="2" fill="none"/><path d="M230 40 v8 h20 v-8" stroke="${SIL}" stroke-width="1" fill="none"/>`; break;
      case 'park': b = `${[230, 300].map(x => `<rect x="${x - 2}" y="54" width="4" height="28" fill="${SIL}"/><circle cx="${x}" cy="46" r="16" fill="${SIL}"/>`).join('')}<rect x="250" y="70" width="34" height="4" rx="1" fill="${SIL}"/><rect x="252" y="74" width="2" height="8" fill="${SIL}"/><rect x="280" y="74" width="2" height="8" fill="${SIL}"/>`; break;
      case 'abroad': b = `<path d="M210 ${GROUND} V40 L222 20 L234 40 V${GROUND}Z" fill="${SIL}"/><rect x="250" y="34" width="40" height="48" fill="${SIL}"/>${win(250, 34, 40, 48, 9)}<g class="plane"><path d="M300 22 l26 -4 l4 2 l-26 6Z M312 20 l-6 -8 h4 l9 7Z" fill="rgba(255,255,255,.35)"/></g>`; break;
      default: b = `<rect x="260" y="40" width="4" height="42" fill="${SIL}"/><rect x="246" y="36" width="34" height="14" rx="2" fill="${SIL}"/><text x="263" y="46" font-size="7" text-anchor="middle" fill="rgba(255,255,255,.4)">BUS</text><rect x="290" y="50" width="56" height="32" fill="${SIL2}"/>`;
    }
    // 내 집이 있으면 작은 집 하나
    const own = p.house && place !== 'home' ? `<g opacity=".9"><path d="M150 ${GROUND} V62 L166 50 L182 62 V${GROUND}Z" fill="rgba(255,220,180,.16)"/><rect x="162" y="70" width="7" height="12" fill="rgba(255,248,200,.22)"/></g>` : '';
    return `<g class="bd">${b}${own}</g>${g}`;
  }

  // ───────────── 무대 구성 ─────────────
  const moodOf = p => (p.happy >= 62 ? 'happy' : p.happy >= 38 ? 'calm' : 'sad');
  function cast(p) {
    const list = [];
    const me = { g: p.gender, age: p.age, outfit: outfitOf(p), mood: moodOf(p), me: true, sweat: p.stress >= 75 };
    list.push(me);
    if (p.age < 13) {
      // 어린 시절: 곁에 부모님(또는 조부모)
      LG.Rel.parents(p).slice(0, 2).forEach(n => list.push({ g: n.gender || (n.role === 'mother' ? 'F' : 'M'), age: n.age, outfit: { top: n.role === 'mother' ? '#b77ea8' : n.role === 'father' ? '#5a7ba8' : '#a39a8a', pants: '#3f3f4c', cardigan: n.age >= 60 }, mood: 'happy' }));
    } else {
      const sp = LG.Rel.get(p, 'spouse') || LG.Rel.get(p, 'partner');
      if (sp) list.push({ g: sp.gender, age: sp.age, outfit: { top: sp.role === 'spouse' ? '#d27a7a' : '#e59aa8', pants: '#3f3f4c', cardigan: sp.age >= 65 }, mood: sp.rel >= 55 ? 'happy' : sp.rel >= 35 ? 'calm' : 'sad', partner: true });
      LG.Rel.all(p, 'child').filter(c => c.age < 20).slice(0, 3).forEach(c => list.push({ g: c.gender, age: c.age, outfit: { top: c.gender === 'F' ? '#f2a6b8' : '#8ec5f0', pants: '#4a4a5a', bag: c.age >= 7 && c.age < 19 }, mood: c.rel >= 50 ? 'happy' : 'calm' }));
    }
    return list;
  }
  const petKind = p => (S.has(p, 'pet') ? ((hue(p) % 2) ? 'cat' : 'dog') : null);

  function sig(p) {
    const c = cast(p).map(x => [x.g, x.age < 3 ? 0 : x.age < 7 ? 1 : x.age < 13 ? 2 : x.age < 19 ? 3 : x.age < 52 ? 4 : x.age < 66 ? 5 : x.age < 72 ? 6 : x.age < 75 ? 7 : x.age < 80 ? 8 : 9, x.mood, x.sweat ? 1 : 0, JSON.stringify(x.outfit)].join(':')).join('|');
    return [c, placeOf(p), !!p.house, petKind(p)].join('#');
  }

  function draw(p) {
    const list = cast(p);
    const pk = petKind(p);
    // 배치: 나를 가운데 왼쪽에, 동반자는 옆으로
    const xs = [112, 146, 78, 180, 46];
    const figs = list.map((o, i) => `<g transform="translate(${xs[i] || 40 + i * 20} ${GROUND})"><g class="sway" style="animation-delay:${-i * 0.7}s">${person(o)}</g></g>`).join('');
    const petSvg = pk ? `<g transform="translate(${list.length > 3 ? 18 : list.length > 1 ? 50 : 146} ${GROUND})">${pet(pk)}</g>` : '';
    return `<svg viewBox="0 0 ${W} 92" preserveAspectRatio="xMidYMax meet" role="img" aria-label="${p.age}세의 나">
      ${backdrop(placeOf(p), p)}
      <g class="crowd">${figs}${petSvg}</g>
    </svg><div class="scene-fx"></div><div class="scene-bubble"></div>`;
  }

  let last = '';
  function update(force) {
    const el = $('#scene'), p = K.p;
    if (!el || !p) return;
    const on = LG.Storage.prefs().scene !== false;
    el.classList.toggle('off', !on);
    document.body.classList.toggle('scene-off', !on);
    if (!on) return;
    const s = sig(p);
    if (!force && s === last) return;
    last = s;
    el.innerHTML = draw(p);
  }

  // ───────────── 반응과 연출 ─────────────
  function react(kind) {
    const el = $('#scene'); if (!el || el.classList.contains('off')) return;
    el.classList.remove('r-success', 'r-fail', 'r-partial', 'r-mourn');
    void el.offsetWidth;
    el.classList.add('r-' + kind);
    clearTimeout(react._t); react._t = setTimeout(() => el.classList.remove('r-' + kind), 1900);
  }
  const FX = {
    confetti: { e: ['🎉', '✨', '🎊', '⭐'], n: 14, mode: 'burst' },
    hearts: { e: ['💖', '💕', '💗'], n: 10, mode: 'rise' },
    baby: { e: ['👶', '🍼', '✨', '💛'], n: 9, mode: 'rise' },
    coins: { e: ['💰', '🪙', '💵'], n: 12, mode: 'fall' },
    house: { e: ['🏠', '🔑', '✨'], n: 8, mode: 'rise' },
    rain: { e: ['💧'], n: 16, mode: 'fall', cloud: true },
    mourn: { e: ['🌸', '🕊️'], n: 9, mode: 'drift' },
    spark: { e: ['✨'], n: 6, mode: 'rise' },
    plane: { e: ['✈️', '🌏'], n: 4, mode: 'fly' },
    heartbreak: { e: ['💔'], n: 4, mode: 'fall', cloud: true },
    hospital: { e: ['💊', '🩹'], n: 5, mode: 'fall' },
    flower: { e: ['💐', '🌷', '🎓'], n: 8, mode: 'rise' }
  };
  function fx(kind, bubble) {
    const el = $('#scene'); if (!el || el.classList.contains('off')) return;
    const box = el.querySelector('.scene-fx'); const f = FX[kind]; if (!box || !f) return;
    box.innerHTML = '';
    if (f.cloud) box.insertAdjacentHTML('beforeend', '<span class="fx-cloud">☁️</span>');
    for (let i = 0; i < f.n; i++) {
      const s = document.createElement('span');
      s.className = 'fx-p ' + f.mode;
      s.textContent = f.e[i % f.e.length];
      const left = f.mode === 'fly' ? -10 : f.cloud ? 18 + Math.random() * 22 : 12 + Math.random() * 46;
      s.style.left = left + '%';
      s.style.animationDelay = (Math.random() * 0.5).toFixed(2) + 's';
      s.style.setProperty('--dx', ((Math.random() - 0.5) * 60).toFixed(0) + 'px');
      s.style.fontSize = (12 + Math.random() * 8).toFixed(0) + 'px';
      box.appendChild(s);
    }
    const b = el.querySelector('.scene-bubble');
    if (b) { b.textContent = bubble || ''; b.classList.toggle('show', !!bubble); clearTimeout(fx._b); fx._b = setTimeout(() => b.classList.remove('show'), 1900); }
    clearTimeout(fx._t); fx._t = setTimeout(() => { box.innerHTML = ''; }, 2600);
  }

  // 선택 결과 → 어떤 장면을 보여 줄까
  function forResult(ev, res) {
    const p = K.p, d = k => (res.deltas || []).find(x => x.k === k);
    const money = d('money') ? d('money').d : 0, hp = d('happy') ? d('happy').d : 0;
    const id = ev.id, cat = ev.cat, ok = res.type === 'success' || res.type === 'done';
    if (/divorce|이혼/.test((res.text || '') + (p.history[p.history.length - 1] || {}).t) && !LG.Rel.get(p, 'spouse') && cat === 'marriage') return ['heartbreak', '이별', 'fail'];
    if ((id === 'r_propose' || id === 'r_proposed') && LG.Rel.get(p, 'spouse')) return ['hearts', '결혼!', 'success'];
    if (id === 'k_child' && res.type === 'success') return ['baby', '임신!', 'success'];
    if (p.house && p.house.at === p.age && cat === 'housing') return ['house', '내 집!', 'success'];
    if (id === 'h_emigrate' || id === 'gl_wh' || id === 'gl_study_degree' || id === 'gl_job_abroad' || id === 'tr_travel') return ok ? ['plane', '떠난다!', 'success'] : ['rain', '', 'fail'];
    if (money >= 3000) return ['coins', '+' + LG.U.money(money), 'success'];
    if (money <= -3000) return ['rain', LG.U.money(money), 'fail'];
    if (res.type === 'success') {
      if (id === 't_csat' || id === 'u_major' || id === 'u_after_fail') return ['flower', '합격!', 'success'];
      if (cat === 'career' || cat === 'education' || cat === 'opportunity' || cat === 'altpath' || cat === 'sports') return ['confetti', '성공!', 'success'];
      if (cat === 'relationship' || cat === 'marriage') return ['hearts', '', 'success'];
      if (cat === 'health') return ['spark', '회복', 'success'];
      return ['spark', '', 'success'];
    }
    if (res.type === 'fail') return ['rain', '', 'fail'];
    if (res.type === 'partial') return ['spark', '', 'partial'];
    if (hp >= 8) return ['spark', '', 'success'];
    if (hp <= -8) return ['rain', '', 'fail'];
    return null;
  }
  // 알림 카드(큰 사건) → 장면
  function forCard(c, glad) {
    const t = (c.title || '') + ' ' + (c.text || ''), ic = c.icon || '';
    if (ic === '🕯️' || /세상을 떠/.test(t)) return ['mourn', '', 'mourn'];
    if (/태어났|새 식구/.test(t)) return ['baby', '안녕, 아가', 'success'];
    if (/인연|만나기 시작/.test(t)) return ['hearts', '두근', 'success'];
    if (/당첨|복권|로또|상속/.test(t)) return ['coins', '', 'success'];
    if (ic === '🚑' || /사고/.test(t)) return ['hospital', '', 'fail'];
    return glad ? ['spark', '', 'success'] : ['rain', '', 'fail'];
  }
  function play(spec) { if (!spec) return; fx(spec[0], spec[1]); react(spec[2]); }

  K.scene = { update, react, fx, play, forResult, forCard, outfitOf, placeOf, sig };
})(window.LG = window.LG || {});
