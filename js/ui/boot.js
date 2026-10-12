/* UI · 시작: 저장된 인생이 있으면 바로 이어서, 없으면 타이틀 */
(function (LG) {
  'use strict';
  const K = LG.UIK;
  LG.Events.init();
  if (K.applyPrefs) K.applyPrefs();
  (function boot() {
    const saved = LG.Storage.load();
    if (saved && saved.alive) {
      try {
        K.p = saved;
        K.enterPlay(true);
        setTimeout(() => K.toast(`${saved.name}, ${saved.age}세 · 저장된 인생을 이어갑니다`), 600);
        return;
      } catch (e) {
        console.error(e); LG.Storage.clear(); K.p = null;
      }
    }
    K.initTitle();
  })();
  // 테스트·디버그용 (브라우저 콘솔에서 LG.UI.p 로 현재 인생을 볼 수 있다)
  LG.UI = { get p() { return K.p; }, st: K.st };
})(window.LG = window.LG || {});
