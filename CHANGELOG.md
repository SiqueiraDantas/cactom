## 02/11/2026 — Login no estilo Duolingo e Tom animado

- Login refeito (`LoginScreen.tsx` + `login-duo.css`) no estilo Duolingo: boas-vindas com o Tom, "Criar conta local", "Já tenho uma conta" e "Pular e experimentar"; formulário simples e centralizado com campos agrupados, botão Mostrar senha, troca Entrar/Criar conta no topo e saída para demo. Mesmas funções de antes (`localAuth.ts`, demo, Tom reagindo à senha). `login.css` e `cactom-access.css` deixaram de ser usados pelo login.
- Sem animação de abertura antes do login.
- Boas-vindas mostram a animação do Tom saindo do celular com o menino e a estante (`cactom-celular.svg`) no lugar do Tom parado; o Tom interativo segue no formulário.
- Seletor "Idioma do site" no topo (Português, English, Español), salvo em `cactom-idioma`; traduz a tela de entrada (`loginText.ts`). Mensagens de erro do `localAuth.ts` e o restante do app continuam em português.
- Teste de renderização da entrada atualizado para a nova animação e o seletor.
- Carregamento: `index.html` mostra o Tom andando pensativo até o React montar.
- Escolha de instrumento: o mascote do topo virou o Tom acenando (`TomWaving.tsx`).
- SVGs animados em `public/branding/cactom/animacoes/`.
- 181/181 testes e build aprovados; o aviso de TypeScript em `conductorMusic.ts` já existia. Conferência visual no navegador e no celular pendente.

## 24/10/2026 — Navegação contínua entre unidades

- **Aprender:** unidades 1, 2 e 3 aparecem na mesma página, em rolagem vertical, sem abas de unidade.
- Cada unidade ganhou cabeçalho identificado com progresso e cor de apoio; atalho para localizar a aula atual.
- Preservados IDs de aulas, dados salvos por perfil, navegação para as atividades e controle de conclusão.
- Teste de cobertura das unidades incluído para trompete e flauta doce.
- TypeScript aprovado e 156 testes de lógica passaram; build e testes visuais pendentes de ambiente adequado.

# Changelog

## 22/10/2026 — Etapa 02, interações do Tom

- Continuidade autorizada após a 01; pendências de testes manuais preservadas.
- Repouso, olhar limitado, privacidade, espera, erro e sucesso real integrados ao acesso local.
- Rig híbrido SVG/PNG; pose derivada criada com imagegen e original preservado. Prompt, hashes e previews registrados.
- Movimento reduzido, pausa por visibilidade e limpeza de recursos; sem captura de valores digitados pelo mascote.
- 163 testes e build aprovados; 15 testes de renderização/motion após o ajuste de pálpebras.
- Vídeo e dispositivos reais pendentes; Etapa 03 não iniciada.


## 22/10/2026 — Etapa 01 implementada para validação visual

- Aceite da Etapa 00 registrado a partir da autorização do responsável.
- Tom oficial extraído do PDF e marca enquadrada da prancha original intacta.
- Boas-vindas e acesso renovados no modo claro, com tokens, adaptação móvel e campos/botões acessíveis.
- Foco, erro e espera; teste local explícito e demo preservados.
- Título/descrição/favicon e nome técnico do pacote Cactom; dados legados preservados.
- 156 testes e build aprovados; contraste e origens registrados.
- Capturas e aceite visual pendentes; Tom estático e Etapa 02 não iniciada.

## 22/10/2026 — CACTOM, Etapa 00 em validação

- Adotado o plano mestre fornecido pelo responsável como ordem de trabalho.
- Nome oficial Cactom e fonte canônica definidos, mantendo o servidor existente.
- Snapshot experimental 0.8.2 preservado antes da auditoria, com CRC e SHA-256.
- PDF e prancha oficial do Tom preservados com origem e hash.
- Criados mapa técnico, backlog de 176 tarefas, registro de decisões, critérios de aceite e evidências de instalação/testes/build.
- Registradas diferenças entre o protótipo e o CACTOM, inclusive câmera/trompete virtual fora do escopo.
- Base passa em 154 testes e build. Aceites visual, móvel, musical e de produção permanecem pendentes.
- Ofensiva, contas locais, adaptação e partituras já codificadas não aprovam etapas do novo plano.
- Atividade 13 segue com falha relatada nos dois instrumentos; avaliador não foi alterado nesta auditoria.

