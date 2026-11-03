# Entrada local, identidade e ofensiva — 0.8.2

Atualização: 22/10/2026. **Estado: Em teste.** Este documento registra a rodada de entrada e refinamento visual, preservando os dois cursos e o progresso anterior.

## Pendência prioritária para a próxima sessão

O responsável informa que a **atividade 13 continua falhando tanto em trompete quanto em flauta doce**. Há um erro desconhecido e aparente ausência de leitura/aprovação das notas. Ele adiou explicitamente a investigação para a próxima sessão. Os casos sintéticos aprovados não comprovam a solução no equipamento real.

Nesta rodada, o avaliador foi preservado. Ao retomar, reproduzir o fluxo, anotar a mensagem exata e o estado da entrada de áudio, observar a nota efetivamente reconhecida e só então corrigir a causa. Não ampliar tolerâncias, dispensar oitava/duração/pausa ou aprovar automaticamente para esconder a falha. A Área do Professor continua fora do escopo.

## Como entrar

1. Abra `http://127.0.0.1:5174/` com o servidor existente ou execute os comandos do README.
2. Use **Entrar** com usuário/senha já criados neste navegador, **Criar conta** ou **Pular e experimentar**.
3. Escolha Trompete em Si♭ ou Flauta doce soprano. A escolha anterior fica marcada no perfil, mas a seleção é apresentada após a entrada.
4. Use o cabeçalho para trocar de instrumento. **Sair** ou **Voltar à entrada** permite mudar de conta/demo. A recarga também volta à entrada.

A conta pede nome ou apelido, usuário de 3 a 32 caracteres e senha de 8 a 128 caracteres, com confirmação. O usuário aceita letras/números, ponto, hífen e sublinhado; não usa e-mail. A senha não é salva em texto: WebCrypto deriva um hash PBKDF2/SHA-256 com salt individual e 600.000 iterações. O limite atual é de 20 contas de teste por navegador.

Tudo fica neste navegador e nesta origem. **Não há nuvem, sincronização entre aparelhos ou recuperação de senha.** `localhost` e `127.0.0.1`, portas diferentes e perfis diferentes do navegador acessam armazenamentos distintos. Limpar os dados do site remove as contas e o progresso. A demo continua disponível se a criação/entrada não for possível.

## Separação dos dados

| Escopo | localStorage | Partituras em IndexedDB |
|---|---|---|
| Demo | Chaves legadas sem prefixo | `mis-music-lab-v08` |
| Conta local | `mis-user:<UUID>:` antes de cada chave de progresso | `mis-music-lab-v08-user-<UUID>` |

O registro de contas fica em `mis-music-lab-local-accounts-v1`. O namespace de perfil abrange instrumento escolhido, aulas, tentativas, reforços, sistema barroco/germânico, exploração virtual e ofensiva. Cada curso continua com suas chaves próprias dentro do perfil.

A demo preserva os dados anteriores. Criar uma conta não importa automaticamente os checks antigos, nem os remove. Dados ilegíveis de cadastro geram erro e permanecem intactos. Uma gravação de progresso bloqueada pode ser mantida apenas na instância montada do perfil, com sinal de que não foi persistida; isso não equivale a salvar depois de recarregar/sair.

Áudio e vídeo continuam em processamento local temporário, sem gravação nem envio. A conta local não adiciona coleta de gravações.

## O que conta para a ofensiva

A meta diária é **concluir uma etapa válida**. O dia pode vir de qualquer um dos dois instrumentos dentro do mesmo perfil:

- Etapa sonora aprovada pelas regras acústicas existentes, incluindo prática/estudos que registram resultado válido.
- Conclusão da etapa de descoberta dos pistos ou furos.
- Posição aprovada no laboratório virtual, com os critérios de continuidade e modo já existentes.

Abrir o aplicativo, visitar uma aula, tocar o som guia, cometer um erro ou cumprir apenas um silêncio não acrescenta um dia. O toque virtual permanece separado dos checks acústicos; contar um dia de hábito não conclui uma aula com microfone.

