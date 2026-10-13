/* 이벤트 — 큰 지출의 갈림길: 결혼식 · 차 · 가전 · 집 수리 · 부모님 병원비 · 큰 소비
   모두 '현금으로 산다 / 할부·대출로 산다 / 싸게 해결한다 / 안 산다' 중에서 고른다.
   할부·대출은 빚(p.debt)으로 잡혀 이자와 함께 해마다 갚아 나간다. 차는 자산(p.car)으로 잡히고 해마다 감가·유지비가 든다. */
(function (LG) {
  const H = LG.EH, has = H.has;
  const S = H.S;
  const M = v => LG.U.money(v);
  const ch = H.pusher({ tier: 'choice', cat: 'spend', label: '큰 지출', w: 12, max: 1 });
  const cash = p => H.cash(p);
  const style = p => LG.Style && LG.Style.active(p) ? LG.Style.key(p) : 'balanced';
  const styleW = p => ({ luxury: 1.8, frugal: 0.5 })[style(p)] || 1;
  // 할부·대출: 원금 + 이자(대략)를 빚으로 잡는다
  // 할부·대출: 종류에 따라 금리와 기간이 다르다 (js/loans.js). 이자는 해마다 따로 붙는다
  const loan = (amt, rate, kind) => p => { const d = Math.round(amt); LG.Loans.add(p, kind || 'install', d); const K = LG.Loans.KINDS[kind || 'install']; return `${M(d)}원을 ${K.name}(연 ${(K.rate * 100).toFixed(1)}%)로 갚아 나가기로 했다.`; };
  const pay = amt => p => { p.money -= amt; return ''; };
  const buyCar = (label, value) => p => { p.car = { label, value, at: p.age }; return ''; };

  // ───── 결혼식 · 신혼 살림 (결혼 직후 이어지는 선택) ─────
  ch({
    id: 'ex_wedding', queued: true, tier: 'major', cat: 'marriage', label: '결혼', icon: '💒', max: 3,
    title: '결혼식은 어떻게 할까', text: p => `날짜를 잡자 견적서가 쏟아진다. 예식장, 스드메, 신혼여행, 혼수…. 평균적인 결혼식이면 수천만 원이라고 한다. 지금 쓸 수 있는 돈은 ${M(cash(p))}원 정도.`,
    choices: [
      { id: 'small', label: '가까운 사람들만 모여 스몰웨딩', intent: 'stability',
        out: { t: '작은 정원에서 서른 명 남짓이 모였다. 하나하나 얼굴을 보며 인사할 수 있어 좋았다.', log: '스몰웨딩', hp: 10, money: -700, rel: { friends: 2 }, flag: 'small_wedding' } },
      { id: 'normal', label: '남들처럼 평범하게 식을 올린다', intent: 'family',
        out: { t: '', log: '결혼식', hp: 12, rel: { parents: 6 }, fn: p => { p.money -= 2800; p.money += 1300; return '정신없이 지나간 하루였다. 축의금으로 비용의 절반쯤을 메웠다.'; } } },
      { id: 'grand', label: '호텔에서 성대하게 (대출을 받더라도)', intent: 'risk',
        out: { t: '', log: '호텔 결혼식', hp: 16, rel: { parents: 8, friends: 4 }, sr: 6, fn: p => { const total = 7000, gift = 2000; const need = total - gift; const own = Math.min(cash(p), Math.round(need * 0.4)); p.money -= own; return '샹들리에 아래 꿈 같은 하루였다. ' + loan(need - own, 0.06)(p); } } },
      { id: 'none', label: '식은 생략하고 혼인신고만 한다', intent: 'money',
        out: { t: '구청에서 혼인신고서를 내고 둘이서 맛있는 저녁을 먹었다. 그 돈은 신혼집 보증금에 보탰다.', log: '식 없이 혼인신고', hp: 6, rel: { parents: -4 }, money: -100, flag: 'no_wedding' } }
    ]
  });

  // ───── 첫 차 ─────
  ch({
    id: 'ex_car_first', ages: [23, 48], w: p => (p.urban ? 10 : 22) * (LG.Rel.all(p, 'child').length ? 1.6 : 1) * styleW(p), icon: '🚗', label: '차',
    if: p => !!p.job && !p.car && !has(p, 'no_car') && p.liveIn !== 'abroad',
    title: '차가 있어야 할까', text: p => `${p.urban ? '대중교통으로도 다닐 만하지만' : '버스가 한 시간에 한 대뿐이라'} 요즘 차 생각이 간절하다. ${LG.Rel.all(p, 'child').length ? '아이를 태우고 다니려면 더 그렇다.' : ''} 새 차는 3,500만 원, 쓸 만한 중고차는 1,200만 원쯤.`,
    choices: [
      { id: 'new_cash', label: '새 차를 일시불로 산다', intent: 'stability', if: p => cash(p) >= 3500,
        out: { t: '새 차 냄새를 맡으며 첫 드라이브를 나섰다. 통장은 가벼워졌지만 마음은 든든하다.', log: '새 차 구입(일시불)', hp: 8, fn: H.seq(pay(3500), buyCar('새 차', 3500)) } },
      { id: 'new_loan', label: '새 차를 할부로 산다', intent: 'risk',
        out: { t: '', log: '새 차 구입(할부)', hp: 8, sr: 3, fn: H.seq(buyCar('새 차', 3500), loan(3500, 0.09), p => '매달 할부금이 나가지만 출퇴근길이 편해졌다.') } },
      { id: 'used', label: '중고차로 시작한다', intent: 'money',
        check: { base: 70, partial: 0, f: [['talent', 'mechanical', 12], ['stat', 'intelligence', 0.15]] },
        out: { success: { t: '주행거리는 길지만 쌩쌩하다. 좋은 차를 싸게 샀다.', log: '중고차 구입', hp: 5, fn: H.seq(pay(1200), buyCar('중고차', 1200)) },
          fail: { t: '사고 이력을 숨긴 차였다. 수리비가 차값만큼 들었다.', log: '중고차 사기', hp: -6, sr: 8, fn: H.seq(pay(1900), buyCar('중고차', 800)) } } },
      { id: 'no', label: '차 없이 산다', intent: 'independence', out: { t: '대중교통과 카셰어링으로 충분하다. 그 돈으로 다른 걸 하기로 했다.', flag: 'no_car', hp: 1 } }
    ]
  });

  // ───── 차를 바꿀 때 ─────
  ch({
    id: 'ex_car_change', ages: [32, 80], w: p => 12 * styleW(p), cd: 7, max: 3, icon: '🚙', label: '차',
    if: p => !!p.car && p.age - p.car.at >= 8,
    title: '차를 바꿀까', text: p => `${p.age - p.car.at}년 탄 차가 자꾸 말썽이다. 정비소 사장님이 "이제 보내 줄 때가 됐다"고 한다. ${p.age >= 72 ? '요즘 밤 운전이 겁나기도 한다.' : ''}`,
    choices: [
      { id: 'import', label: '이번엔 수입차로 간다 (할부)', intent: 'risk', if: p => p.age < 72,
        out: { t: '', log: '수입차로 바꿈', hp: 10, sr: 4, fn: H.seq(p => { p.money += Math.round(p.car.value); return ''; }, buyCar('수입차', 6500), loan(6500 - 0, 0.08), p => '주차장에서 괜히 한 번 더 돌아보게 된다. 대신 할부가 길다.') } },
      { id: 'new', label: '무난한 새 차로 바꾼다', intent: 'stability', if: p => p.age < 76,
        out: { t: '', log: '새 차로 바꿈', hp: 6, fn: H.seq(p => { const old = Math.round(p.car.value); const price = 3800; const own = Math.min(cash(p) + old, price); p.money += old - own; return own < price ? loan(price - own, 0.08)(p) : ''; }, buyCar('새 차', 3800)) } },
      { id: 'fix', label: '고쳐서 더 탄다', intent: 'money',
        check: { base: 60, partial: 0, f: [['talent', 'mechanical', 10]] },
        out: { success: { t: '수리비 200만 원으로 몇 년은 더 탈 수 있겠다.', money: -200, fn: p => { p.car.at = p.age - 4; return ''; } }, fail: { t: '고친 곳 옆이 또 고장 났다. 돈만 쓰고 결국 바꿔야 할 것 같다.', money: -350, sr: 6 } } },
      { id: 'sell', label: '차를 처분하고 대중교통으로', intent: 'independence',
        out: { t: '', log: '차를 정리함', hp: 1, fn: p => { const v = Math.round(p.car.value); p.money += v; p.car = null; S().flag(p, 'no_car'); return `${M(v)}원에 차를 넘겼다. 유지비가 들지 않으니 생활비가 한결 가볍다.`; } } }
    ]
  });

  // ───── 가전·살림 ─────
  ch({
    id: 'ex_appliance', ages: [26, 82], w: p => 9 * styleW(p), cd: 6, max: 3, icon: '🧺', label: '살림',
    if: p => p.home !== 'parents' && p.home !== 'barracks' && p.age >= 26,
    title: p => ['냉장고가 멈췄다', '세탁기가 고장 났다', '에어컨이 시원찮다'][p.age % 3],
    text: '10년 넘게 쓴 가전이 결국 고장 났다. 최신형은 비싸고, 고쳐 쓰자니 또 고장 날 것 같다.',
    choices: [
      { id: 'premium', label: '최신 고급형을 일시불로', intent: 'rest', if: p => cash(p) >= 500,
        out: { t: '새 가전이 들어오니 집이 달라 보인다. 전기세도 줄었다.', hp: 6, money: -450 } },
      { id: 'install', label: '무이자 할부로 최신형을', intent: 'risk', out: { t: '', hp: 6, sr: 2, fn: loan(450, 0.0) } },
      { id: 'repair', label: '수리해서 더 쓴다', intent: 'money',
        check: { base: 60, partial: 0, f: [['talent', 'mechanical', 14]] },
        out: { success: { t: '부품 하나 바꾸니 멀쩡해졌다. 6만 원으로 해결.', money: -6, hp: 2 }, fail: { t: '두 달 만에 또 고장. 결국 새로 샀다.', money: -420, sr: 6, hp: -3 } } },
      { id: 'used', label: '중고 거래로 구한다', intent: 'money', out: { t: '동네 중고 거래로 깨끗한 걸 반값에 샀다. 직접 실어 오느라 허리가 아팠다.', money: -180, hp: 3 } }
    ]
  });

  // ───── 집 수리·리모델링 ─────
  ch({
    id: 'ex_house_fix', ages: [33, 85], w: 11, cd: 10, max: 2, icon: '🛠️', label: '집',
    if: p => !!p.house,
    title: '집이 낡았다', text: p => `${p.house.label}에서 산 지 꽤 됐다. 욕실 천장에서 물이 새고, 창틀 사이로 바람이 들어온다. 전체 리모델링 견적은 3,000만 원.`,
    choices: [
      { id: 'full', label: '전체 리모델링을 한다', intent: 'family', if: p => cash(p) >= 3000,
        out: { t: '두 달 공사 끝에 새집 같아졌다. 집값도 조금 올랐다.', log: '집 리모델링', hp: 10, money: -3000, fn: p => { p.house.value = Math.round(p.house.value + 2200); return ''; } } },
      { id: 'loan', label: '대출을 받아 리모델링한다', intent: 'risk', out: { t: '', log: '대출로 집 리모델링', hp: 8, sr: 4, fn: H.seq(loan(3000, 0.07, 'mortgage'), p => { p.house.value = Math.round(p.house.value + 2200); return '대출은 늘었지만 살기 좋아졌다.'; }) } },
      { id: 'part', label: '새는 곳만 고친다', intent: 'money', out: { t: '급한 곳만 고쳤다. 나머지는 다음에.', money: -500, hp: 2 } },
      { id: 'later', label: '버틸 수 있을 때까지 미룬다', intent: 'stability', out: { t: '양동이를 받쳐 두었다. 집값이 조금 떨어졌다는 얘기가 들린다.', sr: 6, fn: p => { p.house.value = Math.round(p.house.value * 0.96); return ''; } } }
    ]
  });

  // ───── 부모님 병원비 ─────
  ch({
    id: 'ex_parent_hospital', ages: [35, 72], w: 18, cd: 6, max: 2, icon: '🏥', label: '가족',
    if: p => LG.Rel.parents(p).some(n => n.alive && n.health < 50) && p.age >= 35,
    title: '부모님 수술비', text: p => `{parent}가 큰 수술을 받아야 한다. 수술비와 간병비를 합치면 2,000만 원 가까이 든다. ${LG.Rel.get(p, 'sibling') ? '형제들과 어떻게 나눌지도 문제다.' : '외동인 내가 감당해야 한다.'}`,
    choices: [
      { id: 'all', label: '내가 전부 부담한다', intent: 'family', out: { t: '', log: '부모님 병원비를 전부 부담', rel: { parents: 14 }, hp: 2, sr: 8, fn: p => { const own = Math.min(cash(p), 2000); p.money -= own; return own < 2000 ? '모아 둔 돈이 모자라 ' + loan(2000 - own, 0.06, 'credit')(p) : '모아 둔 돈을 털었다. 아깝지 않았다.'; } } },
      { id: 'split', label: '형제들과 나눠 낸다', intent: 'stability', if: p => !!LG.Rel.get(p, 'sibling'),
        check: { base: 52, partial: 0, f: [['rel', 'sibling', 0.4], ['stat', 'social', 0.15]] },
        out: { success: { t: '형제들이 흔쾌히 나눠 냈다. 오랜만에 한마음이 됐다.', rel: { siblings: 8, parents: 8 }, money: -700, hp: 4 },
          fail: { t: '누가 얼마를 낼지로 언성이 높아졌다. 결국 내가 더 많이 냈다.', rel: { siblings: -12, parents: 6 }, money: -1300, sr: 10, hp: -4 } } },
      { id: 'public', label: '국가 지원·요양병원을 알아본다', intent: 'money', out: { t: '재난적 의료비 지원과 장기요양보험을 알아봤다. 부담이 꽤 줄었지만, 부모님 곁을 덜 지키게 됐다.', money: -500, rel: { parents: -2 }, hp: 0 } }
    ]
  });

  // ───── 큰 소비의 유혹 ─────
  ch({
    id: 'ex_splurge', ages: [27, 70], w: p => 8 * styleW(p) * (S().netWorth(p) > 10000 ? 1.5 : 1), cd: 7, max: 3, icon: '🛍️', label: '소비',
    if: p => !!p.job || p.status === 'retired',
    title: p => ['명품 가방', '꿈꾸던 해외여행', '최신 장비 한 세트'][p.age % 3], text: '오래 갖고 싶던 것이 눈앞에 있다. 800만 원. "열심히 살았잖아" 하는 목소리와 "그 돈이면…" 하는 목소리가 싸운다.',
    choices: [
      { id: 'buy', label: '나에게 주는 선물, 산다', intent: 'rest', if: p => cash(p) >= 800,
        out: { t: '며칠 동안 기분이 좋았다. 이런 게 사는 재미다.', hp: 10, money: -800, sr: -6 } },
      { id: 'install', label: '할부로 지른다', intent: 'risk', out: { t: '', hp: 9, sr: 3, fn: loan(800, 0.12, 'credit') } },
      { id: 'no', label: '참는다, 그 돈은 모은다', intent: 'money', out: { t: '장바구니에서 지웠다. 통장 잔고를 보며 조용히 뿌듯했다.', hp: 1, eff: { work: 3 } } }
    ]
  });

  // ───── 로또 1등, 그다음 ─────
  ch({
    id: 'm_lottery', queued: true, tier: 'major', cat: 'money', label: '로또', icon: '🎰', max: 1,
    title: '이 돈을 어떻게 할까', text: p => `당첨금 ${M(p.lotto || 0)}원이 통장에 들어왔다. 은행 직원이 "당분간 아무에게도 말하지 마세요"라고 했다.`,
    choices: [
      { id: 'quiet', label: '아무에게도 말하지 않고, 빚부터 갚고 예금에 넣는다', intent: 'stability',
        out: { t: '', log: '당첨금을 조용히 지킴', hp: 6, sr: -10, fn: p => { const d = LG.Loans.pay(p, Math.min(p.debt, p.money)); p.money -= d; LG.Invest.setPolicy(p, p.invPolicy && p.invPolicy !== 'cash' ? p.invPolicy : 'balanced', true); return '빚을 모두 갚고 나머지는 나눠서 굴리기로 했다. 겉으로는 아무것도 바뀌지 않았다.'; } } },
      { id: 'house', label: '내 집부터 산다', intent: 'family', if: p => !p.house && p.liveIn !== 'abroad',
        out: { t: '', log: '당첨금으로 집 마련', hp: 12, fn: p => { const price = LG.EH.housePrice ? LG.EH.housePrice(p) : 60000; p.money -= price; p.house = { value: price, label: LG.State.liveRegion(p).short + ' 아파트' }; p.home = 'own'; LG.State.flag(p, 'home_owner'); return `${M(price)}원짜리 아파트를 대출 없이 샀다.`; } } },
      { id: 'quit', label: '회사를 그만두고 하고 싶은 걸 한다', intent: 'rest', if: p => !!p.job,
        out: { t: '사직서를 냈다. 동료들은 이유를 끝까지 몰랐다.', log: '로또 당첨 후 퇴사', quit: 'idle', flag: 'rich_idle', hp: 10, sr: -20, queue: [{ id: 'al_idle_life', in: 3 }] } },
      { id: 'share', label: '가족들과 나눈다', intent: 'family',
        out: { t: '', log: '당첨금을 가족과 나눔', rel: { family: 14, parents: 10, siblings: 8 }, hp: 10, fn: p => { const g = Math.round((p.lotto || 0) * 0.3); p.money -= g; return `${M(g)}원을 부모님과 형제들에게 나눴다. 명절 분위기가 달라졌다. 다만 연락이 끊겼던 친척들의 전화가 늘었다.`; } } },
      { id: 'spend', label: '인생은 한 번뿐, 마음껏 쓴다', intent: 'risk',
        out: { t: '수입차, 명품, 해외여행. 처음 1년은 꿈 같았다.', log: '당첨금으로 마음껏 씀', hp: 16, fn: p => { p.money -= Math.round((p.lotto || 0) * 0.45); p.queue.push({ id: 'm_lottery_after', at: p.age + 4 }); return ''; } } }
    ]
  });
  ch({
    id: 'm_lottery_after', queued: true, tier: 'major', cat: 'money', label: '로또', icon: '🧾', max: 1,
    title: '그 많던 돈은 어디로', text: p => `통장 잔고가 ${M(Math.max(0, p.money))}원. 당첨 4년 만이다. 씀씀이는 이미 커져 있다.`,
    choices: [
      { id: 'reset', label: '정신 차리고 다시 일한다', intent: 'career', out: { t: '다시 이력서를 썼다. 돈보다 하루의 리듬이 그리웠다는 걸 알았다.', hp: 2, fn: p => { if (!p.job) LG.Outcome.setJob(p, 'office_small'); return ''; } } },
      { id: 'more', label: '남은 돈으로 한 방을 노린다', intent: 'risk',
        check: { base: 18, partial: 0, f: [['stat', 'intelligence', 0.2]] },
        out: { success: { t: '투자가 터졌다. 운이 두 번 왔다.', money: 20000, hp: 10 }, fail: { t: '남은 돈마저 날렸다. 로또 당첨자의 흔한 결말이 내 이야기가 됐다.', log: '당첨금을 모두 잃음', major: true, hp: -20, sr: 20, fn: p => { p.money = Math.round(p.money * 0.1); LG.Invest.KEYS.forEach(k => { p.inv[k] = Math.round((p.inv[k] || 0) * 0.1); }); return ''; } } } }
    ]
  });
})(window.LG = window.LG || {});
