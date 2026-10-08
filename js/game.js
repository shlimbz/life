/* Game — 한 해를 진행하고 선택을 처리하는 순수 로직 (DOM 없음 → 시뮬레이터에서도 사용) */
(function (LG) {
  'use strict';
  const S = () => LG.State;

  const Game = {
    newLife(gender, seed) {
      const p = LG.Birth.generate(gender, seed || LG.RNG.newSeed());
      const reg = LG.DATA.regions[p.region];
      LG.Timeline.add(p, `${p.birthYear}년, ${reg.short} ${p.town}의 ${p.urban ? '' : '시골 '}한 가정에서 태어났다.`, 'birth', '👶');
      LG.Events.init();
      return p;
    },

    // 1년 진행 → { lines, event, death }
    advance(p) {
      if (!p.alive) return { lines: [], event: null, death: true };
      p.age++; p.year++;
      const lines = [];
      const push = (arr) => arr.forEach(l => {
        lines.push(l);
        LG.Timeline.add(p, l.t, l.reflect ? 'reflect' : l.major ? 'major' : 'minor', l.icon);
      });
      push(LG.Life.yearly(p));
      push(LG.Economy.yearly(p));
      push(LG.Rel.yearly(p));
      push(LG.Health.yearly(p));

      const cause = LG.Health.deathCheck(p);
      if (cause) {
        p.alive = false; p.cause = cause;
        LG.Timeline.add(p, `${cause} 세상을 떠났다.`, 'death', '🕊️');
        return { lines, event: null, death: true };
      }

      const yr = LG.Events.pickYear(p);
      yr.lines.forEach(l => lines.push(l));
      if (!lines.length || (lines.every(l => !l.major) && LG.RNG.chance(p, 0.35))) {
        const f = LG.Events.flavor(p);
        if (f) lines.push(f);
      }
      p.pending = yr.event ? yr.event.id : null;
      lines.forEach(l => { l.t = LG.U.fixJosa(l.t); });
      return { lines, event: yr.event, death: false };
    },

    pendingEvent(p) { return p.pending ? LG.Events.get(p.pending) : null; },

    choose(p, choiceId) {
      const ev = Game.pendingEvent(p);
      if (!ev) return null;
      const res = LG.Events.resolve(p, ev, choiceId);
      res.text = LG.U.fixJosa(res.text);
      const nx = LG.Events.nextChained(p);
      p.pending = nx ? nx.id : null;
      return res;
    },

    // 나이대별 1년 진행 속도(ms, 1배속)
    yearDelay(age) {
      if (age < 6) return 500;
      if (age < 13) return 750;
      if (age < 19) return 950;
      if (age < 30) return 1150;
      if (age < 70) return 900;
      return 800;
    },

    summary(p) {
      const e = LG.Timeline.ending(p);
      return {
        seed: p.seed, name: p.name, gender: p.gender, age: p.age, birthYear: p.birthYear,
        region: LG.DATA.regions[p.region].short, title: e.title, oneLiner: e.oneLiner,
        job: e.job, s: e.s, net: e.net, at: Date.now()
      };
    }
  };

  LG.Game = Game;
})(window.LG = window.LG || {});
