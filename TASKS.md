# TASKS — CACTOM

## Bloco vigente — Etapa 02

Etapa 01 recebeu autorização para avançar. Motion do Tom implementado; 163 testes e build aprovados, com 15 testes específicos após o último refinamento visual. Rig/pose inspecionados em renders nativos; vídeo, foco/cursor/toque e aparelhos reais pendentes. Não começar a 03 sem novo avanço autorizado. Ver docs/cactom/ETAPA-02-TOM-INTERATIVO.md. Os registros abaixo são históricos.


## Bloco vigente — Etapa 01 (22/10/2026)

Etapa 00 aceita pelo responsável. Identidade/boas-vindas/login visual implementados; 156 testes e build aprovados. Asset oficial organizado e conferido. Capturas mobile/desktop, foco/teclado/toque e leitura ainda pendentes. Não começar a 02 sem validar a 01. Ver docs/cactom/ETAPA-01-IDENTIDADE-E-ACESSO.md e BACKLOG.md. Os registros abaixo são históricos, inclusive a situação anterior da 00.

## Bloco vigente — Etapa 00 (22/10/2026)

Plano oficial recebido e adotado. Ver `docs/cactom/BACKLOG.md`: 176 tarefas numeradas extraídas das páginas 5–26, todas inicialmente desmarcadas. O roteiro prevalece sobre o histórico.

Entrega técnica desta sessão: backup verificado, instalação/dependências conferidas, 154 testes e build aprovados, mapa técnico, decisões, changelog, escopo excluído e critérios de aceite. Estado: **em validação**. Não avançar automaticamente.

Próximo bloco após validação: Etapa 01, identidade oficial do Tom e login visual. Câmera/trompete virtual excluídos; ofensivas ficam para 14. O cadastro local antigo não conclui a Etapa 03. A atividade 13 permanece falhando no relato dos dois cursos.

## Histórico anterior — não marca etapas do novo plano

## Entrega atual 0.8.2 — entrada local, identidade e ofensiva (22/10/2026)

**Este registro prevalece sobre o histórico abaixo. Estado: Em teste.** A atividade 13 continua falhando nos dois cursos segundo o responsável. Ele adiou sua investigação para a próxima sessão; a rodada atual preserva o motor de avaliação. Área do Professor fora do escopo.

| ID | Descrição | Prioridade | Versão | Dependências | Status | Critério de aceite |
|---|---|---|---|---|---|---|
| RIT-16 | Reproduzir falha real da atividade 13 em trompete e flauta | P0 | Próxima sessão | Relato/erro e captação reais | Pendente — adiado pelo responsável | Registrar mensagem exata, entrada de áudio e execução; corrigir causa comprovada sem afrouxar avaliação. Os testes sintéticos não encerram este item |
| ACC-01 | Login/criação de conta local antes do instrumento, com demo | P0 | 0.8.2 | WebCrypto e navegador | Em teste | Usuário/senha válidos, erros claros, pular sem cadastro, voltar à entrada e escolher ambos os cursos; validar cliques reais |
| ACC-02 | Separar dados de conta/demo em localStorage e IndexedDB | P0 | 0.8.2 | ProfileStorage | Em teste | Testes de namespace/callbacks/bancos, dados legados intactos na demo; conferir recarga e alternância de contas no navegador |
| ACC-03 | Tratar falhas de leitura/gravação sem falsa conta salva | P0 | 0.8.2 | ACC-01/02 | Em teste | Cadastro inválido/corrompido não sobrescrito, gravação indisponível sinalizada, memória limitada ao perfil montado; conferir fluxo real |
| UI-08-01 | Usar logo original da escola sem editar outro projeto | P1 | 0.8.2 | Marca encontrada | Em teste | Original copiado em public/branding, usado na entrada e navegação; conferir contraste/proporções no navegador |
| UI-08-02 | Refinar trilha e novos assets vetoriais de mascote/instrumentos | P1 | 0.8.2 | Direção visual autorizada | Em teste | Identidade petróleo/verde/laranja, ações claras, leitura móvel, foco/teclado e movimento reduzido; aceite visual pendente |
| STR-01 | Registrar dias reais por etapas válidas no perfil | P0 | 0.8.2 | Prática/descoberta/virtual existentes | Em teste | Uma data por dia em Fortaleza; sem visita/erro/silêncio isolado/futuro; conta e demo isoladas; validar integração com instrumentos |
| STR-02 | Tela de ofensiva, meta, semana, recorde e marcos 3/7/14/30 | P1 | 0.8.2 | STR-01 | Em teste | Valores derivados sem datas retroativas inventadas; ontem mantém sequência até a meta de hoje; conferir navegação e virada de dia |
| QA-23 | Regressão automatizada e build da 0.8.2 | P0 | 0.8.2 | ACC/UI/STR | Em andamento | Última medição147/147 aprovada; incluir três novos testes de ProfileStorage e registrar a contagem final e o build |
| QA-24 | Aceite visual, cliques, teclado, móvel e hardware | P0 | 0.8.2 | Navegador/dispositivos reais | Pendente | URL automatizada bloqueada; executar roteiro ENTRADA-LOCAL-E-OFENSIVA e roteiros musicais quando disponível |

