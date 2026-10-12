/* 이벤트 — 재능의 현실: 천재라도 성공이 보장되지는 않는다.
   집안 사정으로 접어야 할 수도, 부상·슬럼프·기대의 무게에 무너질 수도 있다. (p.blocked[t] = 접은 나이) */
(function (LG) {
  const E = LG.DATA.events;
  const H = LG.EH, has = H.has;
  const S = H.S;
  const ch = H.pusher({ tier: 'choice', w: 12, max: 1, cat: 'talent', label: '재능', dom: [] });
  const COSTLY = ['music', 'art', 'sport'];
  const GR = (p, t) => (p.tgrade || {})[t] || 'common';
  const isOpen = (p, t) => !(p.blocked && p.blocked[t] != null);
  // 등급이 높고 이미 알려진, 아직 접지 않은 재능
  const star = (p, only) => p.talents.find(t => p.found.indexOf(t) >= 0 && GR(p, t) !== 'common' && isOpen(p, t) && (!only || only.indexOf(t) >= 0));
  const nm = (p, t) => (LG.DATA.talents[t] || { name: '재능' }).name;
  // 선택 직후(접은 뒤)에도 같은 재능을 가리키도록
  const costly = p => star(p, COSTLY) || COSTLY.find(t => p.talents.indexOf(t) >= 0 && p.blocked && p.blocked[t] != null);
  const block = t => p => { p.blocked = p.blocked || {}; p.blocked[t || star(p)] = p.age; return ''; };
  const bonus = { genius: 30, gifted: 14, common: 0 };

  // ───── 키울 여건이 안 될 때 ─────
  ch({
    id: 'gt_cost', ages: [11, 17], w: 120, icon: '🎻',
    if: p => !!star(p, COSTLY) && !has(p, 'talent_funded') && (p.family.tier <= 2 || (p.family.tier === 3 && (p.family.tags.indexOf('single_parent') >= 0 || p.family.tags.indexOf('big_family') >= 0))),
    title: p => `${nm(p, costly(p))}, 계속할 수 있을까`,
    text: p => { const t = costly(p); return `선생님이 부모님을 따로 찾아와 "${nm(p, t)} 분야로 제대로 키워 보시라"고 하셨다. 하지만 레슨비와 장비, 대회 참가비를 우리 형편으로는 감당하기 어렵다.`; },
    choices: [
      { id: 'press', label: '부모님을 설득해 무리해서라도 이어 간다', intent: 'family',
        check: { base: 34, partial: 0.4, f: [['support', 0.3], ['family', 0.3], ['fn', p => ({ label: '재능의 등급', v: bonus[GR(p, star(p, COSTLY))] * 0.5 })]] },
        out: {
          success: { t: '부모님이 허리띠를 졸라매고 레슨을 이어 주셨다. 그 마음이 무거우면서도 든든했다.', log: '집안의 희생으로 재능을 이어 감', major: true, flag: 'talent_funded', rel: { parents: 4 }, hp: 6, sr: 10, debt: 600, eff: { art: 8, sport: 8 } },
          partial: { t: '레슨 횟수를 줄이고 독학으로 버텼다. 부족하지만 놓지는 않았다.', flag: 'talent_funded', eff: { art: 4, sport: 4 }, sr: 8, hp: 0 },
          fail: { t: '집안 사정이 갑자기 나빠졌다. "미안하다, 더는 못 해 준다"는 말 앞에서 아무 말도 하지 못했다.', log: '집안 사정으로 재능을 접음', major: true, sr: 14, hp: -10, fn: block() }
        } },
      { id: 'sponsor', label: '장학·후원 기회를 찾아 나선다', intent: 'independence',
        check: { base: 18, partial: 0.4, f: [['fn', p => ({ label: '재능의 등급', v: bonus[GR(p, star(p, COSTLY))] })], ['stat', 'mental', 0.2], ['region', 'culture', 0.15], ['region', 'edu', 0.1]] },
        out: {
          success: { t: '재단 장학생으로 선발됐다. 누군가 내 재능을 알아봐 줬다는 사실이 가장 큰 선물이었다.', log: '후원을 받아 재능을 이어 감', major: true, flag: ['talent_funded', 'scholarship'], achv: 3, hp: 12 },
          partial: { t: '일부 지원을 받았지만 나머지는 내 몫이다. 방과 후 일을 하며 연습한다.', flag: 'talent_funded', sr: 12, hp: 2 },
          fail: { t: '지원서를 여러 곳에 냈지만 답은 없었다. 시간만 흘렀다.', log: '후원을 얻지 못해 재능을 접음', sr: 12, hp: -8, fn: block() }
        } },
      { id: 'quit', label: '현실을 받아들이고 접는다', intent: 'stability',
        out: { t: '악기와 그림 도구를 장롱 깊숙이 넣어 두었다. 가끔 생각나겠지만, 그게 현실이었다.', log: '현실을 받아들이고 재능을 접음', sr: 8, hp: -6, rel: { parents: 2 }, fn: block() } }
    ]
  });

  // ───── 정상에 가까울수록 만나는 벽 ─────
  const WALL = {
    sport: { t: '시즌 중 무릎이 비명을 질렀다. 의사가 "이대로면 선수 생활이 끝날 수 있다"고 했다.', ok: '재활을 이겨 내고 더 단단해져서 돌아왔다.', no: '결국 수술대에 올랐다. 이전 기량으로는 돌아오지 못했다.' },
    music: { t: '연주가 어느 날부터 기계처럼 느껴졌다. 손가락은 움직이는데 음악이 들리지 않는다.', ok: '긴 침묵 끝에 다시 음악이 돌아왔다. 전에 없던 깊이가 생겼다.', no: '무대에 서는 일이 두려워졌다. 한동안 악기를 열지 못했다.' },
    art: { t: '"천재 소리 듣던 애"라는 말이 족쇄가 됐다. 한 장도 그릴 수 없는 날들이 이어진다.', ok: '낙서처럼 다시 시작한 그림에서 새로운 길이 열렸다.', no: '빈 캔버스 앞에서 몇 달을 보냈다. 붓이 점점 무거워졌다.' },
    _: { t: '기대가 무겁다. 잘해야 한다는 압박에 어느 순간 즐거움이 사라졌다.', ok: '잠시 멈추고 방향을 다잡았다. 다시 걸어가는 힘이 생겼다.', no: '지쳐 버렸다. 해야 할 이유를 잃은 채 날들이 흘러갔다.' }
  };
  ch({
    id: 'gt_wall', ages: [15, 40], w: 16, cd: 8, max: 2, icon: '🧱',
    if: p => !!star(p) && p.age >= 15 && (p.effort.art + p.effort.sport > 25 || ['art', 'music', 'sport', 'writing'].indexOf(star(p)) >= 0 || !!p.job),
    title: p => '천재에게도 벽은 온다',
    text: p => (WALL[star(p)] || WALL._).t,
    choices: [
      { id: 'push', label: '이를 악물고 밀어붙인다', intent: 'risk',
        check: { base: 36, partial: 0.4, f: [['stat', 'mental', 0.35], ['health', 0.3], ['stress', 0.3], ['fn', p => ({ label: '재능의 등급', v: bonus[GR(p, star(p))] * 0.4 })]] },
        out: {
          success: { t: p => (WALL[star(p)] || WALL._).ok, log: '벽을 넘음', major: true, achv: 6, hp: 12, st: { mental: 3 } },
          partial: { t: '완전히 넘지는 못했지만 버텨 냈다. 흔적이 남았다.', hp: 0, st: { health: -2 }, sr: 8 },
          fail: { t: p => (WALL[star(p)] || WALL._).no, log: '재능의 벽에 무너짐', major: true, hp: -14, sr: 16, st: { health: -4, mental: -3 }, achv: -2 }
        } },
      { id: 'rest', label: '잠시 멈추고 쉬어 간다', intent: 'rest', out: { t: '일 년쯤 일부러 느리게 살았다. 그 시간이 나중에 큰 힘이 됐다.', hp: 6, sr: -12, st: { mental: 2 }, achv: -1 } },
      { id: 'pivot', label: '방향을 바꿔 가르치는 길로 간다', intent: 'stability', out: { t: '무대 위가 아니라 아이들 곁에서 재능을 쓰기로 했다. 다른 종류의 보람이 있었다.', log: '재능을 가르치는 길로 전환', hp: 4, rel: { friends: 3 }, achv: 2 } }
    ]
  });

  // ───── 스포트라이트의 무게 (천재 한정) ─────
  ch({
    id: 'gt_spot', ages: [17, 32], w: 30, icon: '📸',
    if: p => !!p.prodigy && p.found.indexOf(p.prodigy) >= 0 && isOpen(p, p.prodigy),
    title: '"국민 천재"라는 이름', text: p => `${nm(p, p.prodigy)} 분야에서 이름이 너무 빨리, 너무 크게 알려졌다. 광고 제안과 기자들의 전화, 그리고 한 번의 실수도 용납하지 않는 시선이 따라온다.`,
    choices: [
      { id: 'shine', label: '관심을 받아들이고 정면 승부한다', intent: 'career',
        check: { base: 40, partial: 0.4, f: [['stat', 'mental', 0.4], ['stress', 0.3], ['stat', 'social', 0.15]] },
        out: {
          success: { t: '압박을 에너지로 바꿨다. 이름이 곧 기록이 되었다.', log: '정상에 오름', major: true, achv: 12, hp: 14, money: 4000 },
          partial: { t: '성과는 나왔지만 사생활은 사라졌다.', achv: 6, hp: -2, money: 1500, sr: 12 },
          fail: { t: '한 번의 부진이 거대한 비난이 되어 돌아왔다. 천재라는 말이 가장 무서운 말이 되었다.', log: '천재의 추락', major: true, achv: -3, hp: -16, sr: 20, st: { mental: -4 } }
        } },
      { id: 'guard', label: '거리를 두고 나만의 속도로 간다', intent: 'independence', out: { t: '인터뷰를 줄이고 연습에만 몰두했다. 천천히, 하지만 오래 갈 수 있는 길이다.', achv: 4, hp: 6, sr: -6, money: 500 } }
    ]
  });

  // ───── 접어 둔 재능을 다시 만나다 ─────
  ch({
    id: 'gt_return', ages: [28, 62], w: 22, icon: '🎹',
    if: p => Object.keys(p.blocked || {}).some(t => p.blocked[t] != null) && !has(p, 'talent_revisited'),
    title: '접어 둔 재능', text: p => { const t = Object.keys(p.blocked).find(x => p.blocked[x] != null); return `우연히 ${nm(p, t)}와(과) 마주쳤다. 오래 잊고 지냈는데 몸이 먼저 기억하고 있었다. "그때 계속했더라면" 하는 생각이 스쳐 간다.`; },
    choices: [
      { id: 'again', label: '취미로라도 다시 시작한다', intent: 'hobby',
        out: { t: '퇴근 후 한 시간씩 다시 잡았다. 직업은 되지 못했지만, 마음 한켠이 채워졌다.', log: '접어 둔 재능을 되찾음', flag: 'talent_revisited', hp: 12, sr: -8, st: { mental: 2 }, money: -100 } },
      { id: 'teach', label: '아이들에게 가르쳐 본다', intent: 'family', out: { t: '내가 못 가 본 길을 아이들에게 열어 주고 싶었다. 눈빛이 반짝이는 아이를 보면 그때의 내가 보인다.', log: '접어 둔 재능을 아이들에게 전함', flag: 'talent_revisited', hp: 10, rel: { children: 3 }, achv: 2 } },
      { id: 'let', label: '이제는 흘려보낸다', intent: 'stability', out: { t: '그건 그때의 내 몫이었다. 쓴웃음을 짓고 지나쳤다.', flag: 'talent_revisited', hp: 1 } }
    ]
  });
})(window.LG = window.LG || {});
