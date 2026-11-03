# Music Lab 0.6 — Teste do Trompete Virtual com Câmera

> Atualização 0.8 (21/10/2026): esta página descreve a entrega original. Agora a câmera exige calibração válida por amostras estáveis, há suavização/sensibilidade, controle de volume e 14 etapas (oito IDs anteriores preservados). Modelo e runtimes estão em public/mediapipe; não dependem de CDN ao abrir a câmera. Validação de webcam/móveis ainda pendente. Leia docs/ENTREGA-08-E-TESTES.md e o README atual.

**Versão 0.6.0 / 21 de outubro de 2026 — versão experimental.**

## O que esta entrega acrescenta

- Seleção entre **Com instrumento · Microfone** (funcionalidades da 0.4.3 preservadas) e **Sem instrumento · Câmera**.
- Leitura de 21 pontos da mão com **MediaPipe Hand Landmarker**, análise dos ângulos de indicador, médio e anelar da mão apresentada.
- Destaque dos pistos 1/2/3 reconhecidos e traçado da mão ao vivo sobre a imagem da webcam espelhada.
- Calibração manual por duas poses (dedos estendidos e dedos flexionados) para personalizar os limiares; opção de uso experimental com limiar padrão quando não calibrado.
- Som de guia **sintetizado**, de volume reduzido, na frequência real do trompete em Si♭ para a nota *escrita* selecionada. Não é amostra de trompete acústico; o gesto sozinho não controla a embocadura nem escolhe o harmônico.
- Oito etapas progressivas de digitação: Sol–Fá–Mi–Ré–Dó–Mi–Fá–Sol. Check automático após sustentar a pose por cerca de 0,9–1,25 s e progressão para a próxima atividade.
- Laboratório livre: escolha a nota-alvo (incluindo Dó/Sol com digitação aberta) e experimente o som quando a digitação coincidir.
- Modo alternativo **Pistos na tela**, explicitamente identificado como demonstração e com progresso separado dos exercícios verificados pela webcam.
- Dados salvos *neste navegador*: `mis-music-lab-v06-virtual` guarda apenas os IDs de etapas concluídas separadamente para câmera e toque. A chave anterior `mis-music-lab-v03` não foi alterada.

## Abrir no notebook Windows

1. Instale **Node.js 22 ou superior**.
2. Extraia a pasta completamente; entre no diretório que contém `package.json`.
3. Execute `npm install`, depois `npm test` e `npm run dev`.
4. Abra `http://localhost:5173` no Chrome ou Edge atualizado.
5. Clique **Sem instrumento · Câmera** → **Ativar câmera** → autorize webcam. Na primeira execução, é necessário **internet** para baixar a biblioteca, arquivos WebAssembly e modelo do MediaPipe.
6. Posicione uma mão com a palma voltada para a câmera, afastada do rosto e com os dedos visíveis. Faça a calibração: primeiro dedos soltos, depois três dedos flexionados.
7. Confira as combinações e o check na sequência da aula. Clique **Ouvir a nota** para liberar o áudio se o navegador não o iniciar automaticamente.

## Usar no celular

- O site precisa estar hospedado em **HTTPS**, como uma prévia no Vercel. `http://localhost` só é seguro no mesmo dispositivo; o IP do notebook em HTTP não concede câmera normalmente.
- Toque em **Sem instrumento · Câmera**, autorize a câmera e use a mão dentro do quadro. Em dispositivos modestos, a inferência pode reduzir a taxa de quadros.
- Se a câmera estiver indisponível, **Pistos na tela** permite testar a didática sem gravar vídeo.

## Checklist do teste real

- [ ] Instalação: `npm install` sem erro; `npm run build` sem erros TypeScript/Vite.
- [ ] Aulas 1–13 anteriores ainda abrem e preservam os checks locais.
- [ ] Câmera ativa e desligada sem manter a luz de uso acesa ao sair do modo.
- [ ] Indicador → pisto 1; médio → 2; anelar → 3; testar combinações 0/1/1+2/1+3.
- [ ] Calibração aberta/fechada reduz erros de leitura em duas mãos/aparelhos diferentes.
- [ ] Som guia reproduz notas sem estridência, com volume de sistema confortável.
- [ ] Um gesto incorreto, oscilação de digitação ou ausência de mão não produz check.
- [ ] 8 checks surgem apenas após manter a digitação correta; ao trocar de modo, resultados separados.
- [ ] Mobile em HTTPS: layout sem rolagem horizontal e permissões funcionando.
- [ ] Teste com professor de trompete: feedback e estratégias de aula considerados adequados.

## Limites conhecidos

- É um **protótipo de interpretação de gestos**, não um sensor físico de pistos. Oclusão dos dedos, reflexos, iluminação, movimento da câmera e mão de criança pequena podem gerar leituras falsas. A calibração não resolve todos os casos.
- **Não mede força aplicada**, altura real do pisto, respiração, embocadura ou nota acústica do trompete no modo virtual.
- Dois harmônicos podem utilizar a mesma digitação: por isso a **nota-alvo é selecionada** e o som não é inferido unicamente pelo pisto.
- O reconhecimento do MediaPipe ocorre **localmente** após baixar os arquivos e não grava frames no sistema. Conforme a documentação do fornecedor, bibliotecas MediaPipe podem transmitir métricas técnicas do uso ao Google; avaliar consentimento/privacidade antes de atividade institucional com crianças.
- Modelo/WASM são obtidos externamente por HTTPS (`storage.googleapis.com` e `cdn.jsdelivr.net`). Para funcionar offline, futuramente precisarão ser incluídos no build após revisar licença e distribuição.
- **NÃO foi possível testar a webcam física ou executar o build neste ambiente** devido à indisponibilidade DNS do registro npm. Os 47 testes Node verificam a lógica, não a precisão da imagem real.
