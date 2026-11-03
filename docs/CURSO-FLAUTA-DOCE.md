# Curso de flauta doce soprano — 0.8.1

Implementado em 21/10/2026 para testar o segundo instrumento. Curso inicial experimental: precisa de revisão pedagógica e teste com flauta real. Não equivale a um método completo.

## Instrumento e notação

Flauta doce **soprano em Dó**, com escolha entre sistemas barroco e germânico. Furo 0: polegar esquerdo atrás; 1–3: indicador/médio/anelar esquerdos; 4–7: indicador/médio/anelar/mínimo direitos. Furos duplos inferiores são tratados como totalmente fechados ou abertos nestas notas naturais.

Notação tradicional com 8 acima da clave: escrito Dó4–Ré5, som Dó5–Ré6. O perfil possui deslocamento de +12 semitons, separado dos -2 do trompete. Não basta mudar o nome da nota: o avaliador exige a frequência sonora e a oitava corretas. Exemplos: Si4 escrito = Si5 real ~987,77 Hz; Lá4 = Lá5 ~880 Hz; Sol4 = Sol5 ~783,99 Hz. O limite do detector foi ampliado para 1400 Hz, cobrindo Ré6 ~1174,66 Hz.

As digitações iniciais e a leitura oitavada foram conferidas nas fontes primárias Yamaha:
- [Orientações e tabela de digitação](https://www.yamaha.com/en/musical_instrument_guide/recorder/play/play002.html).
- [Tabela da soprano barroca](https://www.yamaha.com/en/musical_instrument_guide/common/images/recorder/fingering_baroque.pdf).
- [Tabela da soprano germânica](https://www.yamaha.com/en/musical_instrument_guide/common/images/recorder/fingering_german.pdf).
- [Diferença entre sistemas](https://www.yamaha.com/en/musical_instrument_guide/recorder/selection/selection002.html).

As ilustrações SVG foram criadas no projeto; não foi copiado o desenho das tabelas.

## Aulas

| Nº | Aula | Prática |
|---|---|---|
| 1 | Conheça sua flauta doce | Explorar os oito furos no desenho, sem microfone |
| 2 | Seu primeiro Si | Furos 0 e 1; som contínuo por dois segundos |
| 3 | Um novo som: Lá | Furos 0, 1, 2; alternar Lá e Si |
| 4 | Chegou o Sol | Furos 0–3; Sol, Lá e Si |
| 5 | Três notas na bagagem | Sequência Si–Lá–Sol–Lá–Si |
| 6 | Uma nota, duas vezes | Emissões separadas, com silêncio entre repetições |
| 7 | Dó e Ré lá em cima | Dó5 escrito: 0 e 2; Ré5 escrito: 2 |
| 8 | Uma melodia de cinco notas | Si, Lá, Sol, Dó5 e Ré5, com pausa entre etapas |
| 9 | Fá e Mi entram na roda | Fá conforme o sistema; Mi com furos 0–5 |
| 10 | Descendo até o Dó | Ré4 e Dó4 escritos, furos inferiores fechados |
| 11 | Seu som encontra o pulso | Semínimas e mínimas, sustentação guiada pelo metrônomo |
| 12 | Quatro tempos, uma música | Si–Lá–Sol–Lá, entradas/saídas avaliadas em 4/4 |
| 13 | O silêncio também toca | Si por dois pulsos, pausa de um, Lá por um |

Fá barroco: 0, 1, 2, 3, 4, 6, 7. Fá germânico: 0, 1, 2, 3, 4. A escolha altera diagramas, orientações e reforços de Fá; a frequência-alvo é a mesma. O sistema fica salvo. Nenhuma câmera tenta inferir esses gestos.

## Reutilização e isolamento

A tela da trilha, os painéis laterais, o motor de sustentação, a pausa obrigatória entre notas e o avaliador de compassos são compartilhados. Cada nota agora pode explicitar seu deslocamento sonoro e seus furos; notas antigas de trompete continuam com o padrão -2.

Os dois cursos têm IDs e chaves separados. `mis-music-lab-v03` continua sendo do trompete; `mis-music-lab-recorder-v1`, da flauta. O componente de curso é recriado ao trocar instrumento, carregando os dados correspondentes. O histórico adaptativo da flauta usa `mis-music-lab-v07-recorder`; o toque usa chave própria por sistema. Não se migram checks do trompete para a flauta.

As partituras importadas têm instrumento associado; dados antigos sem esse campo pertencem ao trompete. IDs de importação de flauta possuem prefixo próprio, evitando colisão com o mesmo XML lido no outro instrumento. A biblioteca oferece três estudos originais para cada curso. Reforços usam as notas, a oitava e o sistema escolhidos.

O subconjunto de XML da flauta aceita notas naturais escritas de Dó4 a Ré5, uma voz, compassos completos e andamento constante, conforme os limites gerais do README. Transposição explícita incompatível é recusada. Sem campo de transposição, o arquivo é interpretado na convenção da soprano indicada na interface; não há detecção automática de notação em altura real.

## Verificação e próximos testes

115 testes passaram: regressões do trompete, curso e digitações, frequência/oitava da flauta, sequências, compasso com silêncio, reforços, biblioteca/XML, captação sintética até Ré6 e três testes de renderização React no servidor. O build TypeScript/Vite passou.

A renderização em servidor verifica componentes, textos e dados iniciais; não verifica cliques, layout em pixels, permissão de microfone ou som real. A automação do navegador local continua bloqueada pela política previamente registrada.

Roteiro de aceite:
1. Atualizar a página; no cabeçalho escolher Flauta doce e confirmar. Conferir seleção barroca/germânica.
2. Explorar os oito furos da primeira aula, incluindo o 0 atrás; continuar para o Si.
3. Ouvir a referência com microfone desligado; iniciar e tocar Si com furos 0 e 1. Verificar nota e sustentação; repetir em Lá e Sol.
4. Repetir uma nota sem separação: não deve receber dois checks. Tocar uma oitava errada: não deve passar.
5. Conferir o Fá nos dois sistemas, compasso com pausa e melodias da biblioteca; testar som na pausa e nota errada.
6. Voltar ao trompete pelo cabeçalho. Conferir todos os checks antigos e a retomada; voltar à flauta e conferir progresso próprio.
7. Explorar por toque e verificar que isso não conclui aulas com microfone.
8. Validar em notebook e celular HTTPS, com fones e a flauta soprano real, registrando dispositivo, ruído e falsos resultados.

Não houve validação física de flauta, timbre, latência, responsividade visual ou revisão do método por professor nesta entrega. Não há curso de flauta doce contralto, tenor ou flauta transversal; não há cadastro/Área do Professor.
