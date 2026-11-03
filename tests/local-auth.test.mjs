import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalAccount, signInLocal, normalizeUsername, ACCOUNTS_KEY, KDF_ITERATIONS } from '../src/lib/localAuth.ts';

function memoryStorage(initial = []) {
  const values = new Map(initial);
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); } };
}
const input = (overrides = {}) => ({ name: '  Aluna do Sertão  ', username: 'Músico_01', password: 'senha-local-123', confirmation: 'senha-local-123', ...overrides });
const records = storage => JSON.parse(storage.getItem(ACCOUNTS_KEY));

test('conta local usa WebCrypto real e permite entrar com usuário normalizado', async () => {
  assert.ok(globalThis.crypto?.subtle);
  const storage = memoryStorage();
  const created = await createLocalAccount(input(), storage);
  assert.equal(created.name, 'Aluna do Sertão');
  assert.equal(created.username, 'músico_01');
  assert.match(created.id, /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i);
  assert.deepEqual(Object.keys(created).sort(), ['id', 'name', 'username']);
  assert.deepEqual(await signInLocal('  MÚSICO_01  ', 'senha-local-123', storage), created);
});

test('normalização remove espaços externos, caixa e variantes Unicode equivalentes', () => {
  assert.equal(normalizeUsername('  ＡＬＵＮＯ_01  '), 'aluno_01');
  assert.equal(normalizeUsername('JOA\u0303O'), 'joão');
  assert.equal(normalizeUsername('João-Silva.2'), 'joão-silva.2');
});

test('senhas iguais recebem salts e hashes distintos e nunca são salvas em texto', async () => {
  const storage = memoryStorage();
  await createLocalAccount(input({ username: 'aluno.um' }), storage);
  await createLocalAccount(input({ username: 'aluno.dois' }), storage);
  const [first, second] = records(storage);
  assert.notEqual(first.salt, second.salt);
  assert.notEqual(first.passwordHash, second.passwordHash);
  assert.match(first.salt, /^[a-f0-9]{32}$/);
  assert.match(first.passwordHash, /^[a-f0-9]{64}$/);
  assert.equal(first.iterations, KDF_ITERATIONS);
  assert.ok(KDF_ITERATIONS >= 600000);
  assert.equal(storage.getItem(ACCOUNTS_KEY).includes(input().password), false);
  assert.equal('password' in first, false);
  assert.equal('confirmation' in first, false);
  await signInLocal('aluno.dois', input().password, storage);
});

test('senha incorreta e usuário inexistente recebem a mesma resposta sem alterar dados', async () => {
  const storage = memoryStorage();
  await createLocalAccount(input(), storage);
  const before = storage.getItem(ACCOUNTS_KEY);
  let wrongMessage;
  await assert.rejects(signInLocal('músico_01', 'senha-invalida', storage), error => {
    wrongMessage = error.message;
    return /Usuário ou senha incorretos/.test(error.message);
  });
  await assert.rejects(signInLocal('outro.aluno', 'senha-invalida', storage), error => error.message === wrongMessage);
  assert.equal(storage.getItem(ACCOUNTS_KEY), before);
});

test('usuário duplicado após normalização preserva conta anterior', async () => {
  const storage = memoryStorage();
  await createLocalAccount(input(), storage);
  const before = storage.getItem(ACCOUNTS_KEY);
  await assert.rejects(createLocalAccount(input({ username: ' MÚSICO_01 ' }), storage), /já existe/);
  assert.equal(storage.getItem(ACCOUNTS_KEY), before);
});