## Histórico importado — protótipo experimental 0.8.2

Antes do novo plano: login local com demo, logo da escola, novas ilustrações, ofensiva e separação de dados por perfil. Trabalho em teste, preservado para reaproveitamento. Ver docs/ENTRADA-LOCAL-E-OFENSIVA.md e registros anteriores; não corresponde a release CACTOM aprovada.

## 22/10/2026 — Login 3.0 para aprovação

- Reconstruído visual do acesso com referência tecnológica, cenário musical holográfico, modo claro e Tom original.
- Removidos rodapé institucional e aviso de testes da tela inicial.
- Mantido aviso discreto no formulário sobre persistência apenas local, sem prometer autenticação remota.
- Refinado movimento de olhos com interpolação e repouso suave.
- Rotas do login, cadastro local e demo preservadas. Testes em aparelhos reais continuam pendentes.
- Documentação: `docs/cactom/LOGIN-3-IMPLEMENTACAO.md`.


## 01–02/11/2026 — Entrada no estilo Duolingo
- Entrada limpa com `WelcomePhoneScene` (`public/animacoes/cactom-celular.svg`): só título e botões Começar agora, Já tenho uma conta e Explorar primeiro.
- “Eu quero aprender…” (`WorkshopOnboarding`): um cartão por curso disponível com ícones novos (`InstrumentTile`). Um toque escolhe; Tom carregando por 1,5 s (`CactomLoader`); “Oi! Eu sou o Tom!” (`HelloTom`).
- `OnboardingJourney`: perguntas do Tom com prancheta (como conheceu, por que aprender, quanto sabe, o que vai conseguir fazer, meta diária, onde começar), duas falas de motivação, mini atividade de partitura com 5 corações e XP (só aquecimento, não grava nada), Lição concluída, Tom pulando na trilha, explicação da ofensiva e entrada na tela geral como visitante.
- Cartão “Crie seu perfil!” na tela geral do visitante (`AccountActions`), que abre o cadastro já com a oficina.
- Efeitos sonoros sintetizados (`src/lib/uiSound.ts`) com botão de ligar/desligar (`cactom-sons`).
- `accessFlow`: etapas `hello` e `journey`, ação `signup`. Testes atualizados.

## 02/11/2026 — Tom novo nas lições e falas no estilo novo
- `TomCharacter.tsx` + `tom-character.css`: o Tom aprovado (o mesmo do “Oi! Eu sou o Tom!”) com as nove expressões do app (feliz, animado, orgulhoso, concentrado, triste, surpreso, comemorando, pensativo, privacidade), cada uma com pose e animação próprias. `TomOfficial` e o Tom do login (`TomInteractive`, olhar seguindo o mouse e mãos nos olhos na senha) passam a usar o desenho novo; o `CactomTomArt` antigo continua no projeto só para as cenas antigas que não aparecem mais.
- Lições da trilha (`RecorderLesson`): balões das falas no estilo da jornada, história contada pelo Tom num balão (sem a caixa amarela), “Lição concluída” com Tom pulando e cartões coloridos de XP, de primeira e recuperadas. Balões da introdução e do treinador das atividades do trompete também atualizados.
- Teste do Tom do login ajustado para o desenho novo. Backup em `_backup-tom-novo-licoes-2026-11-02/`.

