# Cactom — Revisão da Etapa 01/02: login limpo

**Data:** 22/10/2026

## Intenção

O responsável pediu uma entrada visual mais simples, inspirada na clareza das telas de acesso do Duolingo, mas usando a identidade própria Cactom. O código anterior foi preservado como base, não substituído por template genérico.

## Entrega desta revisão

- Uma primeira tela com logo, Tom, slogan, ação para começar, ação para acessar conta existente e opção demo.
- Formulário local de cadastro/login exibido apenas quando solicitado; botão Voltar e alternância entre fluxos.
- Continuidade dos campos e da verificação local já existentes (`localAuth.ts`), sem autenticação simulada.
- `TomInteractive.tsx` e `tomMotion.ts` preservados: cursor, piscar, flor, senha, sucesso e erro.
- Ajustes de layout em modo claro e pontos de quebra responsivos.
- Git inicializado localmente: primeiro commit da base, depois commit das alterações. Sem GitHub remoto.

## Arquivos principais

- `src/components/LoginScreen.tsx`
- `src/components/cactom-access.css`
- `ABRIR-CACTOM.bat`
- `COMECE-AQUI-CACTOM.md`
- `docs/cactom/PREVIA-ESTATICA-LOGIN.html` (apenas referência estática)

## Evidências

- TypeScript sem erros (`tsc --noEmit`).
- `npm test`: 154 aprovados, 1 teste de renderização bloqueado por módulo nativo ausente do Rollup Linux no pacote de dependências entregue.
- `npm run build`: não completou pelo mesmo bloqueio de ambiente (`vite` sem permissão / binário Rollup ausente); após instalar dependências limpas, repetir.
- A prévia estática apresentou largura correta em 390 e 1365 px, sem rolagem horizontal.

## Pendências de aceite

- [ ] Reinstalar dependências limpas na máquina de desenvolvimento.
- [ ] Executar `npm test` com 100% de aprovação e `npm run build`.
- [ ] Conferir primeira tela e formulários por cliques reais.
- [ ] Conferir cursor, senha, erro, espera e sucesso com Tom em movimento.
- [ ] Verificar acesso com teclado, foco, zoom e redução de movimento.
- [ ] Validar em smartphone real (especialmente rolagem, teclado virtual e espaço útil).
- [ ] Aprovação visual do responsável.

A etapa 03 (autenticação de produção e privacidade) **não começou**. A Área do Professor permanece futura; o trompete virtual não foi ampliado.
