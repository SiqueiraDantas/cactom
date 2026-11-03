# Entrega 0.6–0.8 — 21/10/2026

> Atualização 0.8.1: agora também existe o curso de flauta doce soprano, com dados separados, 13 aulas e três estudos. Este documento descreve a entrega anterior; veja CURSO-FLAUTA-DOCE.md e o PROGRESSO atual para o segundo instrumento.

## Escopo e auditoria

A base existente foi preservada: React 19, TypeScript, Vite, Pitchy, Web Audio, MediaPipe, 13 aulas e chaves de progresso anteriores. Não houve alteração nos motores legados `practice.ts`/`release.ts`, nem no projeto separado Made In Sertão Studio.

A direção visual aprovada é uma experiência inspirada na clareza das atividades do Duolingo, com identidade própria Made in Sertão. A escolha inicial prepara cursos adicionais, mas só trompete tem conteúdo e avaliação implementados.

0.6: amostras estáveis na calibração, verificação de limites/contraste, sensibilidade ±15°, suavização exponencial, histerese, reset por perda de mão e saltos de relógio; poses repetidas exigem saída real. Controle de volume, envelope suave e 14 digitações com registro explícito. Arquivos de visão locais. A avaliação continua baseada em ângulos aproximados; uma mão ocluída que o modelo ainda estime incorretamente pode produzir erro. Validar em webcam real.

0.7: classificação derivada de tentativas, recorrência sem acerto posterior, reforço em nota/foco, níveis acolhedor/padrão/desafio, revisão após 24 h e histórico limitado. Um acerto de sustentação não resolve uma dificuldade de pausa. Reforços ficam separados da conclusão das 13 aulas. Os níveis modificam duração e tolerâncias dentro de limites; nota e oitava corretas continuam obrigatórias. Não há alegação de eficácia educacional validada.

0.8: parser restritivo de MusicXML; OpenSheetMusicDisplay sob demanda; biblioteca original; marcador por posição musical; eventos ligados contínuos; feedback de altura/afinação/duração/pausa; escolha de compasso; persistência em IndexedDB. O marcador segue o andamento fixado, com feedback acústico e checks; não há acompanhamento de tempo livre/rubato. Arquivos fora do subconjunto suportado recebem erro, em vez de uma avaliação incorreta.

## Aula 13 — problema e correções

Relato do responsável: tocava Sol e Fá e recebia erro. Não houve acesso ao áudio dessa execução; não é possível afirmar que a causa concreta foi reproduzida no hardware.

Falhas de código encontradas e tratadas:
- Origem do metrônomo podia gerar de quatro a oito pulsos até a entrada; agora há exatamente um compasso de preparação.
- O início depende de microfone ativo; a permissão é resolvida antes da contagem.
- Compensação atua nos timestamps captados, sem deslocar a indicação visual.
- A avaliação espera amostras posteriores à soltura, inclusive com compensação negativa.
- Intervalos sem dados e ruído sem altura reconhecida não são aceitos como pausas.
- Continuidade exige uma emissão válida; dois sopros não viram uma mínima.
- Interface mostra nível, dispositivo e nota escrita reconhecida, permite testar antes, trocar entrada e ajustar limiar.
- Sol/Fá escritos são comparados a 349,23/311,13 Hz reais; testes incluem harmônicos sintéticos.

## Roteiro manual prioritário

1. Manter a origem http://127.0.0.1:5174/ para recuperar dados anteriores. Atualizar a página e confirmar seleção inicial de trompete.
2. Aula 13: com fones, usar “Testar microfone primeiro”. Tocar Sol4 e Fá4; conferir nota ouvida e barra. Se necessário, parar, escolher entrada e ajustar sensibilidade.
3. Começar em 60 BPM, esperar quatro pulsos e tocar Sol por dois tempos, silêncio por um e Fá por um. Conferir feedback individual. Se o atraso for sistemático, testar compensação em passos de 25 ms e registrar equipamento.
4. Provocar oitava errada, som na pausa, sopro interrompido e microfone desconectado; nenhum deve concluir indevidamente. Tentar novamente e voltar à trilha, conferindo encerramento da captura.
5. Praticar duas tentativas com a mesma dificuldade e confirmar recomendação; completar reforço, verificar novo resultado e preservar checks das aulas.
6. Abrir cada estudo em Partituras; conferir pauta, cursor, seleção de compasso, contagem, erros e tentativas. Importar XML exportado de editor, recarregar a página e verificar persistência.
7. Câmera: calibrar aberta/fechada, variar luz/posição, testar perda da mão, gestos rápidos, calibração ruim, troca de modo e som/volume. Toque não deve alterar progresso da câmera.
8. Conferir larguras 320, 390, 768 e 1440 px, teclado/Escape/foco dos painéis, orientação móvel. Testar Android e iPhone em HTTPS; medir CPU/FPS/latência e revisar critérios musicais com professor.

## Limites de verificação

Testes automatizados usam frequências e landmarks sintéticos, relógios e contextos de áudio simulados, além do parser XML real para Node. Não substituem testes de microfone, trompete, webcam ou renderização em navegador.

O acesso automatizado à prévia local foi bloqueado por política do navegador; inspeção visual e fluxos de clique não foram concluídos. Build verifica tipos e empacotamento, mas não comprova renderização OSMD, permissão de mídia ou disponibilidade de IndexedDB no aparelho. O teste HTTP verifica apenas entrega dos arquivos.

Não foi migrado áudio para AudioWorklet sem medição que justifique a mudança. Não foi acrescentada calibração automática de latência nem timbre gravado. Área do Professor segue planejada para 0.9, sem implementação.
