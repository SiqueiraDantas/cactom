# PROGRESSO — CACTOM

## 06/11/2026 — Partitura nas telas de tocar

Partitura voltou a aparecer nas telas de tocar (encolhia até largura zero); cartões de dedilhado embaixo dela removidos a pedido do responsável. 312/312 testes, tsc ok. Conferência no celular pendente. Ver CHANGELOG.

## 22/10/2026 — Etapa 02 implementada para conferência

Continuidade após a 01 autorizada pelo responsável. Tom recebe repouso, piscar, flor suave, olhar limitado, reação à identificação, privacidade ao focar/mostrar senha, espera, sucesso real e apoio ao erro. Rig híbrido com textura oficial e pose derivada transparente criada com imagegen; cortes diretos dos braços foram rejeitados na inspeção. Original intacto.

163 testes aprovados; após refinar o contorno das pálpebras, 15 testes de renderização/motion aprovados e build final aprovado. Previews nativos do asset salvos; não são capturas do app ou vídeo. Toque, movimento reduzido e desempenho em dispositivos reais aguardam conferência. Etapa 03 não iniciada. Ver docs/cactom/ETAPA-02-TOM-INTERATIVO.md.


## 22/10/2026 — Etapa 01 implementada para conferência

O responsável aceitou a Etapa 00 e autorizou continuar. Entrada renovada com Tom oficial em PNG transparente extraído do PDF, marca Cactom, boas-vindas no modo claro, layout responsivo, campos/botões reutilizáveis, foco/erro/espera, teste local explícito e demo preservada. Título, favicon e nome técnico do pacote atualizados. Sem animação do Tom ou autenticação de produção.

156/156 testes e build aprovados. Contraste medido e origens dos assets conferidas. Capturas desktop/mobile e interação real pendentes; a 01 não está integralmente aprovada. Ver docs/cactom/ETAPA-01-IDENTIDADE-E-ACESSO.md.

## 22/10/2026 — Etapa 00: preparar e auditar a base

O responsável determinou seguir o PDF CACTOM passo a passo, com informes durante o trabalho. A rodada visual anterior foi preservada como código experimental; novas ampliações ficaram suspensas para respeitar a ordem.

- Nome oficial Cactom e única fonte canônica registrados.
- PDF e prancha PNG preservados sem alteração, com hashes.
- Backup experimental de 136 arquivos criado, CRC aprovado e SHA-256 registrado.
- Instalação offline/dependências conferidas; 154/154 testes e build aprovados.
- Criados backlog de 176 tarefas, decisões, changelog, mapa técnico, fluxo mínimo e critérios.
- Diferenças registradas: Tom oficial diferente do mascote atual; câmera/trompete virtual fora do escopo; ofensivas e contas não aprovam fases futuras.
- Atividade 13 segue com falha real nos dois instrumentos, sem alteração do avaliador.

**Estado: Etapa 00 em validação.** Evidências e pendências em `docs/cactom/AUDITORIA-ETAPA-00.md`. Interface, celulares, rubricas e piloto continuam sem aprovação. Próximo bloco previsto: Etapa 01, após conferir a base.

## Histórico do protótipo — não corresponde a etapas CACTOM aprovadas

## 22/10/2026 — 0.8.2: entrada local, identidade visual e ofensiva real

**Estado: Em teste. Esta entrada prevalece sobre os registros anteriores.** O responsável autorizou conta local neste navegador com opção de pular para demo e pediu refinamento visual, novos assets e tela de ofensiva. A Área do Professor continua excluída.

**Prioridade da próxima sessão: atividade 13 nos dois cursos.** O responsável relata que ela continua sem funcionar em **trompete e flauta doce**, apresenta um erro não identificado e aparentemente não lê/aprova a execução. Ele explicitamente adiou a investigação para a próxima sessão. Não foi alterado o motor de avaliação nesta rodada. O resultado dos testes sintéticos anteriores não confirma solução do problema real; não tratar RIT-15 como aceite de hardware concluído.

