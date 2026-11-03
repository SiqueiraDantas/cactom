# Orientações para desenvolvimento com Codex / colaboradores

## Restauração em 02/11/2026
Esta pasta foi montada pelo Claude porque a pasta antiga se perdeu: o código (`src`, `public`, `tests`, `scripts`, `package.json`) é a versão mais nova que existia na pasta antiga, já com as mudanças de 01–02/11. Os documentos da raiz e `docs/` vieram da pasta CACTOM que estava na Mesa, que é de uma versão mais antiga, então podem estar desatualizados em relação ao código (por exemplo, a trilha de 64 paradas da flauta). O modelo `public/mediapipe/hand_landmarker.task` e as bibliotecas instaladas também vieram dessa pasta.

## Entrada estilo Duolingo — decisões do responsável (01–02/11/2026)
- Fluxo: “Eu quero aprender…” → Tom carregando 1,5 s → “Oi! Eu sou o Tom!” → `OnboardingJourney` → tela geral como visitante com cartão “Crie seu perfil”.
- **Exceção autorizada pelo responsável em 02/11/2026:** a mini atividade de partitura da jornada mostra corações e XP como no Duolingo. Vale só para essa atividade (aquecimento, não grava XP, não mexe na trilha nem na ofensiva). A regra geral continua no resto do app.
- Respostas da jornada em `cactom-onboarding-v1`; preferência de sons em `cactom-sons`. Cadastro de visitante não migra o progresso da visita.


## CACTOM — regra vigente a partir do plano de 22/10/2026

**Esta seção prevalece sobre todas as retomadas abaixo.** O responsável forneceu o PDF CACTOM de 71 páginas e pediu executar o cronograma passo a passo, com atualizações durante o trabalho. Ler primeiro `docs/cactom/PLANO-DE-EXECUCAO.md`, `AUDITORIA-ETAPA-00.md`, `DECISOES.md` e `BACKLOG.md`.

- Bloco atual: **Etapa 02 — Tom interativo, implementada para conferência**. O responsável autorizou continuar após a 01. Ler docs/cactom/ETAPA-02-TOM-INTERATIVO.md. Capturas/interação em dispositivos reais continuam pendentes; a autorização de avançar não comprova testes não realizados. Não iniciar a 03 automaticamente.
- Nome oficial: Cactom. Repositório único na raiz do workspace; fonte canônica continua na pasta em execução de nome antigo. A cópia da raiz é distribuição antiga congelada, não sincronizar como segunda fonte de desenvolvimento.
- Não antecipar etapas. Primeiro base; depois identidade/login visual (01), motion fiel do Tom (02), definições de conta/privacidade/autenticação consolidada (03). Não ampliar cadastro local nem cadastrar pessoas reais nesta fase.
- Tom oficial é o cacto verde com flor laranja da referência em `referencias/`, na raiz do repositório. O mascote com chapéu/vaso do protótipo é legado, não asset oficial.
- Câmera, rastreamento de dedos e trompete virtual estão excluídos do CACTOM. Código legado preservado no backup, sem novas implementações. Remover suas entradas ao integrar o fluxo CACTOM.
- Ofensiva está na Etapa 14, instrumento real na 15, adaptativo na 17, MusicXML na 18 e professor na 19/0.9. Os módulos existentes são candidatos futuros, não portões cumpridos.
- Preservar “Som antes do Símbolo”, tentativas livres e ausência de energia/vidas/cristais/assinatura. Não inventar domínio, XP ou resultados.
- Atualização da 02: **163 testes aprovados**, mais 15 de renderização/motion após ajuste de pálpebras; build aprovado. TomInteractive.tsx + tomMotion.ts + tom-motion.css usam textura oficial, máscaras e pose derivada tom-privacidade-v1.png criada com imagegen. Original oficial preservado; a pose derivada aguarda aceite. Tom recebe só estado de foco/resultado e coordenadas do mouse, nunca texto de senha. Não contornar o bloqueio anterior do navegador local. Atividade 13 e motores intactos.
- Registrar bloco, mudanças, evidência e pendências; comunicar ao responsável sem avançar silenciosamente. Checks oficiais continuam vazios até validação específica.

## Histórico do protótipo (não é cronograma CACTOM aprovado)

## Retomada prioritária — 0.8.2, entrada local, visual e ofensiva (22/10/2026)