As datas usam **America/Fortaleza**, inclusive quando o relógio do aparelho é exibido em outro fuso. Uma prática registra a data local uma vez. Várias etapas/instrumentos no mesmo dia continuam valendo um dia. Datas inválidas, duplicadas ou futuras não entram no cálculo.

A sequência atual termina hoje ou ontem: se houve prática ontem e ainda não hoje, a sequência fica viva até a meta de hoje. Se um dia inteiro foi perdido, a sequência atual recomeça; o recorde permanece. O calendário mostra os últimos sete dias terminando hoje. Os marcos de **3, 7, 14 e 30 dias** são conquistados a partir da melhor sequência real.

O ledger usa `mis-music-lab-streak-v1` no namespace do perfil. Demo e contas têm ofensivas independentes; trompete e flauta do mesmo perfil contribuem para a mesma sequência. Os registros começam nesta atualização. Checks antigos não são usados para inventar datas retroativas, XP ou ranking.

## Identidade e assets

A logo original foi encontrada em:

`C:/Users/siqda/OneDrive/Documentos/ChatGPT/Sistema Arranjadora IA/Partitura MusicXML/public/assets/logo-madeinsertao.png`

O arquivo foi somente lido e copiado para `public/branding/logo-madeinsertao.png`, preservando o PNG RGBA de 4922×2623. O repositório de origem não foi modificado. `SchoolLogo.tsx` apresenta a marca; CSS mantém o original branco no petróleo e permite arte preta em fundo claro.

`LabIllustrations.tsx` reúne cenas SVG originais do mandacaru e os instrumentos, com variantes para boas-vindas, prática, conquista e ofensiva. O acabamento preserva fundo claro, azul-petróleo, verde e laranja, botões com relevo e trilha de aprendizagem. Há tratamento para preferência de movimento reduzido. As ferramentas de ajuda/afinação permanecem próximas à atividade.

## Roteiro de conferência manual

1. Abrir a página: confirmar login antes da seleção e visualizar a marca em fundo claro/petróleo sem corte ou deformação.
2. Pular para a demo: escolher ambos os instrumentos e conferir o progresso antigo. Voltar à entrada sem apagar dados.
3. Criar conta A e concluir uma descoberta/etapa válida. Confirmar um dia na ofensiva, meta 1/1 e nenhum crédito duplicado na segunda etapa do mesmo dia.
4. Criar conta B: confirmar progresso, partituras, histórico e ofensiva próprios. Voltar à conta A e depois à demo, verificando isolamento e recuperação dos dados.
5. Conferir senha incorreta, usuário duplicado, confirmação divergente, saída e recarga. Validar mensagens legíveis e foco do erro pelo teclado.
6. Importar uma partitura em um perfil e conferir sua ausência nos demais. Recarregar e verificar a persistência do perfil correto.
7. Conferir tela de ofensiva, retorno à prática, calendário e marcos bloqueados sem dados. A passagem de dia é coberta por testes de relógio injetado; não alterar o relógio do notebook apenas para fabricar dias.
8. Conferir 320–430 px, tablet e desktop, foco visível, toque e movimento reduzido; verificar se as ações não ficam encobertas.

## Evidência e limites

Última medição: **147/147 testes aprovados**; três novos testes de ProfileStorage ainda aguardam a execução final junto à suíte. Cobertura inclui hash/validações de conta, namespaces, datas de Fortaleza, meia-noite/ano/bissexto, lacunas, dados inválidos, falhas de armazenamento, isolamento e renderização React no servidor. O build final da 0.8.2 ainda está pendente de registro.

O navegador automatizado está com bloqueio de política da URL local registrado; não foi contornado. A aparência final, os cliques, a acessibilidade interativa, os instrumentos reais e os dispositivos móveis **ainda precisam de conferência**. Teste unitário/servidor aprovado não significa que o reconhecimento da atividade 13 esteja corrigido.

Ler também `PROGRESSO.md`, `TASKS.md`, `CURSO-FLAUTA-DOCE.md` e `ENTREGA-08-E-TESTES.md`.
