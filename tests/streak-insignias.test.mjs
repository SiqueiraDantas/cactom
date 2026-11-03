import test from 'node:test';
import assert from 'node:assert/strict';
import {STREAK_INSIGNIAS,insigniaForStreak} from '../src/lib/streakInsignias.ts';

test('insígnias respeitam os limites: Tiquinho começa em um dia e Estirão somente em trinta',()=>{
  const expected=[[0,null],[1,'Tiquinho'],[2,'Tiquinho'],[3,'Passinho'],[6,'Passinho'],[7,'Embalo'],[13,'Embalo'],[14,'Rojão firme'],[29,'Rojão firme'],[30,'Estirão'],[31,'Estirão'],[150,'Estirão'],[36600,'Estirão']];
  for(const [days,name] of expected)assert.equal(insigniaForStreak(days)?.name??null,name,`${days} dias`);
  assert.deepEqual(STREAK_INSIGNIAS.map(item=>item.days),[1,3,7,14,30]);
});

test('contagens inválidas não concedem insígnia e a consulta não modifica os marcos',()=>{
  const before=JSON.stringify(STREAK_INSIGNIAS);
  for(const value of [-1,NaN,Infinity,-Infinity,.5,1.5,Number.MAX_SAFE_INTEGER+1])assert.equal(insigniaForStreak(value),null);
  insigniaForStreak(30);
  assert.equal(JSON.stringify(STREAK_INSIGNIAS),before);
});