**Este registro prevalece sobre o histórico abaixo.** O usuário autorizou conta local neste navegador com usuário/senha e opção de pular para demo, antes da escolha entre trompete e flauta doce. Em seguida pediu novos assets, visual mais bonito na direção Duolingo e tela de ofensiva real. A Área do Professor continua fora do escopo.

**PRÓXIMA SESSÃO — ATIVIDADE 13:** o usuário confirma que ela ainda falha em **trompete e flauta doce**, com erro desconhecido e aparente ausência de leitura. Os testes sintéticos aprovados não resolvem o relato real. Ele explicitamente adiou a investigação para a próxima sessão. Não mexer no avaliador nesta rodada visual. Retomar reproduzindo o erro e obtendo a mensagem exata/estado da captação; não ampliar tolerâncias para forçar aprovação. Não afirmar que a atividade 13 está corrigida.

- Fonte ativa continua em `Made_In_Sertao_Music_Lab_v0.6_Novo_Visual/made-in-sertao-music-lab-v0.6`, porta 5174. Preservar o servidor existente, a origem e o progresso. Espelhar fonte/documentação na cópia da raiz ao entregar.
- `LoginScreen.tsx` / `localAuth.ts`: entrar/criar conta com nome/apelido, usuário e senha ou **Pular e experimentar**. Sessão de acesso em memória; nova carga volta à entrada. Conta local não tem nuvem, sincronização, e-mail ou recuperação de senha. Senha é derivada com WebCrypto PBKDF2/SHA-256, salt individual e 600.000 iterações; não salvar senha em texto. Cadastros corrompidos não são substituídos silenciosamente.
- `ProfileStorage.tsx` / `profileStorage.ts`: conta usa `mis-user:<UUID>:`; demo mantém chaves antigas sem prefixo. IndexedDB também é separado por conta (`mis-music-lab-v08-user-<UUID>`), com banco legado na demo. Não misturar contas, instrumentos ou callback antigo com perfil novo. Falha de gravação pode manter dados na instância montada, sempre sinalizando persistência indisponível.
- `SchoolLogo.tsx`: arquivo original em `public/branding/logo-madeinsertao.png`, copiado sem alterar a imagem de `C:/Users/siqda/OneDrive/Documentos/ChatGPT/Sistema Arranjadora IA/Partitura MusicXML/public/assets/logo-madeinsertao.png`. O projeto de origem foi somente lido. CSS apresenta a arte branca em fundo petróleo ou preta em fundo claro; não redesenhar ou substituir a marca.
- `LabIllustrations.tsx` / `illustrations.css`: cenas vetoriais originais do mandacaru e instrumentos, variações de prática/conquista/ofensiva, ícone de chama. Manter identidade Made in Sertão, foco visível, adaptação móvel e preferência de movimento reduzido. As ferramentas continuam junto à atividade.
- `streak.ts` / `practiceDay.ts` / `StreakExperience.tsx`: uma data de prática por dia, timezone `America/Fortaleza`, chave `mis-music-lab-streak-v1` dentro do perfil. Conta e demo têm ofensivas separadas; instrumentos do mesmo perfil contribuem para a mesma sequência. Crédito após etapa acústica válida, conclusão da descoberta ou posição virtual validada; visita, som guia e silêncio isolado não geram um dia. Não converter checks antigos em datas fictícias.
- Tela de ofensiva: últimos sete dias, meta de uma etapa, sequência atual com tolerância de ontem, melhor sequência, dias totais e marcos 3/7/14/30 derivados do recorde real. Sem XP ou ranking inventado. Os registros começam nesta atualização.
- Última medição: **147/147 testes aprovados**. Três novos testes de ProfileStorage serão incluídos na medição final; build desta rodada ainda pendente de registro. Não confundir a validação antiga da 0.8.1 com a 0.8.2.
- Automação do navegador continua com bloqueio da URL local registrado. Não contornar com outro controlador; inspeção visual, cliques, responsividade e hardware real seguem pendentes. Testes de renderização em servidor não substituem esse aceite.
- Ler `docs/ENTRADA-LOCAL-E-OFENSIVA.md`, topo de `PROGRESSO.md` e `TASKS.md`; depois os roteiros musicais existentes. Os estados antigos abaixo permanecem como histórico.

## Retomada atual — 0.8.1, dois instrumentos (21/10/2026)

Esta seção prevalece sobre os registros antigos. O responsável autorizou o segundo curso: **flauta doce soprano em Dó**, com 13 aulas próprias, sistemas barroco/germânico, exploração por toque e três partituras. Trompete preservado; Área do Professor não implementada.

