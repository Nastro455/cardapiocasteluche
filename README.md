# Gerador de Cardápio Casteluche

Repositório estático para criar, editar e gerar PDF de cardápios para impressão, usando os dados da planilha `cardapio_digital_casteluche.xlsx` como base.

## O que já vem pronto

- Base com os itens importados da planilha.
- Editor de produtos, preços, categorias, descrições e observações.
- Upload local de imagem por item.
- Formato principal: **Pasta A4 — limite configurável**.
- Formatos livres: **A4 vertical**, **A4 horizontal**, **A5 vertical**, **Feed 4:5** e **Stories 9:16**.
- Temas visuais: **Boteco premium**, **Clean claro** e **Escuro elegante**.
- Botão **Gerar PDF** via navegador.
- Botão **Organizar layout selecionado**, que respeita o formato escolhido, agrupa variações e evita páginas brancas no PDF.
- Cabeçalho com opção de usar **logo da casa** ou o texto do restaurante.
- Cabeçalho com opção de adicionar **QR Code do Cardápio Virtual**.
- Botão **Zerar valores da categoria**, para deixar todos os preços de uma seção como `R$ 0,00`.
- Botão **Salvar no navegador**, **Exportar JSON** e **Importar JSON**.
- Pronto para hospedar no **GitHub Pages**.

## Modo Pasta A4 — limite configurável

Esse modo foi criado para cardápio físico em pasta/plástico A4.

- Limita a exportação a a quantidade de páginas definida pelo usuário.
- Usa layout compacto em duas colunas e agrupa variações do mesmo produto na mesma linha, como `Individual / Casal / Família` ou `P / M / G`.
- Repete cabeçalho e rodapé em cada página.
- Numera as páginas automaticamente.
- Mantém o cardápio organizado para impressão.

Se passar do limite informado, a ferramenta tenta concentrar o excesso na última página e mostra um aviso. Para melhorar o encaixe, reduza descrições longas, desative imagens ou separe o cardápio em PDFs por categoria.

## Como publicar no GitHub Pages

1. Crie um repositório novo no GitHub.
2. Envie todos os arquivos desta pasta para a raiz do repositório.
3. Vá em **Settings > Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**.
5. Selecione a branch `main` e a pasta `/root`.
6. Salve e aguarde o GitHub gerar o link.

## Como editar o cardápio

Abra o site, altere as informações no painel esquerdo e clique em **Salvar no navegador**.

Para guardar uma versão fora do navegador, use **Exportar JSON**. Depois, em outra máquina, use **Importar JSON** para recuperar os dados.

## Como gerar PDF

Clique em **Gerar PDF**. A ferramenta usa a biblioteca `html2pdf.js` via CDN. Se ela não carregar por bloqueio de internet, use o atalho **Ctrl+P** e escolha **Salvar como PDF**.

## Estrutura

```txt
casteluche-cardapio-generator/
├── index.html
├── style.css
├── app.js
├── data/
│   ├── menu-data.js
│   └── menu.json
├── assets/
│   └── README.md
├── docs/
│   └── PROXIMOS_PASSOS.md
└── .nojekyll
```


## Novidades da versão 3

- O preview da pasta A4 agora agrupa produtos repetidos com variações de preço, evitando que o mesmo prato apareça em várias linhas separadas.
- O botão **Organizar layout selecionado** respeita o formato atual, aplica densidade compacta, remove imagens e ajusta descrições para o PDF não quebrar.
- O botão **Zerar valores da categoria** usa o filtro de seção/categoria selecionado e define todos os preços daquela seção como `R$ 0,00`.

## Observação importante

Essa versão salva alterações no próprio navegador. Para transformar em uma plataforma com login, múltiplos clientes e banco de dados, o próximo passo é integrar com Firebase ou Supabase.

## Atualização V4

A exportação de PDF agora renderiza cada página individualmente antes de montar o arquivo. Isso evita o problema de páginas brancas extras que acontecia quando um cardápio de 9 páginas virava um PDF com muitas páginas vazias.

O botão de organização não força mais apenas o modelo Pasta A4: ele respeita o formato selecionado, seja A4 vertical, A4 horizontal, A5, Feed ou Stories.

## Atualização V8

Esta versão adiciona:

- controle de escala das imagens dos itens, respeitando a paginação do layout;
- opção de menu digital com botões de acesso rápido às categorias;
- botão de voltar ao menu nas páginas internas;
- presets continuam salvando configurações, imagens, QR Code, logo, escala do logo, escala das imagens e menu digital.


## Atualização V9+

Esta versão mantém a base visual da V9, que foi a mais estável para o layout de impressão, e adiciona o recurso de **Exportar cardápio público**.

O botão gera um arquivo HTML independente para uso como cardápio digital em uma página pública do GitHub Pages. Esse arquivo sai sem painel administrativo, com menu rápido de categorias, botão de WhatsApp quando houver telefone cadastrado e opção de imprimir pelo navegador.

Fluxo recomendado:

1. Ajuste o cardápio normalmente no editor.
2. Clique em **Salvar no navegador** para preservar a versão local.
3. Clique em **Exportar cardápio público**.
4. Suba o arquivo `.html` gerado para o repositório do GitHub Pages.
5. Use esse arquivo como destino do QR Code do cardápio virtual.


## Atualização — limite de páginas configurável

O campo **Limite de páginas** não fica mais travado em 9. O padrão continua sendo 9 para o cardápio físico atual do Casteluche, mas o operador pode informar outro limite de páginas, de 1 a 99, caso a pasta física ou o uso digital mude no futuro.