## 2026-11-02 — Flauta doce: criança estuda sozinha
- Atividades da flauta não dependem mais do professor: saíram “O professor confirmou”, “O professor ouviu” e as telas guiadas pelo professor. Os exemplos tocam dentro da própria atividade.
- L01 “Encontre o furo traseiro”: duas flautas lado a lado, FRENTE (furos 1–7) e TRÁS (furo 0).
- L02: os modelos A (leve) e B (explosivo) de si tocam na própria tela “Escute dois modelos de si”; as duas perguntas seguintes agora têm gabarito automático. O “Ouvir um exemplo” saiu da tela de abertura.
- Som de flauta doce sintetizado (harmônicos + sopro) no lugar do bipe; aceita gravações reais em public/sons/flauta-doce (ver LEIA-ME.txt).
- O curso escolhido fica salvo no navegador (chave cactom-curso-navegador), com ou sem login.

## 2026-11-02 — Rojão, chapéu de couro e Tom nordestino
- “Ofensiva” virou “Rojão” em todo lugar. O ícone do foguinho virou o Tom segurando firme uma corda, fazendo força (componente TomRojao; animado na tela “Teu rojão começa hoje”).
- Na atividade de aquecimento, o coração virou chapéu de couro: cada erro derruba um chapéu.
- Falas do Tom com jeito nordestino (“Eita, chegou gente boa! Eu sou o Tom, visse?”, “Arretado!”, “Eita, quase!”, “Bora!”). Textos de instrução continuam claros.

## 2026-11-02 — Microfone nas atividades de tocar
- Bipes do metrônomo na contagem de preparação (o 1º mais agudo), junto com “Prepare · 1, 2, 3, 4”.
- Correção pensada para criança: confere a nota (±50 cents) no miolo de cada figura e o silêncio nas pausas; entrar um pouco atrasado, soltar antes ou um quadro de ar no meio não reprovam mais. Antes exigia entrada e saída com 0,22 s de precisão.

## 2026-11-02 — Gota d’água no lugar do chapéu
- Na atividade de aquecimento, o chapéu de couro virou uma gota d’água: cada erro baixa o nível da água (5 → 0), com um pinguinho caindo; em 0 a gota fica vazia e cinza.

## 2026-11-02 — Abas ligadas à trilha + Comunidade
- A trilha da aba Aprender agora alimenta as outras abas: lição concluída conta um dia no Rojão; XP e % do topo vêm da trilha; Praticar abre a próxima lição da trilha; Conquistas novas (primeira lição, primeira parada, rojão de 3 e 7 dias, 100 XP, revisão, Unidade 1, trilha completa); Progresso mostra as 64 paradas por unidade.
- Aba Partituras saiu do menu (as partituras continuam acessíveis em Praticar). Entrou a aba Comunidade: sala Geral + uma sala por instrumento, só salas públicas, Tom dá as boas-vindas com as regras, filtro bloqueia telefone, e-mail, endereço, redes, links e palavrões, botão Esconder, visitante só lê.
- PRÉVIA: as mensagens ainda ficam só neste aparelho (src/lib/community.ts, transporte local). Para ficar online falta ligar um servidor com moderação.

## 2026-11-02 — Partitura da flauta
- Fórmula de compasso empilhada (4 sobre 4, 6 sobre 8), sem a barra logo depois dela.
- Colcheias seguidas no mesmo tempo (ou no mesmo grupo de 3 no 6/8) agora ficam ligadas por barra, em vez de bandeirinhas soltas.
- Traço de fração entre os números do compasso (6 / traço / 8).
- Hastes para baixo a partir do Si (3ª linha) pra cima (colcheias com barra seguem a média do grupo); pausas maiores e no lugar certo do pentagrama (semínima centrada, mínima sobre a 3ª linha, semibreve pendurada na 4ª).

## 2026-11-02 — Colcheias no microfone e sessão lembrada
- Microfone: a janela de cada nota acompanha o atraso normal (microfone + criança, ~120 ms) e notas curtas (colcheia) só precisam de um trechinho afinado. Colcheia tocada certo não reprova mais; nota errada continua reprovando.
- Ao atualizar a página, quem já passou pelo começo (visitante que fez o tutorial/explorou, ou conta local que entrou) volta direto para a tela geral. Guarda só id, usuário e nome (nunca senha). “Sair da conta” / “Voltar à entrada” apaga (src/lib/session.ts).