- `App` controla a escolha; `InstrumentCourse` é recriado com key por instrumento, isolando estados e recursos. Não voltar a compartilhar progresso entre cursos.
- `courses.ts`: curso/unidades e `progressStorageKey`. Trompete mantém `mis-music-lab-v03`; flauta usa `mis-music-lab-recorder-v1`. IDs de aulas/etapas da flauta têm prefixo próprio.
- `recorder.ts`: posições, sistema e 13 aulas; `RecorderExperience.tsx`/`recorder.css`: desenho e toque. Furo 0 atrás; 1–7 na frente. Toque não conclui exercício acústico. Não existe rastreamento de flauta por câmera.
- `PracticeNote.transposeSemitones` opcional: notas legadas continuam -2; soprano usa +12 na notação tradicional com 8 sobre a clave (Si4 escrito = Si5 real). Não confundir soprano com contralto, tenor ou transversal. O detector aceita até 1400 Hz.
- Furos da flauta ficam em `note.holes`; não reinterpretar como os três pistos. Fá barroco = 0,1,2,3,4,6,7; germânico = 0,1,2,3,4. Reforços devem receber o sistema escolhido.
- `usePracticeHistory(instrumentId)` e recomendações têm escopo de instrumento; flauta usa `mis-music-lab-v07-recorder`. Toque guarda progresso por sistema em chave própria.
- Bibliotecas separadas em `scoreLibrary.ts`; importações têm instrumentId e IDs de flauta prefixados. Dados legados sem instrumento pertencem ao trompete. `parseMusicXml` conserva perfil padrão do trompete para retrocompatibilidade.
- `ReferenceTone` reproduz a frequência real de cada nota; parar referência antes de ligar o mic ou sair. Os motores `practice.ts` e `release.ts` não foram alterados.
- 115 testes aprovados, incluindo três testes de renderização React no servidor. Esses testes não são inspeção visual nem teste de clique em navegador. Build aprovado; webcam, flauta, trompete, latência e móveis ainda precisam de testes reais.
- Ler `docs/CURSO-FLAUTA-DOCE.md` e os registros atuais de TASKS/PROGRESSO. Fonte em execução continua na pasta de nome antigo, porta 5174; espelhar código/documentos na cópia da raiz.

## Retomada atual — MVP 0.8, 21/10/2026

As seções antigas abaixo permanecem como histórico. A implementação atual chegou a 0.8, **Em teste**, sem Área do Professor. Preservar a direção visual e as ferramentas ao lado do exercício aprovadas pelo responsável.

- Cópia em execução: `Made_In_Sertao_Music_Lab_v0.6_Novo_Visual/made-in-sertao-music-lab-v0.6`, porta 5174. O nome antigo da pasta foi mantido para não interromper o servidor. Conferir a pasta ativa antes de editar.
- Fonte espelhada em `made-in-sertao-music-lab-v0.6` na raiz do workspace. Sincronizar alterações de fonte/documentos; excluir node_modules/dist na distribuição.
- Node >=22.18. Comandos: `npm test`, `npm run build`, `npm run dev -- --port 5174 --strictPort`. Última verificação: 96/96 testes e build aprovados. Não repetir suites sem mudança ou preocupação nova.
- Browser automatizado bloqueado pela política da URL local; não tentar contornar com outro controlador. Testes visuais/hardware continuam pendentes. Não afirmar validação que não foi executada.
- Instrumento: `instruments.ts` e `InstrumentPicker.tsx`. Só trumpet-bb habilitado; outros são cursos futuros.
- Adaptação: `adaptive.ts`/`adaptiveStore.ts`, resultados derivados sem mídia, chave `mis-music-lab-v07`. Reforços têm IDs separados, não contam como novas aulas concluídas. Não inventar recomendações sem evidência.
- Partituras: `musicxml.ts`, `scoreAssessment.ts`, `scoreStorage.ts`, `ScoreLab.tsx`/`ScoreRenderer.tsx`. Respeitar limites de importação, transposição -2, oitava, ligaduras, continuidade e silêncio. IDB `mis-music-lab-v08`.
- Cursor mostra posição esperada no andamento; checks só após avaliação real. Não chamar de seguidor adaptativo de tempo.
- `pulseAssessment.ts` usa o avaliador compartilhado, sem migrar as aulas de sustentação legadas. `practice.ts` e `release.ts` continuam preservados.
- Aula 13: referência Sol4=349,23 Hz/Fá4=311,13 Hz; quatro pulsos fixos após ativar mic. Compensação só altera timestamps captados, nunca a indicação visual. Aguardar amostras da soltura inclusive com offset negativo.
- MediaPipe local em public/mediapipe; scripts/prepare-assets.mjs prepara WASM e licenças. Modelo .task precisa acompanhar ZIP. Som guia só com mic desligado; não registrar áudio/vídeo.
- Ler `docs/ENTREGA-08-E-TESTES.md`, TASKS e PROGRESSO para critérios e limitações. 0.9 administrativa só mediante novo pedido do responsável.