test('cadastros simultâneos do mesmo usuário não sobrescrevem nem duplicam a conta', async () => {
  const storage = memoryStorage();
  const results = await Promise.allSettled([
    createLocalAccount(input({ username: 'mesmo.aluno' }), storage),
    createLocalAccount(input({ username: 'MESMO.ALUNO' }), storage),
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter(result => result.status === 'rejected').length, 1);
  assert.equal(records(storage).length, 1);
  await signInLocal('mesmo.aluno', input().password, storage);
});

test('cadastro e login também funcionam em navegador sem Web Locks', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: undefined });
  try {
    const storage = memoryStorage();
    const account = await createLocalAccount(input({ username: 'sem-locks' }), storage);
    assert.deepEqual(await signInLocal('sem-locks', input().password, storage), account);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'navigator', descriptor);
    else delete globalThis.navigator;
  }
});

test('validações de cadastro não escrevem contas inválidas', async () => {
  const cases = [
    { name: ' ' }, { name: 'a'.repeat(41) },
    { username: 'ab' }, { username: 'a'.repeat(33) }, { username: 'aluno com espaço' },
    { username: '.aluno' }, { username: 'aluno@escola' },
    { password: 'curta', confirmation: 'curta' },
    { password: ' '.repeat(8), confirmation: ' '.repeat(8) },
    { password: 'a'.repeat(129), confirmation: 'a'.repeat(129) },
    { confirmation: 'senha-diferente' },
  ];
  for (const invalid of cases) {
    const storage = memoryStorage();
    await assert.rejects(createLocalAccount(input(invalid), storage), Error);
    assert.equal(storage.getItem(ACCOUNTS_KEY), null, JSON.stringify(invalid));
  }
});

test('limite de contas recusa nova criação sem apagar contas existentes', async () => {
  const storage = memoryStorage();
  await createLocalAccount(input(), storage);
  const [base] = records(storage);
  storage.setItem(ACCOUNTS_KEY, JSON.stringify(Array.from({ length: 20 }, (_, index) => ({ ...base, id: crypto.randomUUID(), username: 'aluno-' + index }))));
  const before = storage.getItem(ACCOUNTS_KEY);
  await assert.rejects(createLocalAccount(input({ username: 'aluno-novo' }), storage), /20 contas/);
  assert.equal(storage.getItem(ACCOUNTS_KEY), before);
});

test('falhas de leitura e gravação são explícitas e não geram uma conta falsa', async () => {
  const unreadable = { getItem() { throw new Error('blocked'); }, setItem() { assert.fail('não deve escrever após falha de leitura'); } };
  await assert.rejects(createLocalAccount(input(), unreadable), /não permitiu ler/);
  await assert.rejects(signInLocal('aluno', input().password, unreadable), /não permitiu ler/);
  const storage = memoryStorage();
  const unwritable = { getItem: storage.getItem, setItem() { throw new Error('quota'); } };
  await assert.rejects(createLocalAccount(input(), unwritable), /Não foi possível salvar/);
  assert.equal(storage.getItem(ACCOUNTS_KEY), null);
});

test('dados corrompidos ou registros adulterados são preservados para recuperação', async () => {
  const valid = memoryStorage();
  await createLocalAccount(input(), valid);
  const [base] = records(valid);
  const malformed = [
    '{registro quebrado', 'null', '{}', '[null]',
    JSON.stringify([{ ...base, passwordHash: 'senha-plain' }]),
    JSON.stringify([{ ...base, salt: '' }]),
    JSON.stringify([{ ...base, id: '../outro-perfil' }]),
    JSON.stringify([{ ...base, iterations: 1 }]),
    JSON.stringify([base, { ...base, id: crypto.randomUUID() }]),
    JSON.stringify([base, { ...base, username: 'outro.aluno' }]),
  ];
  for (const raw of malformed) {
    const storage = memoryStorage([[ACCOUNTS_KEY, raw]]);
    await assert.rejects(createLocalAccount(input({ username: 'aluno-novo' }), storage), /dados não foram substituídos/);
    await assert.rejects(signInLocal('músico_01', input().password, storage), /dados não foram substituídos/);
    assert.equal(storage.getItem(ACCOUNTS_KEY), raw);
  }
});
