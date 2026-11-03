# CACTOM — auditoria da Etapa 00

Data: 22/10/2026. Estado: **entrega técnica em validação**, sem aprovação de produto/piloto. Esta auditoria segue a página 5 do plano recebido.

## Base identificada e segurança da cópia

- Repositório único existente na raiz do workspace; ainda sem commit antes desta auditoria.
- Fonte em uso: `Made_In_Sertao_Music_Lab_v0.6_Novo_Visual/made-in-sertao-music-lab-v0.6`.
- Pacote experimental: `made-in-sertao-music-lab@0.8.2`. O número é histórico do protótipo; não significa etapas 0.7/0.8 do novo plano aprovadas.
- Servidor existente: `http://127.0.0.1:5174/`. Não foi encerrado ou reiniciado.
- Backup pré-auditoria: `backups/CACTOM_BASE_0.8.2_EM_DESENV_2026-10-22.zip`, 136 arquivos, 18.222.410 bytes. SHA-256 e CRC em `evidencias/2026-10-22/backup.json`.
- Cópia fonte exclui node_modules, dist, .git e .env*. Dependências são reinstaláveis pelo lockfile. O backup não copia contas/progresso do navegador; preservar a origem e os dados do site.
- PDF e prancha de identidade copiados sem alteração para `referencias/` na raiz; origens, tamanhos e hashes registrados.

## Mapa técnico