Implementado nesta rodada:

- Entrada antes da escolha de instrumento, com abas Entrar/Criar conta e **Pular e experimentar**. Nome/apelido, usuário normalizado, senha/confirmacão, opção de mostrar senha e mensagens de erro. A sessão de acesso é mantida em memória; a recarga volta à entrada sem apagar os dados salvos.
- Contas locais com senha derivada via WebCrypto PBKDF2/SHA-256, salt individual e 600.000 iterações, sem senha em texto. Não há nuvem, sincronização entre aparelhos, e-mail ou recuperação de senha. Dados de cadastro inválidos/corrompidos não são apagados silenciosamente.
- Perfil de armazenamento aplicado ao progresso, escolha, tentativas, sistemas, modos virtuais, partituras e relatórios. Conta usa prefixo próprio em localStorage e banco IndexedDB próprio. Demo mantém chaves/banco anteriores; criar conta não migra nem sobrescreve esses testes. Falhas de gravação podem preservar dados só na instância montada e são sinalizadas como não persistentes.
- Logo original encontrada em `C:/Users/siqda/OneDrive/Documentos/ChatGPT/Sistema Arranjadora IA/Partitura MusicXML/public/assets/logo-madeinsertao.png`; copiada sem alterar o PNG para `public/branding/logo-madeinsertao.png` (RGBA, 4922×2623). O projeto de origem foi apenas lido. Marca usada na entrada/seleção e navegação, com tratamento de contraste por CSS.
- Novas cenas SVG próprias do mandacaru, trompete e flauta doce, variantes de boas-vindas/prática/conquista/ofensiva, ícone de chama e acabamento da trilha. Fundo claro, petróleo/verde/laranja e botões com relevo preservam a direção inspirada no Duolingo e a identidade Made in Sertão. Preferência de movimento reduzido contemplada no CSS.
- Tela e cartão de ofensiva: meta de uma etapa válida, calendário dos últimos sete dias, sequência atual, recorde, total de dias e marcos de 3/7/14/30 dias. Conta e demo têm sequências separadas; os instrumentos do mesmo perfil contribuem para a mesma ofensiva.
- Registro somente após resultado válido de uma etapa sonora, conclusão da descoberta ou posição virtual aprovada pelas regras existentes. Visita, referência sonora e silêncio isolado não contam. Datas em `America/Fortaleza`, sem duplicatas/dias futuros; ontem conserva a sequência enquanto a meta de hoje continua disponível. Nenhum histórico antigo é convertido em dias fictícios; a ofensiva começa nesta atualização.

Verificação mais recente:

- `npm test`: **147/147 aprovados** nesta rodada, incluindo autenticação local com WebCrypto real, isolamento dos namespaces, datas/calendário da ofensiva e renderização React no servidor. Três testes adicionais de recuperação/falha do ProfileStorage foram preparados; a contagem final ainda será registrada após a execução.
- `npx tsc --noEmit` foi aprovado na verificação da implementação da ofensiva. O build final da 0.8.2 ainda está **pendente de execução/registro**; não assumir aprovação a partir dos builds antigos.
- Não houve inspeção visual/interativa nesta entrega. O bloqueio de política da URL local no navegador automatizado já está registrado; não foi contornado com outro controlador. Testes de renderização em servidor não equivalem a verificar cliques, foco, sobreposição, layout móvel ou aparência.
- Trompete/flauta/webcam reais, latência física, ambientes com ruído, Android/iOS e revisão pedagógica permanecem pendentes. A falha real da atividade 13 continua aberta em ambos os cursos.

Roteiro para entrada e ofensiva: `docs/ENTRADA-LOCAL-E-OFENSIVA.md`. Próxima sessão: começar por RIT-16; depois conferir visual/navegação e recuperação de dados por conta/demo. `practice.ts` e `release.ts` permanecem preservados; nenhuma área administrativa foi criada.

## 21/10/2026 — 0.8.1: curso de flauta doce como segundo instrumento