Sem nuvem/sincronização/recuperação de senha e sem professor/turmas/painel administrativo. A demo conserva o progresso antigo; novas contas começam com dados próprios. Detalhes em `docs/ENTRADA-LOCAL-E-OFENSIVA.md`.

## Entrega atual 0.8.1 — segundo curso (21/10/2026)

As entradas abaixo são históricas. Curso de flauta implementado e **Em teste**. A área do professor segue fora do escopo.

| ID | Descrição | Prioridade | Versão | Dependências | Status | Critério de aceite |
|---|---|---|---|---|---|---|
| REC-01 | Disponibilizar dois instrumentos e retomar curso correto | P0 | 0.8.1 | Registro e seleção | Em teste | Renderização inicial passa; confirmar troca e retorno no navegador |
| REC-02 | Criar 13 aulas próprias de flauta soprano | P0 | 0.8.1 | Currículo | Em teste | IDs únicos, objetivos/dicas, notas, sequência, ritmo e pausas; validar com flauta real |
| REC-03 | Diagrama e escolha barroca/germânica | P0 | 0.8.1 | Posições verificadas | Em teste | Polegar/duplos e Fá corretos nos testes; conferir acessibilidade/toque visual |
| REC-04 | Frequência/oitava da soprano e captação até Ré6 | P0 | 0.8.1 | Avaliador e monitor | Em teste | Frequências sintéticas e oitava errada testadas; confirmar instrumento real |
| REC-05 | Separar progresso, conquistas e reforços | P0 | 0.8.1 | Persistência e adaptação | Em teste | Chave legada preservada, notas/erros não se misturam; validar recarga/troca real |
| REC-06 | Exploração por toque e som guia | P1 | 0.8.1 | Desenho e áudio | Em teste | Combinação contínua; progresso separado por sistema, sem check acústico; teste de uso pendente |
| REC-07 | Biblioteca/MusicXML da flauta | P1 | 0.8.1 | XML/OSMD existentes | Em teste | Três estudos e perfil de importação passam; conferir pauta/cursor/execução no navegador |
| REC-08 | Regressão automatizada e build | P0 | 0.8.1 | REC-01–07 | Concluído | 115/115 testes, incluindo três renderizações em servidor; build aprovado |
| REC-09 | Aceite com flauta e telas reais | P0 | 0.8.1 | Instrumento/dispositivos | Pendente | Executar docs/CURSO-FLAUTA-DOCE.md; registrar captação, responsividade e revisão pedagógica |

Nenhuma câmera de flauta, curso de contralto/transversal ou cadastro de professor foi adicionado.

## Entrega 0.8 — estado atual em 21/10/2026

Esta seção substitui os estados antigos abaixo; as entradas seguintes ficam como histórico. **0.6, 0.7 e 0.8 estão Em teste**, com implementação de código e verificações automatizadas concluídas. A aceitação em hardware e navegador ainda está pendente. Área do Professor fora do escopo.

