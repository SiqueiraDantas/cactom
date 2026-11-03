# CACTOM · Login 3.0 · Entrega para revisão visual

**Data:** 22/10/2026 · **Estado:** Implementado em código; aguarda validação em navegador e dispositivo do responsável.

## Direção visual aprovada

- Reinterpretar a imagem-conceito aprovada pelo responsável, não usar a montagem de telefone/notebook como plano de fundo.
- Usar **o PNG oficial do Tom** localizado em `public/branding/cactom/tom-oficial.png`.
- Tela clara, com título “A música floresce em você.” e “você” em laranja, tipografia de alto contraste, ações simples e consistentes.
- Desktop: cópia e ações à esquerda, Tom e cenário holográfico musical à direita.
- Mobile: marca no topo, Tom centralizado, título e ações, com rolagem vertical natural se necessário.
- Formas luminosas, aros, partículas, plataforma e partitura abstrata são CSS/SVG e não requerem IA ou internet para renderizar.
- Retirar rodapé institucional e aviso de testes da **tela inicial**, a pedido do responsável.

## Código alterado

- `src/components/LoginScreen.tsx`: composição visual, copy e remoção do rodapé; rotas de entrada/login/cadastro/demo preservadas.
- `src/components/cactom-access.css`: reconstrução responsiva dos layouts, botões, fundos, arte tecnológica e microanimações.
- `src/components/TomInteractive.tsx`: suavização interpolada do rastreamento ocular, com respeito a movimento reduzido, foco de senha, visibilidade e mouse.
- `src/components/tom-motion.css`: balanço e respiração mais orgânicos mantendo proporções e asset oficial.

## Segurança e honestidade de produto

O botão “Criar conta” continua criando apenas um **perfil local neste navegador**. Não implementamos backend, sincronização, recuperação real de senha, cadastro público ou proteção de dados de produção. Por isso, a informação de persistência local foi mantida **apenas no formulário** de forma concisa. Não utilizar dados reais de menores nesta fase.

## Verificações

- [x] Código React/TypeScript: `tsc --noEmit` passou em 22/10/2026.
- [x] Componente React do primeiro acesso renderizado com SSR para inspeção da estrutura.
- [ ] Build Vite completo em ambiente limpo. No ambiente de inspeção, a dependência binária Linux do Rollup não estava disponível; o pacote originário incluía dependências para Windows.
- [ ] Captura e avaliação visual com largura de 320, 390, 768 e 1440 px no Chrome/Edge.
- [ ] Verificação manual dos três botões iniciais, formulários de login/cadastro e modo de exploração.
- [ ] Testes de pointer/mouse, senha, movimento reduzido e fluxo com teclado no navegador.
- [ ] Aprovação estética pelo responsável.

## Como abrir no Windows

1. Extrair o ZIP numa pasta **nova**, sem substituir a versão anterior.
2. Executar `ABRIR-CACTOM.bat` (Node.js instalado e internet no primeiro uso).
3. Abrir o endereço que aparecer no terminal, geralmente `http://127.0.0.1:5174/`.
4. Pressionar `Ctrl + F5` se o navegador estiver mostrando arquivos antigos.

O botão “Explorar primeiro” segue para o modo demonstrativo existente. A área do professor permanece fora desta etapa, assim como o trompete virtual com câmera. Não ampliar o escopo sem nova definição.
