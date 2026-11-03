import test from 'node:test';
import assert from 'node:assert/strict';
import { createProfileStorage, profileDatabaseName } from '../src/lib/profileStorage.ts';

const firstId = 'fd1710a2-8351-41bb-b0d3-e9eb545dc7d8';
const secondId = '026af5d0-cc7f-4de6-9d34-4c4870e8b33f';
function memoryStorage(initial = []) {
  const values = new Map(initial);
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); }, removeItem: key => { values.delete(key); } };
}

test('demo e duas contas mantêm o progresso isolado, inclusive ao remover dados', () => {
  const backing = memoryStorage();
  const demo = createProfileStorage(null, backing);
  const first = createProfileStorage(firstId, backing);
  const second = createProfileStorage(secondId, backing);
  const key = 'mis-music-lab-v03';
  demo.setItem(key, 'progresso antigo');
  first.setItem(key, 'progresso de Ana');
  second.setItem(key, 'progresso de João');
  assert.equal(demo.getItem(key), 'progresso antigo');
  assert.equal(first.getItem(key), 'progresso de Ana');
  assert.equal(second.getItem(key), 'progresso de João');
  first.removeItem(key);
  assert.equal(first.getItem(key), null);
  assert.equal(second.getItem(key), 'progresso de João');
  assert.equal(demo.getItem(key), 'progresso antigo');
  assert.equal(first.profileId, firstId);
  assert.equal(demo.profileId, null);
});

test('callback de um perfil antigo continua escrevendo somente no namespace capturado', () => {
  const backing = memoryStorage();
  const oldProfile = createProfileStorage(firstId, backing);
  const saveAfterExercise = value => oldProfile.setItem('resultado', value);
  const newProfile = createProfileStorage(secondId, backing);
  newProfile.setItem('resultado', 'novo aluno');
  saveAfterExercise('exercício anterior finalizado');
  assert.equal(oldProfile.getItem('resultado'), 'exercício anterior finalizado');
  assert.equal(newProfile.getItem('resultado'), 'novo aluno');
  assert.equal(createProfileStorage(null, backing).getItem('resultado'), null);
});

test('criar e usar conta não migra, sobrescreve nem remove chaves legadas da demo', () => {
  const legacy = [
    ['mis-music-lab-v03', '{"lessonId":"l13"}'],
    ['mis-music-lab-recorder-v1', '{"lessonId":"recorder13"}'],
    ['mis-music-lab-v07', '[{"id":"tentativa"}]'],
    ['mis-music-lab-instrument', 'recorder-soprano'],
  ];
  const backing = memoryStorage(legacy);
  const account = createProfileStorage(firstId, backing);
  for (const [key, original] of legacy) {
    assert.equal(account.getItem(key), null);
    account.setItem(key, 'dados da conta');
    assert.equal(backing.getItem(key), original);
    account.removeItem(key);
    assert.equal(backing.getItem(key), original);
  }
  assert.deepEqual([...backing.values], legacy);
});

test('partituras IndexedDB recebem bancos distintos por conta e preservam banco legado na demo', () => {
  const base = 'mis-music-lab-v08';
  assert.equal(profileDatabaseName(base, null), base);
  const first = profileDatabaseName(base, firstId);
  const second = profileDatabaseName(base, secondId);
  assert.notEqual(first, base);
  assert.notEqual(first, second);
  assert.equal(profileDatabaseName(base, firstId), first);
});

test('identificadores inválidos são recusados antes de acessar o armazenamento', () => {
  const backing = { getItem() { assert.fail('leitura não esperada'); }, setItem() { assert.fail('gravação não esperada'); }, removeItem() { assert.fail('remoção não esperada'); } };
  for (const invalid of ['', 'demo', '../outro-perfil', '00000000-0000-0000-0000-000000000000', 'fd1710a2-8351-11bb-b0d3-e9eb545dc7d8', 'fd1710a2-8351-41bb-00d3-e9eb545dc7d8']) {
    assert.throws(() => createProfileStorage(invalid, backing), /Perfil local inválido/);
    assert.throws(() => profileDatabaseName('mis-music-lab-v08', invalid), /Perfil local inválido/);
  }
});

test('falhas do armazenamento são propagadas sem escrever em namespace alternativo', () => {
  const backing = { getItem() { throw new Error('read blocked'); }, setItem() { throw new Error('write blocked'); }, removeItem() { throw new Error('remove blocked'); } };
  const account = createProfileStorage(firstId, backing);
  assert.throws(() => account.getItem('progress'), /read blocked/);
  assert.throws(() => account.setItem('progress', '{}'), /write blocked/);
  assert.throws(() => account.removeItem('progress'), /remove blocked/);
});

test('gravação bloqueada mantém valor somente na instância atual e continua sinalizando falha', () => {
  const backing = memoryStorage();
  const denied = new Error('write blocked');
  const blocked = { ...backing, setItem() { throw denied; } };
  const account = createProfileStorage(firstId, blocked);
  assert.equal(account.isPersistent(), true);
  assert.throws(() => account.setItem('streak', '{"days":["2026-10-22"]}'), error => error === denied);
  assert.equal(account.getItem('streak'), '{"days":["2026-10-22"]}');
  assert.equal(account.isPersistent(), false);
  assert.equal(createProfileStorage(firstId, blocked).getItem('streak'), null);
  assert.equal(createProfileStorage(secondId, blocked).getItem('streak'), null);
  assert.equal(createProfileStorage(null, blocked).getItem('streak'), null);
  assert.equal(backing.values.size, 0);
});

test('recuperar gravação limpa apenas a pendência salva e volta a ler o armazenamento ao vivo', () => {
  const backing = memoryStorage();
  let writable = false;
  const recovering = { ...backing, setItem(key, value) { if (!writable) throw new Error('quota'); backing.setItem(key, value); } };
  const account = createProfileStorage(firstId, recovering);
  for (const key of ['streak', 'progress']) assert.throws(() => account.setItem(key, 'pendente'), /quota/);
  writable = true;
  account.setItem('streak', 'salvo');
  assert.equal(account.getItem('streak'), 'salvo');
  assert.equal(account.isPersistent(), false);
  account.setItem('progress', 'salvo');
  assert.equal(account.isPersistent(), true);
  createProfileStorage(firstId, backing).setItem('progress', 'mudança externa');
  assert.equal(account.getItem('progress'), 'mudança externa');
});

test('remoção bloqueada esconde valor antigo até a remoção ser persistida', () => {
  const backing = memoryStorage();
  let removable = false;
  const recovering = { ...backing, removeItem(key) { if (!removable) throw new Error('remove blocked'); backing.removeItem(key); } };
  const account = createProfileStorage(firstId, recovering);
  account.setItem('progress', 'valor antigo');
  assert.throws(() => account.removeItem('progress'), /remove blocked/);
  assert.equal(account.getItem('progress'), null);
  assert.equal(account.isPersistent(), false);
  assert.equal(createProfileStorage(firstId, backing).getItem('progress'), 'valor antigo');
  removable = true;
  account.removeItem('progress');
  assert.equal(account.isPersistent(), true);
  assert.equal(createProfileStorage(firstId, backing).getItem('progress'), null);
});
