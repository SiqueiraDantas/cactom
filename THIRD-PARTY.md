# Dependências e atribuições

## Pose derivada do Tom — Etapa 02

public/branding/cactom/tom-privacidade-v1.png é uma variante experimental criada com imagegen built-in a partir do Tom oficial para cobrir os olhos no campo de senha. Não substitui o original. Prompt em docs/cactom/evidencias/etapa-02/PROMPT-POSE-PRIVACIDADE.txt e hash em public/branding/cactom/origens.json. Previews SVG/PNG são evidências nativas do rig, não capturas de navegador.


## Identidade CACTOM — Etapa 01

Tom oficial extraído sem redesenho da imagem incorporada na página 48 do PDF fornecido pelo responsável. Prancha de identidade copiada integralmente e enquadrada apenas na interface para apresentar o logotipo. Arquivos, origens e hashes em public/branding/cactom/origens.json. A escola permanece no rodapé. O mascote SVG antigo é legado, não o Tom oficial. Nenhum asset do Duolingo foi utilizado.

Este documento acompanha o código e os arquivos estáticos distribuídos. O inventário exato de dependências está em `package-lock.json`.

- **OpenSheetMusicDisplay 2.2.1**, copyright 2019 PhonicScore, licença BSD de três cláusulas. [Projeto](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay). Licença integral: `public/licenses/opensheetmusicdisplay-LICENSE.txt`. Bibliotecas do bundle possuem avisos em `public/licenses/opensheetmusicdisplay-bundle-NOTICES.txt`.
- **MediaPipe Tasks Vision 1.1.1**, Google, Apache-2.0 conforme o pacote. [Projeto](https://github.com/google-ai-edge/mediapipe). Licença integral em `public/mediapipe/LICENSE`. WASM/JS copiados do pacote instalado por `scripts/prepare-assets.mjs`.
- Modelo **Hand Landmarker float16/1**, disponibilizado pelo MediaPipe: [arquivo original](https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task). Incluído em `public/mediapipe/hand_landmarker.task`; política de uso do modelo e atribuições devem acompanhar a distribuição. [Documentação do modelo](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker).
- React, React DOM, Pitchy e fft.js: licenças MIT dos pacotes instalados. Os textos acompanham `public/licenses/`. Não foram utilizadas amostras sonoras de terceiros.
- `@xmldom/xmldom` é utilizado apenas nos testes Node, não é empacotado na aplicação.
- As três pequenas melodias da biblioteca foram criadas para esta entrega; o mascote é um SVG original do projeto.

As fontes web pré-existentes continuam referenciadas pelo CSS. O carregamento local de modelo/WASM não representa uma certificação de funcionamento integral offline nem uma auditoria jurídica de implantação.