| ID | Descrição | Prioridade | Versão | Dependências | Status | Critério de aceite |
| --- | --- | --- | --- | --- | --- | --- |
| INST-01 | Escolher instrumento na primeira abertura, lembrar escolha e reabrir seleção | P0 | 0.8 | Registro de instrumentos | Em teste | Só trompete habilitado; cursos futuros identificados; sem apagar progresso; testar navegação real |
| CAM-13 | Estabilizar calibração, suavização, sensibilidade e perda de sinal | P0 | 0.6 | MediaPipe | Em teste | Testes puros aprovados; ainda validar webcam, oclusão e falsos checks |
| CAM-14 | Modelo e runtimes servidos localmente | P1 | 0.6 | postinstall/build | Em teste | Arquivos preparados e incluídos; conferir câmera no navegador e desempenho móvel |
| CAM-15 | Volume, envelope e 14 atividades, mantendo IDs antigos | P1 | 0.6 | CAM-13 | Em teste | Testes de sequência aprovados; ouvir timbre/estalos e conferir gestos reais |
| ADP-01 | Histórico derivado e identificação de recorrências | P0 | 0.7 | Resultados do microfone | Em teste | Persistir até 500 tentativas; considerar acerto posterior e tarefas de pausa separadas |
| ADP-02 | Reforços por nota/foco e dificuldade gradual | P0 | 0.7 | ADP-01 | Em teste | Três níveis limitados, oitava correta e IDs próprios; completar fluxo real |
| ADP-03 | Revisão após 24 h e histórico visível | P1 | 0.7 | ADP-01 | Em teste | Revisão baseada em data real; validar recarga e recomendação no navegador |
| XML-01 | Parser monofônico restritivo e seguro | P0 | 0.8 | Registro do trompete | Concluído | Testes de importação, transposição, durações, ligaduras, erros e conteúdo externo aprovados |
| XML-02 | Biblioteca e importação local | P0 | 0.8 | XML-01, IndexedDB | Em teste | Três estudos, importação e resultados recuperáveis após recarga em navegador real |
| XML-03 | Renderização OSMD e marcador por nota | P0 | 0.8 | XML-01 | Em teste | Tipos/build aprovados; conferir SVG, cursor e responsividade no navegador |
| XML-04 | Avaliação por nota, pausa e compasso | P0 | 0.8 | Motor de avaliação, mic/metro | Em teste | Casos sintéticos aprovados; confirmar melodias, repetição e compensação com trompete |
| RIT-15 | Corrigir aula 13 e expor o sinal ouvido | P0 | 0.8 | Mic, metrônomo | Em teste | Quatro pulsos fixos; Sol–pausa–Fá e harmônicos aprovados nos testes; repetir com equipamento do relato |
| QA-20 | Regressão automatizada e build Windows | P0 | 0.8 | Dependências instaladas | Concluído | 96/96 testes; TypeScript e build Vite aprovados |
| QA-21 | Conferir fluxos e composições no navegador | P0 | 0.8 | Prévia acessível | Bloqueado | Automação bloqueada pela política da URL local; fazer revisão visual/interativa quando disponível |
| QA-22 | Testar trompete, câmera, latência e móveis HTTPS | P0 | 0.6–0.8 | Dispositivos reais | Pendente | Executar docs/ENTREGA-08-E-TESTES.md, registrar falsos positivos/negativos e revisar musicalmente |
| FUT-09 | Área do Professor | P2 | 0.9 | Solicitação futura | Pendente | Nenhum cadastro, turma ou painel implementado agora |

Próximo aceite: QA-22, começando pela aula 13; depois QA-21 e validação das partituras. O aviso do bundle grande de OSMD é conhecido; o módulo é carregado sob demanda.

Atualização: 21/10/2026 | Versão atual: 0.6.0 (modo câmera experimental)

## Atualização visual — 21/10/2026

| ID | Descrição | Prioridade | Versão | Dependências | Status | Critério de aceite |
| --- | --- | --- | --- | --- | --- | --- |
| UI-06-09 | Mover afinação, dicas e etapas para ícones junto ao exercício | P0 | 0.6 visual | UI-06-06 | Em teste | Abrir/fechar painel sem rolar a página, manter afinação ao vivo, funcionar em celular e teclado; 47 testes e build aprovados |

| ID | Descrição | Prioridade | Versão | Dependências | Status | Critério de aceite |
| --- | --- | --- | --- | --- | --- | --- |
| UI-06-06 | Substituir a estrutura interna antiga por experiência focada de atividade | P0 | 0.6 visual | UI-06-01 | Em teste | Explorar três pistos, receber conquista, continuar e verificar aulas acústicas e rítmicas |
| UI-06-07 | Atualizar a cópia efetivamente usada na porta 5174 | P0 | 0.6 visual | UI-06-06 | Em teste | Arquivos aplicados à cópia ativa; usuário confirmar a tela após atualização |
| UI-06-08 | Regressão de lógica e build das novas atividades | P0 | 0.6 visual | UI-06-06 | Concluído | 47/47 testes e build TypeScript/Vite aprovados |

Nova composição em `ActivityExperience.tsx` e `activity.css`. O aceite visual depende de conferência manual devido ao bloqueio de acesso do navegador automatizado.

| ID | Descrição | Prioridade | Versão | Dependências | Status | Critério de aceite |
| --- | --- | --- | --- | --- | --- | --- |
| UI-06-01 | Nova tela inicial, trilha de três unidades, navegação e identidade Made in Sertão | P0 | 0.6 visual | Base 0.6 | Em teste | Build e testes aprovados; confirmar composição e navegação no navegador |
| UI-06-02 | Conquistas e progresso derivados dos resultados existentes | P0 | 0.6 visual | UI-06-01, currículo e progresso local | Em teste | Conferir na interface os estados antes/depois de concluir uma aula e após recarregar |
| UI-06-03 | Harmonizar prática real e virtual com a nova identidade | P0 | 0.6 visual | UI-06-01 | Em teste | Verificar aula de pistos, áudio, metrônomo, câmera e toque, incluindo retorno à trilha |
| UI-06-04 | Tipagem, build e regressão da lógica existente | P0 | 0.6 visual | UI-06-01 a UI-06-03 | Concluído | 47/47 testes e build TypeScript/Vite aprovados |
| UI-06-05 | Aceite visual em celular, tablet e desktop | P0 | 0.6 visual | UI-06-01 a UI-06-03 | Pendente | Conferir 320–430 px, tablet e desktop; sem rolagem horizontal, foco visível e toque confortável |

