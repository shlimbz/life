/* Affinity — "이 사람은 어떤 길에 가까운가"를 출생 환경 · 재능 · 노력 · 과거 선택(flag/track/major/job)에서
   그때그때 계산한다. 저장하지 않고 현재 상태에서 도출하므로 세이브 호환성 문제가 없다.
   이벤트는 dom 태그로, 선택지는 rank 로 이 값을 사용해 "내 삶과 이어진" 갈림길을 만든다. */
(function (LG) {
  'use strict';
  const S = () => LG.State, U = () => LG.U;

  const DOMAINS = {
    sports:   { name: '운동·체육', icon: '⚽' },
    art:      { name: '미술·디자인', icon: '🎨' },
    music:    { name: '음악', icon: '🎵' },
    writing:  { name: '글·인문', icon: '✍️' },
    science:  { name: '과학·수학', icon: '🔬' },
    tech:     { name: '기술·IT', icon: '💻' },
    business: { name: '사업·장사', icon: '💡' },
    people:   { name: '사람·소통', icon: '🤝' },
    care:     { name: '돌봄·봉사', icon: '🩺' },
    nature:   { name: '자연·농촌', icon: '🌾' },
    global:   { name: '세계·언어', icon: '🌏' }
  };

  const TALENT = {
    sport: [['sports', 1]], music: [['music', 1]], art: [['art', 1]], math: [['science', 1], ['tech', 0.3]],
    language: [['global', 1], ['writing', 0.4]], leadership: [['people', 0.6], ['business', 0.5]], social: [['people', 1]],
    mechanical: [['tech', 1]], writing: [['writing', 1]], entrepreneur: [['business', 1]]
  };
  // 과거 선택이 남긴 흔적(flag) → 성향
  const FLAG = {
    kid_sport: { sports: 14 }, kid_art: { art: 12, music: 8 }, kid_study: { science: 10, writing: 4 }, pe_major: { sports: 10 },
    sports_hs: { sports: 30 }, athlete_path: { sports: 30 }, sports_injury: { sports: 12 }, sp_rehab: { sports: 10, care: 8 },
    pro_athlete: { sports: 25 }, exercise_habit: { sports: 12 }, marathoner: { sports: 18 }, sp_club: { sports: 12 },
    arts_hs: { art: 30 }, art_award: { art: 20 }, exhibited: { art: 18 },
    band: { music: 28 }, music_award: { music: 20 }, busker: { music: 18 },
    gamer_dream: { tech: 16, business: 6 }, coding_kid: { tech: 25, science: 12 }, olympiad: { science: 25 }, coder: { tech: 18 },
    vocational: { tech: 22 }, certified: { tech: 14 },
    writer_kid: { writing: 25 }, published: { writing: 22 }, blogger: { writing: 12 },
    lemonade: { business: 22 }, started_business: { business: 22 }, online_shop: { business: 20 }, side_hustle: { business: 12 },
    volunteer: { care: 25, people: 8 }, counsel_friend: { care: 15, people: 12 }, stood_up: { people: 8, care: 6 },
    played_outside: { people: 6, sports: 5 }, kept_friends: { people: 8 },
    farm_helper: { nature: 25 }, returned_farm: { nature: 25 }, hiking: { nature: 14, sports: 6 },
    lang_camp: { global: 25 }, working_holiday: { global: 20 }, exchange: { global: 20 }, emigrated: { global: 18 }, study_abroad: { global: 22 }, early_abroad: { global: 20 }, returned_scholar: { global: 10 }, citizen_abroad: { global: 12 },
    art_academy: { art: 14 }, art_portfolio: { art: 20 }, art_admit: { art: 10 }, studio_intern: { art: 12 }, own_work: { art: 10, business: 8 }, late_artist: { art: 6 },
    music_lessons: { music: 16 }, chorus: { music: 8 }, trainee: { music: 20 }, music_prep: { music: 18 }, indie_deal: { music: 14 }, music_teacher: { music: 12, people: 6 }, late_music: { music: 6 },
    lit_club: { writing: 14 }, campus_press: { writing: 10, people: 6 }, author: { writing: 18 }, memoir: { writing: 6 },
    science_kid: { science: 14 }, science_hs: { science: 22, tech: 6 }, grad_school: { science: 18 }, paper: { science: 14 },
    tinkerer: { tech: 14 }, hackathon_win: { tech: 14 }, startup_success: { tech: 12, business: 14 }, startup_member: { tech: 8, business: 10 }, startup_failed: { business: 6 },
    flea_seller: { business: 12 }, school_biz: { business: 14, people: 4 }, biz_plan: { business: 8 }, bz_expanded: { business: 14 },
    caregiver_kid: { care: 14 }, hospital_vol: { care: 14 }, counseled: { care: 4 },
    garden_kid: { nature: 14 }, agri_path: { nature: 22 }, smart_farm: { nature: 14, tech: 6 }, rural_retire: { nature: 6 },
    pen_pal: { global: 12 }, lang_track: { global: 22 }, abroad_exp: { global: 14 }, abroad_work: { global: 18 }, expat: { global: 14 },
    child_award: { art: 4, music: 4, science: 4, sports: 4 }, worked_teen: { business: 6 }, teen_job: { business: 4 }
  };
  const MAJOR = {
    it: { tech: 40, science: 25 }, biz: { business: 30, people: 15, writing: 10 }, med: { care: 40, science: 25 }, nursing: { care: 45 },
    edu: { people: 30, care: 15 }, arts: { art: 40 }, sci: { science: 40 }, pe: { sports: 45, care: 8 }, music: { music: 45 },
    agri: { nature: 45, science: 8 }, welfare: { care: 40, people: 20 }, lang: { global: 40, writing: 15 }
  };
  const JOB = {
    athlete: { sports: 35 }, coach: { sports: 25, people: 10 }, developer: { tech: 30, science: 10 }, researcher: { science: 35 },
    doctor: { care: 30, science: 15 }, nurse: { care: 30 }, teacher: { people: 20, care: 10 }, artist: { art: 30 }, designer: { art: 25 },
    musician: { music: 35 }, writer: { writing: 35 }, creator: { tech: 10, people: 12 }, ceo: { business: 30 }, selfemp: { business: 25 },
    farmer: { nature: 35 }, technician: { tech: 25 }, engineer: { tech: 30, science: 10 }, socialworker: { care: 35, people: 12 },
    translator: { global: 35, writing: 12 }, lawyer: { writing: 12, people: 10 }, civil: { people: 6 }
  };
  const PARENT_JOB = {
    selfemp: { business: 14 }, ceo: { business: 16 }, farmer: { nature: 22 }, doctor: { care: 10, science: 8 }, nurse: { care: 12 },
    teacher: { people: 10 }, developer: { tech: 12 }, researcher: { science: 14 }, technician: { tech: 12 }, factory: { tech: 6 },
    driver: {}, civil: {}, lawyer: { writing: 8 }
  };
  const TRAIT = { extrovert: { people: 8 }, introvert: { writing: 5, science: 4 }, careful: { science: 3 }, competitive: { sports: 4, business: 4 }, impulsive: {} };

  let cache = { key: '', val: null };

  function compute(p) {
    const key = p.seed + ':' + p.age + ':' + p.choices + ':' + Object.keys(p.flags).length + ':' + p.found.length + ':' + (p.major || '') + ':' + (p.job ? p.job.id : '') + ':' + (p.track || '');
    if (cache.key === key) return cache.val;
    const a = {};
    Object.keys(DOMAINS).forEach(k => { a[k] = 0; });
    const add = (m, mult) => { if (m) Object.keys(m).forEach(k => { a[k] += m[k] * (mult == null ? 1 : mult); }); };

    // 노력과 능력치 (살아오면서 쌓인 것)
    const E = p.effort, st = p.stats;
    a.sports += E.sport * 0.55 + Math.max(0, st.physical - 55) * 0.5;
    a.art += E.art * 0.4 + Math.max(0, st.creativity - 55) * 0.35;
    a.music += E.art * 0.25;
    a.writing += Math.max(0, st.creativity - 58) * 0.2 + E.study * 0.1;
    a.science += E.study * 0.35 + Math.max(0, st.intelligence - 55) * 0.45;
    a.tech += E.study * 0.12 + Math.max(0, st.intelligence - 60) * 0.2;
    a.business += E.work * 0.15;
    a.people += E.social * 0.45 + Math.max(0, st.social - 55) * 0.45;
    a.care += Math.max(0, st.mental - 60) * 0.2;

    // 재능 (발견하면 크게, 숨은 재능은 은근히)
    p.talents.forEach(t => {
      const isFound = p.found.indexOf(t) >= 0 && !(p.blocked && p.blocked[t] != null);
      (TALENT[t] || []).forEach(([d, w]) => { a[d] += ((isFound ? 30 : 10) + ({ genius: 24, gifted: 8 }[(p.tgrade || {})[t]] || 0)) * w; });
    });

    // 진로 · 전공 · 직업 · 과거의 흔적
    if (p.track === 'sports') a.sports += 35;
    if (p.track === 'arts') { a.art += 25; a.music += 15; }
    if (p.track === 'vocational') a.tech += 22;
    if (p.major) add(MAJOR[p.major]);
    if (p.job) add(JOB[p.job.id]);
    (p.jobHistory || []).forEach(j => add(JOB[j.id], 0.25));
    Object.keys(p.flags).forEach(f => add(FLAG[f]));

    // 출생 환경
    LG.Rel.parents(p).forEach(n => add(PARENT_JOB[n.job], 0.7));
    if (!p.urban) a.nature += 14;
    if (p.family.tags.indexOf('self_employed') >= 0) a.business += 10;
    if (S().regionAttr(p, 'culture') >= 80) { a.art += 4; a.music += 4; }
    if (p.family.tier >= 4) a.global += 6;
    p.traits.forEach(t => add(TRAIT[t]));

    Object.keys(a).forEach(k => { a[k] = Math.round(U().clamp(a[k], 0, 100)); });
    cache = { key, val: a };
    return a;
  }

  function get(p, d) { return compute(p)[d] || 0; }
  function max(p, ds) { const a = compute(p); return Math.max.apply(null, [].concat(ds).map(d => a[d] || 0)); }
  function top(p, n) {
    const a = compute(p);
    return Object.keys(a).sort((x, y) => a[y] - a[x]).slice(0, n || 3).filter(k => a[k] >= 20);
  }
  // 이벤트 가중치 배율: 관련 성향이 높을수록 자주, 낮으면 드물게
  function mult(p, doms) {
    if (!doms) return 1;
    const m = max(p, doms);
    // 나와 관련된 분야일수록 훨씬 자주 (예: 연관도 40 → 약 2.5배, 70 → 약 4.5배), 무관하면 드물게
    return m >= 20 ? 1 + Math.pow(m / 30, 1.3) : 0.6;
  }

  LG.Aff = { DOMAINS, compute, get, max, top, mult };
})(window.LG = window.LG || {});