**Estado: Em teste**, com implementação e testes de código aprovados; validação física/visual pendente. Esta é a atualização mais recente.

- Seleção inicial oferece Trompete e Flauta doce; troca pelo nome do instrumento no cabeçalho. Mascote e ícone da flauta em SVG original.
- Flauta doce soprano em Dó com 13 aulas próprias: descoberta dos furos, Si/Lá/Sol, repetições, Dó/Ré agudos, melodias, Fá/Mi, Ré/Dó graves, pulsos e dois compassos avaliados.
- Escolha barroca/germânica persistente; Fá, dicas e reforços usam o sistema correto. Diagrama identifica furo 0 atrás e 1–7 na frente, incluindo as duas aberturas inferiores.
- Notação oitavada da soprano: escrito Dó4–Ré5, som Dó5–Ré6. As frequências não herdam os -2 semitons do trompete. Faixa do monitor aumentada para 1400 Hz; teste sintético cobre Ré6.
- Exploração por toque de nove posições, com continuidade de 1,2 s e progresso por sistema. Sem câmera e sem atribuir checks das aulas com microfone.
- Motor acústico, sustentação contínua e silêncio entre emissões compartilhados; `practice.ts` e `release.ts` preservados. Referência eletrônica considera cada instrumento e encerra antes de captar.
- Progresso, conquistas e recomendações isolados por instrumento. Chaves e checks anteriores do trompete mantidos. Componente de curso recriado ao trocar instrumento.
- Três estudos originais de flauta e importação MusicXML com perfil próprio, limites claros e identificação de instrumento na persistência. Dados antigos continuam associados ao trompete.

Verificado:
- `npm test`: **115/115 aprovados**. Inclui todas as regressões anteriores, posições/octavas/sistemas da flauta, currículo, descoberta sem falso check, compasso e pausas, isolamento adaptativo, parser/biblioteca, captação sintética até Ré6 e exploração por toque.
- Três testes renderizam React no servidor: escolha inicial com dois cursos disponíveis, flauta sem conquistas herdadas e retomada de cada curso com seus dados. Nenhum deles usa navegador ou solicita microfone.
- TypeScript e build Vite aprovados; OSMD continua em chunk separado e mantém aviso de tamanho. Dependências adicionais não foram necessárias.
- Servidor existente em 127.0.0.1:5174 respondeu HTTP 200 com a página e os módulos atualizados do curso, seleção de instrumento, atividades e SVG da flauta. Esta é verificação de entrega de arquivos, sem teste visual/interativo.
- O teste antigo que exigia um único instrumento foi atualizado para os dois cursos autorizados; o restante das regressões foi preservado.

Ainda não validado:
- Flauta soprano real, microfones e ambientes do aluno; precisão sob timbre/ruído, harmônicos e latência.
- Cliques e layout visual em navegador e aparelhos móveis. Automação da prévia continua bloqueada pela política previamente registrada.
- Revisão da sequência por professor de flauta. O microfone não comprova vedação dos furos nem técnica de sopro.

Roteiro detalhado e fontes primárias de digitação: `docs/CURSO-FLAUTA-DOCE.md`. Próximo teste: escolher Flauta doce, confirmar sistema, explorar os oito furos e tocar Si/Lá/Sol; depois alternar para trompete e verificar que os checks anteriores permanecem.

## 21/10/2026 — Implementação até 0.8 e correção da aula 13

**Estado atual: Em teste.** As entradas mais antigas abaixo são históricas. A área administrativa/professor da 0.9 não foi implementada.

