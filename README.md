# 대한민국 인생게임

> 태어나는 것은 랜덤, 살아가는 것은 선택, 결과는 현실과 운이 결정하는 대한민국 인생 시뮬레이션.

성별만 고르면 나머지(지역·가정 형편·부모·형제·능력·재능·성격)는 모두 랜덤으로 정해집니다.
0세부터 죽을 때까지 한 사람의 인생이 8~10분 만에 빠르게 흘러가고, 중요한 순간마다 직접 선택합니다.
선택은 결과를 보장하지 않습니다. 능력·노력·환경·관계·과거 선택·성격·운이 합쳐져 성공 / 부분 성공 / 실패가 결정됩니다.

- 빌드 없음 · 프레임워크 없음 · 백엔드 없음 (HTML + CSS + Vanilla JS)
- 모바일 세로 화면 기준 (390×844), 360~430px 폭 대응, safe-area 지원
- LocalStorage 자동 저장 → 새로고침해도 이어하기
- Seed 기반 RNG → 같은 인생 코드 + 같은 선택 = 같은 인생

## 실행

`index.html`을 브라우저로 열면 바로 실행됩니다. 로컬 서버로 띄우려면:

```bash
npx serve .        # 또는
python3 -m http.server 8000
```

특정 출발점으로 시작: `index.html?seed=abc123`

## 배포

**GitHub Pages**
1. 이 폴더를 저장소 루트로 push
2. Settings → Pages → Source: `Deploy from a branch` → Branch `main` / `(root)`
3. `https://<계정>.github.io/<저장소>/` 에서 플레이

**Vercel**
1. vercel.com → Add New Project → GitHub 저장소 Import
2. Framework Preset: `Other`, Build Command 비움, Output Directory `.`
3. Deploy

> 글꼴(Pretendard)은 jsDelivr CDN에서 불러오며, 실패하면 시스템 글꼴로 대체됩니다.

## 구조

```
index.html  style.css  manifest.webmanifest  icon.svg
data/   names · regions · jobs · talents · traits · flavor · endings
        events-early(유년·청소년·입시) · events-adult(20대~중년) · events-later(노년·자동·희귀)
js/     rng · state · relationship · birth · probability · outcome · economy · health
        life · timeline · event-engine · storage · game(순수 로직) · ui(화면)
tools/  simulate.js   ← 밸런스 시뮬레이터
DESIGN.md             ← 시스템 설계 문서
```

`game.js`까지는 DOM을 쓰지 않아서 Node에서도 그대로 돌아갑니다.

## 이벤트 추가하기

`data/events-*.js` 배열에 객체 하나를 `push`하면 엔진이 자동으로 인식합니다.

```js
E.push({
  id: 'w_example', cat: 'career', tier: 'choice',   // auto | choice | major
  ages: [25, 45], w: 6, cd: 5,                     // 나이 범위 · 가중치 · 쿨다운(년)
  if: p => !!p.job,                                // 발생 조건
  label: '커리어', title: '새로운 제안', text: '...',
  choices: [{
    id: 'go', label: '도전한다', intent: 'career',
    check: { base: 40, partial: 0.5, f: [['stat', 'intelligence', 0.4], ['eff', 'work', 0.3], ['flag', 'intern', 10, '인턴 경험']] },
    out: {
      success: { t: '성공 문장', log: '연표 기록', perf: 10, achv: 5 },
      partial: { t: '부분 성공 문장', perf: 3 },
      fail:    { t: '실패 문장', sr: 8, queue: [{ id: 'w_example_retry', in: 1 }] }
    }
  }]
});
```

- 확률 요인: `stat` `eff` `family` `support` `assets` `region` `talent` `trait` `flag` `noflag` `stress` `health` `happy` `edu` `ageOver` `rel` `perf` `jobYears` `job` `eduEnv` `fn`
- 결과 효과: `st` `hp` `sr` `money` `debt` `eff` `rel` `flag` `unflag` `edu` `major` `status` `job` `quit` `home` `achv` `exp` `perf` `queue` `next` `fn`
- 텍스트 토큰: `{name}` `{partner}` `{spouse}` `{friend}` `{child}` `{sibling}` `{parent}` `{job}` `{region}` — 조사 `이(가)` `와(과)` `을(를)` `(으)로`는 자동 교정

## 밸런스 시뮬레이션

```bash
node tools/simulate.js 300 random   # 무작위 선택으로 300판
node tools/simulate.js 300 first    # 항상 첫 번째 선택지로 300판
```

수명 분포, 한 판 선택 횟수, 예상 플레이 시간, 결혼·자녀·자산 분포, 출생 형편별 결과, 오류를 출력합니다.
현재 기준(무작위 300판): 수명 중앙 80세(p10 66 ~ p90 91), 선택 약 32회, 오류 0.
