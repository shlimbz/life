/* PlayerState — 게임의 모든 상태는 이 객체 하나에 담긴다 */
(function (LG) {
  'use strict';

  const U = {
    clamp(v, a, b) { return Math.max(a, Math.min(b, v)); },
    round(v) { return Math.round(v); },
    // 만원 단위 → "4,200만" / "4.2억" / "-850만"
    money(man) {
      const neg = man < 0; const v = Math.abs(Math.round(man));
      let s;
      if (v >= 10000) {
        const eok = v / 10000;
        s = (eok >= 100 ? Math.round(eok) : Math.round(eok * 10) / 10) + '억';
      } else s = v.toLocaleString('ko-KR') + '만';
      return (neg ? '-' : '') + s;
    },
    // "민지이(가)" → "민지가" 처럼 조사 자동 교정
    fixJosa(str) {
      if (!str) return str;
      return str.replace(/([가-힣])(이\(가\)|와\(과\)|을\(를\)|은\(는\)|\(으\)로|아\(야\)|이\(라\))/g, (m, ch, j) => {
        const code = ch.charCodeAt(0) - 0xAC00, jong = code % 28, has = jong !== 0;
        switch (j) {
          case '이(가)': return ch + (has ? '이' : '가');
          case '와(과)': return ch + (has ? '과' : '와');
          case '을(를)': return ch + (has ? '을' : '를');
          case '은(는)': return ch + (has ? '은' : '는');
          case '(으)로': return ch + (has && jong !== 8 ? '으로' : '로');
          case '아(야)': return ch + (has ? '아' : '야');
          case '이(라)': return ch + (has ? '이라' : '라');
        }
        return m;
      });
    },
    josa(word, a, b) { // 받침 유무로 조사 선택: josa('대학','을','를')
      if (!word) return a;
      const c = word.charCodeAt(word.length - 1);
      if (c < 0xAC00 || c > 0xD7A3) return b;
      return (c - 0xAC00) % 28 ? a : b;
    },
    level(v) { // 감성 표현
      if (v >= 85) return '매우 높음';
      if (v >= 68) return '높음';
      if (v >= 55) return '평균 이상';
      if (v >= 45) return '보통';
      if (v >= 32) return '낮은 편';
      return '낮음';
    },
    healthWord(v) {
      if (v >= 80) return '아주 좋음';
      if (v >= 62) return '좋음';
      if (v >= 45) return '보통';
      if (v >= 28) return '나쁨';
      return '위독';
    }
  };

  const STAT_LABEL = {
    health: '건강', intelligence: '학습능력', social: '사교성',
    physical: '운동능력', creativity: '창의력', mental: '정신력'
  };
  const EFF_LABEL = {
    study: '꾸준한 공부', sport: '운동 연습', art: '예술 연습',
    work: '일에 쏟은 노력', health: '건강 관리 습관', social: '사람을 챙긴 노력'
  };

  const State = {
    STAT_LABEL, EFF_LABEL,

    create(gender, seed) {
      return {
        v: 1, seed, rngState: LG.RNG.hashSeed(seed),
        gender, name: '', surname: '', given: '',
        birthYear: 2000, age: 0, year: 2000, alive: true, cause: null,
        region: 'seoul', urban: true, town: '',
        family: { structure: 'both', tier: 3, tags: [], home: '', eduEnv: 50 },
        stats: { health: 70, intelligence: 50, social: 50, physical: 50, creativity: 50, mental: 50 },
        talents: [], found: [], traits: [],
        luck: 0, luckLog: { good: 0, bad: 0 },
        effort: { study: 0, sport: 0, art: 0, work: 0, health: 0, social: 0 },
        happy: 65, stress: 15,
        money: 0, debt: 0, house: null, home: 'parents', homeLabel: '',
        edu: 'none', major: null, track: null, college: null,
        status: 'child', job: null, jobHistory: [], lastSalary: 0, militaryUntil: 0,
        people: [], nextId: 1,
        flags: {}, done: {}, cool: {}, queue: [],
        intents: {}, choices: 0, outcomes: { success: 0, partial: 0, fail: 0 },
        achv: 0, exp: 0,
        avg: { n: 0, health: 0, happy: 0, rel: 0 },
        history: [], headline: '', pending: null
      };
    },

    has(p, f) { return Object.prototype.hasOwnProperty.call(p.flags, f); },
    flag(p, f) { if (!State.has(p, f)) p.flags[f] = p.age; },
    unflag(p, f) { delete p.flags[f]; },
    hasTrait(p, t) { return p.traits.indexOf(t) >= 0; },
    hasTalent(p, t) { return p.talents.indexOf(t) >= 0; },

    addStat(p, k, d) {
      if (k === 'happy' || k === 'stress') p[k] = U.clamp(p[k] + d, 0, 100);
      else p.stats[k] = U.clamp(p.stats[k] + d, 1, 100);
    },

    netWorth(p) { return p.money + (p.house ? p.house.value : 0) - p.debt; },

    // 현재 거주 지역 (이주하면 바뀜)
    liveRegion(p) { return LG.DATA.regions[p.liveIn || p.region]; },

    // 지역 특성값 (농촌 보정 포함)
    regionAttr(p, k) {
      const r = State.liveRegion(p);
      let v = r[k];
      if (!p.urban && !p.liveIn) {
        if (k === 'edu') v -= 12;
        if (k === 'job') v -= 15;
        if (k === 'culture') v -= 15;
        if (k === 'community') v += 10;
        if (k === 'medical') v -= 8;
      }
      return v;
    },

    job(p) { return p.job ? LG.DATA.jobs[p.job.id] : null; },

    supportScore(p) {
      const parents = p.people.filter(n => (n.role === 'father' || n.role === 'mother' || n.role === 'grandparent') && n.alive);
      if (!parents.length) return 30;
      const s = parents.reduce((a, n) => a + (n.support || 50) * 0.6 + n.rel * 0.4, 0) / parents.length;
      return U.clamp(s, 0, 100);
    },

    // 관계 종합 점수
    relScore(p) {
      const alive = p.people.filter(n => n.alive && n.age >= 0);
      const parts = [];
      alive.forEach(n => {
        if (n.role === 'spouse' || n.role === 'partner') parts.push([n.rel, 2.2]);
        else if (n.role === 'child') parts.push([n.rel, 1.4]);
        else if (n.role === 'father' || n.role === 'mother' || n.role === 'grandparent') parts.push([n.rel, 1]);
        else if (n.role === 'friend') parts.push([n.rel, 0.8]);
        else if (n.role === 'sibling') parts.push([n.rel, 0.6]);
      });
      if (!parts.length) return 25;
      const wsum = parts.reduce((a, x) => a + x[1], 0);
      const avg = parts.reduce((a, x) => a + x[0] * x[1], 0) / wsum;
      const breadth = Math.min(12, wsum * 2.2); // 사람이 많을수록 약간 보정
      return U.clamp(Math.round(avg * 0.85 + breadth), 0, 100);
    },

    relLabel(p) {
      const sp = p.people.find(n => n.alive && n.role === 'spouse');
      if (sp) return '기혼 · ' + sp.name;
      const pt = p.people.find(n => n.alive && n.role === 'partner');
      if (pt) return '연애 중 · ' + pt.name;
      if (p.flags.widowed) return '사별';
      if (p.flags.divorced) return '이혼';
      return '싱글';
    },

    jobLabel(p) {
      if (p.job) return LG.DATA.jobs[p.job.id].name;
      const map = {
        child: p.age < 7 ? '아이' : '학생', student: '학생', college: '대학생', military: '군 복무 중',
        seeking: '구직 중', retired: '은퇴', parttime: '아르바이트', grad: '대학원생',
        unemployed: '무직', retake: '재수생', abroad: '유학 중'
      };
      return map[p.status] || '—';
    },

    homeLabel(p) {
      if (p.house) return p.house.label;
      const r = State.liveRegion(p).short;
      if (p.home === 'parents') return p.age < 19 ? r + ' · ' + p.family.home : '부모님 집';
      if (p.home === 'dorm') return '기숙사';
      if (p.home === 'barracks') return '군 막사';
      if (p.home === 'abroad') return '해외';
      return r + ' 월세';
    },

    stageOf(age) {
      if (age < 6) return 'baby';
      if (age < 13) return 'child';
      if (age < 19) return 'teen';
      if (age < 30) return 'young';
      if (age < 50) return 'adult';
      if (age < 65) return 'middle';
      return 'old';
    },

    intent(p, k) { if (k) p.intents[k] = (p.intents[k] || 0) + 1; }
  };

  LG.U = U;
  LG.State = State;
})(window.LG = window.LG || {});
