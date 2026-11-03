# CACTOM — base experimental e plano de execução

**Direção vigente:** Etapa 02, Tom interativo no acesso, implementada para conferência. O responsável autorizou a continuidade após a 01. Ver [entrega, assets e roteiro](docs/cactom/ETAPA-02-TOM-INTERATIVO.md). São 163 testes e build aprovados, com 15 testes de renderização/motion após o ajuste visual final. Vídeo e conferências manuais em computador/celular continuam pendentes. Etapa 03 não iniciada.

Comece por [acompanhamento do plano](docs/cactom/PLANO-DE-EXECUCAO.md), [auditoria e mapa técnico](docs/cactom/AUDITORIA-ETAPA-00.md), [backlog com 176 tarefas](docs/cactom/BACKLOG.md) e [decisões](docs/cactom/DECISOES.md). Instalação local conferida, 154 testes e build aprovados. Evidências em `docs/cactom/evidencias/2026-10-22/`.

O novo plano exclui câmera/trompete virtual e coloca ofensivas na Etapa 14. O Tom oficial é a referência com flor laranja, preservada em `referencias/` na raiz. Assets, login e cursos do protótipo precisam de avaliação na etapa correspondente. Autenticação de produção, conteúdo pedagógico, celulares e piloto não estão aprovados.

A fonte canônica continua na pasta já usada pelo servidor 5174; não criar outro app nem editar a distribuição antiga da raiz.

## Histórico do protótipo — Made In Sertão Music Lab 0.8.2

Aplicativo experimental da Escola de Música de Madalena — Made In Sertão. Aprendizagem de trompete em Si♭ e flauta doce soprano em Dó, prática com instrumento real e exploração virtual. A Área do Professor permanece fora desta entrega.

**Estado atual: Em teste (22/10/2026).** A atividade 13 continua falhando no uso real relatado pelo responsável, tanto no trompete quanto na flauta doce; o erro exato ainda não foi identificado. A investigação foi adiada por ele para a próxima sessão. Esta rodada concentra-se na entrada, identidade visual e ofensiva, sem alterar o motor de avaliação. Este registro prevalece sobre as descrições de correção anteriores.

## Iniciar no Windows

Extraia o ZIP e abra o terminal na pasta que contém `package.json`. Use Node.js 22.18 ou superior.

```powershell
npm install
npm run dev -- --port 5174 --strictPort
```

Abra **http://127.0.0.1:5174/**. Também é possível executar `ABRIR-MUSIC-LAB.bat`. Se o servidor já estiver aberto nessa porta, basta atualizar a página; não abra uma segunda instância. Preserve endereço e porta para manter acesso ao progresso do navegador.

Verificações de desenvolvimento:

```powershell
npm test
npm run build
```

## O que está disponível

- **Entrada antes da escolha do instrumento:** entrar com usuário/senha, criar uma conta local ou escolher **Pular e experimentar** para acessar a demo. Conta e progresso ficam neste navegador, sem nuvem, sincronização ou recuperação de senha. A demo preserva os testes antigos.
- **Identidade da escola:** logo original encontrada em outro projeto do responsável e copiada sem modificar o arquivo; novas ilustrações vetoriais próprias do mandacaru, trompete e flauta, mantendo fundo claro, azul-petróleo, verde e laranja.
- **Ofensiva de prática:** tela própria, meta diária de uma etapa válida, calendário dos últimos sete dias, sequência atual, recorde e marcos de 3, 7, 14 e 30 dias. Abrir o app não conta como prática; os dias seguem Fortaleza e os registros começam nesta atualização.
- **Escolha inicial de instrumento:** trompete em Si♭ e flauta doce soprano disponíveis; clarinete, saxofone, trombone e flauta transversal são futuros cursos. A escolha é lembrada e pode ser reaberta pelo cabeçalho do curso.
- **Duas trilhas com 13 aulas cada:** interface clara, botões com relevo e mascote mandacaru original. As ferramentas de afinação, dicas e etapas ficam nos ícones junto à atividade.
- **Prática real:** frequência, afinação, estabilidade e sustentação; metrônomo e avaliação aproximada de notas, durações e pausas nas aulas 12/13.
- **Virtual 0.6 aprimorado:** calibração por amostras estáveis, suavização, sensibilidade, perda de mão, volume e 14 atividades. As oito etapas antigas mantêm os IDs; câmera e toque guardam progresso separado.
- **Reforço adaptativo 0.7:** histórico de tentativas, dificuldades recorrentes, reforços personalizados, três níveis graduais e revisão após um dia. Regras locais e verificáveis, sem dependência de IA generativa.
- **Partituras 0.8:** três estudos originais por instrumento, importação MusicXML, renderização SVG com OpenSheetMusicDisplay, marcador de leitura, treino inteiro ou por compasso, feedback por nota/pausa e histórico local.