Detalhes, resultados e limites da verificação em `PROGRESSO.md`. As tarefas abaixo são mantidas como histórico/backlog; esta atualização não representa o encerramento da auditoria 0.6.

**Como usar:** cada tarefa possui ID estável, dependências e critério de aceite. Concluir uma por vez. Antes de iniciar, ler `PROGRESSO.md` e `AGENTS.md`. Atualizar os dois arquivos ao terminar cada etapa. Não marcar como concluída sem testar.

Legenda: `[x]` concluído e verificado; `[~]` implementado, aguardando validação; `[ ]` não iniciado. Prioridades: P0 bloqueia MVP; P1 importante; P2 evolução.

## M0 — Fundamentos e infraestrutura

- [x] **MIS-001 [P0] — Definir escopo do MVP.** Entregável: `docs/PRODUTO.md` com público, problema, fluxo, limites e metas. Aceite: documenta instrumento real e modo inicial de apenas 5 notas.
- [x] **MIS-002 [P0] — Selecionar arquitetura.** Entregável: `docs/ARQUITETURA.md`. Aceite: decisões e razões para React+TS, Vite, Web Audio/Pitchy, expansão OSMD/MediaPipe e Electron.
- [~] **MIS-003 [P0] — Criar estrutura do projeto.** Entregável: arquivos `package.json`, `src/`, Vite e `.gitignore`. Aceite: `npm install`, `npm run dev` e `npm run build` passam no Windows. **Bloqueio:** ambiente de criação sem acesso ao registro npm, portanto instalação e build pendentes.
- [x] **MIS-004 [P0] — Documentar continuidade para Codex.** Entregável: `TASKS.md`, `PROGRESSO.md`, `AGENTS.md`. Aceite: um novo assistente sabe o que executar e o que não alterar.
- [ ] **MIS-005 [P0] — Criar repositório Git independente.** Depende: MIS-003. Aceite: repo privado `made-in-sertao-music-lab`, primeiro commit, sem alteração do repositório do Studio.

## M1 — Prova de conceito de escuta do trompete real

- [~] **AUD-001 [P0] — Capturar microfone com autorização.** Depende: MIS-003. Implementação preliminar: `src/lib/audio.ts`. Aceite: pedir acesso apenas por clique, áudio local e parar totalmente ao desligar. Teste manual pendente.
- [~] **AUD-002 [P0] — Detectar frequência fundamental (Hz) e clareza.** Depende: AUD-001. Implementação preliminar com Pitchy. Aceite: leitura estável no trompete real, silêncio ignorado e sem confundir harmônicos em repertório inicial. Exige teste prático.
- [x] **MUS-001 [P0] — Definir transposição do trompete em Si♭.** Entregável: `src/lib/music.ts` e testes. Aceite: Dó4 escrito = Si♭3 de concerto (~233,08 Hz); conversão com testes automatizados aprovados.
- [x] **MUS-002 [P0] — Definir cinco notas e digitações sugeridas.** Aceite: Dó4 aberto; Ré4 1+3; Mi4 1+2; Fá4 1; Sol4 aberto; testes automatizados.
- [~] **AUD-003 [P0] — Comparar nota ouvida com nota-alvo.** Depende: AUD-002 e MUS-001. Implementação preliminar realizada. Aceite: feedback de nota e cents em tela; tolerância testada com instrumento real.
- [ ] **AUD-004 [P0] — Testar em condições reais.** Depende: AUD-003. Aceite: três sessões de trompete, notas sustentadas em diferentes volumes e dois microfones; documentar acertos, oitavas erradas, ruído e latência. Nenhuma precisão será presumida.
- [ ] **AUD-005 [P1] — Otimizar análise com AudioWorklet/worker.** Depende: AUD-004. Aceite: medir latência e carga da interface; migrar processamento somente se demonstrar ganho/necessidade.
- [ ] **AUD-006 [P1] — Calibração de entrada e limiar de silêncio.** Depende: AUD-004. Aceite: controle de sensibilidade e explicação clara quando o som não puder ser identificado.

## M2 — Primeira experiência de aprendizagem

- [~] **EDU-001 [P0] — Interface de exercício com cinco notas.** Depende: MUS-002, AUD-003. Implementação preliminar em `src/App.tsx`. Aceite: mostrar nota escrita, digitação sugerida e áudio real detectado.
- [~] **EDU-002 [P0] — Registrar conclusão de uma nota sustentada.** Depende: EDU-001. Implementação preliminar: 650 ms dentro de ±30 cents. Aceite: testar estabilidade contra falso positivo, ataques/transientes e variação na afinação.
- [ ] **EDU-003 [P0] — Validar exercício presencialmente com professor e 2–3 alunos.** Depende: AUD-004 e EDU-002. Aceite: lista de dificuldades, observações pedagógicas e melhorias priorizadas.
- [ ] **EDU-004 [P1] — Exercícios de ritmo com metrônomo.** Depende: EDU-003. Aceite: marcação de tempos, início/pausas e tolerância de ataque validada.
- [ ] **EDU-005 [P1] — Histórico local sem conta de usuário.** Depende: EDU-003. Tecnologia: IndexedDB/Dexie. Aceite: últimos estudos persistem ao fechar e reabrir, com opção apagar tudo.
- [ ] **EDU-006 [P1] — Feedback positivo, legível e progressivo.** Depende: EDU-003. Aceite: linguagem respeitosa, evita punir variação normal de iniciante, modo acessível com contraste.

