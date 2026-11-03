# Music Lab 0.4.1 — Metrônomo e leitura rítmica

## O que mudou

As 9 aulas anteriores continuam idênticas: validação de nota, afinação e sustentação em segundos, incluindo checks previamente salvos. Acrescentamos as aulas **10 — O pulso da música** (semínima e mínima) e **11 — Lendo notas longas** (semínima, mínima e semibreve), com oito exercícios novos.

## Figuras e equivalências

| Figura | Pulsos (♩ como unidade) | 60 BPM | 90 BPM | 120 BPM |
|---|---:|---:|---:|---:|
| Semínima | 1 | 1 s | 0,667 s | 0,5 s |
| Mínima | 2 | 2 s | 1,333 s | 1 s |
| Semibreve | 4 | 4 s | 2,667 s | 2 s |

Todos os exemplos são em 4/4 com a semínima como unidade do pulso. O professor pode ajustar o BPM de 45 a 120, em incrementos de 5, **antes** de ativar o microfone ou o metrônomo.

## Como testar

1. Abra a aula 10 ou 11. Observe a figura desenhada no pentagrama (cheia = semínima, oca com haste = mínima, oca sem haste = semibreve).
2. Selecione 60 BPM, ligue o metrônomo e escute os 4 pulsos com o primeiro acentuado.
3. Ative o microfone e toque a nota indicada, mantendo o som afinado pelo número de pulsos sugerido; ao cumprir a duração mínima válida, o check e o avanço permanecem automáticos.
4. Interrompa o sopro entre as notas; a pausa é necessária para confirmar o novo ataque.
5. Pare microfone/metrônomo, mude o BPM para 90; a duração escrita em pulsos continuará igual, mas o tempo em segundos será mais curto.
6. Observe que as aulas antigas não mudam a duração ao modificar o BPM, pois não são aulas rítmicas.

## Limite pedagógico deliberado

**Ainda não mede precisão de ataque no clique, nem a duração total até a soltura da nota.** Neste incremento medimos a duração **mínima contínua** de som válido relativa à figura e ao andamento, em vez de um número fixo de segundos. A avaliação completa de ritmo (ataque, soltura, pausas e compassos) está nas próximas tarefas (RIT-04–07) e requer calibração de latência em diferentes aparelhos.

Os cliques do metrônomo são de tom curto e agudo, planejados para reduzir interferência com a frequência do trompete, mas ainda podem entrar no microfone. Prefira fones de ouvido e verifique a leitura com o instrumento real. Evite pressionar crianças a sustentar sem conforto; faça pausas entre tentativas.

## Engenharia

- `src/lib/rhythm.ts`: valores e conversão BPM → ms, lógica pura e testável.
- `src/lib/metronome.ts`: agendamento Web Audio com janela de antecipação e intervalos curtos; evita temporizar o clique com simples `setInterval`.
- `src/lib/curriculum.ts`: campo opcional `figure` para novos exercícios e `defaultBpm` por aula.
- `src/App.tsx`: controle por aula, indicação de figura, pulsos e atualização da meta de sustentação.
- `tests/rhythm.test.mjs`: testes de cálculos, compatibilidade e conteúdo didático.

O microfone e o metrônomo usam contextos de áudio distintos; gravações e áudio bruto continuam sem persistência ou envio.
