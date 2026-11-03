# Etapa 01 — identidade, boas-vindas e login visual

Data: 22/10/2026. **Continuidade para a Etapa 02 autorizada pelo responsável.** Capturas e conferências manuais não foram fornecidas; permanecem pendentes no registro, sem afirmar validação de hardware. O responsável aceitou a Etapa 00 e autorizou começar a 01 na conversa. Nenhuma tarefa da Etapa 02 foi iniciada.

## O que mudou

- Entrada no modo claro com marca Cactom, Tom oficial, boas-vindas e formulário.
- Tom extraído como PNG transparente da imagem incorporada na página 48 do PDF; sem redesenho, chapéu, vaso, deformação ou animação.
- Logotipo original mostrado por enquadramento SVG da prancha original inalterada. O arquivo original permanece integral; não foi criado um logotipo novo ou atribuído um vetor independente inexistente.
- Layout de duas colunas em telas maiores e boas-vindas compactas acima do formulário em telas menores; breakpoints em 1000, 740 e 380 px.
- Tokens locais para cores, tipografia Nunito com fallback, escala de 8 px e cantos de 16 px; campos de 54 px e botões/abas/mostrar senha com alvos de pelo menos 44 px.
- Campos e botões reutilizáveis com rótulos associados, dicas/erros acessíveis, foco visível, espera e ação desabilitada durante envio.
- Título, descrição e favicon identificam Cactom. Nome técnico do pacote atualizado; versão experimental 0.8.2 e chaves de dados preservadas.
- Logo da escola mantida no rodapé como origem da marca.
- Acesso local legado continua funcional, explicitamente de teste, com opção **Pular e experimentar**. Não foi criada autenticação de produção, recuperação por e-mail ou sincronização.

## Arquivos oficiais

| Arquivo | Origem e uso |
|---|---|
| public/branding/cactom/tom-oficial.png | PNG RGBA 1254 × 1254 extraído da imagem incorporada na página 48 do PDF; mascote e favicon |
| public/branding/cactom/identidade-oficial.png | Cópia exata da prancha recebida; enquadramento do logotipo somente na interface |
| public/branding/cactom/icone-estudo.png | Imagem incorporada da página 48, preservada como estudo; não aplicada como ícone aprovado |
| public/branding/cactom/origens.json | Origem, dimensão e SHA-256 dos arquivos |

A prancha completa com poses não é um rig. Olhos seguindo cursor, braços cobrindo senha e demais animações continuam para a Etapa 02.

## Estado dos oito itens oficiais

| Tarefa | Estado e evidência |
|---|---|
| 01-01 — organizar PNG oficial e logotipo | Conferido: arquivos oficiais vistos, origens e hashes preservados |
| 01-02 — paleta, fontes, espaçamentos e modo claro | Implementado; pares de contraste medidos; aparência final aguarda aceite |
| 01-03 — campos e botões básicos | Implementado; rótulos, descrições, erro e espera verificados em renderização React |
| 01-04 — boas-vindas no celular | Layout implementado; captura de celular pendente |
| 01-05 — login visual sem autenticação falsa | Implementado; identifica o legado como teste local e mantém a demo |
| 01-06 — foco, erro e espera | Código e contratos de acessibilidade conferidos; interação no navegador pendente |
| 01-07 — testar celular e computador | Pendente; não substituir por testes de renderização no servidor |
| 01-08 — contraste, toque, teclado e legibilidade | Contraste e tamanhos no código conferidos; teclado/toque/leitura reais pendentes |

## Verificação técnica

- 156/156 testes aprovados, incluindo regressões da entrada e dados, associação de rótulo/dica/erro e botão em espera.
- Build de TypeScript/Vite aprovado. O aviso existente do chunk OSMD grande permanece.
- Assets oficiais conferidos visualmente a partir dos arquivos extraídos.
- Contraste calculado a partir das cores do CSS; resultado em evidencias/etapa-01/contraste-e-assets.json. Essa medição não aprova o layout inteiro.
- Capturas mobile/desktop, navegação por teclado, zoom e toque ainda não executados. O bloqueio anterior da URL local continua registrado; não foi contornado com outro controlador.

## Roteiro curto de conferência manual

1. Atualizar o servidor existente em http://127.0.0.1:5174/; não abrir outra instância.
2. Conferir Tom com flor laranja, logotipo Cactom legível, proporções e texto de boas-vindas.
3. Conferir largura de 320/390 px e desktop de 1280 px, sem cortes de formulário ou rolagem horizontal; conferir zoom de 200%.
4. Navegar com Tab: pular para acesso → abas → usuário/senha → mostrar senha → entrar → demo. O foco precisa aparecer.
5. Abrir Criar conta local usando dados fictícios; conferir confirmação de senha e explicação de armazenamento.
6. Tentar campos vazios e senha incorreta fictícia: erro deve ser legível; durante envio, nova ação fica bloqueada. Nenhum sucesso inventado.
7. Usar Pular e experimentar e conferir que os testes anteriores da demo continuam acessíveis.
8. Conferir a mesma experiência no celular, incluindo toque e rodapé com área segura.

Após o aceite visual, fechar os itens restantes da Etapa 01 com evidências e só então começar a 02. Cursos, câmera/trompete virtual legados, avaliação da atividade 13, currículo e ofensiva não foram ampliados nesta etapa.