## Curso de flauta doce soprano

Atualize a página, entre ou pule para a demo e escolha **Flauta doce**. Também é possível trocar de instrumento pelo nome no topo do curso. Progresso, conquistas, tentativas e estudos são separados por curso; cada conta e a demo têm seus próprios dados.

A trilha começa pelos furos e pelas notas Si–Lá–Sol; depois apresenta notas repetidas, Dó/Ré agudos, pequenas melodias, Fá/Mi, notas graves, pulsos e compassos com pausa. Escolha **barroca** ou **germânica** na tela do curso: a orientação do Fá muda conforme o sistema.

Há desenho interativo dos oito furos (0 atrás), referências sonoras e exploração por toque. A prática real usa o microfone; a exploração por toque tem progresso separado e não usa câmera.

Usamos a notação tradicional da soprano com **8 acima da clave**: Dó4 escrito soa Dó5, e Si4 escrito soa Si5 (~987,77 Hz). A captação alcança o Ré6 sonoro (~1174,66 Hz). Não há suporte neste curso para flauta doce contralto/tenor ou flauta transversal.

Roteiro, fontes de digitação e limites: [CURSO-FLAUTA-DOCE.md](docs/CURSO-FLAUTA-DOCE.md).

## Atividade 13 — falha real pendente nos dois instrumentos

O responsável informa que a atividade não lê/aprova corretamente a execução em trompete e flauta doce e apresenta um erro ainda não identificado. Os testes sintéticos anteriores passaram, mas não resolveram esse relato. **Prioridade da próxima sessão:** reproduzir a falha, obter a mensagem exata e observar o fluxo real antes de mudar tolerâncias, captação ou avaliação. A investigação foi explicitamente adiada; o avaliador não foi modificado nesta rodada visual.

As instruções abaixo documentam o funcionamento esperado do trompete, sem confirmar a correção no equipamento real.

Use **Testar microfone primeiro** para conferir a nota escrita reconhecida. Para trompete em Si♭, Sol4 escrito corresponde a aproximadamente **349,23 Hz** reais, e Fá4 a **311,13 Hz**. Os botões de referência só funcionam com o microfone desligado.

Em **Começar atividade**, permita o microfone, ouça quatro pulsos de preparação e toque quando aparecer “Agora”: Sol nos tempos 1–2, silêncio no 3 e Fá no 4. Use fones. Há seleção de entrada, limiar de captação e compensação manual de ±300 ms. A contagem foi corrigida para não acrescentar pulsos extras. Veja [roteiro de validação](docs/ENTREGA-08-E-TESTES.md).

## MusicXML suportado nesta etapa

Uma parte, uma voz e uma pauta em clave de Sol; notas escritas para trompete em Si♭ de Dó4 a Dó6 ou notas naturais para flauta doce soprano de Dó4 a Ré5 (oitava acima na execução). Compassos completos em 2/4, 3/4 ou 4/4, andamento constante, figuras de semicolcheia a semibreve com durações em múltiplos de 1/4 de pulso; ligaduras de prolongamento são avaliadas como uma emissão contínua.

Limites: 512 KB, 64 compassos, 512 notas/pausas e 20 arquivos importados. Use `.musicxml` ou `.xml` descompactado. Polifonia, múltiplas vozes, repetições, quiálteras, anacruses, mudanças de compasso/andamento e `.mxl` ainda não são aceitos. Figuras com menos de 300 ms exigem andamento mais lento.

