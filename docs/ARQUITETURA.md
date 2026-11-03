# Arquitetura e decisões tecnológicas

## Tecnologia do MVP

- React + TypeScript + Vite: interface moderna, componentes testáveis, fácil evoluir para desktop. Esqueleto Vite/React.
- `getUserMedia` + Web Audio `AnalyserNode`: captação local inicial; `Pitchy` (McLeod Pitch Method) detecta frequência fundamental estimada e clareza.
- Motor musical independente em `src/lib/music.ts`: transposição trompete Si♭, frequência de referência A4=440 Hz, mapeamento de notas e cents.
- Processamento em intervalos de ~90 ms no protótipo. Após medir custo/latência, migrar DSP ao `AudioWorklet` e/ou worker na tarefa AUD-005.
- Sem servidor. Nenhuma mídia gravada ou enviada. Microfone solicitado apenas após clique. `localhost` ou HTTPS para permissões.

## Expansão planejada, não instalada

- OpenSheetMusicDisplay: renderização de MusicXML com cursor para nota atual.
- MediaPipe Hand Landmarker: reconhecimento de 21 pontos da mão em teste experimental; oclusão por pistos físicos pode inviabilizar precisão.
- Dexie/IndexedDB: histórico local de exercício, apenas após definir modelo de consentimento/retensão para menores.
- Electron: distribuição Windows posteriormente, preservando `contextIsolation`, `sandbox` e sem habilitar `nodeIntegration` em interface remota.

## Contratos de domínio

- Nota escrita (trompete Si♭) é DOIS semitons ACIMA do som de concerto. Exemplo Dó4 escrito -> Si♭3 ouvido ~233,08 Hz.
- O aplicativo compara frequência detectada com a frequência de concerto esperada e exibe a nota escrita para a criança.
- Pistos exibidos são instrução pedagógica, não informação detectada via microfone.
- Falhas de pitch detection em harmônicos, ruído, ataques e múltiplas fontes devem produzir estado de incerteza, não correção categórica.

## Qualidade e limites atuais

Primeiro protótipo com análise no thread da interface: suficiente para experimentar, não garantia de desempenho de produção. Build real, ajustes de pacote, calibração e testes com instrumento físico ainda pendentes.

## Referências

- https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet
- https://github.com/ianprime0509/pitchy
- https://github.com/opensheetmusicdisplay/opensheetmusicdisplay
- https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js
- https://www.electronjs.org/docs/latest/tutorial/security/