| Área | Arquivos | Situação observada |
|---|---|---|
| Entrada e execução | package.json, package-lock.json, vite.config.ts, index.html, src/main.tsx | React/TypeScript/Vite; sem servidor de aplicação |
| Orquestração | src/App.tsx | Entrada → seleção → curso; telas controladas por estado React, sem roteador URL |
| Login experimental | LoginScreen.tsx, localAuth.ts | Conta local com WebCrypto; sem provedor consolidado, recuperação, sessão de servidor ou API |
| Separação de dados | ProfileStorage.tsx, profileStorage.ts | Prefixo por UUID; demo conserva chaves legadas |
| Início, trilha e resultados | LearningHome.tsx, learning.css, journey-refresh.css | Candidato a reaproveitamento; aceite visual pendente |
| Assets | LabIllustrations.tsx, SchoolLogo.tsx, public/branding | Mascote legado diferente do Tom; logo da escola não substitui o logotipo Cactom |
| Atividade-base | ActivityExperience.tsx, activity.css | Barra de progresso, ferramentas ao lado, feedback e conclusão |
| Cursos legados | curriculum.ts, recorder.ts, courses.ts, RecorderExperience.tsx | 13 aulas por instrumento; não equivalem ao Nível 1 sensorial do plano |
| Áudio e critérios | audio.ts, music.ts, assessment.ts, practice.ts, release.ts | Pitchy/Web Audio, frequência/duração e pausa; sem validação atual de hardware |
| Ritmo | metronome.ts, rhythm.ts, pulseAssessment.ts, MeteredBarLesson.tsx | Relógio/avaliação aproximada; atividade 13 falha no uso real relatado |
| Adaptação | adaptive.ts, adaptiveStore.ts | Regras locais de histórico/reforço; não aprovam a Etapa 17 |
| Partituras | musicxml.ts, scoreAssessment.ts, scoreStorage.ts, ScoreLab.tsx, ScoreRenderer.tsx | Subconjunto MusicXML, OSMD e IndexedDB; candidato futuro à Etapa 18 |
| Ofensiva | streak.ts, practiceDay.ts, StreakExperience.tsx | Calendário e dias reais; congelado como protótipo da futura Etapa 14 |
| Câmera e trompete virtual | VirtualTrumpetLab.tsx, virtual*.ts, public/mediapipe | Legado fora do novo escopo; preservar backup e retirar do fluxo CACTOM |
| Testes | tests/*.test.mjs | Node com strip-types; inclui lógica pura, WebCrypto e renderização React em servidor |
| Documentação anterior | README, TASKS, PROGRESSO, docs/* | Histórico preservado; documentos de docs/cactom prevalecem |

## Bibliotecas e serviços

Versões instaladas observadas: React/React DOM 19.3.1; TypeScript 5.9.3; Vite 6.4.5; plugin React 4.7.0; Pitchy 4.1.0; OpenSheetMusicDisplay 2.2.1; MediaPipe Tasks Vision 1.1.1; xmldom 0.9.12 somente para testes; tipos React/DOM 19.3.0.

Persistência: localStorage para contas/curso/histórico e IndexedDB para partituras/relatórios. Não há backend, banco remoto, envio de e-mail, autenticação em nuvem ou sincronização. Conteúdo do microfone/câmera não é gravado pela aplicação. Há carregamento externo de fonte Nunito pelo Google Fonts; não declarar funcionamento totalmente offline.

MediaPipe está incluído no bundle/assets legados. OSMD é carregado separadamente, mas gera aviso de chunk grande no build. Não adicionar dependências novas nesta etapa.

## O que as evidências comprovam

- `npm install --offline --ignore-scripts --no-audit --no-fund`: instalação existente conferida, sem alterar o servidor. O script de preparação dos assets foi executado pelo build.
- `npm ls --depth=0`: árvore de dependências resolvida, sem pacotes ausentes reportados.
- `npm test`: **154/154 aprovados**, zero falhas, zero pulados, saída 0.
- `npm run build`: TypeScript e Vite aprovados, saída 0. Aviso de chunk OSMD maior que 500 kB registrado.
- Backup: abertura/CRC aprovado, inventário de arquivos e hashes salvo.
- PDF: páginas da Etapa 00, 01, 02 e identidade renderizadas para inspeção, além da extração de texto completo.

Esses resultados não comprovam usabilidade móvel, navegação por clique, acerto com instrumento real, aprovação pedagógica, segurança de produção ou conclusão de etapas futuras.

## Diferenças e problemas a tratar

| ID | Constatação | Destino no cronograma |
|---|---|---|
| AUD-01 | Mascote atual com chapéu/vaso diverge do Tom oficial | Etapa 01; rig somente na 02 |
| AUD-02 | Título/metadata e assets ainda usam a marca do protótipo | Etapa 01, preservando chaves e dados |
| AUD-03 | Texto branco em CTA laranja tem baixo contraste; revisar pequenos textos da ofensiva | Etapa 01 para componentes básicos; 14 para ofensiva |
| AUD-04 | Navegação móvel precisa rever altura com safe-area e cabeçalho com nomes longos | Etapas 01 e 06; validação em celular |
| AUD-05 | Login local não satisfaz autenticação/recuperação/autorização de produção | Etapa 03; somente dados fictícios |
| AUD-06 | Câmera/trompete virtual existentes conflitam com escopo | Exclusão registrada agora; retirar navegação na integração CACTOM |
| AUD-07 | N1 começa com pautas/notas e técnica instrumental no protótipo | Etapas 07–09: currículo sensorial antes de símbolos |
| AUD-08 | Atividade 13 falha nos dois instrumentos, causa não identificada | Aberta; análise real de áudio adiada pelo responsável |
| AUD-09 | Sem prova por competência nem domínio em várias ocasiões | Etapa 11; não confundir checks existentes com domínio |
| AUD-10 | Bloqueio completo de leitura do storage pode perder ofensiva da sessão ao voltar ao início | Etapa 14; falha de gravação já tem cache, leitura ainda exige ajuste |
| AUD-11 | Sem revisão atual Android/iPhone, manual, pedagógica e de privacidade | Portões das etapas correspondentes; não aprovar piloto |
| AUD-12 | CSS com sobreposições e chunk OSMD grande | Consolidar na etapa pertinente; evitar reescrever antes do inventário |

## Fluxo mínimo de destino e aceite

O primeiro bloco visual será **boas-vindas → login visual no modo claro com Tom oficial**. Só depois vêm motion e definição de contas. O fluxo pedagógico posterior será **entrada → onboarding → N1 sensorial → apoio ao erro → prova → resultado → próximo módulo**, com tentativas livres.

Aceite da Etapa 00: uma fonte canônica identificada, backup íntegro e recuperável, inventário e mapa técnico, instalação/testes/build registrados, exclusões documentadas, backlog/decisões/changelog e fluxo mínimo definidos. Registrar o commit inicial como evidência. Conferência final do responsável mantém a etapa em validação até aceite.

Aceite do próximo bloco visual: comparação com o Tom/logotipo oficial, capturas mobile/desktop, foco/erro/espera, contraste/toque/teclado e nenhuma promessa de conta de produção. Nenhuma função de câmera ou trompete virtual no fluxo CACTOM. O avaliador e o professor não entram nesse bloco.
