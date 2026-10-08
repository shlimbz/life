/* 성격 — 5개 축 중 3개 축에서 하나씩 뽑는다.
   mods: 선택 의도(intent)별 성공 확률 보정(확률 요인으로 화면에 '성격'으로 표시됨)
   variance: 부분성공 비율 배수(<1이면 큰 성공/큰 실패) mood: 행복 기준점 보정 */
(function (LG) {
  LG.DATA = LG.DATA || {};
  LG.DATA.traitAxes = [
    ['introvert', 'extrovert'],
    ['careful', 'impulsive'],
    ['optimist', 'pessimist'],
    ['competitive', 'stable', 'adventurous'],
    ['family', 'independent']
  ];
  LG.DATA.traits = {
    introvert:   { name: '내향적', desc: '혼자 있는 시간에서 힘을 얻는다', stat: { social: -6, mental: 3 }, mods: { social: -5, love: -4, education: 4 } },
    extrovert:   { name: '외향적', desc: '사람들 속에서 빛난다', stat: { social: 8 }, mods: { social: 6, love: 5, education: -2 } },
    careful:     { name: '신중함', desc: '돌다리도 두들겨 보고 건넌다', mods: { risk: -4, stability: 4 }, variance: 1.45 },
    impulsive:   { name: '충동적', desc: '생각보다 몸이 먼저 움직인다', mods: { risk: 4, adventure: 4, stability: -3 }, variance: 0.6 },
    optimist:    { name: '낙관적', desc: '어떻게든 잘 될 거라고 믿는다', mood: 7, mods: { love: 2 } },
    pessimist:   { name: '비관적', desc: '최악을 먼저 떠올린다', mood: -6, mods: { risk: -2, stability: 3 } },
    competitive: { name: '경쟁적', desc: '지는 걸 견디지 못한다', stress: 6, mods: { career: 6, education: 4, family: -3 } },
    stable:      { name: '안정 추구', desc: '큰 변화보다 평온한 하루가 좋다', mods: { stability: 7, risk: -6, adventure: -4 } },
    adventurous: { name: '모험 추구', desc: '가 보지 않은 길에 끌린다', mods: { risk: 7, adventure: 8, stability: -4 }, variance: 0.6 },
    family:      { name: '가족 중심', desc: '무엇보다 가족이 먼저다', mods: { family: 7, love: 3, career: -2 } },
    independent: { name: '독립적', desc: '내 일은 내가 정한다', mods: { career: 3, risk: 3, family: -3 } }
  };
})(window.LG = window.LG || {});