Projeto: **Made In Sertão Music Lab 0.3**, independente do projeto de partituras Made In Sertão Studio. Não modificar outro repositório nem alterar cores do aplicativo OMR.

## Direção visual atual — decisão do responsável em 21/10/2026

O responsável solicitou uma interface de aprendizagem inspirada na navegação do Duolingo, mantendo a estética colorida e divertida da Made in Sertão. Esta orientação atualiza as recomendações antigas de predominância Liquid Glass: usar fundo claro, azul-petróleo institucional, laranja e verde, botões com relevo, trilha de aulas e mascote mandacaru original. Reservar a transparência para detalhes discretos.

`src/components/LearningHome.tsx` e `learning.css` implementam a tela inicial. `src/redesign.css` harmoniza a prática existente sem substituir seus motores. Não inventar XP, sequência diária, ranking ou desempenho: os indicadores e conquistas devem vir das aulas e resultados reais. Preservar IDs do currículo, chaves de progresso e separação entre toque/câmera. O aceite visual manual desta atualização ainda está pendente; ver `PROGRESSO.md`.

As atividades reais agora usam `src/components/ActivityExperience.tsx` e `src/activity.css`: cabeçalho de progresso, atividade central, pistos em cartões, mascote e feedback no rodapé. Não reintroduzir a estrutura antiga de sidebar/painéis simultâneos nesse fluxo. A cópia em execução identificada em 21/10 fica em `../Made_In_Sertao_Music_Lab_v0.6_Novo_Visual/made-in-sertao-music-lab-v0.6`, porta 5174; confirmar qual pasta o servidor usa antes de futuras alterações.

Afinação, dicas e etapas são acessadas pelos ícones de ferramentas junto ao exercício (tipo `ActivityTool`, prop `tools` de `ActivityShell`). Não voltar a colocá-las em blocos no fim da página. Manter foco/teclado, atualização ao vivo e posicionamento responsivo do painel.

## Regras técnicas e pedagógicas

1. Manter interface em **pt-BR**, visual Liquid Glass branco/azul com acentos da escola: `#2c5163`, `#4a84c3`, `#f5a528`, `#239143`. Evitar criar interface predominantemente escura.
2. Mobile-first: sem tabelas largas ou affordances apenas para mouse. Botões precisam funcionar via toque e teclado.
3. O microfone mede frequência e amplitude, mas **não afirma avaliar respiração, embocadura, digitação real ou qualidade do timbre**.
4. Trompete em Si♭: compare a frequência REAL com nota ESCRITA transposta 2 semitons acima. Ex.: Sol4 escrito => Fá4 real ≈349,23 Hz.
5. Progressão de cada etapa depende de som válido por duração contínua. Nunca somar sopros diferentes como um só. Sempre usar ID ÚNICO de etapa (`step.id`), inclusive notas repetidas.
6. Depois de um acerto, esperar breve transição e exigir silêncio antes da nota seguinte. Não conceder novo check por um único som sustentado.
7. Preferir lógica pura nos módulos `src/lib`, com testes Node em `tests/`.
8. Não enviar, armazenar nem reproduzir capturas do microfone. Tom guia eletrônico só com microfone desligado.
9. Não adicionar serviços pagos, login de crianças, rankings competitivos ou câmera sem revisão da necessidade e privacidade.
10. Não criar alegações quantitativas de eficácia da aprendizagem sem estudo com grupo de comparação.

## Arquivos principais

- `src/lib/audio.ts`: mic + Pitchy (janela 4096 amostras, callback em torno de 90 ms).
- `src/lib/music.ts`: notas, frequências e transposição.
- `src/lib/practice.ts`: crédito da duração da nota.
- `src/lib/assessment.ts`: qualidade da detecção e feedback.
- `src/lib/release.ts`: pausa obrigatória entre emissões.
- `src/lib/curriculum.ts`: nove aulas e etapas com IDs únicos.
- `src/App.tsx`: interface React e orquestração de estados.
- `src/styles.css`: glassmorphism responsivo.

