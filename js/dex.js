/* Dex — 다회차 수집 요소(인생 도감)와 오늘의 인생(일일 시드). DOM 없음 → 시뮬레이터에서도 사용 가능.
   한 판이 끝날 때 record() 로 엔딩 칭호 · 한 줄 평 · 직업 · 업적을 모은다. 저장은 LG.Storage 가 맡는다. */
(function (LG) {
  'use strict';
  const has = (p, f) => Object.prototype.hasOwnProperty.call(p.flags, f);

  // 업적 · 희귀한 인생 (도감에 이름과 조건이 보이고, 이룬 것만 밝게 표시된다)
  const ACH = [
    { k: 'ext_poor', icon: '🧱', name: '맨손의 시작', desc: '극빈 가정에서 태어났다', test: p => p.family.ext < 0 },
    { k: 'ext_rich', icon: '🏰', name: '금수저', desc: '재벌·자산가 가문에서 태어났다', test: p => p.family.ext > 0 },
    { k: 'genius', icon: '🌟', name: '시대의 천재', desc: '천재로 태어나 세상이 알아봤다', test: p => !!p.prodigy && p.found.indexOf(p.prodigy) >= 0 },
    { k: 'gifted', icon: '🌠', name: '수재', desc: '수재 재능을 일찍 꽃피웠다', test: p => p.talents.some(t => (p.tgrade || {})[t] === 'gifted' && p.found.indexOf(t) >= 0) },
    { k: 'blocked', icon: '🎻', name: '접어 둔 재능', desc: '사정 때문에 재능을 접어야 했다', test: p => Object.keys(p.blocked || {}).length > 0 },
    { k: 'rags', icon: '📈', name: '개천의 용', desc: '어려운 집에서 태어나 순자산 10억을 넘겼다', test: (p, e) => p.family.tier <= 2 && e.net >= 100000 },
    { k: 'rich', icon: '💎', name: '자산가', desc: '순자산 30억을 넘겼다', test: (p, e) => e.net >= 300000 },
    { k: 'happy', icon: '🌈', name: '행복한 사람', desc: '행복 점수 85 이상으로 생을 마쳤다', test: (p, e) => e.s.happy >= 85 },
    { k: 'bonds', icon: '🤝', name: '사람 부자', desc: '관계 점수 85 이상', test: (p, e) => e.s.rel >= 85 },
    { k: 'grade', icon: '🏅', name: '충만한 인생', desc: '종합 등급 "충만한 인생"을 받았다', test: (p, e) => e.total >= 72 },
    { k: 'centenarian', icon: '🎂', name: '백 세 인생', desc: '100세를 넘겨 살았다', test: p => p.age >= 100 },
    { k: 'short', icon: '🕯️', name: '짧았던 생', desc: '40세 이전에 세상을 떠났다', test: p => p.age < 40 },
    { k: 'big_family', icon: '👨‍👩‍👧‍👦', name: '대가족', desc: '자녀 셋 이상을 키웠다', test: (p, e) => e.kids >= 3 },
    { k: 'abroad', icon: '🛫', name: '이방인', desc: '해외에 뿌리를 내렸다', test: p => has(p, 'emigrated') },
    { k: 'study_abroad', icon: '🎓', name: '유학파', desc: '해외에서 학위를 받았다', test: p => has(p, 'study_abroad') },
    { k: 'second_act', icon: '🔁', name: '두 번째 기회', desc: '못 이룬 꿈에 다시 도전해 이뤘다', test: p => has(p, 'second_act') },
    { k: 'stood_up', icon: '⚖️', name: '침묵하지 않은 사람', desc: '부당함에 맞섰다', test: p => has(p, 'stood_up') },
    { k: 'mentor', icon: '🌱', name: '받은 만큼 돌려준 사람', desc: '누군가의 멘토가 되었다', test: p => has(p, 'mentor_given') },
    { k: 'sober', icon: '🫖', name: '다시 일어선 사람', desc: '술이나 도박을 끊고 돌아왔다', test: p => has(p, 'turned_around') || (has(p, 'sober') && !has(p, 'alcoholic')) },
    { k: 'donor', icon: '🎁', name: '기부자', desc: '재산을 사회에 나눴다', test: p => has(p, 'donor') },
    { k: 'grandparent', icon: '🧸', name: '할머니·할아버지', desc: '손주를 봤다', test: p => has(p, 'grandparent') },
    { k: 'single', icon: '🏡', name: '혼자서도 단단하게', desc: '비혼을 선택해 끝까지 잘 살았다', test: (p, e) => has(p, 'childfree_single') && e.s.happy >= 55 },
    { k: 'survivor', icon: '🎗️', name: '암 생존자', desc: '암을 이겨 내고 완치 판정을 받았다', test: p => has(p, 'cancer_survivor') },
    { k: 'debt_free', icon: '🕊️', name: '짐을 내려놓다', desc: '노년에 빚을 정리했다', test: p => has(p, 'debt_cleared') },
    { k: 'idol', icon: '🎤', name: '데뷔', desc: '아이돌로 데뷔했다', test: p => has(p, 'idol_debut') },
    { k: 'star', icon: '⭐', name: '스타', desc: '연예·방송으로 이름을 알렸다', test: p => has(p, 'famous') && (p.jobHistory || []).some(j => ['idol', 'entertainer', 'creator'].indexOf(j.id) >= 0) },
    { k: 'world', icon: '🏆', name: '세계 무대', desc: '영재로 자라 국제 무대에서 이름을 알렸다', test: p => has(p, 'world_stage') },
    { k: 'young_uni', icon: '🧮', name: '꼬마 박사', desc: '최연소로 대학에 들어갔다', test: p => has(p, 'early_college') },
    { k: 'unicorn', icon: '🦄', name: '유니콘', desc: '천재 창업가로 사업을 크게 일궜다', test: p => has(p, 'genius_founder') && has(p, 'business_success') },
    { k: 'landlord', icon: '🏢', name: '건물주', desc: '건물을 물려받았다', test: p => has(p, 'landlord') },
    { k: 'idle', icon: '🛋️', name: '돈 많은 백수', desc: '일하지 않아도 되는 삶을 택했다', test: p => has(p, 'rich_idle') },
    { k: 'recluse', icon: '🌤️', name: '문밖으로', desc: '은둔을 끝내고 세상으로 돌아왔다', test: p => has(p, 'turned_around') && !!p.done.al_recluse_out },
    { k: 'daily', icon: '📅', name: '오늘의 인생', desc: '오늘의 인생을 끝까지 살았다', test: p => !!p.daily }
  ];

  // 오늘 날짜(기기 기준) → 모두가 같은 출발점
  function today(d) {
    d = d || new Date();
    const z = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
  }
  const dailySeed = date => 'D' + (date || today()).replace(/-/g, '');

  function empty() { return { v: 1, lives: 0, titles: {}, liners: {}, jobs: {}, ach: {}, daily: {} }; }

  // 한 판의 결과를 도감에 더한다 → 새로 얻은 것 목록을 돌려준다 (결과 화면에서 "새로 발견" 표시)
  function record(dex, p, e) {
    dex = dex || empty();
    const fresh = [];
    // 저장은 키(k)로, 화면에 보여 줄 '새로 추가' 목록은 사람이 읽는 이름(shown)으로
    const bump = (obj, k, shown) => { if (!k) return; if (!obj[k]) fresh.push(shown || k); obj[k] = (obj[k] || 0) + 1; };
    dex.lives = (dex.lives || 0) + 1;
    bump(dex.titles, e.title);
    bump(dex.liners, e.oneLiner);
    bump(dex.jobs, e.job);
    ACH.forEach(a => { try { if (a.test(p, e)) bump(dex.ach, a.k, a.icon + ' ' + a.name); } catch (err) { /* 무시 */ } });
    // 오늘의 인생: 결과가 시드로 정해져 있어 몇 번이고 다시 하면 '정답'을 외울 수 있다 → 공식 기록은 첫 도전만, 이후는 연습 기록
    if (p.daily) {
      const cur = dex.daily[p.daily];
      if (!cur) dex.daily[p.daily] = { total: e.total, title: e.title, name: p.name, age: p.age, tries: 1 };
      else { cur.tries = (cur.tries || 1) + 1; if (!cur.best || e.total > cur.best) cur.best = e.total; }
    }
    return { dex, fresh: fresh.slice(0, 6) };
  }

  // 도감 전체 목록 (모아야 할 것들)
  function catalog() {
    const titles = Array.from(new Set((LG.DATA.endingTitles || []).map(x => x.t)));
    const liners = Array.from(new Set((LG.DATA.oneLiners || []).map(x => x.t)));
    const jobs = Object.keys(LG.DATA.jobs).filter(k => k !== 'homemaker').map(k => LG.DATA.jobs[k].name).concat(['전업주부', '없음']);
    return { titles, liners, jobs, ach: ACH };
  }

  LG.Dex = { ACH, today, dailySeed, empty, record, catalog };
})(window.LG = window.LG || {});