Implementado:
- Escolha inicial de instrumento, persistente, com trompete disponível e futuros cursos desabilitados. Pode ser reaberta no cabeçalho.
- Virtual 0.6: calibração por múltiplas amostras estáveis, sensibilidade, suavização, proteção contra perda da mão/saltos de relógio, volume e 14 atividades, mantendo as oito etapas anteriores. Modelo e WASM servidos localmente, com preparação automática e atribuições.
- 0.7: histórico local derivado, dificuldades recorrentes por nota/foco, reforços personalizados, níveis graduais e revisões por tempo. Sem modelos generativos, dados fictícios ou alterações nos checks das aulas anteriores.
- 0.8: importação MusicXML monofônica, OSMD carregado sob demanda, três estudos originais, cursor de leitura, notas/durações/pausas, ligaduras, treino por compasso e relatórios locais em IndexedDB.
- Aula 13: contagem reiniciada em exatamente quatro pulsos; microfone ativo antes do preparo; compensação aplicada só às amostras; espera adequada da soltura; detecção ao vivo e controles de entrada/sensibilidade; referências de Sol/Fá com mic desligado. Avaliação distingue som errado, afinação, duração, interrupção e pausa.

Validação realizada:
- Dependências instaladas no Windows; pacote atualizado para 0.8.0.
- **96/96 testes automatizados aprovados**, incluindo regressões legadas, instrumentos, reforço, parser XML, avaliação de partituras, metronomia, captação simulada e estabilidade de câmera.
- Sol4 escrito = 349,23 Hz e Fá4 = 311,13 Hz foram reconhecidos em sinais sintéticos com harmônicos; compasso Sol–pausa–Fá aprovado no avaliador. Casos de ruído, oitava errada, som prolongado repetido, interrupção e falta de dados não ganham crédito indevido.
- Build TypeScript/Vite aprovado. OSMD gera aviso de chunk grande (~1,44 MB, ~383 KB gzip), separado do carregamento inicial.
- Servidor existente na porta 5174 respondeu HTTP 200 para a página, App, aula rítmica, biblioteca, modelo de mão, WASM e licença. Os módulos consultados contêm os novos fluxos. Isso confirma entrega de arquivos, sem representar teste visual.
- O teste de sinal fraco inicialmente reutilizava um track já encerrado no mock. O fixture foi corrigido para representar uma nova conexão; não foi reduzido o critério de avaliação para fazê-lo passar.

Limites:
- Automação de navegador bloqueada pela política de acesso à URL local; não houve revisão visual/interativa desta entrega. O build não comprova renderização OSMD nem persistência efetiva em aparelho real.
- Não houve teste de trompete/webcam reais, confirmação da correção no equipamento do responsável, latência física, CPU/temperatura, Android/iOS ou validação pedagógica com alunos.
- MusicXML tem subconjunto explícito (README), andamento fixo e marcador esperado; não acompanha rubato. Timbre continua sintético; latência é compensada manualmente. Não houve migração para AudioWorklet sem medição prévia.
- Origem do navegador e chaves antigas preservadas. Áudio e vídeo não são gravados.

Roteiro completo e limitações: docs/ENTREGA-08-E-TESTES.md. Próximo teste: aula 13 com fones, conferir a nota reconhecida antes de iniciar e executar Sol nos tempos 1–2, silêncio no 3 e Fá no 4.

## 21/10/2026 — Ferramentas ao lado da atividade

- Afinação/gráfico, dicas pedagógicas e etapas/aulas saíram dos blocos expansíveis no fim da página. Agora são acessados por ícones junto ao exercício.
- Em telas largas, o painel fica ao lado da atividade; em telas estreitas, os atalhos ficam acima dela e abrem um painel sobre a área central. Conteúdo extenso rola dentro do painel.
- Painel com título acessível, estado expandido nos botões, foco ao abrir, fechamento por botão/Esc e retorno do foco ao atalho. A troca de aula fecha o painel. A afinação continua recebendo as leituras ao vivo.
- Alteração aplicada à cópia usada na porta 5174. Mantidos os motores de avaliação, áudio e progresso local.
- Verificação: **47/47 testes aprovados** e **build TypeScript/Vite aprovado**. Aceite de composição e interações no navegador continua manual devido ao bloqueio de acesso automatizado já registrado.

**Status: Em teste** — implementação pronta; confirmar posicionamento, abertura/fechamento e telas móveis.

