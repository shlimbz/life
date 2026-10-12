/* InvestSystem — 돈을 벌기 시작하면 '어떻게 굴릴지'를 정한다.
   현금 · 예적금 · 주식(ETF) · 코인 · 부동산(집)으로 자산이 나뉘고, 해마다 시장이 움직인다.
   시장은 레짐(상승/보합/하락)과 코인 사이클을 따라 출렁이고, 내 선택(운용 방식)은 그 위에서 결과를 바꾼다. 금액 단위: 만원 */
(function (LG) {
  'use strict';
  const U = () => LG.U, S = () => LG.State, R = () => LG.RNG;

  const CLASSES = {
    deposit: { name: '예적금', icon: '🏦' },
    stock:   { name: '주식·ETF', icon: '📈' },
    crypto:  { name: '코인', icon: '🪙' }
  };
  const POLICY = {
    cash:     { name: '그냥 통장에', icon: '👛', desc: '투자하지 않고 현금으로 둔다', w: { deposit: 0, stock: 0, crypto: 0 } },
    saver:    { name: '예적금 위주', icon: '🏦', desc: '원금 보존이 우선. 느리지만 확실하게', w: { deposit: 1, stock: 0, crypto: 0 } },
    balanced: { name: '균형 투자', icon: '⚖️', desc: '예적금 40 · 주식 55 · 코인 5', w: { deposit: 0.4, stock: 0.55, crypto: 0.05 } },
    growth:   { name: '성장 투자', icon: '🌱', desc: '예적금 15 · 주식 70 · 코인 15', w: { deposit: 0.15, stock: 0.7, crypto: 0.15 } },
    yolo:     { name: '공격 투자', icon: '🎲', desc: '주식 40 · 코인 60. 크게 벌거나 크게 잃는다', w: { deposit: 0, stock: 0.4, crypto: 0.6 } }
  };
  const REGIME_NAME = { bull: '상승장', normal: '보합장', bear: '하락장' };
  const CRYPTO_NAME = { boom: '코인 열풍', flat: '코인 잠잠', bust: '코인 한파' };

  function init(p) {
    p.inv = p.inv || { deposit: 0, stock: 0, crypto: 0 };
    if (p.invPolicy === undefined) p.invPolicy = null;
    p.mkt = p.mkt || { regime: 'normal', crypto: 'flat', rate: 0.025, stockRet: 0, cryptoRet: 0, hist: [] };
    p.invLast = p.invLast || { deposit: 0, stock: 0, crypto: 0, pl: 0 };
  }

  const total = p => { init(p); return p.inv.deposit + p.inv.stock + p.inv.crypto; };

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
    ['deposit', 'stock', 'crypto'].forEach(k => {
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
    const sum = pol.w.deposit + pol.w.stock + pol.w.crypto;
    if (sum <= 0) return 0;
    Object.keys(pol.w).forEach(k => { p.inv[k] += Math.round(amount * pol.w[k] / sum); });
    p.money -= amount;
    return amount;
  }

  // 모든 투자 자산을 정책 비율로 재배분 (정책 변경 시)
  function rebalance(p) {
    init(p);
    const pol = POLICY[p.invPolicy];
    if (!pol) return;
    const all = total(p);
    p.money += all; p.inv = { deposit: 0, stock: 0, crypto: 0 };
    const keep = Math.max(reserve(p), 0);
    if (pol.w.deposit + pol.w.stock + pol.w.crypto <= 0) return;
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
    ['deposit', 'stock', 'crypto'].forEach(k => { p.inv[k] = Math.max(0, p.inv[k] + gain[k]); });
    const pl = gain.deposit + gain.stock + gain.crypto;
    p.invLast = { deposit: Math.round(m.rate * 100), stock: Math.round(m.stockRet * 100), crypto: Math.round(m.cryptoRet * 100), pl, before };

    // 연금저축 납입
    if (S().has(p, 'private_pension') && p.job && p.age < 60 && p.money > 600) { p.money -= 300; p.inv.deposit += 300; }

    // 남는 현금은 정해 둔 방식대로 굴린다
    if (p.invPolicy && p.invPolicy !== 'cash' && p.age >= 19) {
      const extra = p.money - reserve(p);
      if (extra >= 200) deploy(p, extra);
    }

    if (p.age < 19) return lines; // 어린이에게는 시장 소식이 와닿지 않는다
    // 시장 소식 (내가 가진 만큼만 체감한다)
    const hold = p.inv.stock, coin = p.inv.crypto;
    if (m.stockRet <= -0.2) {
      lines.push({ t: `증시가 폭락했다(${Math.round(m.stockRet * 100)}%).` + (hold >= 500 ? R().pick(p, [' 내 주식 계좌도 파랗게 질렸다.', ' 계좌를 열어 볼 엄두가 나지 않는다.', ' 밤새 해외 증시 뉴스를 새로고침했다.']) : R().pick(p, [' 뉴스마다 곡소리다.', ' 직장 동료들의 한숨이 깊어졌다.', ' 남의 일 같지 않은 분위기다.'])), icon: '📉', major: hold >= 1500 });
      if (hold >= 1000) { S().addStat(p, 'stress', 6); S().addStat(p, 'happy', -3); if (m.stockRet <= -0.25 && p.age >= 24 && (p.cool.m_crash || 0) <= p.age) p.queue.push({ id: 'm_crash', at: p.age }); }
    } else if (m.stockRet >= 0.28) {
      lines.push({ t: `증시가 불타올랐다(+${Math.round(m.stockRet * 100)}%).` + (hold >= 500 ? R().pick(p, [' 계좌가 두툼해졌다.', ' 수익률 화면을 한참 들여다봤다.', ' 괜히 어깨가 으쓱해진다.']) : R().pick(p, [' 남들은 다 벌었다는데…', ' 투자할걸 하는 후회가 스친다.', ' 점심시간에 주식 얘기만 오간다.'])), icon: '📈', major: hold >= 1500 });
    }
    if (m.cryptoRet >= 1.0) {
      lines.push({ t: `코인 시장이 폭등했다(+${Math.round(m.cryptoRet * 100)}%).` + (coin >= 200 ? R().pick(p, [' 숫자가 믿기지 않는다.', ' 손이 떨려서 화면을 못 보겠다.', ' 지금 팔아야 하나 계속 고민이다.']) : R().pick(p, [' 직장 동료들이 코인 이야기뿐이다.', ' 주변에 벼락부자 소문이 돈다.', ' 괜히 마음이 싱숭생숭하다.'])), icon: '🪙', major: coin >= 500 });
      if (m.cryptoRet >= 1.2 && coin < 200 && p.age >= 22 && p.money >= 500 && (p.cool.m_fomo || 0) <= p.age) p.queue.push({ id: 'm_fomo', at: p.age });
    } else if (m.cryptoRet <= -0.6 && coin >= 300) {
      lines.push({ t: `코인이 폭락했다(${Math.round(m.cryptoRet * 100)}%).` + R().pick(p, [' 잔고가 반의 반 토막이 났다.', ' 커뮤니티가 장례식장 분위기다.', ' 어제의 수익은 꿈처럼 사라졌다.']), icon: '💥', major: true });
      S().addStat(p, 'stress', 8); S().addStat(p, 'happy', -6);
    }
    if (pl <= -3000 && before >= 6000) lines.push({ t: `올해 투자 손익은 ${U().money(pl)}원.` + R().pick(p, [' 쓰라린 한 해였다.', ' 수업료치고는 비싸다.', ' 한숨이 절로 나온다.']), icon: '😮‍💨' });
    else if (pl >= Math.max(3000, before * 0.12) && before >= 6000 && (p.cool.m_gain || 0) <= p.age && (p.cool.m_gain = p.age + 3)) lines.push({ t: `올해 투자로 ${U().money(pl)}원을 벌었다.` + R().pick(p, ['', ' 복리의 힘이 보이기 시작한다.', ' 인내가 보상받았다.']), icon: '💹' });
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
      { k: 'house', name: '부동산', icon: '🏠', v: house }
    ];
    return rows;
  }

  LG.Invest = { CLASSES, POLICY, REGIME_NAME, CRYPTO_NAME, init, total, yearly, raise, deploy, rebalance, setPolicy, allocation, reserve };
})(window.LG = window.LG || {});
