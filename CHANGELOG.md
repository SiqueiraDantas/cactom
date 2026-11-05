## 05/11/2026 — Tela de atualização e ícone novo

- Ícone novo do app e da aba do site: a carinha do Tom (sobrancelhas, olhos, boca e a flor) em fundo verde, no estilo de app infantil. Gerado em vetor a partir do Tom do app (`public/branding/cactom-icone.svg`), com versões comuns, "maskable" (Android), 180 px (iPhone) e favicon.
- Service worker passou para `cactom-v2`, o que limpa o cache antigo e dispara a tela de atualização.

- Quando sai uma versão nova com o app aberto, aparece uma tela cheia com o Tom, a lista do que mudou e o botão "Atualizar agora". "Depois" deixa a criança terminar a lição; a versão nova entra na próxima vez que abrir.
- O que aparece na lista vem de `public/novidades.json`. A cada versão, edite esse arquivo (data em `versao` e os itens) antes do commit.
- O app procura versão nova a cada 30 minutos e sempre que volta para a tela.

## 05/11/2026 — Cactom instalável (PWA)

- O Cactom agora pode ser instalado como app: `public/manifest.webmanifest` (nome, cores, ícones comuns e "maskable" para Android) e `public/sw.js` (service worker).
- Abre rápido e funciona sem internet nas partes que não dependem do servidor. Páginas sempre buscam a versão nova quando há internet; o Supabase nunca é guardado em cache.
- Faixa "Instale o Cactom no celular" na aba Aprender (Android: botão Instalar; iPhone: passo a passo pelo Compartilhar). Some por 14 dias ao tocar em "Agora não".
- O site (`/site/`) ganhou o botão "Instalar o app".
- `customHttp.yml`: cabeçalhos do Amplify para o service worker e o manifesto não ficarem presos em cache.

## 05/11/2026 — Site do Cactom

- Novo site de apresentação em `public/site/` (abre em `/site/`), no estilo da página do Duolingo: cursos, recursos com telas reais, como funciona, segurança, Comunidade, chamada para escolas (Escola Parceira, em breve) e a história. Os botões levam ao app.
- Comunidade: no celular, o selo ao lado da própria mensagem ficava cortado na borda; corrigido.
- Pasta recriada a partir do GitHub (`git clone`) depois que a pasta antiga sumiu da Área de Trabalho.

## 05/11/2026 — Curso de Iniciação Musical

- Novo curso **Iniciação musical**, para quem ainda não tem instrumento: tudo se responde tocando na tela (escolher, bater o ritmo no botão, montar o compasso). Plano completo em `docs/PLANO-INICIACAO.md`.
- 16 unidades em 4 seções (O som · Notas e figuras · Leitura na tua clave · Autonomia musical), 4 áreas por unidade, 5 lições com 3 atividades e desafio no fim de cada seção, igual aos outros cursos (XP, revisão espaçada, rojão).
- Conteúdo: pulso, agudo/grave, longo/curto, forte/piano, crescendo, andamento, nomes das notas, pauta, figuras e pausas, compassos 4/4 e 3/4, colcheias, ponto de aumento, sinais de dinâmica, ditado e criação.
- **Escolha da clave na unidade 9**: Sol ou Fá (dá pra trocar no mapa da trilha). A pauta agora desenha a clave de Fá.
- Sons de exemplo com volume (forte/piano) e timbre neutro de teclado.
- Aparece no seletor de cursos, no ranking, na Comunidade (Turma da Iniciação) e no painel do desenvolvedor. Sem aba de Partituras nesse curso por enquanto.
- Correção: no "Bata o ritmo da partitura" a pauta não aparecia (trompete e clarinete também).
- **Banco:** rode `supabase/cactom-iniciacao.sql` no SQL Editor para o ranking e o chat aceitarem o curso novo.
- Backup em `_backup-20261105-0119-iniciacao/`.

## 04/11/2026 — Comunidade online (Supabase)

