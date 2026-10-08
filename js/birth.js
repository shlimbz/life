/* BirthGenerator — 성별 외 모든 출생 조건을 랜덤 생성한다.
   출생 환경은 '난이도'가 아니라 장점과 단점의 조합이다. */
(function (LG) {
  'use strict';
  const R = () => LG.RNG, U = () => LG.U, S = () => LG.State;

  const HOMES = {
    urban: { 1: ['반지하 단칸방', '오래된 다세대 주택'], 2: ['작은 빌라', '임대 아파트'], 3: ['아파트', '빌라'], 4: ['넓은 아파트', '신축 아파트'], 5: ['고급 아파트', '단독주택'] },
    rural: { 1: ['낡은 시골집', '조립식 주택'], 2: ['시골 주택', '작은 연립'], 3: ['시골 단독주택', '읍내 아파트'], 4: ['넓은 전원주택', '읍내 신축 아파트'], 5: ['큰 전원주택', '과수원이 딸린 집'] }
  };
  const TIER_LABEL = { 1: '어려움', 2: '빠듯함', 3: '보통', 4: '여유 있음', 5: '부유함' };

  function generate(gender, seed) {
    const p = S().create(gender, seed);
    const r = R();

    // 1. 이름
    p.surname = r.weightedKey(p, LG.DATA.names.surnames);
    p.given = r.pick(p, gender === 'M' ? LG.DATA.names.male : LG.DATA.names.female);
    p.name = p.surname + p.given;

    // 2. 출생연도
    p.birthYear = r.int(p, 1988, 2010);
    p.year = p.birthYear;

    // 3. 지역 / 도시·농촌
    const regions = LG.DATA.regions;
    p.region = r.weightedKey(p, Object.fromEntries(Object.keys(regions).map(k => [k, regions[k].pop])));
    const reg = regions[p.region];
    p.urban = reg.rural.length === 0 || r.chance(p, reg.urban);
    p.town = r.pick(p, p.urban ? reg.cities : reg.rural);

    // 4. 가정 형편 (지역 편향 + 정규분포, 1~5)
    const tierRaw = r.normal(p, 3 + reg.wealth * 0.9 - (p.urban ? 0 : 0.35), 1.0);
    p.family.tier = U().clamp(Math.round(tierRaw), 1, 5);

    // 5. 가족 형태
    const structure = r.weightedKey(p, { both: 68, single_mom: 9, single_dad: 4, grand: 10, big: 9 });
    p.family.structure = structure === 'big' ? 'both' : structure;
    const tags = [];
    if (structure === 'big') tags.push('big_family');
    if (structure === 'single_mom' || structure === 'single_dad') { tags.push('single_parent'); p.family.tier = Math.max(1, p.family.tier - (r.chance(p, 0.6) ? 1 : 0)); }

    // 6. 부모 NPC
    const mkParent = (role, gender) => {
      const age = r.int(p, 25, 38) + (role === 'father' ? r.int(p, 0, 3) : 0);
      const job = r.weightedKey(p, LG.DATA.parentJobs[p.family.tier]);
      const J = LG.DATA.jobs[job];
      const pers = r.pick(p, LG.Rel.PERSONALITIES);
      let support = r.normal(p, 58, 16);
      if (pers === '다정함') support += 10; if (pers === '걱정 많음') support += 6;
      if (pers === '자유로움') support -= 6; if (pers === '무뚝뚝함') support -= 4;
      return LG.Rel.make(p, role, {
        gender, age, job, gen: 'older',
        surname: role === 'father' ? p.surname : undefined,
        income: Math.round(J.income * (1 + (age - 25) * 0.03) * r.float(p, 0.8, 1.2)),
        edu: U().clamp(Math.round(r.normal(p, 40 + p.family.tier * 8, 12)), 5, 100),
        health: U().clamp(Math.round(r.normal(p, 78, 10)), 35, 100),
        personality: pers, support: U().clamp(Math.round(support), 5, 100),
        rel: U().clamp(Math.round(r.normal(p, 75, 10)), 30, 100)
      });
    };
    if (structure !== 'single_mom') mkParent('father', 'M');
    if (structure !== 'single_dad') mkParent('mother', 'F');
    if (structure === 'grand') {
      LG.Rel.make(p, 'grandparent', { gender: r.chance(p, 0.6) ? 'F' : 'M', age: r.int(p, 58, 72), gen: 'older', rel: 80, support: 70, health: r.int(p, 45, 80) });
      tags.push('with_grandparents');
    }
    const parents = LG.Rel.parents(p).filter(n => n.role !== 'grandparent');
    const working = parents.filter(n => n.job !== 'homemaker');
    if (working.length === 2) tags.push('dual_income');
    if (parents.some(n => n.job === 'selfemp')) tags.push('self_employed');
    if (parents.some(n => ['doctor', 'lawyer', 'ceo', 'nurse'].indexOf(n.job) >= 0) || (working.length === 2 && r.chance(p, 0.35))) tags.push('busy_parents');
    if (parents.length === 2 && r.chance(p, 0.16)) tags.push('conflict'); // 이후 부모 이혼/다툼 이벤트
    if (p.family.tier <= 2 && r.chance(p, 0.3)) tags.push('job_risk');  // 이후 부모 실직 이벤트

    // 7. 형제자매
    const nSib = structure === 'big' ? r.int(p, 2, 4) : +r.weightedKey(p, { 0: 34, 1: 46, 2: 15, 3: 5 });
    if (nSib === 0) tags.push('only_child');
    for (let i = 0; i < nSib; i++) {
      const older = r.chance(p, 0.55);
      LG.Rel.make(p, 'sibling', { age: older ? r.int(p, 1, 6) : 0, gen: 'peer', surname: p.surname, rel: r.int(p, 50, 85), note: older ? '손위' : '동생' });
    }
    // 동생은 나중에 태어난 것으로 (나이 음수 → 출생 시 0)
    p.people.filter(n => n.role === 'sibling' && n.note === '동생').forEach(n => { n.age = -r.int(p, 1, 5); n.alive = true; });

    // 8. 주거
    p.family.home = r.pick(p, HOMES[p.urban ? 'urban' : 'rural'][p.family.tier]);
    p.family.tags = tags;

    // 9. 교육환경 (지역 접근성 + 형편 + 부모 학력)
    const pEdu = parents.length ? parents.reduce((a, n) => a + n.edu, 0) / parents.length : 50;
    p.family.eduEnv = Math.round(U().clamp(S().regionAttr(p, 'edu') * 0.45 + p.family.tier * 7 + pEdu * 0.25 + r.float(p, -6, 6), 5, 100));

    // 10. 능력치
    const st = p.stats;
    st.health = Math.round(U().clamp(r.normal(p, 74, 12) + (p.family.tier - 3) * 1.5, 25, 98));
    ['intelligence', 'social', 'physical', 'creativity', 'mental'].forEach(k => { st[k] = Math.round(U().clamp(r.normal(p, 50, 14), 8, 92)); });

    // 11. 재능 (숨김)
    const nTal = +r.weightedKey(p, { 0: 33, 1: 47, 2: 20 });
    const talKeys = Object.keys(LG.DATA.talents);
    while (p.talents.length < nTal) {
      const t = r.pick(p, talKeys);
      if (p.talents.indexOf(t) < 0) {
        p.talents.push(t);
        const b = LG.DATA.talents[t].boost;
        Object.keys(b).forEach(k => S().addStat(p, k, b[k]));
      }
    }

    // 12. 성격 (5축 중 3축)
    const axes = LG.DATA.traitAxes.slice();
    for (let i = 0; i < 3; i++) {
      const ax = axes.splice(r.int(p, 0, axes.length - 1), 1)[0];
      const t = r.pick(p, ax);
      p.traits.push(t);
      const T = LG.DATA.traits[t];
      if (T.stat) Object.keys(T.stat).forEach(k => S().addStat(p, k, T.stat[k]));
    }

    // 13. 숨은 운
    p.luck = r.int(p, -4, 4);
    p.happy = 70; p.stress = 10;
    p.homeLabel = p.family.home;
    return p;
  }

  // 출생 환경의 장점과 단점 (항상 둘 다 존재)
  function prosCons(p) {
    const S_ = S();
    const pros = [], cons = [];
    const edu = S_.regionAttr(p, 'edu'), job = S_.regionAttr(p, 'job'), com = S_.regionAttr(p, 'community');
    const reg = LG.DATA.regions[p.region];
    const rent = reg.rent * (p.urban ? 1 : 0.6);
    if (edu >= 74) pros.push('학원·학교 선택지가 많다'); else if (edu < 56) cons.push('교육 기회와 대학 접근성이 낮다');
    if (job >= 72) pros.push('주변에 일자리가 많다'); else if (job < 52) cons.push('원하는 직장은 멀리 있다');
    if (com >= 70) pros.push('이웃끼리 서로 챙기는 동네'); else if (com < 50) cons.push('치열한 경쟁 속에서 자란다');
    if (rent <= 450) pros.push('주거비·생활비 부담이 적다'); else if (rent >= 700) cons.push('집값과 생활비가 비싸다');
    if (S_.regionAttr(p, 'medical') >= 78) pros.push('병원이 가깝다');
    if (S_.regionAttr(p, 'culture') < 45) cons.push('문화시설이 부족하다');
    const t = p.family.tier;
    if (t >= 4) { pros.push('경제적으로 여유 있는 집'); cons.push('높은 기대와 비교 속에서 자란다'); }
    if (t <= 2) { cons.push('집안 형편이 빠듯하다'); pros.push('일찍 철이 들고 생활력이 생긴다'); }
    const tags = p.family.tags;
    if (tags.indexOf('dual_income') >= 0) { pros.push('맞벌이로 살림은 안정적'); cons.push('부모님과 보내는 시간이 적다'); }
    if (tags.indexOf('with_grandparents') >= 0) pros.push('조부모님의 사랑을 듬뿍 받는다');
    if (tags.indexOf('single_parent') >= 0) cons.push('한 부모가 모든 짐을 진다');
    if (tags.indexOf('only_child') >= 0) pros.push('관심과 지원이 한 몸에 쏠린다');
    if (tags.indexOf('big_family') >= 0) { pros.push('형제가 많아 외롭지 않다'); cons.push('나눠 써야 하는 것이 많다'); }
    if (tags.indexOf('self_employed') >= 0) pros.push('어깨너머로 장사를 배운다');
    if (!pros.length) pros.push('평범하지만 무난한 시작');
    if (!cons.length) cons.push('특별한 기회도 많지는 않다');
    return { pros: pros.slice(0, 3), cons: cons.slice(0, 3) };
  }

  LG.Birth = { generate, prosCons, TIER_LABEL };
})(window.LG = window.LG || {});
