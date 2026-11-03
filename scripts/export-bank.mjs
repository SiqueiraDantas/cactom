// Gera docs/cactom/trilha/BANCO-DE-APRESENTACOES.md a partir do banco (node --experimental-strip-types scripts/export-bank.mjs)
import {EXERCISES,unitCounts} from '../src/lib/recorderExercises.ts';
import {JOURNEY_UNITS} from '../src/lib/recorderJourney.ts';
import {EVIDENCE_LABEL} from '../src/lib/recorderJourney.ts';
import {writeFileSync} from 'node:fs';
const KIND={choice:'Escolha',fingering:'Dedilhado no desenho',order:'Ordenar',tap:'Toque rítmico',perform:'Tocar (microfone, declarado ou professor)',observe:'Prática observada',create:'Criação'};
let md='# Banco de apresentações · trilha da flauta doce\n\nGerado do código (`src/lib/recorderExercises.ts`). Cada tarefa-base do plano gera duas apresentações: P1 descoberta e P2 aplicação em exemplo novo. Feedback e retomada são estados da mesma apresentação, não novas atividades.\n\nLegenda de status: **pronto** = implementado e com gabarito conferido por teste automático ou rubrica; **rascunho** = depende de áudio gravado, diagrama conferido ou validação ainda ausente (não aparece para o aluno).\n\n## Contagem por unidade\n\n| Unidade | Tarefas-base | Apresentações | Prontas | Rascunho | Com professor | Correção automática |\n|---|---|---|---|---|---|---|\n';
for(const c of unitCounts())md+=`| ${c.unit} | ${c.tasks} | ${c.presentations} | ${c.ready} | ${c.draft} | ${c.teacher} | ${c.autoChecked} |\n`;
const t=unitCounts().reduce((a,c)=>({tasks:a.tasks+c.tasks,p:a.p+c.presentations,r:a.r+c.ready,d:a.d+c.draft,te:a.te+c.teacher,au:a.au+c.autoChecked}),{tasks:0,p:0,r:0,d:0,te:0,au:0});
md+=`| **Total** | **${t.tasks}** | **${t.p}** | **${t.r}** | **${t.d}** | **${t.te}** | **${t.au}** |\n\nAlém disso: 8 tarefas diagnósticas e 12 de avaliação continuam nas telas próprias (marcos de seção), fora destas 480.\n`;
for(const u of JOURNEY_UNITS){md+=`\n## Unidade ${u.number} · ${u.goal}\n\n${u.title}\n\n| Código | Parada | Tipo | Instrução / pergunta | Gabarito ou rubrica | Pista | Evidência | Status |\n|---|---|---|---|---|---|---|---|\n`;
 for(const e of EXERCISES.filter(x=>x.unit===u.number)){const stop=u.stops.find(s=>s.lessonIds.includes(e.lessonId));const cell=v=>String(v??'').replace(/\|/g,'/').replace(/\n/g,' ');
  md+=`| ${e.id} | ${stop.label} | ${KIND[e.kind]}${e.audio?' · com áudio':''}${e.story?' · história':''} | ${cell(e.instruction)}${e.prompt?' — '+cell(e.prompt):''}${e.options&&!e.options.some(o=>o.art||o.holes)?' ('+e.options.map(o=>cell(o.label)).join(' / ')+')':''} | ${cell(e.answerKey)} | ${cell(e.hint)} | ${e.evidence.map(x=>EVIDENCE_LABEL[x]).join(', ')} | ${e.status}${e.draftReason?': '+cell(e.draftReason):''} |\n`;}}
writeFileSync('docs/cactom/trilha/BANCO-DE-APRESENTACOES.md',md);console.log(md.length,'bytes');
