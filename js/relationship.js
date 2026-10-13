/* RelationshipSystem — 가족·친구·연인·배우자·자녀를 개별 NPC로 관리한다.
   플레이어는 관계에 영향을 줄 수 있지만 상대의 행동을 통제할 수 없다. */
(function (LG) {
  'use strict';
  const R = () => LG.RNG, U = () => LG.U;

  const PERSONALITIES = ['다정함', '엄격함', '실용적', '자유로움', '걱정 많음', '유쾌함', '무뚝뚝함', '이성적'];
  const ROLE_LABEL = {
    father: '아버지', mother: '어머니', grandparent: '조부모', sibling: '형제', friend: '친구',
    partner: '연인', spouse: '배우자', child: '자녀', ex: '옛 연인', ex_spouse: '전 배우자'
  };
  const PARENT_ROLES = ['father', 'mother', 'grandparent'];
  // 알림 카드에 보여 줄 변화 한 줄 (행복 -14 등)
  const dl = (k, d) => ({ k, d, icon: { happy: '😊', stress: '😣' }[k], label: { happy: '행복', stress: '스트레스' }[k], text: (d > 0 ? '+' : '') + d, good: k === 'stress' ? d < 0 : d > 0 });

  const Rel = {
    PERSONALITIES, ROLE_LABEL,

    makeName(p, gender, gen, surname) {
      const N = LG.DATA.names;
      const sur = surname || R().weightedKey(p, N.surnames);
      let pool;
      if (gen === 'older') pool = gender === 'M' ? N.olderMale : N.olderFemale;
      else if (gen === 'child') pool = gender === 'M' ? N.childMale.concat(N.male.slice(0, 10)) : N.childFemale.concat(N.female.slice(0, 10));
      else pool = gender === 'M' ? N.male : N.female;
      return sur + R().pick(p, pool);
    },

    make(p, role, o) {
      o = o || {};
      const gender = o.gender || (R().chance(p, 0.5) ? 'M' : 'F');
      const npc = {
        id: p.nextId++, role, gender,
        name: o.name || Rel.makeName(p, gender, o.gen || 'peer', o.surname),
        age: o.age != null ? o.age : p.age,
        job: o.job || null,
        personality: o.personality || R().pick(p, PERSONALITIES),
        income: o.income || 0,
        edu: o.edu != null ? o.edu : Math.round(R().normal(p, 55, 15)),
        health: o.health != null ? o.health : Math.round(U().clamp(R().normal(p, 75, 10), 30, 100)),
        rel: o.rel != null ? o.rel : 55,
        support: o.support,
        alive: true, since: p.age,
        note: o.note || ''
      };
      p.people.push(npc);
      return npc;
    },

    get(p, role) { return p.people.find(n => n.alive && n.age >= 0 && n.role === role) || null; },
    all(p, role) { return p.people.filter(n => n.alive && n.age >= 0 && n.role === role); },
    parents(p) { return p.people.filter(n => n.alive && PARENT_ROLES.indexOf(n.role) >= 0); },

    // 그룹 단위 관계 변화
    adjust(p, key, d) {
      let list;
      switch (key) {
        case 'parents': list = Rel.parents(p); break;
        case 'partner': list = Rel.all(p, 'partner'); break;
        case 'spouse': list = Rel.all(p, 'spouse'); break;
        case 'love': list = Rel.all(p, 'spouse').concat(Rel.all(p, 'partner')); break;
        case 'children': list = Rel.all(p, 'child'); break;
        case 'friends': list = Rel.all(p, 'friend'); break;
        case 'siblings': list = Rel.all(p, 'sibling'); break;
        case 'grandparent': list = Rel.all(p, 'grandparent'); break;
        case 'family': list = p.people.filter(n => n.alive && ['father', 'mother', 'grandparent', 'sibling', 'spouse', 'child'].indexOf(n.role) >= 0); break;
        default: list = [];
      }
      list.forEach(n => { n.rel = U().clamp(n.rel + d, 0, 100); });
      return list.length;
    },

    randomJobFor(p, age, eduHint) {
      if (age < 23) return R().chance(p, 0.5) ? 'parttime' : null;
      return R().weightedKey(p, {
        office_small: 6, office_big: 3, civil: 2, teacher: 2, developer: 2, designer: 1.5, nurse: 1.5,
        service: 3, technician: 2, selfemp: 1.5, freelancer: 1.2, researcher: 0.6, doctor: 0.3, cook: 1
      });
    },

    // 새 인연 (연인 후보)
    makeLoveInterest(p, o) {
      o = o || {};
      const g = p.gender === 'M' ? 'F' : 'M';
      const age = U().clamp(p.age + R().int(p, -3, 3), 18, 99);
      const job = Rel.randomJobFor(p, age);
      const J = job ? LG.DATA.jobs[job] : null;
      return Rel.make(p, o.role || 'partner', {
        gender: g, age, job,
        income: J ? Math.round(J.income * (1 + Math.max(0, age - 25) * 0.025)) : 0,
        rel: o.rel || R().int(p, 58, 72)
      });
    },

    addFriend(p, rel, note) {
      const f = Rel.make(p, 'friend', { age: p.age + R().int(p, -1, 1), rel: rel || 60, gender: R().chance(p, 0.6) ? p.gender : (p.gender === 'M' ? 'F' : 'M'), note });
      return f;
    },

    marry(p) {
      const pt = Rel.get(p, 'partner');
      if (!pt) return null;
      pt.role = 'spouse'; pt.since = p.age;
      LG.State.flag(p, 'married');
      LG.State.unflag(p, 'dating');
      p.flags.marriedAt = p.age;
      p.exp += 4;
      return pt;
    },

    // 예전 인연이 다시 연인이 된다 (새 사람을 만들지 않고 같은 사람이 돌아온다)
    revive(p, n, rel) {
      if (!n || !n.alive) return null;
      const cur = Rel.get(p, 'partner'); if (cur && cur !== n) Rel.breakup(p);
      n.role = 'partner'; n.rel = Math.max(n.rel, rel || 66); n.since = p.age; n.waits = 0; n.proposer = null;
      LG.State.flag(p, 'dating');
      return n;
    },
    // 지난 인연 후보: 첫사랑 → 가장 최근의 옛 연인 순
    pastLove(p) {
      const alive = n => n && n.alive && n.age >= 18;
      const fl = p.firstLoveId != null ? p.people.find(n => n.id === p.firstLoveId) : null;
      const exes = p.people.filter(n => alive(n) && n.role === 'ex').sort((a, b) => b.since - a.since);
      return alive(fl) && ['ex', 'crush', 'past_friend', 'friend'].indexOf(fl.role) >= 0 ? fl : exes[0] || null;
    },

    breakup(p) {
      const pt = Rel.get(p, 'partner');
      if (pt) { pt.role = 'ex'; pt.rel = Math.min(pt.rel, 30); }
      LG.State.unflag(p, 'dating');
      LG.State.flag(p, 'had_breakup');
      return pt;
    },

    divorce(p) {
      const sp = Rel.get(p, 'spouse');
      if (!sp) return null;
      sp.role = 'ex_spouse'; sp.rel = Math.min(sp.rel, 25);
      LG.State.unflag(p, 'married');
      LG.State.flag(p, 'divorced');
      // 재산 분할
      p.money = Math.round(p.money * 0.55);
      if (p.inv) LG.Invest.KEYS.forEach(k => { p.inv[k] = Math.round((p.inv[k] || 0) * 0.55); });
      if (p.prop) { const eq = p.prop.value - LG.Loans.amount(p, 'prop') - LG.Loans.amount(p, 'deposit'); p.money += Math.round(Math.max(0, eq) * 0.5); LG.Loans.pay(p, LG.Loans.amount(p, 'prop') + LG.Loans.amount(p, 'deposit'), ['prop', 'deposit']); p.prop = null; }
      if (p.house) { const owe = LG.Loans.amount(p, 'mortgage'); LG.Loans.pay(p, Math.min(owe, p.house.value), ['mortgage']); p.money += Math.round(Math.max(0, p.house.value - owe) * 0.5); p.house = null; p.home = 'rent'; }
      Rel.adjust(p, 'children', -8);
      return sp;
    },

    haveChild(p) {
      const g = R().chance(p, 0.51) ? 'M' : 'F';
      const sur = p.gender === 'M' ? p.surname : (Rel.get(p, 'spouse') ? Rel.get(p, 'spouse').name[0] : p.surname);
      const c = Rel.make(p, 'child', { gender: g, age: 0, gen: 'child', surname: sur, rel: 80, health: R().int(p, 60, 95) });
      LG.State.flag(p, 'parent');
      p.exp += 4;
      return c;
    },

    childCount(p) { return p.people.filter(n => n.role === 'child').length; },

    // 매년 실행
    yearly(p) {
      const lines = [];
      const S = LG.State;
      p.people.forEach(n => {
        if (!n.alive) return;
        n.age++;
        if (n.role === 'sibling' && n.age === 0) lines.push({ t: `동생 ${n.name}이(가) 태어났다.`, icon: '👶', major: true });
        if (n.age < 0) return;
        // 노화
        if (n.age > 40) n.health = U().clamp(n.health - (n.age > 75 ? 1.8 : n.age > 60 ? 1.1 : 0.5) + R().float(p, -0.8, 0.8), 1, 100);
        if (n.income && n.job && n.age < 63) n.income = Math.round(n.income * 1.025);
        if (n.age >= 63 && n.job && n.role !== 'child') { n.job = null; n.income = Math.round(n.income * 0.3); }
      });

      // 사망 (부모·조부모·배우자·형제, 그리고 60세 이상이 된 자녀)
      // 의도: 젊은 자녀의 죽음은 무작위 '자연사'로 다루지 않는다(너무 자의적이고 가혹하다).
      //       자녀가 60세를 넘긴 뒤(내가 아주 오래 살았을 때)만 노화에 따른 사망이 일어날 수 있다.
      const CHILD_NATURAL_DEATH_AGE = 60;
      p.people.forEach(n => {
        if (!n.alive) return;
        if (n.role === 'child' && n.age < CHILD_NATURAL_DEATH_AGE) return;
        if (['ex', 'ex_spouse', 'friend'].indexOf(n.role) >= 0) return;
        const hz = LG.Health.hazard(n.age, n.health, n.gender) * (n.role === 'grandparent' ? 1.2 : 1);
        if (R().chance(p, hz) || n.age >= 102) {
          n.alive = false; n.diedAt = p.age;
          const label = Rel.ROLE_LABEL[n.role] || '';
          if (PARENT_ROLES.indexOf(n.role) >= 0) {
            lines.push({ t: `${label} ${n.name}님이 ${n.age}세로 세상을 떠나셨다.`, major: true, icon: '🕯️', card: { title: `${label}와의 이별`, icon: '🕯️', text: `${label} ${n.name}님이 ${n.age}세로 세상을 떠나셨다. 장례식장에서 사흘을 보냈다. 집에 돌아와서야 실감이 났다.`, deltas: [dl('happy', -14), dl('stress', 10)] }, fx: '행복 -14 · 스트레스 +10' });
            p.happy = U().clamp(p.happy - 14, 0, 100);
            p.stress = U().clamp(p.stress + 10, 0, 100);
            S.flag(p, 'parent_lost');
            if (p.age < 19 && !Rel.parents(p).length) S.flag(p, 'young_carer');   // 부모를 모두 잃은 미성년 = 소년소녀가장
          } else if (n.role === 'spouse') {
            lines.push({ t: `배우자 ${n.name}이(가) ${n.age}세로 먼저 세상을 떠났다.`, major: true, icon: '🕯️', card: { title: '배우자와의 이별', icon: '🕯️', text: `평생을 함께한 ${n.name.slice(1)}이(가) ${n.age}세로 먼저 떠났다. 집 안의 모든 물건이 그 사람을 기억한다.`, deltas: [dl('happy', -22)] }, fx: '행복 -22' });
            p.happy = U().clamp(p.happy - 22, 0, 100);
            S.flag(p, 'widowed'); S.unflag(p, 'married');
          } else if (n.role === 'sibling') {
            lines.push({ t: `형제 ${n.name}을(를) 먼저 떠나보냈다.`, major: true, icon: '🕯️', fx: '행복 -10' });
            p.happy = U().clamp(p.happy - 10, 0, 100);
          } else if (n.role === 'child') {
            lines.push({ t: `자녀 ${n.name}이(가) 먼저 세상을 떠났다.`, major: true, icon: '🕯️', card: { title: '자식을 먼저 보내다', icon: '🕯️', text: `${n.name}이(가) 먼저 세상을 떠났다. 세상에서 가장 무거운 슬픔이었다.`, deltas: [dl('happy', -25)] }, fx: '행복 -25' });
            p.happy = U().clamp(p.happy - 25, 0, 100);
          }
          // 상속: 부모 세대가 모두 떠났을 때
          if (PARENT_ROLES.indexOf(n.role) >= 0 && !Rel.parents(p).length && !S.has(p, 'inherited') && p.age >= 20) {
            const base = ({ 1: 0, 2: 600, 3: 3000, 4: 12000, 5: 40000 }[p.family.tier] || 0) * LG.Birth.giftMul(p);
            const sib = p.people.filter(x => x.role === 'sibling').length;
            const amt = Math.round(base * R().float(p, 0.6, 1.4) / (sib + 1) / 100) * 100;
            if (amt > 0) {
              p.money += amt; S.flag(p, 'inherited');
              lines.push({ t: `부모님이 남기신 재산 ${U().money(amt)}원을 상속받았다.`, major: true, icon: '📜', fx: `순자산 +${U().money(amt)}` });
            }
          }
        }
      });

      // 연인
      const pt = Rel.get(p, 'partner');
      if (pt) {
        let d = R().float(p, -3.5, 3.5) + 0.8;
        if (p.happy > 62) d += 1.2;
        if (p.stress > 72) d -= 2.5;
        if (S.hasTrait(p, 'independent')) d -= 0.6;
        if (S.hasTrait(p, 'family')) d += 0.6;
        pt.rel = U().clamp(pt.rel + d, 0, 100);
        if (pt.rel < 22) {
          Rel.breakup(p);
          lines.push({ t: `${pt.name}와(과)의 관계가 점점 멀어지더니 결국 헤어졌다.`, major: true, icon: '💔', fx: '행복 -10' });
          p.happy = U().clamp(p.happy - 10, 0, 100);
        }
      }

      // 배우자: 스트레스·워라밸·돈 문제·성격이 관계를 흔든다
      const sp = Rel.get(p, 'spouse');
      if (sp) {
        const J = S.job(p);
        let target = 64;
        if (J) target += (J.wlb - 50) * 0.25;
        target -= Math.max(0, p.stress - 50) * 0.35;
        if (p.debt > 0 && p.money <= 0) target -= 10;
        if (S.has(p, 'family_time')) target += 6;
        if (S.hasTrait(p, 'family')) target += 5;
        if (S.has(p, 'workaholic')) target -= 8;
        if (sp.personality === '다정함' || sp.personality === '유쾌함') target += 4;
        if (sp.personality === '엄격함' || sp.personality === '무뚝뚝함') target -= 3;
        sp.rel = U().clamp(sp.rel + (target - sp.rel) * 0.14 + R().float(p, -4, 4), 0, 100);
      }

      // 자녀
      Rel.all(p, 'child').forEach(c => {
        let d = R().float(p, -2, 2);
        if (S.has(p, 'family_time')) d += 1;
        if (S.has(p, 'workaholic') && c.age < 20) d -= 1.5;
        if (S.has(p, 'abroad_alone')) d -= 2;
        c.rel = U().clamp(c.rel + d, 0, 100);
        if (c.age === 8) lines.push({ t: `${c.name}이(가) 초등학교에 입학했다.`, icon: '🎒' });
        // 자녀의 입시: 열아홉 살에 부모로서의 선택(k_child_csat)이 기다린다 → 결과는 그동안의 교육(c.plan)·관계·형편이 만든다
        if (c.age === 19 && !c.uni) p.queue.push({ id: 'k_child_csat', at: p.age });
        if (c.age === 20 && !c.uni) {
          c.edu = R().int(p, 30, 90); c.uni = c.edu > 55 ? 'univ' : 'work';
          lines.push({ t: c.edu > 55 ? `${c.name}이(가) 대학에 합격했다.` : `${c.name}이(가) 자기 길을 찾아 일을 시작했다.`, icon: '🎓', major: true });
        }
        if (c.age === 26) {
          c.job = c.uni === 'arts' ? R().pick(p, ['artist', 'musician', 'designer', 'creator']) : c.uni === 'top' ? R().pick(p, ['office_big', 'developer', 'researcher', 'doctor', 'lawyer']) : c.uni === 'abroad' ? R().pick(p, ['researcher', 'office_big', 'translator', 'developer']) : Rel.randomJobFor(p, 26);
          c.income = c.job ? LG.DATA.jobs[c.job].income : 0;
          if (c.uni === 'top' || c.uni === 'abroad') lines.push({ t: `${c.name}이(가) ${LG.DATA.jobs[c.job].name}(으)로 첫 출근을 했다. 그때 들인 시간이 헛되지 않았다.`, icon: '💼', major: true });
        }
        if (c.age >= 28 && c.age <= 36 && !c.married && R().chance(p, 0.15)) {
          c.married = true;
          lines.push({ t: `${c.name}이(가) 결혼했다. 식장에서 눈물이 났다.`, icon: '💒', major: true });
          p.happy = U().clamp(p.happy + 6, 0, 100);
        }
        if (c.married && !c.grandkid && c.age >= 30 && R().chance(p, 0.22)) {
          c.grandkid = true; S.flag(p, 'grandparent');
          lines.push({ t: `${c.name}에게 아이가 생겼다. 할${p.gender === 'M' ? '아버지' : '머니'}가 되었다!`, icon: '👶', major: true });
          p.happy = U().clamp(p.happy + 10, 0, 100);
        }
      });

      // 친구: 챙기지 않으면 멀어진다
      Rel.all(p, 'friend').forEach(f => {
        let d = -1.6 + p.effort.social * 0.05 + R().float(p, -1.5, 1.5);
        if (S.hasTrait(p, 'extrovert')) d += 0.6;
        f.rel = U().clamp(f.rel + d, 0, 100);
        if (f.rel < 14) { f.role = 'past_friend'; lines.push({ t: `연락이 뜸해지면서 ${f.name}와(과) 멀어졌다.`, icon: '🍂' }); }
      });
      Rel.all(p, 'sibling').forEach(s => { s.rel = U().clamp(s.rel + R().float(p, -1.5, 1.2), 0, 100); });
      if (p.age < 19) Rel.parents(p).forEach(n => { n.rel = U().clamp(n.rel + R().float(p, -1.5, 1.5), 0, 100); });

      return lines;
    }
  };

  LG.Rel = Rel;
})(window.LG = window.LG || {});