- As turmas agora conversam de verdade entre aparelhos: rode `supabase/cactom-comunidade.sql` no SQL Editor (depois do `cactom-banco.sql`).
- Na primeira vez, um responsável maior de 18 anos autoriza o chat (nome e ano de nascimento), como pede a LGPD (art. 14).
- O servidor confere o token secreto do perfil, deixa cada criança ler e escrever só na Geral e na turma do instrumento dela, repete os filtros do app e limita a velocidade (1 mensagem a cada 3 s, 20 a cada 10 min).
- "Esconder" também denuncia: com 3 denúncias a mensagem some para todos.
- Painel do desenvolvedor ganhou "Comunidade: moderação" (mostrar/esconder, apagar, bloquear perfil).
- Mensagens novas chegam a cada 4 segundos enquanto a aba está aberta. Sem servidor configurado, o chat continua só no aparelho.
- Backup em `_backup-20261105-0014-chat-online/`.

## 04/11/2026 — Comunidade em turmas e clave de sol no lugar

- **Comunidade** refeita no jeito de chat de jogo: brasão da turma (Tom na Geral, o instrumento na turma do curso), contagem de membros e mensagens do dia, abas em escudo, selos coloridos com a inicial, XP de cada um (🏆), Tom como líder 👑, separador de dias e figurinhas do Tom.
- A criança só vê duas salas: **Geral** e a **turma do instrumento** escolhido (`roomsFor` em `community.ts`). A sala de Regência saiu.
- Regras de segurança mantidas: sem telefone, endereço, rede social ou link, palavrões filtrados, botão Esconder, visitante só lê.
- **Clave de sol** agora é desenhada (`src/lib/trebleClef.ts`) em vez do caractere 𝄞, que mudava de tamanho e altura conforme a fonte. A espiral fica na 2ª linha (Sol) no quiz de entrada e na pauta do compasso.
- Backup dos arquivos anteriores em `_backup-20261105-0005-comunidade/`.

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

## 2026-11-03 — Nota nova ensinada (Fá♯, Si♭) + trompete e clarinete no novo formato
- Flauta: Fá♯ (0 1 2 3 5 6) e Si♭ (0 1 3 4), sistema barroco, entraram na tabela de dedilhados. Antes da primeira atividade com cada nota aparece a tela “Nota nova” (pauta + dedilhado + som). Nas atividades de tocar e de criar aparece o dedilhado de todas as notas usadas. No germânico, Fá♯ e Si♭ mostram aviso para conferir a tabela do fabricante.
- Trompete e clarinete: trilha nova no mesmo formato das lições da flauta (src/lib/bandTrail.ts, src/components/BandLesson.tsx), montada com as notas e dedilhados que os cursos já usavam. Tom nordestino, “Nota nova” para cada nota, pergunta de dedilhado, escuta com o som dentro da tela, tocar com microfone (4 bipes, correção para criança, som real 1 tom abaixo do escrito), sem professor.
- O clarinete agora usa o mesmo painel (Aprender, Praticar, Rojão, Conquistas, Progresso, Comunidade). Trompete mantém as 13 aulas antigas em “Treinos anteriores”.
- Modelos sonoros com timbre próprio de trompete e de clarinete.

## 2026-11-03 — Plano completo do trompete e do clarinete (mesmo molde da flauta)
- Novo plano (src/lib/bandPlan.ts): 4 seções (Primeiros Passos A1, Fundamentos A2, Intermediário B1, Autonomia Musical B2), 16 módulos com os mesmos temas da flauta, 5 lições por módulo (Descobrir, Discriminar, Executar, Ler e criar, Aplicar e recuperar) e 3 atividades por lição = 80 lições e 240 atividades por instrumento.
- Ordem das notas — trompete: Sol, Fá, Mi, Ré e Dó, Lá/Si/Dó agudo, Fá♯ e Si♭, Ré agudo; clarinete: Sol, Fá, Mi, Ré e Dó, Lá da garganta, Lá e Sol graves, Fá♯ e Si♭. Cada nota nova tem a tela “Nota nova” antes de ser cobrada.
- Telas: nota nova, dedilhado, escuta, comparar sons (A/B), leitura na pauta (sem o nome embaixo), pergunta do módulo, história do módulo e tocar com microfone (4 bipes; duo com segunda voz no módulo 8; 3/4 no módulo 11).
- Desenho do clarinete com mão direita, chave do Lá e chave de registro. Linhas suplementares abaixo da pauta corrigidas.
- Planos por escrito: docs/PLANO-TROMPETE.md e docs/PLANO-CLARINETE.md.