## M3 — Partitura interativa

- [ ] **PAR-001 [P1] — Renderizar MusicXML com OSMD.** Depende: EDU-003. Aceite: partitura de cinco notas exibe clave, compasso e altura corretamente em notação de trompete Si♭.
- [ ] **PAR-002 [P1] — Destacar nota atual na partitura.** Depende: PAR-001. Aceite: marcador muda somente após evidência suficiente de acerto.
- [ ] **PAR-003 [P1] — Importar exercícios MusicXML simples.** Depende: PAR-001. Aceite: valida arquivo, exibe erro amigável, suporta monofonia inicial.
- [ ] **PAR-004 [P2] — Biblioteca de exercícios elaborados pelos professores.** Depende: PAR-003. Aceite: versão, nível, objetivo, BPM e digitações cadastrados.

## M4 — Digitação por câmera (experimento)

- [ ] **VIS-001 [P1] — Provar detecção da mão com MediaPipe.** Depende: MIS-003. Aceite: identificar 21 pontos em diferentes condições de luz.
- [ ] **VIS-002 [P1] — Mapear indicador, médio, anelar para pistos.** Depende: VIS-001. Aceite: calibrar mão e demonstrar oito combinações sem instrumento, medindo taxa de erro.
- [ ] **VIS-003 [P1] — Testar a oclusão dos dedos segurando o trompete.** Depende: VIS-002. Aceite: registrar limitações reais; caso visão falhe, não afirmar que conferiu digitação.
- [ ] **VIS-004 [P2] — Associar detecção dos pistos a exercícios.** Depende: VIS-003 validado. Aceite: exibir resultado com confiança e estado 'não foi possível confirmar'.
- [ ] **VIS-005 [P2] — Modo trompete virtual sem instrumento.** Depende: VIS-002. Aceite: sintetizar/reproduzir timbre e selecionar registro harmônico sem prometer embocadura real.

## M5 — Escola, privacidade e distribuição

- [ ] **ESC-001 [P1] — Painel do professor e objetivos por turma.** Depende: EDU-005. Aceite: professor define exercícios e visualiza apenas dados autorizados.
- [ ] **ESC-002 [P0 antes de dados de crianças] — Política de privacidade e consentimento.** Depende: EDU-005/ESC-001. Aceite: tratamento de dados de menores analisado sob LGPD, acesso restrito, retenção mínima e exclusão.
- [ ] **ESC-003 [P1] — Teste em notebooks modestos e microfones comuns.** Depende: EDU-003. Aceite: funcionamento avaliado em máquinas de uso da escola.
- [ ] **REL-001 [P1] — Empacotar versão desktop Electron.** Depende: EDU-003. Aceite: versão Windows abre e encerra câmera/microfone corretamente, integração segura (contextIsolation, sandbox, mínimo privilégio).
- [ ] **REL-002 [P2] — Avaliar integração com o Made In Sertão Studio.** Depende: REL-001 e PAR-001. Aceite: decisão documentada; manter motor OMR/partituras atual intacto.
- [ ] **REL-003 [P2] — Estudo controlado de efetividade pedagógica.** Depende: EDU-003. Aceite: plano simples de pré/pós-teste, critérios claros, consentimento e análise de resultados sem prometer '100% de melhoria'.

## Ordem de execução sem desvios

1. Verificar MIS-003 no Windows e iniciar Git (MIS-005).
2. Executar AUD-004 com um trompete real; corrigir falhas do AUD-001–003.
3. Concluir EDU-001/002 com validação presencial EDU-003.
4. Só então iniciar a partitura OSMD, ritmo e histórico.
5. Experimentar câmera/MediaPipe separadamente, sem paralisar o aplicativo de áudio.
6. Decidir distribuição Electron e recursos de escola depois de validar a aprendizagem.

**Regra de projeto:** qualquer nova ideia entra no final deste arquivo como tarefa futura; nunca interromper a tarefa atual sem registrar o motivo no `PROGRESSO.md`.

## M1.1 — Aulas guiadas e check de som sustentado (MVP v0.2, 20/10/2026)

Implementado em código, mas pendente de validação prática com trompete e compilação real no Windows:

