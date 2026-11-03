# Music Lab 0.4.2 + 0.4.3 — controle do pulso e leitura de compasso

> Atualização 0.8: a aula 13 foi revisada. “Começar atividade” ativa o mic antes de iniciar exatamente quatro pulsos de preparação; o teste de microfone é opcional e não avalia. Há nível/nota ouvida e ajustes de entrada/sensibilidade. O build passa, e MusicXML já foi integrado separadamente. Os estados e roteiros abaixo são históricos; consulte docs/ENTREGA-08-E-TESTES.md. Área do Professor permanece fora do escopo, prevista para 0.9.

## Atualização 1: 0.4.2 — Ataque e soltura próximos do pulso
- Nova função `src/lib/pulseAssessment.ts`: associa timestamps de amostras aos eventos do compasso 4/4.
- Verifica a nota **escrita para trompete em Si♭**, comparando com a frequência real esperada (dois semitons abaixo).
- Exige começo e final da nota próximos das posições previstas do metrônomo, além de estabilidade razoável do som no interior da figura.
- A janela inicial de ±240 ms é **experimental**, não uma regra didática universal.
- Controle de compensação manual de latência de ±300 ms (não é calibração automática).
- O usuário recebe informação sobre ataque adiantado/atrasado, soltura e interrupções.

## Atualização 2: 0.4.3 — Um compasso real, com silêncio avaliado
- Nova Aula 12 — **Entradas no tempo**: Sol, Fá, Mi e Sol, quatro semínimas.
- Nova Aula 13 — **Compasso com pausa**: Sol (mínima), pausa de semínima, Fá (semínima).
- Pauta didática simplificada, marcadores de eventos e destaque da etapa em execução.
- Metrônomo de quatro pulsos, com pelo menos um compasso de preparação antes da tentativa.
- Check automático **após concluir o compasso inteiro**. Se houver falha, exibe orientação por evento e oferece repetir o compasso.
- Reconhecimento da pausa a partir do silêncio no microfone. O metrônomo pode vazar para o microfone: **usar fones**.
- Mantém as 11 aulas anteriores, sem alterar a regra de contagem de sustentação das versões 0.2–0.4.1.
- Histórico local do navegador com a mesma chave de armazenamento, sem enviar áudio ou dados a um servidor.

## Atenções para testes reais
1. Usar Node.js 22 ou superior. Rodar `npm install`, `npm test`, `npm run dev`.
2. Abrir a Aula 12, escolher 60 BPM. Iniciar microfone e metrônomo e então Iniciar compasso.
3. Aguardar a contagem e tocar quatro semínimas de Sol–Fá–Mi–Sol com o instrumento real.
4. Conferir se entradas muito atrasadas e pausas com som NÃO são marcadas como corretas.
5. Na Aula 13, tocar Sol por dois tempos, **silêncio** no terceiro e Fá no quarto.
6. Se todos os ataques forem deslocados na mesma direção, ajustar compensação de latência em passos de 25 ms e registrar o aparelho usado.
7. Testar com fone no notebook; no celular, usar site HTTPS e fones.
8. Registrar acertos e falsos positivos com professor antes de reduzir a tolerância de avaliação.

## Limitações conhecidas
- O detector usa blocos de áudio com leitura periódica no navegador, não mede o toque físico nos pistos ou o movimento da língua.
- Ataque e soltura são estimativas do som reconhecido; o timbre e a sala podem introduzir atraso.
- O volume do metrônomo ou ruídos externos podem influenciar a análise, em particular as pausas.
- A representação da partitura é didática simplificada, ainda não substitui a leitura MusicXML.
- Não foi possível executar o `npm install`/build neste ambiente (registro npm inacessível); os testes automatizados de lógica passaram, mas o comportamento de interface e hardware ainda exige verificação prática.

## Seguinte no cronograma
- 0.4.4: melhorar a calibração de latência e detectar múltiplos compassos com repetição de notas.
- 0.5: área do professor, atividades personalizáveis, relatórios, revisão da sequência didática com professores.