## 21/10/2026 — Atividades com interface de aprendizagem focada

- Substituída a estrutura antiga de sidebar, hero e painéis simultâneos na prática real. `ActivityExperience.tsx` e `activity.css` agora oferecem cabeçalho com progresso real da aula, tarefa central e faixa de ação/feedback no rodapé.
- Primeira aula redesenhada com três cartões de pistos em SVG, estados pressionado/explorado, orientação do mascote e tela de conquista ao explorar os três.
- Aulas acústicas com nota e partitura em destaque, botão de referência protegido durante a captação, diagrama dos pistos, barra de sustentação e botão principal de microfone. Afinação, gráfico, histórico e CSV continuam acessíveis em detalhes expansíveis.
- Aulas de ritmo usam a mesma estrutura visual; o motor `MeteredBarLesson` foi preservado e recebeu estilos consistentes. Os exercícios de figuras continuam exigindo metrônomo.
- Laboratório virtual com nova apresentação, orientação do mascote, cartões e cores consistentes. Toque/câmera permanecem separados e nenhuma regra de avaliação foi alterada.
- Localizado o servidor que o usuário está usando: `Made_In_Sertao_Music_Lab_v0.6_Novo_Visual/made-in-sertao-music-lab-v0.6`, porta 5174. Os arquivos modificados foram sincronizados nessa cópia para atualização pelo Vite, sem apagar progresso ou encerrar o servidor do usuário.
- Verificação: **47/47 testes existentes aprovados**; **build TypeScript/Vite aprovado**. Acesso automatizado à aba local foi novamente rejeitado pela política de URL do navegador de testes; não foi tentado contornar o bloqueio. Conferência visual, cliques, áudio e câmera em dispositivos reais continuam pendentes.

**Status: Em teste** — implementação aplicada também à cópia ativa; confirmar a aparência e a navegação com o usuário.

## 21/10/2026 — Direção visual de aprendizagem Made in Sertão

### Implementado nesta atualização

- Base 0.6 extraída do ZIP fornecido para a pasta deste workspace. O arquivo original e a cópia de Downloads não foram alterados.
- `LearningHome.tsx` + `learning.css`: página inicial, trilha das 13 aulas em três unidades, retomada da primeira aula incompleta, quatro áreas de navegação e menu inferior em telas estreitas.
- Identidade clara com as cores institucionais, tipografia arredondada, botões com relevo, ilustração SVG original de um mandacaru músico, indicações de foco e suporte a movimento reduzido.
- Conquistas calculadas a partir de pistos explorados/aulas aprovadas e painel de progresso baseado nos IDs reais do currículo. Sem XP, sequência diária ou dados de desempenho inventados.
- `redesign.css`: identidade consistente aplicada à área de prática e ao laboratório virtual existentes, mantendo os componentes de câmera, áudio e avaliação.
- Retorno à trilha cancela a transição pendente e encerra microfone/metrônomo. A saída do laboratório virtual desmonta o componente com sua limpeza existente. Abertura tardia do microfone é recusada quando o aluno já saiu da prática.
- Preservadas as chaves `mis-music-lab-v03` e `mis-music-lab-v06-virtual`. A origem (host/porta) precisa ser a mesma para acessar dados antigos do navegador.
- Inicializador Windows atualizado para a porta 5174 com `--strictPort --open`, evitando que o navegador abra a versão antiga já em execução na porta 5173. A abertura manual pelo `.bat` ainda deve ser confirmada pelo usuário.

### Verificado

- Antes e depois das alterações, `npm test`: **47 testes aprovados, zero falhas**.
- `npm run build`: TypeScript e build Vite **aprovados**.
- Dependências reutilizadas da instalação existente na cópia de Downloads, com seu `package-lock.json`. A tentativa inicial de instalação nesta cópia não terminou e foi interrompida; não foi declarado sucesso de uma instalação nova.
- Prévia servida em `http://127.0.0.1:5174/`: **HTTP 200**. A porta 5173 estava ocupada; nenhum servidor existente foi encerrado.