- [~] **PED-01 [P0] — Navegação entre três aulas.** Aula 1 = conhecer os pistos; Aula 2 = Sol4 sustentado; Aula 3 = Dó–Ré–Mi–Fá–Sol. Aceite: percurso sem erros, inclusive após recarregar a página.
- [~] **PED-02 [P0] — Demonstrar pistos 1, 2 e 3.** Aula 1 com cliques e check individual (não confundir cliques virtuais com a detecção da mão real). Aceite: a aula só marca concluída depois dos três cliques.
- [~] **AVAL-01 [P0] — Barra de nota sustentada.** Implementado `src/lib/practice.ts`, amostras sucessivas e tempo válido; tolerância inicial ±40 cents e padrão 2 s configurável. Aceite: sem progressão no silêncio ou nota errada, validar latência com instrumento.
- [~] **AVAL-02 [P0] — Check e avanço automático.** Código marca check, aguarda 1,1 s para o aluno perceber e inicia a nota seguinte. Aceite: verificar fisicamente cinco notas, sem falsos positivos.
- [~] **AVAL-03 [P0] — Feedback em tempo real.** Cents, nota ouvida, grave/agudo e orientação para aluno. Aceite: testes com diferentes microfones, volumes e ambiente de aula.
- [~] **AVAL-04 [P1] — Parâmetros e histórico local.** Tempo 1,5/2/3/5 segundos e checks em localStorage. Aceite: persistência e reinício manual funcionais.
- [x] **TEST-01 [P0] — Testes da lógica pura de sustentação.** `npm test`: 5 testes novos; 9 no total, todos aprovados neste ambiente em 20/10/2026.
- [ ] **TEST-02 [P0] — `npm install`, `npm run build`, teste em Chrome/Edge.** Bloqueado neste ambiente por registro npm indisponível; executar no Windows.
- [ ] **TEST-03 [P0] — Validação musical presencial.** Testar com trompete real notas Dó–Sol, ataques, ruído de fundo e pausas; ajustar critérios a partir de evidências.
- [ ] **EDU-07 [P1] — Revisão por professor.** Ajustar sequência didática e parâmetros de sustentação para alunos iniciantes.

**Nova regra de trabalho:** nenhuma nota passa apenas por clique. O botão é exclusivamente para ativar/desativar microfone e navegar entre aulas. A aprovação de nota exige detecção acústica estável durante o tempo especificado.


## M1.2 — Liquid Glass + Avaliação inteligente + curso responsivo (MVP v0.3 — 20/10/2026)

Estado dos itens a seguir: [x] implementado no código e coberto por testes onde cabível; [~] implementação inicial ainda requer validação real; [ ] pendente.

- [x] **UI-01 [P0] — Direção visual Liquid Glass branco/azul.** Critério: painéis translúcidos com blur, laranja e verde da escola como detalhes, fonte legível, sem substituir visual do aplicativo de partituras.
- [~] **UI-02 [P0] — Responsividade no celular.** CSS implementado para 320/360/390/768 px, com navegação compacta; verificar Android/iPhone e teclado real.
- [x] **DID-01 [P0] — Curriculum de nove aulas com metas explícitas.** `src/lib/curriculum.ts`: 9 aulas e 30 etapas acústicas, IDs únicos, explicações e dicas do professor.
- [x] **DID-02 [P0] — Notas repetidas com checks separados.** Sem reutilização de conclusão entre etapas que compartilham mesma altura.
- [x] **DID-03 [P0] — Sustentação por atividade.** Cada passo especifica 1,5–3 s; sem progressão por clique de aprovação.
- [x] **AVAL-05 [P0] — Check automático e avanço.** Check visual/sonoro, pausa de 1 s e nova nota sem ação do aluno.
- [x] **AVAL-06 [P0] — Impedir uma única emissão de aprovar notas repetidas.** Pausa com silêncio detectado por 260 ms após cada check; dois testes automáticos.
- [x] **AVAL-07 [P0] — Feedback de afinação e estabilidade.** Nota errada, grave/agudo, oscilação e som correto; parâmetros explícitos por aula.
- [x] **AVAL-08 [P1] — Tom eletrônico de referência.** Desabilitado com microfone ligado para evitar autocorreção/falso check.
- [x] **DATA-01 [P1] — Persistência local sem cadastro.** Registra aula, pistos e tentativas por etapa; migra dados básicos da v0.2.
- [x] **TEST-04 [P0] — Testes automatizados do motor e currículo.** `npm test`: 20 testes passaram.
- [ ] **TEST-05 [P0] — `npm install` e build de produção.** Rodar `npm run build` no Windows após instalar dependências.
- [ ] **TEST-06 [P0] — Teste do microfone com trompete físico.** Validar cinco notas, notas repetidas, afinação, ruído, pausas e latência.
- [ ] **MOB-01 [P0] — Publicação piloto por HTTPS.** Criar repo separado e testar celular com microfone permitido; instruções em `docs/CELULAR-HTTPS.md`.
- [ ] **MOB-02 [P0] — Teste de interfaces em dispositivos reais.** Android + iPhone, retrato/paisagem, 320–430 px, permission prompt.
- [ ] **DID-04 [P0] — Revisão da sequência e limiares por professor.** Ajustar tempo e notas sem incentivar esforço/hiperventilação.
- [ ] **AUDIO-09 [P1] — Reduzir falsos harmônicos.** Medir erros de oitava/timbre em trompete e diferentes aparelhos; só modificar detector com dados.
- [ ] **AUDIO-10 [P1] — Testar AudioWorklet e latência.** Migrar processamento pesado apenas se métricas apontarem necessidade.
- [ ] **DID-05 [P1] — Lições com leitura rítmica e metrônomo.** Separar avaliação de notas e avaliação do tempo; requer validação prévia das notas.
- [ ] **ESC-04 [P1] — Exportar resumo para o professor.** Sem dados pessoais na primeira versão; avaliar consentimento antes de criar perfis.