O marcador indica a posição esperada no andamento; os checks vêm da análise do áudio. Notas repetidas exigem emissões separadas. Não é um seguidor de partitura que ajusta automaticamente o andamento ao aluno.

## Dados, recursos e limites

Há contas locais opcionais, com nome/apelido, usuário e senha; a demo permite experimentar sem criar conta. O áudio é analisado em memória; não é gravado nem enviado. Vídeo e fotos não são guardados. A escolha, os resultados e as partituras ficam neste navegador:

| Armazenamento | Conteúdo |
|---|---|
| `mis-music-lab-local-accounts-v1` | Contas deste navegador; senha derivada com salt individual, sem senha em texto |
| `mis-music-lab-streak-v1` | Datas locais de prática válida; sem áudio ou tentativas brutas |
| `mis-music-lab-v03` | Progresso legado preservado |
| `mis-music-lab-v06-virtual` | Progresso de câmera/toque |
| `mis-music-lab-instrument` | Instrumento escolhido |
| `mis-music-lab-v07` | Até 500 tentativas derivadas, sem mídia |
| `mis-music-lab-recorder-v1` | Progresso das aulas de flauta doce |
| `mis-music-lab-v07-recorder` | Tentativas e reforços da flauta |
| `mis-music-lab-recorder-system` | Digitação barroca ou germânica |
| `mis-music-lab-recorder-touch-v1-baroque/german` | Exploração por toque, separada por sistema |
| IndexedDB `mis-music-lab-v08` | MusicXML e até 200 relatórios |

Na demo, as chaves e o banco antigos são mantidos. Cada conta usa o prefixo `mis-user:<UUID>:` nas chaves e um banco IndexedDB `mis-music-lab-v08-user-<UUID>` próprio. Os dados anteriores não são copiados automaticamente para uma conta. Ao atualizar a página, a entrada é solicitada novamente; o progresso salvo permanece no perfil escolhido. Não há sincronização, e-mail ou recuperação de senha. Limpar os dados do site remove essas informações locais. Mais detalhes e roteiro de teste: [ENTRADA-LOCAL-E-OFENSIVA.md](docs/ENTRADA-LOCAL-E-OFENSIVA.md).

O modelo e os WASM do MediaPipe são servidos pela própria aplicação. `postinstall` e build preparam os runtimes do pacote instalado. O ZIP inclui o modelo e as licenças. Instalação exige internet; as fontes web existentes também podem fazer solicitações externas. Não se trata de uma PWA offline.

Microfone e câmera em celular exigem HTTPS fora do localhost do próprio aparelho. Ver [CELULAR-HTTPS](docs/CELULAR-HTTPS.md). A síntese é uma referência eletrônica, sem amostras de trompete real. O microfone não comprova respiração, embocadura ou digitação física.

## Validação

Última medição desta rodada: **147/147 testes automatizados aprovados**, incluindo contas locais, namespaces de perfil, datas da ofensiva e renderização React em servidor. Três testes adicionais de armazenamento de perfil foram preparados; a contagem final e o build da 0.8.2 ainda aguardam execução/registro. O registro exato está em [PROGRESSO.md](PROGRESSO.md).

O navegador automatizado ficou indisponível por bloqueio de política de acesso à URL local. Não houve inspeção visual/interativa desta entrega, teste com flauta/trompete/webcam reais, medição de latência, validação Android/iOS ou avaliação de desempenho térmico. Testes de servidor e de lógica não comprovam os cliques nem a leitura de instrumentos reais. A atividade 13 permanece com falha relatada nos dois cursos; as versões 0.6–0.8 continuam **em teste**.

O bundle de partituras é carregado sob demanda e gera aviso de tamanho no Vite; avaliar seu desempenho em celulares. Bibliotecas e atribuições: [THIRD-PARTY.md](THIRD-PARTY.md). Continuidade e critérios de aceite: [TASKS.md](TASKS.md) e [AGENTS.md](AGENTS.md).
