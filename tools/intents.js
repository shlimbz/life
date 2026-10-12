#!/usr/bin/env node
/* 의도(intent) 평균 비율과 엔딩 한 줄 평 분포 — endings.js 의 intentBase 갱신용. 사용법: node tools/intents.js [판수=400] */
const fs=require('fs'),path=require('path'),vm=require('vm');const root=path.join(__dirname,'..');
const html=fs.readFileSync(root+'/index.html','utf8');
const sc=[...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]).filter(s=>!s.startsWith('js/ui/')&&!s.includes('ui.js')&&!s.includes('main.js'));
const ctx={window:{},console,Math,Date,JSON,Object,Array};ctx.window=ctx;vm.createContext(ctx);
sc.forEach(s=>vm.runInContext(fs.readFileSync(path.join(root,s),'utf8'),ctx,{filename:s}));
const LG=ctx.LG;const tot={};let all=0;const lines={};const N=+process.argv[2]||400;
for(let i=0;i<N;i++){const p=LG.Game.newLife(null,'i'+i);let k=0;
 while(p.alive&&k++<130){LG.Game.advance(p);let e=LG.Game.pendingEvent(p);while(e){const v=LG.Events.visibleChoices(p,e);LG.Game.choose(p,v[Math.floor(Math.random()*v.length)].id);e=LG.Game.pendingEvent(p);}}
 const t=Object.values(p.intents).reduce((a,b)=>a+b,0);Object.keys(p.intents).forEach(k=>{tot[k]=(tot[k]||0)+p.intents[k]/t;});
 const e=LG.Timeline.ending(p);lines[e.oneLiner]=(lines[e.oneLiner]||0)+1;}
console.log(JSON.stringify(Object.fromEntries(Object.entries(tot).map(([k,v])=>[k,+(v/N).toFixed(3)]))));
console.log(Object.entries(lines).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+' '+(v/N*100).toFixed(0)+'%').join('\n'));