**Próximo ponto de retomada:** fazer TEST-05 no Windows, TEST-06 com trompete e MOB-01 com HTTPS antes de desenvolver câmera ou MusicXML.


## M1.3 — Avaliação de afinação visível e histórico acústico (MVP v0.4 — 20/10/2026)

- [x] **AUD-11 [P0] — Traçado de afinação vivo.** Gráfico SVG dos últimos nove segundos, com faixa de tolerância e quebra na ausência de altura válida.
- [x] **AUD-12 [P0] — Resumo da execução concluída.** Cents médios, oscilação e desvio máximo a partir da frequência dos frames aceitos; sem prometer análise biomecânica.
- [x] **DID-10 [P0] — Feedback pedagógico após check.** Mensagem de reforço conforme regularidade da afinação; não impede progressão de nota válida.
- [x] **DATA-02 [P1] — Histórico de avaliação por etapa.** Novo campo `results` sem apagar checks históricos, com exportação CSV por aula.
- [x] **UI-03 [P0] — Liquid Glass responsivo com gráfico.** Componentes SVG + CSS para telas pequenas sem dependência extra.
- [x] **TEST-07 [P0] — Testes de telemetria.** 6 novos testes, 26 no total passaram com `npm test`.
- [ ] **TEST-08 [P0] — Verificar build no Windows.** `npm install`, `npm run build`; registry npm não acessível neste ambiente.
- [ ] **TEST-09 [P0] — Validar relatório e gráfico em trompete real/celular.** Falsos harmônicos, linhas ao vivo, precisão de cents, áudio em diferentes aparelhos.
- [ ] **DID-06 [P1] — Metrônomo e ritmos.** Só depois da calibração da captação; nenhuma avaliação de ritmo nesta entrega.
- [ ] **DID-07 [P1] — Reforço por aula baseado em dificuldade persistente.** Ainda não existe um sistema adaptativo; apenas feedback textual por nota.

**Ponto de retomada:** TEST-08 → TEST-09 → DID-06. A IA/visão dos pistos permanece tarefa futura.

## M1.4 — Metrônomo e valores de figuras (MVP v0.4.1, 20/10/2026)

**Histórico (antes da revisão em 21/10):** o plano original incluía painel do professor na 0.5. **SUPERADO pela decisão posterior:** área do professor foi movida para 0.9 e a câmera assumiu prioridade 0.6.

- [x] **RIT-01 [P0] — Unidade de duração por figura.** `src/lib/rhythm.ts`: semínima=1 pulso, mínima=2, semibreve=4; BPM determina milissegundos necessários; aulas legadas continuam em segundos.
- [x] **RIT-02 [P0] — Metrônomo em WebAudio.** Acento no tempo 1, contagem visual 4/4, controles 45–120 BPM, agendamento antecipado para não depender de `setInterval` como relógio de áudio.
- [x] **RIT-03 [P0] — Aulas rítmicas 10 e 11.** Oito novas etapas de semínima, mínima e semibreve. Nota escrita muda de aparência (cabeça cheia/oca, com/sem haste). Check e avanço após duração mínima validada em pulsos.
- [x] **RIT-03A [P0] — Regressão do currículo.** 32 testes de lógica passam com `npm test`. Nova duração é calculada sem mudar IDs ou checks das nove aulas anteriores.
- [ ] **RIT-04 [P0] — Medir latência de escuta vs. metrônomo em dispositivos reais.** Comparar microfones USB/integrados, Android e iPhone antes de decidir janelas de ataque.
- [ ] **RIT-05 [P1] — Validar ataques sincronizados ao pulso.** Ainda não existe correção de entrada no tempo forte/fraco; projetar janela configurável com calibração.
- [ ] **RIT-06 [P1] — Reconhecer soltura e duração efetiva até o fim da nota.** Evitar aprovar uma semínima que continue além da duração; considerar silêncio/grace e detecção de onsets.
- [ ] **RIT-07 [P1] — Avaliar pausas, células e compassos completos.** Depois de RIT-04–06 e revisão dos professores.
- [ ] **MOB-03 [P0] — Confirmar 0.4.1 em celular HTTPS.** Fones, clique, interface, microfone e perda de foco.
- [ ] **TEST-10 [P0] — Build `npm run build` no Windows com dependências.** `npm install` indisponível neste ambiente; necessário validar a compilação no dispositivo do usuário.