### Limitações e próximos testes

- A abertura inicial no navegador automatizado falhou por timeout antes da liberação do servidor; ao tentar recuperar a aba de erro, a política do navegador bloqueou o protocolo da página de erro. A inspeção visual/interativa automatizada não foi concluída. **Responsividade, composição visual e fluxos de clique precisam de conferência manual.**
- Não foram utilizados microfone/câmera reais. Os testes unitários não comprovam reconhecimento em aparelhos reais, qualidade sonora nem precisão de avaliação com trompete.
- Não foi feita auditoria completa de desempenho da 0.6; esta entrega trata da direção visual e da navegação. O roadmap 0.7–1.0 permanece como estava.
- Próximo roteiro: abrir o app, navegar pelas três unidades e quatro áreas, concluir a exploração dos três pistos, voltar à trilha e conferir a conquista/progresso; testar modo de toque e retorno; verificar 320–430 px, tablet e desktop, depois câmera/microfone com professor.

**Status: Em teste** — implementação e verificações de código concluídas; aceite visual e validação real pendentes.

## Entrega atual: MVP 0.4 — Professor musical (20/10/2026)

### Implementado no código

- [x] Preservado o fluxo da v0.3: nove aulas, 30 etapas acústicas, três pistos virtuais, afinação, sustentação contínua e avanço/check automático.
- [x] Gráfico SVG de afinação dos últimos 9 s com zona verde configurada pela tolerância da atividade (`PitchTimeline.tsx`, `telemetry.ts`).
- [x] Resumo após cada nota aprovada: desvio médio, dispersão da frequência em cents, tentativas e recomendação baseada em regra explícita.
- [x] Histórico resumido no próprio navegador, sem salvar áudio nem identificar a criança.
- [x] Exportação CSV de resultados por aula.
- [x] Layout responsivo adicional no Liquid Glass (branco, azul; detalhes verdes e laranja).
- [x] Persistência retrocompatível com os dados locais do MVP 0.3.
- [x] 26 testes automáticos (`npm test`) aprovados.

### Validações restantes

- [ ] Rodar `npm install`, `npm run build` e testar em Chrome/Edge reais; registro npm indisponível no ambiente de entrega.
- [ ] Testar captação com trompete verdadeiro, pelo menos Dó a Sol, em ambiente silencioso e com ruído.
- [ ] Conferir comportamento em Chrome Android e Safari iOS publicados em HTTPS.
- [ ] Medir falsos acertos por harmônicos, precisão de oitava, variação de microfones, dinâmica e ataques de notas.
- [ ] Ajustar com professor de trompete tolerâncias, duração e mensagens.
- [ ] Criar metrônomo e avaliação rítmica após os testes anteriores; **ainda não estão nesta versão**.
- [ ] Revisar consentimento, privacidade e normas aplicáveis antes de cadastro online de menores.

### Retomada

1. Execute `npm test` e `npm run build` no Windows.
2. Teste a Aula 2 com Sol: gráfico ao vivo, check, resumo e CSV.
3. Teste a Aula 4, especialmente repetição de Sol, com pausa acústica.
4. Teste no celular com HTTPS (ver `docs/CELULAR-HTTPS.md`).
5. Reporte os resultados antes de partir para pontuação automática de ritmo.

*O relatório avalia somente frequência captada; não comprova qualidade da embocadura, respiração ou pistos.*

## 20/10/2026 — MVP 0.4.1 (incremento didático de ritmo)

