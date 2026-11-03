# CACTOM — acompanhamento do plano oficial

Atualizado em 22/10/2026. Fonte: PDF de 71 páginas fornecido pelo responsável, preservado em `referencias/CACTOM_Plano_Mestre.pdf` na raiz do repositório. O roteiro numerado das páginas 5–26 prevalece sobre as telas conceituais e os registros antigos.

**Bloco atual: Etapa 02 — motion interativo do Tom.** Continuidade autorizada pelo responsável após a 01. Interações implementadas para conferência; vídeo, toque e desempenho em dispositivo real pendentes. Não iniciar a 03 automaticamente.

Os 176 itens estão em [BACKLOG.md](BACKLOG.md). As etapas 00/01 receberam autorização de continuidade; verificações manuais não executadas permanecem pendentes. Um teste unitário não aprova uma tela, um curso, um piloto ou uma etapa inteira.

| Ordem | Etapa | Situação |
|---|---|---|
| 00 | Preparar o projeto e confirmar a base | Aceita pelo responsável; commit e9a74b7 |
| 01 | Identidade, boas-vindas e tela de login | Continuidade autorizada; capturas e testes manuais pendentes |
| 02 | Motion interativo do Tom no login | Implementado para conferência |
| 03 | Login verdadeiro, privacidade e contas | Aguardando 00–02 e definições |
| 04 | Perfil de avaliador do piloto | Aguardando 03; não é professor |
| 05 | Primeiro acesso e perfil básico | Aguardando 03–04 |
| 06 | Tela inicial, abas e trilha | Aguardando 05 |
| 07 | Currículo e regras pedagógicas | Aguardando 06 |
| 08 | Motor básico de som e estímulos | Aguardando 07 |
| 09 | Primeiras atividades do Nível 1 | Aguardando 08 |
| 10 | Correção imediata e andaime 80/20 | Aguardando 09 |
| 11 | Provas, avanço e progresso | Aguardando 10 |
| 12 | Perfil, resultados e XP essencial | Aguardando 11 |
| 13 | Segurança, qualidade e piloto fechado | Aguardando 03–12 |
| 14 | Missões, ofensivas e conquistas | Aguardando 13 |
| 15 | Instrumento real e microfone | Aguardando 13 |
| 16 | Níveis 2–4 e biblioteca musical | Aguardando 13 e 15 conforme conteúdo |
| 17 | Professor virtual adaptativo — 0.7 | Aguardando 11 e 16 |
| 18 | Partituras inteligentes — 0.8 | Aguardando 15–17 |
| 19 | Área do Professor — 0.9 | Aguardando 13–18 |
| 20 | Qualidade final e publicação — 1.0 | Aguardando etapas obrigatórias |
| 21 | Ideias pós-lançamento | Aguardando 1.0; sem execução automática |

## Como trabalhar cada bloco

1. Informar ao responsável a etapa, o pequeno conjunto de tarefas e a entrega esperada.
2. Ler dependências e critérios no PDF antes de implementar.
3. Executar somente o bloco atual, preservando dados e evidências anteriores.
4. Registrar o que mudou, testes executados, resultado e limitações.
5. Conferir o resultado real com a evidência exigida; manter pendente o que não foi validado.
6. Só avançar depois dessa validação. Usar dados fictícios nos testes.

O PDF recomenda sessões flexíveis de 60–120 minutos e folga para correções; os tempos não são promessa de entrega. Não criar agendamentos automaticamente.

## Bloco em validação

**Etapa 02: Tom interativo.** Rig híbrido com máscaras da textura oficial e pose de privacidade derivada da referência, sem os recortes de braço rejeitados na inspeção. Ver [entrega e roteiro](ETAPA-02-TOM-INTERATIVO.md). Próxima, após validar a 02: definição de contas e privacidade na Etapa 03.

Autenticação consolidada pertence à Etapa 03. O cadastro local do protótipo é legado experimental, não conclusão dessa etapa. Ofensiva já codificada permanece candidata à Etapa 14; não desenvolver novas missões agora.

## Registro desta sessão

- Plano completo extraído para consulta; páginas das etapas 00/01/02 e da identidade renderizadas e inspecionadas.
- Backup da base experimental criado e conferido; originais preservados.
- Instalação local verificada, 154 testes aprovados e build aprovado.
- Mapa técnico, diferenças de escopo, backlog de 176 tarefas, decisões e changelog registrados.
- Testes visuais, celulares, conteúdo pedagógico e autenticação de produção continuam pendentes.
