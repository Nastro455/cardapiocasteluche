# Gerador de Cardápio Casteluche

Repositório estático para criar, editar e gerar PDF de cardápios para impressão, usando os dados da planilha `cardapio_digital_casteluche.xlsx` como base.

## O que já vem pronto

- Base com **201 itens** importados da planilha.
- Editor de produtos, preços, categorias, descrições e observações.
- Upload local de imagem por item.
- Formatos de saída: **A4 vertical**, **A4 horizontal**, **A5 vertical**, **Feed 4:5** e **Stories 9:16**.
- Temas visuais: **Boteco premium**, **Clean claro** e **Escuro elegante**.
- Botão **Gerar PDF** via navegador.
- Botão **Salvar no navegador**, **Exportar JSON** e **Importar JSON**.
- Pronto para hospedar no **GitHub Pages**.

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
└── .nojekyll
```

## Observação importante

O GitHub Pages é hospedagem estática. Ele não salva dados em banco de dados. Nesta versão, as alterações são salvas no próprio navegador usando `localStorage` e também podem ser exportadas/importadas via JSON.

Para virar uma plataforma com login para vários clientes, o próximo passo é integrar com Firebase ou Supabase.
