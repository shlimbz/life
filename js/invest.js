/* InvestSystem — 돈을 벌기 시작하면 '어떻게 굴릴지'를 정한다.
   현금 · 예적금 · 주식(ETF) · 코인 · 부동산(집)으로 자산이 나뉘고, 해마다 시장이 움직인다.
   시장은 레짐(상승/보합/하락)과 코인 사이클을 따라 출렁이고, 내 선택(운용 방식)은 그 위에서 결과를 바꾼다. 금액 단위: 만원 */
(function (LG) {
  'use strict';
  const U = () => LG.U, S = () => LG.State, R = () => LG.RNG;

  const CLASSES = {
    deposit: { name: '예적금', icon: '🏦' },
    stock:   { name: '주식·ETF', icon: '📈' },
    crypto:  { name: '코인', icon: '🪙' },
    reit:    { name: '리츠(부동산 펀드)', icon: '🏢' }
  };
  const KEYS = ['deposit', 'stock', 'crypto', 'reit'];
  const POLICY = {
    cash:     { name: '그냥 통장에', icon: '👛', desc: '투자하지 않고 현금으로 둔다', w: { deposit: 0, stock: 0, crypto: 0, reit: 0 } },
    saver:    { name: '예적금 위주', icon: '🏦', desc: '원금 보존이 우선. 느리지만 확실하게', w: { deposit: 1, stock: 0, crypto: 0, reit: 0 } },
    balanced: { name: '균형 투자', icon: '⚖️', desc: '예적금 35 · 주식 45 · 리츠 15 · 코인 5', w: { deposit: 0.35, stock: 0.45, crypto: 0.05, reit: 0.15 } },
    realty:   { name: '부동산 위주', icon: '🏢', desc: '예적금 30 · 리츠 50 · 주식 20. 월세처럼 배당이 나오고, 집값 흐름을 따라간다', w: { deposit: 0.3, stock: 0.2, crypto: 0, reit: 0.5 } },
    growth:   { name: '성장 투자', icon: '🌱', desc: '예적금 15 · 주식 70 · 코인 15', w: { deposit: 0.15, stock: 0.7, crypto: 0.15, reit: 0 } },
    yolo:     { name: '공격 투자', icon: '🎲', desc: '주식 40 · 코인 60. 크게 벌거나 크게 잃는다', w: { deposit: 0, stock: 0.4, crypto: 0.6, reit: 0 } }
  };
  const RE_NAME = { boom: '부동산 상승기', normal: '부동산 보합', slump: '부동산 침체' };
  // 지역마다 집값이 움직이는 폭(베타)과 기본 흐름이 다르다: 서울·수도권은 크게 오르내리고, 지방은 완만하거나 내림세
  const RE_BETA = { seoul: [1.35, 0.005], gyeonggi: [1.15, 0.002], incheon: [1.05, 0], sejong: [1.2, 0], busan: [0.95, -0.002], daegu: [0.95, -0.004], daejeon: [0.9, -0.002], gwangju: [0.85, -0.004], ulsan: [0.9, -0.005], jeju: [1, -0.002] };
  const REGIME_NAME = { bull: '상승장', normal: '보합장', bear: '하락장' };
  const CRYPTO_NAME = { boom: '코인 열풍', flat: '코인 잠잠', bust: '코인 한파' };

  function init(p) {
    p.inv = p.inv || { deposit: 0, stock: 0, crypto: 0, reit: 0 };
    if (p.inv.reit === undefined) p.inv.reit = 0;
    if (p.invPolicy === undefined) p.invPolicy = null;
    p.mkt = p.mkt || { regime: 'normal', crypto: 'flat', rate: 0.025, stockRet: 0, cryptoRet: 0, hist: [] };
    p.invLast = p.invLast || { deposit: 0, stock: 0, crypto: 0, pl: 0 };
    if (!p.mkt.re) { p.mkt.re = 'normal'; p.mkt.reRet = 0; p.mkt.reIdx = 1; }
  }
  // 내가 사는 지역의 부동산 베타·기본 흐름
  function reBeta(p) {
    const id = p.liveIn === 'abroad' ? 'abroad' : p.region;
    const b = RE_BETA[id] || [0.65, -0.008];   // 그 밖의 도 지역: 완만하고 약한 내림세
    return (!p.urban && !p.liveIn) ? [b[0] * 0.75, b[1] - 0.004] : b;
  }

  const total = p => { init(p); return p.inv.deposit + p.inv.stock + p.inv.crypto + (p.inv.reit || 0); };

  function step(p) {
    const m = p.mkt;
    const t = { bull: [0.5, 0.38, 0.12], normal: [0.28, 0.5, 0.22], bear: [0.36, 0.44, 0.2] }[m.regime];
    const r = R().next(p);
    const prev = m.regime;
    m.regime = r < t[0] ? 'bull' : r < t[0] + t[1] ? 'normal' : 'bear';
    const c = { boom: [0.3, 0.25, 0.45], flat: [0.25, 0.5, 0.25], bust: [0.22, 0.5, 0.28] }[m.crypto]; // → boom, flat, bust
    const r2 = R().next(p);
    m.crypto = r2 < c[0] ? 'boom' : r2 < c[0] + c[1] ? 'flat' : 'bust';

    const mean = { bull: 0.115, normal: 0.03, bear: -0.17 }[m.regime];
    const sd = { bull: 0.1, normal: 0.1, bear: 0.12 }[m.regime];
    const rebound = prev === 'bear' ? 0.03 : 0;
    const skill = (p.stats.intelligence - 50) * 0.0002 + (S().hasTrait(p, 'careful') ? 0.008 : 0) - (S().hasTrait(p, 'impulsive') ? 0.012 : 0) + p.luck * 0.0015 + (LG.Style ? LG.Style.investSkill(p) : 0);
    m.stockRet = U().clamp(R().normal(p, mean + rebound, sd), -0.5, 0.55);
    const cm = { boom: 0.75, flat: 0.03, bust: -0.55 }[m.crypto];
    const cs = { boom: 0.55, flat: 0.3, bust: 0.18 }[m.crypto];
    m.cryptoRet = U().clamp(R().normal(p, cm, cs), -0.92, 3.5);
    m.rate = U().clamp(m.rate + R().float(p, -0.004, 0.004) + (m.regime === 'bear' ? -0.001 : 0), 0.01, 0.035);
    m.skill = skill;
    // 부동산 시장: 몇 년씩 이어지는 상승기·보합·침체 (주식보다 느리고 길게 움직인다)
    const tr = { boom: [0.62, 0.3, 0.08], normal: [0.2, 0.62, 0.18], slump: [0.12, 0.43, 0.45] }[m.re || 'normal'];
    const r3 = R().next(p);
    m.re = r3 < tr[0] ? 'boom' : r3 < tr[0] + tr[1] ? 'normal' : 'slump';
    m.reRet = U().clamp(R().normal(p, { boom: 0.05, normal: 0.005, slump: -0.05 }[m.re] + (m.rate < 0.018 ? 0.01 : 0), 0.035), -0.2, 0.25);
    m.hist.push({ y: p.year, s: Math.round(m.stockRet * 100), c: Math.round(m.cryptoRet * 100) });
    if (m.hist.length > 12) m.hist.shift();
  }

  function reserve(p) { return U().clamp(Math.round((p.lastIncome || 0) * 0.3 / 100) * 100, 500, 3000); }

  // 부족한 현금을 투자 자산을 팔아 채운다 (예적금 → 주식 → 코인 순)
  function raise(p, need) {
    init(p);
    need = Math.round(need);
    if (need <= 0) return 0;
    let got = 0;
    ['deposit', 'stock', 'reit', 'crypto'].forEach(k => {
      if (got >= need) return;
      const take = Math.min(p.inv[k], need - got);
      p.inv[k] -= take; got += take;
    });
    p.money += got;
    return got;
  }

  // 현금을 정책 비율로 나눠 넣는다
  function deploy(p, amount) {
    const pol = POLICY[p.invPolicy];
    if (!pol || amount <= 0) return 0;
    const sum = KEYS.reduce((a, k) => a + (pol.w[k] || 0), 0);
    if (sum <= 0) return 0;
    KEYS.forEach(k => { p.inv[k] = (p.inv[k] || 0) + Math.round(amount * (pol.w[k] || 0) / sum); });
    p.money -= amount;
    return amount;
  }

  // 모든 투자 자산을 정책 비율로 재배분 (정책 변경 시)
  function rebalance(p) {
    init(p);
    const pol = POLICY[p.invPolicy];
    if (!pol) return;
    const all = total(p);
    p.money += all; p.inv = { deposit: 0, stock: 0, crypto: 0, reit: 0 };
    const keep = Math.max(reserve(p), 0);
    if (KEYS.reduce((a, k) => a + (pol.w[k] || 0), 0) <= 0) return;
    const amt = Math.max(0, p.money - keep);
    deploy(p, amt);
  }

  function setPolicy(p, key, doRebalance) {
    init(p);
    if (!POLICY[key]) return;
    p.invPolicy = key;
    S().flag(p, 'asset_start');
    if (doRebalance !== false) rebalance(p);
  }

  function yearly(p) {
    init(p);
    const lines = [];
    step(p);
    const m = p.mkt, before = total(p);
    const gain = {};
    gain.deposit = Math.round(p.inv.deposit * m.rate);
    gain.stock = Math.round(p.inv.stock * (m.stockRet + m.skill));
    gain.crypto = Math.round(p.inv.crypto * (m.cryptoRet + m.skill));
    // 리츠: 임대 배당(연 4~5%) + 부동산 가격 흐름의 일부
    gain.reit = Math.round((p.inv.reit || 0) * (0.045 + m.reRet * 0.8 + R().normal(p, 0, 0.04)));
    KEYS.forEach(k => { p.inv[k] = Math.max(0, (p.inv[k] || 0) + gain[k]); });
    // 실물 부동산(집 · 투자용 부동산 · 건물) 시세 — 지역별 베타를 따른다
    const [beta, drift0] = reBeta(p);
    const drift = drift0 - 0.08 * Math.log(m.reIdx || 1);   // 너무 오른 뒤엔 오르기 어렵고, 너무 빠진 뒤엔 반등한다
    const local = m.reRet * beta + drift;
    m.reIdx = Math.round((m.reIdx || 1) * (1 + local) * 10000) / 10000;
    let reGain = 0;
    const move = (o, b, extra) => { if (!o) return; const r = U().clamp(m.reRet * b + drift + (extra || 0) + R().normal(p, 0, 0.02), -0.3, 0.35); const d = Math.round(o.value * r); o.value += d; reGain += d; return r; };
    move(p.house, beta);
    move(p.prop, beta * ((p.prop && p.prop.beta) || 1));
    move(p.bldg, 0.7, 0.008);
    p.reLast = { ret: Math.round(local * 100), gain: reGain };
    const pl = gain.deposit + gain.stock + gain.crypto + gain.reit;
    p.invLast = { deposit: Math.round(m.rate * 100), stock: Math.round(m.stockRet * 100), crypto: Math.round(m.cryptoRet * 100), reit: Math.round(m.reRet * 100), pl, before };

    // 연금저축 납입
    if (S().has(p, 'private_pension') && p.job && p.age < 60 && p.money > 600) { p.money -= 300; p.inv.deposit += 300; }

    // 남는 현금은 정해 둔 방식대로 굴린다
    if (p.invPolicy && p.invPolicy !== 'cash' && (p.age >= 19 || S().has(p, 'kid_investor'))) {
      const extra = p.money - reserve(p);
      if (extra >= 200) deploy(p, extra);
    }

    if (p.age < 19) return lines; // 어린이에게는 시장 소식이 와닿지 않는다
    // 시장 소식 (내가 가진 만큼만 체감한다)
    const hold = p.inv.stock, coin = p.inv.crypto;
    const cd = k => { if ((p.cool[k] || 0) > p.age) return false; p.cool[k] = p.age + (hold >= 1500 || coin >= 500 ? 3 : 5); return true; };
    if (m.stockRet <= -0.2 && cd('newsCrash')) {
      lines.push({ t: `증시가 폭락했다(${Math.round(m.stockRet * 100)}%).` + (hold >= 500 ? R().pick(p, [' 내 주식 계좌도 파랗게 질렸다.', ' 계좌를 열어 볼 엄두가 나지 않는다.', ' 밤새 해외 증시 뉴스를 새로고침했다.']) : R().pick(p, [' 뉴스마다 곡소리다.', ' 직장 동료들의 한숨이 깊어졌다.', ' 남의 일 같지 않은 분위기다.'])), icon: '📉', major: hold >= 1500 });
      if (hold >= 1000) { if (m.stockRet <= -0.25 && p.age >= 24 && (p.cool.m_crash || 0) <= p.age) p.queue.push({ id: 'm_crash', at: p.age }); }
    } else if (m.stockRet >= 0.28 && cd('newsBoom')) {
      lines.push({ t: `증시가 불타올랐다(+${Math.round(m.stockRet * 100)}%).` + (hold >= 500 ? R().pick(p, [' 계좌가 두툼해졌다.', ' 수익률 화면을 한참 들여다봤다.', ' 괜히 어깨가 으쓱해진다.']) : R().pick(p, [' 남들은 다 벌었다는데…', ' 투자할걸 하는 후회가 스친다.', ' 점심시간에 주식 얘기만 오간다.'])), icon: '📈', major: hold >= 1500 });
    }
    if (m.cryptoRet >= 1.0 && cd('newsCoin')) {
      lines.push({ t: `코인 시장이 폭등했다(+${Math.round(m.cryptoRet * 100)}%).` + (coin >= 200 ? R().pick(p, [' 숫자가 믿기지 않는다.', ' 손이 떨려서 화면을 못 보겠다.', ' 지금 팔아야 하나 계속 고민이다.']) : R().pick(p, [' 직장 동료들이 코인 이야기뿐이다.', ' 주변에 벼락부자 소문이 돈다.', ' 괜히 마음이 싱숭생숭하다.'])), icon: '🪙', major: coin >= 500 });
      if (m.cryptoRet >= 1.2 && coin < 200 && p.age >= 22 && p.money >= 500 && (p.cool.m_fomo || 0) <= p.age) p.queue.push({ id: 'm_fomo', at: p.age });
    } else if (m.cryptoRet <= -0.6 && coin >= 300 && cd('newsCoinDown')) {
      lines.push({ t: `코인이 폭락했다(${Math.round(m.cryptoRet * 100)}%).` + R().pick(p, [' 잔고가 반의 반 토막이 났다.', ' 커뮤니티가 장례식장 분위기다.', ' 어제의 수익은 꿈처럼 사라졌다.']), icon: '💥', major: true });
    }
    if (pl <= -3000 && before >= 6000 && cd('newsPL')) lines.push({ t: `올해 투자 손익은 ${U().money(pl)}원.` + R().pick(p, [' 쓰라린 한 해였다.', ' 수업료치고는 비싸다.', ' 한숨이 절로 나온다.']), icon: '😮‍💨' });
    else if (pl >= Math.max(3000, before * 0.12) && before >= 6000 && (p.cool.m_gain || 0) <= p.age && (p.cool.m_gain = p.age + 3)) lines.push({ t: `올해 투자로 ${U().money(pl)}원을 벌었다.` + R().pick(p, ['', ' 복리의 힘이 보이기 시작한다.', ' 인내가 보상받았다.']), icon: '💹' });
    // 부동산 소식: 집·투자용 부동산이 있으면 시세 변화를 체감한다. 집이 없으면 상승기가 마음을 조급하게 만든다
    const ownRE = (p.house ? p.house.value : 0) + (p.prop ? p.prop.value : 0);
    if (ownRE > 0 && Math.abs(local) >= 0.05 && (p.cool.reNews || 0) <= p.age) {
      p.cool.reNews = p.age + 2;
      const up = reGain > 0;
      lines.push({ t: up ? R().pick(p, [`${S().liveRegion(p).short} 집값이 올랐다(${local >= 0 ? '+' : ''}${Math.round(local * 100)}%). 부동산 앱의 시세를 몇 번이고 새로고침했다.`, `동네 아파트 실거래가가 또 올랐다(+${Math.round(local * 100)}%). 괜히 마음이 든든하다.`])
        : R().pick(p, [`${S().liveRegion(p).short} 집값이 떨어졌다(${Math.round(local * 100)}%). 대출 이자는 그대로인데 시세만 빠진다.`, `부동산 경기가 얼어붙었다(${Math.round(local * 100)}%). 급매물 현수막이 늘었다.`]), icon: up ? '🏘️' : '🏚️', major: Math.abs(reGain) >= 5000 });
    } else if (!ownRE && p.age >= 28 && p.age <= 55 && m.re === 'boom' && local >= 0.06 && (p.cool.reNews || 0) <= p.age && p.liveIn !== 'abroad') {
      p.cool.reNews = p.age + 4;
      lines.push({ t: `${S().liveRegion(p).short} 집값이 또 뛰었다(+${Math.round(local * 100)}%). 내 집 마련이 한 걸음 멀어진 기분이다.`, icon: '🏘️', fx: '스트레스 +3' });
      S().addStat(p, 'stress', 3);
    }

    // 내 돈이 크게 불거나 줄면 기분도 따라 움직인다 (재산 대비 비율로: 1억 가진 사람의 1천만 원과 100억 가진 사람의 1천만 원은 다르다)
    const base = Math.max(3000, before + Math.max(0, p.money) + (p.house ? p.house.value * 0.3 : 0));
    const ratio = (pl + reGain) / base;
    if ((ratio >= 0.1 || ratio <= -0.08) && Math.abs(pl) >= 300) {
      const dh = Math.round(U().clamp(ratio * 40, -10, 9)), ds = Math.round(U().clamp(-ratio * 30, -5, 9));
      if (dh) S().addStat(p, 'happy', dh);
      if (ds) S().addStat(p, 'stress', ds);
      if (ratio >= 0.25) S().addStat(p, 'mental', 1);          // 큰 성공은 자신감이 된다
      if (ratio <= -0.25) S().addStat(p, 'mental', 1);         // 큰 손실을 버틴 경험도 단단함이 된다
      const fx = [dh ? `행복 ${dh > 0 ? '+' : ''}${dh}` : '', ds ? `스트레스 ${ds > 0 ? '+' : ''}${ds}` : '', Math.abs(pl) >= 50 ? `투자 손익 ${pl > 0 ? '+' : ''}${U().money(pl)}` : '', Math.abs(reGain) >= 50 ? `부동산 ${reGain > 0 ? '+' : ''}${U().money(reGain)}` : ''].filter(Boolean).join(' · ');
      const last = lines.length ? lines[lines.length - 1] : null;
      if (last) last.fx = last.fx ? last.fx + ' · ' + fx : fx;
      else if (Math.abs(ratio) >= 0.15 && Math.abs(pl) >= 1000) lines.push({ t: pl + reGain > 0 ? '자산이 불었다.' : '자산이 줄었다.', fx, icon: pl > 0 ? '💹' : '😮‍💨' });
    }
    return lines;
  }

  function allocation(p) {
    init(p);
    const house = p.house ? p.house.value : 0;
    const rows = [
      { k: 'cash', name: '현금', icon: '👛', v: Math.max(0, p.money) },
      { k: 'deposit', name: CLASSES.deposit.name, icon: CLASSES.deposit.icon, v: p.inv.deposit },
      { k: 'stock', name: CLASSES.stock.name, icon: CLASSES.stock.icon, v: p.inv.stock },
      { k: 'crypto', name: CLASSES.crypto.name, icon: CLASSES.crypto.icon, v: p.inv.crypto },
      { k: 'reit', name: CLASSES.reit.name, icon: CLASSES.reit.icon, v: p.inv.reit || 0 },
      { k: 'house', name: '내 집', icon: '🏠', v: house },
      { k: 'prop', name: p.prop ? p.prop.label : '투자용 부동산', icon: '🏘️', v: (p.prop ? p.prop.value : 0) + (p.bldg ? p.bldg.value : 0) }
    ];
    return rows;
  }

  LG.Invest = { CLASSES, KEYS, RE_NAME, reBeta, POLICY, REGIME_NAME, CRYPTO_NAME, init, total, yearly, raise, deploy, rebalance, setPolicy, allocation, reserve };
})(window.LG = window.LG || {});
