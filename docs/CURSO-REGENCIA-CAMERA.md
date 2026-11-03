# Curso de Regência (Cactom) — protótipo funcional para teste

## Integração
O usuário escolhe **Regência · Maestro** em `InstrumentPicker`. O `CourseEntry` isola o curso do fluxo antigo de instrumentos. A trilha, as nove atividades, a calibração, o rastreamento, a avaliação e os resultados estão no módulo `ConductorCourse.tsx`. O algoritmo puro de avaliação fica em `src/lib/conducting.ts` e seus testes em `tests/conducting.test.mjs`.

## Visão de aprendizagem
Som antes do símbolo: primeiro o pulso de um metrônomo audível e um ponto-guia visual, depois a experiência do gesto. Três unidades de progressão 2/4, 3/4 e 4/4 com três andamentos por metro. Os esquemas são didáticos simplificados, não uma norma única de técnica de regência.

## Funcionamento técnico
- Permissão explícita para `getUserMedia` (apenas vídeo, `audio:false`).
- MediaPipe `HandLandmarker` em modo VIDEO; modelo local `/mediapipe/hand_landmarker.task`; GPU com fallback para CPU.
- Um ponto da palma é obtido pela média ponderada entre punho e base do dedo médio. O X é espelhado para acompanhar o vídeo.
- O comando Calibrar capta o ponto inicial; deslocamentos são convertidos para o palco de 400x340, com controle de amplitude.
- A referência azul percorre os tempos com interpolação linear. A referência sonora usa `Metronome` com AudioContext e uma barra de preparação antes da execução.
- A pontuação só é atribuída por pontos atingidos **na ordem** dentro de janela temporal ±39–47% de um tempo. Pontos perdidos não bloqueiam o treino. Êxito: 75% dos tempos e ao menos metade dos primeiros tempos dos compassos acertados.
- A percepção de sincronização está em fase experimental e pode sofrer interferência de iluminação, câmera e latência do dispositivo.
- Apenas métricas por lição (`precision`, `rhythm`, `stars`, `passed`) são salvas por perfil em armazenamento local; nunca frames/vídeos.
- Ao sair do exercício, desligar o curso ou ocultar a página, as trilhas de câmera são encerradas.

## Privacidade e limitações
A câmera não é gravada/transmitida pelo curso e requer HTTPS fora de `localhost`. Idade e consentimento devem ser revisados antes de um lançamento público para crianças/adolescentes. Não é adequado declarar o algoritmo uma certificação de regência: não analisa cotovelo, ombro, articulação, gesto preparatório e expressão musical.

## Testes e validação pendente
`node --experimental-strip-types --test tests/conducting.test.mjs tests/instruments.test.mjs` testa estruturas curriculares, mapeamento, ordem/tempo e curso disponível. Também foram atualizados os testes de seleção em `tests/course-render.test.mjs`.

O ambiente desta entrega não conseguiu instalar o conjunto completo do npm, portanto ainda é necessário testar o `npm run build` e a webcam real no Windows e em um celular sob HTTPS.