## 2026-11-03 — Digitações pelas tabelas de referência + corpo antes de soprar
- Trompete: pistos conferidos com as tabelas Tonestro (Si♭ e Dó — os pistos são os mesmos). Desenho novo no estilo da tabela (pisto roxo = apertado). Opção “Teu trompete é em: Si bemol / Dó” na abertura da lição: muda o som do modelo e o que o microfone confere.
- Clarinete: digitações conferidas com a tabela “Clarinet Fingerings” (Yamaha). Desenho novo no estilo da tabela (● apertado, ○ aberto) com chave de registro, polegar, chaves do Lá e do Sol♯, mão esquerda e mão direita.
- Módulo 1: telas de postura sentada, respiração, embocadura (trompete: zumbido no bocal; clarinete: lábio, palheta e dentes) e posição das mãos, antes de soprar. Respiração volta no Módulo 2.

## 2026-11-03 — Microfone diz qual nota saiu
- Gravação de teste do Fá♯ analisada: soou 784 Hz (Sol). O Fá♯ da soprano soa ~740 Hz. O app estava certo em reprovar.
- Agora, quando sai outra nota, o feedback diz qual saiu (“Saiu Sol em vez de Fá♯”), se ficou mais aguda ou mais grave, e mostra os furos certos da nota pedida (Fá♯: 0 · 1 · 2 · 3 · 5 · 6, o 4 aberto).
- Vídeos: videos/cactom-explicativo-narrado.mp4, videos/cactom-anuncio-horizontal.mp4 e videos/cactom-anuncio-vertical.mp4.

## 2026-11-03 — Fá♯ na flauta germânica
- Fá♯ germânico = 0 · 1 · 2 · 3 · 5 · 6 · 7 (furo 4 aberto), conforme a tabela do woodwind.org (“Basic for German models”). Barroco continua 0 · 1 · 2 · 3 · 5 · 6.
- Nas telas “Nota nova” do Fá e do Fá♯ aparece “Minha flauta é: Barroca / Germânica” (salva a escolha e já troca o desenho).

## 2026-11-03 — Metrônomo contínuo
- Nas atividades de tocar (flauta, trompete, clarinete) a contagem de 4 bipes continua durante toda a música: bipes mais baixos, com o 1º tempo de cada compasso destacado.
- O "Ouvir modelo" também mantém a marcação do tempo.
- O microfone tolera os bipes (teste novo em recorder-full-course).

## 2026-11-03 — Aba Partituras (PDF) no lugar de Praticar
- Saiu a aba Praticar. Entrou a aba **Partituras**: biblioteca + "Enviar minha partitura" (PDF ou MusicXML).
- PDF: o Cactom lê as notas (leitor próprio, roda no navegador, nada é enviado), mostra "Li tua partitura!" com o PDF ao lado da leitura, deixa ajustar nome, compasso e armadura e depois abre a tela de tocar com marcador na pauta e microfone.
- Funciona melhor com PDF de programa (MuseScore, Finale, Sibelius) e papel escaneado reto; melodia única em clave de Sol, até 6 páginas.
- O reforço personalizado e a flauta/trompete na tela ("Tá sem a flauta aí?") foram para o alto da aba Aprender.
- Partituras agora aceitam clarinete e trompete em Dó (som esperado segue a afinação escolhida).
- Correção: as partituras da flauta apareciam uma oitava abaixo na pauta (clave com 8). Agora a nota escrita fica no lugar certo.
- Nova dependência: pdfjs-dist 4.10.38 (já copiada para node_modules).