**Ponto de retomada:** TEST-10 + MOB-03 + RIT-04. Não iniciar avaliação rígida de ataques antes de calibrar latência real.

## M1.5 — Avaliação rítmica e compassos (v0.4.2 + v0.4.3, 21/10/2026)
- [x] **RIT-09 — Calcular entrada/saída aproximadas das notas pela frequência captada e grade de pulsos** (±240 ms como tolerância experimental).
- [x] **RIT-10 — Oferecer correção manual do atraso do microfone** (±300 ms; ainda NÃO calibrada automaticamente).
- [x] **RIT-11 — Criar contagem de preparação antes da execução**.
- [x] **RIT-12 — Validar silêncio durante pausas e notas de durações diferentes**.
- [x] **DID-15 — Adicionar aulas 12 e 13 com quatro semínimas e mínima/pausa/semínima**.
- [x] **UI-18 — Exibir compasso didático responsivo com feedback por evento**.
- [x] **QA-16 — Testes automatizados de acerto, atraso, pausa correta e pausas com som**.
- [ ] **QA-17 [P0] — Validar npm install, build e interface no Windows** (npm registry indisponível no ambiente de criação).
- [ ] **QA-18 [P0] — Medir atraso real de microfone e alto-falante usando trompete e fone**.
- [ ] **QA-19 [P0] — Testar as aulas 12/13 em Android e iOS em HTTPS**.
- [ ] **RIT-13 [P1] — Calibração guiada de latência, sem depender de ajuste manual**.
- [ ] **RIT-14 [P1] — Trabalhar múltiplos compassos, repetição articulada e retomadas**.
- [ ] **DID-16 [P1] — Revisar tolerâncias e progressões com professor de trompete**.

## Revisão de roteiro — 21/10/2026

**Decisão:** Área do Professor deixa de ser prioridade 0.5 e passa a ser **versão 0.9**, a última fase antes da 1.0. Nenhum cadastro de professores/turmas será exigido até lá. O aplicativo continua concentrado na experiência do aluno.

### 0.6 — Trompete Virtual com Câmera (versão atual)

- [x] **CAM-01** — Integrar segundo modo de treino sem alterar o microfone nem as aulas 1–13.
- [~] **CAM-02** — Reconhecer uma mão por webcam com MediaPipe Hand Landmarker, 21 pontos e overlay espelhado. Implementado; validação em câmera real pendente.
- [~] **CAM-03** — Converter flexão dos dedos indicador, médio, anelar em pistos 1/2/3 com histerese e calibração aberta/fechada. Implementado e testado na lógica, validar com aluno real.
- [x] **CAM-04** — Notas alvo Dó–Sol e som sintetizado de referência transposto para trompete em Si♭, sem alegar simulação acústica integral.
- [x] **CAM-05** — Trilha de oito atividades com check após manutenção contínua da digitação, sem check sem mão; salvar progresso individual dos dois modos.
- [x] **CAM-06** — Modo pistos por toque separado do rastreamento, útil em celular/navegador sem webcam.
- [x] **CAM-07** — Interface Liquid Glass responsiva com câmera, calibração, pistos e instruções em português.
- [x] **CAM-08** — Oito testes automatizados de ângulos, calibração, debounce e validação de digitação (47 no total).
- [ ] **CAM-09 [P0]** — `npm install`, `npm run build` e validação da interface com webcam no Windows, Chrome/Edge.
- [ ] **CAM-10 [P0]** — Testes de câmera e som em Android/iOS HTTPS, com internet e luz variável.
- [ ] **CAM-11 [P1]** — Ajustar reconhecimento para postura real dos dedos e avaliar resultados com professor e alunos, medindo falso positivo/falso negativo.
- [ ] **CAM-12 [P1]** — Hospedar WASM/modelo localmente para reduzir dependência externa e fortalecer privacidade/offline.

### Roadmap restante, aprovado

- **0.7 — Professor Virtual Adaptativo:** exercícios de reforço automáticos baseados em dificuldades, sujeitos a validação pedagógica.
- **0.8 — Partituras Inteligentes:** MusicXML, leitura e acompanhamento nota a nota, figuras e compassos.
- **0.9 — Área do Professor (última etapa):** cadastro, turmas, atividades, histórico e acompanhamento quando realmente necessário.
- **1.0 — Lançamento inicial:** estabilização, acessibilidade, testes reais e revisão de privacidade para uso com menores.
