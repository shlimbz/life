/* 선천적 재능 — 출생 시 0~2개, 처음엔 숨겨져 있고 이벤트로 '발견'된다.
   재능은 확률 보정일 뿐, 노력·환경 없이는 결과를 보장하지 않는다. */
(function (LG) {
  LG.DATA = LG.DATA || {};
  LG.DATA.talents = {
    sport:        { name: '운동', icon: '⚽', boost: { physical: 14 }, hint: '몸을 쓰는 일이라면 남들보다 빨리 익혔다.' },
    music:        { name: '음악', icon: '🎹', boost: { creativity: 8 }, hint: '한 번 들은 멜로디를 바로 따라 불렀다.' },
    art:          { name: '미술', icon: '🎨', boost: { creativity: 12 }, hint: '연습장 귀퉁이 낙서가 유난히 그럴듯했다.' },
    math:         { name: '수학', icon: '📐', boost: { intelligence: 10 }, hint: '숫자 퍼즐 앞에서 눈이 반짝였다.' },
    language:     { name: '언어', icon: '🗣️', boost: { intelligence: 5, social: 4 }, hint: '외국어 단어가 귀에 쏙쏙 들어왔다.' },
    leadership:   { name: '리더십', icon: '🧭', boost: { social: 8, mental: 4 }, hint: '모둠 활동을 하면 어느새 앞에 서 있었다.' },
    social:       { name: '친화력', icon: '🤝', boost: { social: 12 }, hint: '처음 보는 사람과도 금방 친해졌다.' },
    mechanical:   { name: '손재주', icon: '🔧', boost: { creativity: 4, physical: 4 }, hint: '고장 난 장난감을 뚝딱 고쳐 놓았다.' },
    writing:      { name: '글쓰기', icon: '✍️', boost: { creativity: 8, intelligence: 3 }, hint: '일기장을 읽은 선생님이 오래 칭찬했다.' },
    entrepreneur: { name: '장사 감각', icon: '💡', boost: { social: 4, mental: 4 }, hint: '학교 바자회에서 혼자 물건을 다 팔았다.' }
  };
})(window.LG = window.LG || {});