- Preservados códigos das 9 aulas anteriores, suas metas em segundos e os IDs persistidos na mesma chave local (`mis-music-lab-v03`).
- Adicionado motor puro `rhythm.ts`, conversão BPM/valores musicais, metrônomo de 4/4 em `metronome.ts`, visual responsivo Liquid Glass, duas novas aulas (total 11) e oito exercícios rítmicos.
- Nos exercícios novos, check automático exige o som válido pelo **mínimo** de pulsos correspondente à figura. Metrônomo deve estar ativo; o andamento pode mudar com áudio parado.
- Limitação explícita: não avalia ainda se o ataque coincide com o pulso nem a soltura exata da nota; esta verificação depende da medição da latência real.
- `npm test` passou com 32/32 testes; build completo não pôde ser validado por indisponibilidade de DNS do registry npm. Teste no instrumento físico e no celular pendente.
- Próximas tarefas: TEST-10 → MOB-03 → RIT-04 → RIT-05/06, sem pular validação acústica.

## 21/10/2026 — 0.4.2 + 0.4.3 (entrega combinada)
- Mantida a base 0.4.1, progresso de alunos em `mis-music-lab-v03`, 11 aulas anteriores e Liquid Glass responsivo.
- Criado motor rítmico para início e fim aproximados e silêncio nas pausas, sem confundir com sustentação em segundos.
- Criado desafio de compasso com preparo de quatro pulsos, pauta didática, marcadores e feedback evento a evento.
- Adicionadas as Aulas 12 e 13 (13 no total) e ajuste manual de compensação ±300 ms.
- 39/39 testes automáticos da lógica aprovados (7 novos).
- Parse sintático TS/TSX verificado. Instalação npm/build completo bloqueados por EAI_AGAIN do registro npm, portanto NÃO validados nesta máquina.
- Pendente validar com trompete, notebook e celulares HTTPS, especialmente falsos positivos e atrasos sistemáticos.
- Marco previsto na época: 0.4.4 = calibração de latência. **Roteiro atualizado em 21/10:** 0.6 câmera, 0.7 adaptação, 0.8 partituras, 0.9 área do professor.

## 21/10/2026 — MVP 0.6.0: Trompete Virtual com Câmera

**Mudança de prioridades confirmada:** a Área do Professor fica para a **versão 0.9**, última funcionalidade grande antes do marco 1.0. O foco da 0.6 é o aluno sem instrumento.

### Implementado

- Seleção de modo com instrumento/microfone (preservando 13 aulas e a chave de progresso legada) ou sem instrumento/câmera.
- Câmera com MediaPipe Hand Landmarker (modelo e WASM via HTTPS na primeira execução), traçado visual e análise de indicador/médio/anelar.
- Duas posições de calibração com limiares personalizados e suavização de troca de pistos.
- Som sintético guia na afinação real para o trompete em Si♭; nota-alvo escolhida para resolver harmônicos com pistos idênticos.
- Sequência de 8 posições Sol–Fá–Mi–Ré–Dó–Mi–Fá–Sol, check automático após 0,9–1,25 s de digitação estável.
- Simulador de pistos por toque para celular sem câmera, armazenando conclusão separada da verificação pela IA.
- Novo CSS Liquid Glass responsivo; privacidade e restrições descritas em `docs/MODO-VIRTUAL-CAMERA-06.md`.

### Testes concluídos

- `npm test`: **47/47 passaram**; oito cenários adicionais de mão/calibração/avaliação de digitação.
- TypeScript sintático conferido; tipagem e build final **não verificados** porque `npm install` falhou com `EAI_AGAIN` ao conectar a `registry.npmjs.org`.

### Falta validar em dispositivo real

- [ ] `npm install && npm run build` no Windows.
- [ ] Webcam do notebook, detecção de mão e pressão dos três dedos com iluminação real.
- [ ] Tela do celular e permissões HTTPS; interação por toque e som sintetizado.
- [ ] Falsos checks, variações da pose e estabilidade para alunos pequenos.
- [ ] Medir desempenho, aquecimento e carga no CPU/GPU; ajustar FPS se necessário.
- [ ] Rever experiência e conceitos musicais com professor antes de uso com turmas.

**Próximo passo prático:** abrir v0.6 no Windows com `npm run dev`, entrar em `Sem instrumento · Câmera`, permitir webcam, calibrar, completar as primeiras notas, testar a alternativa `Pistos na tela` e enviar resultados.