## Validação e registro

Em qualquer mudança: rodar `npm test`, `npm run build` (após instalar dependências) e testar a aula afetada no browser. Atualizar `TASKS.md` e `PROGRESSO.md` com estado real, mantendo pendências explícitas. Não considerar funcionalidade pronta só porque testes unitários passaram.

## Retomada v0.4 (20/10/2026)

- Fonte principal: `src/App.tsx` e `src/components/PitchTimeline.tsx`.
- Motor puro de telemetria: `src/lib/telemetry.ts` (não depende de React ou navegador).
- Não modificar o mecanismo de check automático da v0.3 (`src/lib/practice.ts` e `src/lib/release.ts`) sem testes adicionais: progressão depende de duração contínua válida e pausa entre notas.
- `Saved.results` salva apenas métricas acústicas derivadas, sem áudio bruto. Manter a chave `localStorage` `mis-music-lab-v03` para preservar progresso.
- A análise de variação representa oscilação da *frequência detectada*, não qualidade de respiração, embocadura, postura ou digitação real.
- Ainda **não há avaliação rítmica**; adicionar apenas após calibrar detector de notas com instrumento real.
- Testes: `npm test`; build: `npm run build` (pendente no ambiente de criação, instalar dependências no Windows).
- Atualizar `TASKS.md` e `PROGRESSO.md` a cada sprint, sem trocar paleta branco/azul Liquid Glass.

## 0.4.1 — Regras de retomada

Metrônomo + 8 exercícios rítmicos implementados em `src/lib/{rhythm,metronome}.ts`; já estão nas aulas 10 e 11. Os exercícios com `figure` usam BPM e só são avaliados quando metrônomo está ligado; os demais usam `holdSeconds`, sem mudança retroativa. Cuidado ao melhorar o ritmo: **não confundir duração mínima por pulsos com avaliação de ataque, soltura, síncope ou compasso**. Para isto, primeiro coletar medição de latência e testes com trompete/Android/iOS. Ver `docs/METRONOMO-E-LEITURA-RITMICA.md` e `TASKS.md` (RIT-04 a RIT-07).

## Continuação 0.4.2 / 0.4.3
- Abrir `docs/EVOLUCAO-RITMICA-042-043.md` e `PROGRESSO.md` antes de editar.
- Fluxo novo: `src/components/MeteredBarLesson.tsx` e `src/lib/pulseAssessment.ts`; usa `Metronome.nextExerciseBarStartMs()` e amostras com timestamps de `performance.now()`.
- A correção de latência é MANUAL, limitada a ±300 ms. Não alegar precisão física absoluta nem calibração automática.
- As aulas de sustentação antiga e as rítmicas 10/11 NÃO devem migrar de motor sem testes.
- Manter progresso/localStorage, usabilidade móvel/HTTPS e não guardar o áudio bruto.
- Testar `npm test` e `npm run build` em ambiente com acesso a npm; registrar o que passar/falhar.

## Marco 0.6 — Modos virtuais (21/10/2026)

- **Nova prioridade:** a Área do Professor foi postergada para **0.9**, última fase antes de 1.0; não implementar cadastros/turmas agora.
- Novos arquivos `src/components/VirtualTrumpetLab.tsx`, `src/lib/virtualTrumpet.ts`, `src/lib/virtualAudio.ts`, `src/virtual.css`, `tests/virtual-trumpet.test.mjs`.
- `App.tsx` oferece botão para entrar/sair do modo virtual, com a antiga `workspace` intacta.
- No modo virtual, **câmera** atribui os pistos por ângulo dos 3 dedos, com debounce; **toque** simula os pistos e é explicitamente uma demonstração, com IDs de progresso separados.
- Não usar apenas digitação para inferir altura: Dó4 e Sol4 têm pistos abertos; o aplicativo escolhe a nota-alvo/registro musical e emite nota sintética como referência.
- Não gravar vídeo, foto ou áudio nem enviar frames; avaliar consentimento para menores e possíveis métricas coletadas pelo fornecedor do MediaPipe.
- A 0.6 é experimental e **não** foi testada em webcam real nesta máquina. `npm test` passou 47/47; `npm install` falhou por indisponibilidade DNS, logo `npm run build` permanece pendente.
- Roteiro posterior: 0.7 Professor Virtual Adaptativo; 0.8 Partituras Inteligentes; 0.9 Área do Professor; 1.0 Estabilização e lançamento.
