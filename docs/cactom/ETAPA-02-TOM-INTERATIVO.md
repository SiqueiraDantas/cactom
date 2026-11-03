# Etapa 02 — Tom interativo no acesso

Data: 22/10/2026. **Implementada para conferência.** O responsável autorizou avançar da 01 para a 02. Isso registra o aceite para continuidade, sem inventar capturas ou testes de celular não realizados. Etapa 03 não iniciada.

## O que já funciona no código

- Repouso com piscar, respiração discreta e movimento suave da flor.
- Pupilas acompanham o cursor em dispositivos com mouse, limitadas a 12 × 8 unidades do desenho.
- Ao focar usuário/apelido, Tom reage ao campo de identificação. O protótipo não usa e-mail; criar campo fictício não faria parte desta etapa.
- Ao focar senha/confirmação ou ativar Mostrar senha, entra a pose com os dois olhos cobertos. Não rastreia o cursor nessa situação.
- Durante o envio real, reação de espera. Erro de validação ou do acesso local gera reação de apoio.
- A comemoração só aparece depois que o acesso local existente retorna sucesso. Limpa senha/confirmação e oferece uma transição de 650 ms antes de abrir o curso; envio duplicado fica bloqueado.
- Movimento reduzido desativa balanço, piscar, transições e perseguição do cursor. Mantém a pose estática de privacidade.
- Toque não interceptado: o personagem não captura eventos de toque. Rastreamento aceita apenas mouse e escuta passiva.
- Pausa quando a página fica oculta ou o mascote sai da área visível. Há limite de atualizações próximo de 30 por segundo e limpeza de listeners/RAF/timer ao sair.

## Decisão de rig e fidelidade

O arquivo oficial é um PNG plano. Inspecionamos a separação de corpo, olhos, flor e braços. O recorte direto de braços deixava cortes nas junções e não foi aplicado.

A solução é **híbrida**: máscaras e recortes SVG da textura original para olhos/flor, pequenos transformes que conservam proporções e uma pose PNG derivada para a privacidade. Não é um esqueleto com braços independentes. O desenho original continua intacto em tom-oficial.png.

A pose tom-privacidade-v1.png foi produzida com a ferramenta imagegen built-in a partir do Tom oficial. É uma **variante derivada em validação**, não o arquivo oficial redesenhado ou substituído. Foi vista e comparada: flor, corpo, sorriso, pés, cores e os dois olhos totalmente cobertos. O prompt e a origem estão arquivados; não há recortes geométricos nos braços da versão aplicada.

Pálpebras seguem o contorno dos olhos; pupilas reaproveitam os pixels da referência. A etapa ainda depende de avaliação humana da fidelidade durante o movimento.

## Arquivos

- src/lib/tomMotion.ts: estados, prioridade, privacidade, olhar limitado e mensagens; não recebe texto digitado.
- src/components/TomInteractive.tsx: rig SVG, observação de visibilidade e entrada de mouse.
- src/components/tom-motion.css: repouso, piscar, espera, apoio ao erro, comemoração e movimento reduzido.
- LoginScreen.tsx: integração com foco e resultados reais do acesso local.
- public/branding/cactom/tom-privacidade-v1.png: pose derivada transparente, copiada para o projeto.
- public/branding/cactom/origens.json: hashes, origem e classificação dos assets.
- evidencias/etapa-02/PROMPT-POSE-PRIVACIDADE.txt: prompt exato e ferramenta utilizada.

## Evidências e seus limites

- Suite completa: **163 testes aprovados**, zero falhas/pulados.
- Depois do ajuste do contorno das pálpebras: **15 testes de renderização/motion aprovados**.
- Build final aprovado. Aviso preexistente de tamanho do chunk OSMD permanece.
- Previews PNG/SVG em evidencias/etapa-02: repouso, olhar, senha, erro e piscar; comparação em comparacao-rig.png.
- Esses previews são renders nativos do asset SVG em poses estáticas, feitos para inspecionar a geometria. **Não são capturas do aplicativo nem gravação das animações no navegador.** O quadro de erro não mostra a inclinação animada.
- O bloqueio anterior da URL local permanece registrado; não foi contornado com outro controlador.
- Toque, teclado, leitor de tela, desempenho e preferência de movimento em aparelhos reais ainda precisam de conferência. Não declarar Android/iPhone validados.

## Estado do checklist

| Item | Estado |
|---|---|
| 02-01 — viabilidade das partes | Inspecionada; limitações do PNG e solução registradas |
| 02-02 — rig sem deformações | Rig híbrido implementado e poses estáticas inspecionadas; aceite do movimento pendente |
| 02-03 — repouso | Implementado; captura/vídeo no navegador pendente |
| 02-04 — cursor limitado | Regras testadas; interação manual pendente |
| 02-05 — foco da identificação | Aplicado ao usuário/apelido existente; manual pendente |
| 02-06 — cobrir olhos na senha | Pose comparada, regra testada; foco real por mouse/teclado/toque pendente |
| 02-07 — espera, sucesso e erro | Integrado ao resultado real; vídeo da sequência pendente |
| 02-08 — toque, movimento reduzido e desempenho | Proteções no código e regras testadas; dispositivos reais pendentes |

## Conferência curta no navegador

1. Atualizar http://127.0.0.1:5174/ sem iniciar outro servidor.
2. Aguardar o piscar; mover o mouse pelos extremos e conferir que as pupilas ficam dentro dos olhos.
3. Focar usuário/apelido por teclado; depois senha e confirmação: Tom cobre os dois olhos.
4. Alternar Mostrar senha; conferir a pose também quando o campo perde foco e a senha continua mostrada.
5. Com dados fictícios, conferir campos inválidos, erro de acesso, espera e sucesso verdadeiro. Não usar dados de crianças reais.
6. Ativar movimento reduzido no sistema; não deve haver balanço, perseguição ou transição, mas a pose de privacidade continua disponível.
7. Conferir no celular que não há bloqueio de rolagem ou toque. Ocultar a aba e voltar.
8. Registrar um vídeo curto antes de aprovar a etapa. Não avançar automaticamente para autenticação/privacidade da Etapa 03.

A atividade 13 e os motores de avaliação permanecem sem alteração nesta rodada.