## 2026-11-04 — Trompete e clarinete no molde da flauta; regência bloqueada
- Trilha do trompete e do clarinete igual à da flauta: 16 unidades com 4 áreas (Descoberta com 2 lições, Prática, Criação, Missão e revisão) + Desafio da seção depois das unidades 4, 8, 12 e 16 (68 paradas). Mesmo mapa, mesmo Tom, mesmo "Continuar".
- Cada lição: 3 atividades × 2 apresentações (descoberta + exemplo novo), com postura/respiração/embocadura/mãos e "Nota nova" antes de cada nota.
- Tipos novos: montar o dedilhado (apertar pistos / fechar furos e chaves), bater o ritmo do trecho, sentir o pulso, sobe ou desce, ler na pauta (nota, pausa, tempos, nota mais aguda), criar um compasso, ditado, qual pista ajuda, tocar sem ouvir antes.
- Dinâmica igual à flauta: erro volta no fim da lição, revisão espaçada (D+1, +3, +7, +14), XP, conclusão com habilidades, pendências e próxima revisão.
- Progresso antigo do trompete/clarinete é levado para a trilha nova (registro v2; o v1 continua guardado).
- Regência bloqueada: some da escolha de curso e aparece com cadeado "Em breve" no catálogo.
- Correção: o balão da última parada de uma unidade ficava escondido atrás do cartão seguinte (flauta também).

## 2026-11-04 — Ícone do site
- O ícone na aba do navegador (e na tela inicial do celular) agora é o ícone do Cactom: public/branding/cactom-icone-32/48/180/192/512.png, ligados no index.html.

## 2026-11-04 — Ranking por instrumento e Painel do desenvolvedor
- Ranking na aba Conquistas: quem tem login no instrumento, com pódio e lista. Três ordens: Pontos (XP), Acertos de primeira (a partir de 10 respostas) e Rojão. Mostra só o primeiro nome; "Tu" destacado e quanto falta pra passar o próximo. Por enquanto junta as contas deste aparelho (src/lib/ranking.ts tem a fonte trocável pelo servidor).
- Registro de eventos (src/lib/devEvents.ts): abertura do app com velocidade (load, FCP, LCP, TTFB, aparelho, navegador), entrar/criar conta/visitante/sair/voltou logado, curso escolhido, abas, lição começada e concluída, cada resposta (certa/errada/pulada), microfone, partitura em PDF e erros da página. Guarda até 4000 eventos no navegador; pronto para enviar ao Supabase.
- Painel do desenvolvedor: endereço #desenvolvedor (link no rodapé da barra lateral). Abre só no computador de quem desenvolve (npm run dev ou rede local). Mostra números do dia e da semana, gráficos de 14 dias, velocidade de carregamento, quem entrou, usuários e progresso por curso, lições mais feitas e abandonadas, telas onde mais erram, cursos, abas, microfone, erros e a linha do tempo de tudo o que cada pessoa fez (com filtro). Exportar JSON e limpar eventos.
- Privacidade: nada de áudio, tela, senha ou localização.

## 2026-11-04 — Servidor (Supabase): eventos, ranking de todos e painel com login
- supabase/cactom-banco.sql: tabelas eventos (o app só grava; só o desenvolvedor lê), ranking (atualização por função com token do aparelho; leitura pública só de primeiro nome e números) e desenvolvedores. Regras testadas num Postgres 16 local.
- O app envia os eventos em lote (fila guardada se a internet cair) e a linha do ranking de quem tem login.
- Ranking passa a mostrar todos os alunos do instrumento quando o servidor responde.
- Painel do desenvolvedor: "Servidor (todos)" com login de desenvolvedor (e-mail e senha do Supabase Auth) ou "Este navegador".
- .env.local com a URL e a chave publicável. Nunca coloque a chave secreta nem a senha do banco no app.
- Nova dependência: @supabase/supabase-js 2.119.0 (copiada para node_modules).
