# Cactom — Login 2.0 (protótipo de testes)

**Entrega de 22/10/2026.** Esta pasta contém o código-fonte editado e um repositório Git **local** na pasta oculta `.git`. Nenhum repositório remoto/GitHub foi criado.

## Abrir no Windows

1. Descompacte a pasta `CACTOM` em um local novo; preserve sua cópia anterior.
2. Tenha Node.js LTS instalado (com npm).
3. Clique duas vezes em `ABRIR-CACTOM.bat` — na primeira execução o script instala dependências.
4. Abra a URL que aparecer no terminal (geralmente `http://127.0.0.1:5173/`).
5. Teste **Começar agora**, **Já tenho uma conta** e **Experimentar sem cadastro**.

Alternativa via terminal dentro da pasta:

```powershell
npm install
npm run dev
npm test
npm run build
```

### Se ocorrer problema nas dependências

Não reutilize `node_modules` do ZIP anterior: o módulo compilado de Rollup pode vir de outro sistema operacional. Exclua `node_modules` e execute `npm install` novamente.

### O que mudou

- Primeira tela simplificada: **Tom, slogan e três opções**, sem mostrar formulário antes da escolha.
- Formulários de conta local aparecem em tela compacta somente após **Começar agora** ou **Já tenho uma conta**.
- Motion interativo preexistente do Tom foi preservado e reencaixado na nova composição.
- Design mobile-first claro e botões amplos; acesso demonstrativo preservado.
- Autenticação **local experimental** existente foi preservada; NÃO corresponde a cadastro real na internet, backend ou recuperação de senha.
- Os motores pedagógicos não foram alterados; recursos legados fora do planejamento atual continuam na base, sem novas implementações nesta entrega.

### Git

O ZIP original não tinha `.git`. Esta nova pasta possui histórico local com dois commits (base preservada e redesign). O nome/email do autor Git são marcadores locais provisórios; configure os seus antes do próximo commit:

```powershell
git config user.name "Seu nome"
git config user.email "seu-email-de-git"
git status
git log --oneline -2
```

Não há remoto. Para publicar no GitHub será necessário criar um repositório e adicionar o remoto; **nada foi publicado automaticamente**.

### Verificações e limitações

- `tsc --noEmit`: passou sem erros após a alteração.
- 154 de 155 testes da suíte existente passaram no ambiente de inspeção. O teste restante depende da inicialização do Vite/Rollup, cujo módulo binário Linux não estava incluído no `node_modules` do ZIP Windows.
- O build completo do Vite não pôde ser validado neste ambiente pelo mesmo problema de dependência.
- Prévia estática da entrada foi conferida em larguras desktop e 390 px; não é uma validação das animações funcionando no app.
- Testes de clique, autenticação e motion no navegador real, Android e iPhone continuam pendentes.
- Não foi gerado vídeo por IA: o Motion funcional preservado é interativo em tempo real; um MP4 não substituiria esse comportamento.

**Antes de marcar a etapa 01/02 como concluída**, confira pessoalmente os formulários, o movimento dos olhos e a reação à senha no navegador, execute a suíte após `npm install` e aprove o resultado visual.
