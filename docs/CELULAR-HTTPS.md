# Teste no celular: interface e microfone

## Por que o IP local pode não funcionar?

Chrome, Safari e navegadores modernos normalmente só permitem `getUserMedia()` com origem segura: `https://` ou `http://localhost` no próprio dispositivo. Um celular acessando `http://IP-DO-NOTEBOOK:5173` **não é `localhost` do celular**.

## Teste visual sem publicar

Abra `http://127.0.0.1:5173` no notebook, pressione `F12`, ative a visualização responsiva e escolha larguras de 360 px, 390 px e 768 px. Isso verifica o layout, não equivale à validação do microfone no celular.

## Teste completo via Vercel HTTPS

1. Suba **somente este Music Lab** em um repositório GitHub próprio. Não use nem substitua o repositório do Made In Sertão Studio/partituras.
2. Importe o repositório para um novo projeto no Vercel.
3. Configuração: framework **Vite**; build `npm run build`; saída `dist`; instalação `npm install`.
4. Concluído o deploy, abra o endereço fornecido pelo Vercel com `https://` no Chrome Android ou Safari iPhone.
5. Na Aula 2, toque **Ativar microfone**, conceda a permissão e use o trompete real.
6. Confirme 2 s de Sol escrito (Fá real), check verde e aula concluída. Teste a Aula 4 com pausas entre sons repetidos.

## Dicas importantes

- Use um ambiente tranquilo e volume confortável. Se possível, mantenha o alto-falante silencioso durante a avaliação.
- **Ouvir tom guia** é desabilitado enquanto o microfone está ligado para evitar que o som do próprio celular seja confundido com o trompete.
- Não envie nomes, imagens ou gravações de crianças ao testar este protótipo. O MVP não solicita nenhum desses dados.
- Em iPhone, atualize o iOS/Safari; desative economia agressiva de bateria se interromper o microfone ao escurecer a tela.
- Sem HTTPS a aula visual poderá abrir, mas a permissão de microfone pode falhar.
