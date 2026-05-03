# Gerador de Cardápio Casteluche

Repositório estático para criar, editar e gerar PDF de cardápios para impressão, usando os dados da planilha `cardapio_digital_casteluche.xlsx` como base.

## O que já vem pronto

- Base com os itens importados da planilha.
- Editor de produtos, preços, categorias, descrições e observações.
- Upload local de imagem por item.
- Formato principal: **Pasta A4 — até 9 páginas**.
- Formatos livres: **A4 vertical**, **A4 horizontal**, **A5 vertical**, **Feed 4:5** e **Stories 9:16**.
- Temas visuais: **Boteco premium**, **Clean claro** e **Escuro elegante**.
- Botão **Gerar PDF** via navegador.
- Botão **Organizar layout para pasta**, que agrupa variações do mesmo produto e ajusta o modo compacto.
- Botão **Zerar valores da categoria**, para deixar todos os preços de uma seção como `R$ 0,00`.
- Botão **Salvar no navegador**, **Exportar JSON** e **Importar JSON**.
- Pronto para hospedar no **GitHub Pages**.

## Modo Pasta A4 — até 9 páginas

Esse modo foi criado para cardápio físico em pasta/plástico A4.

- Limita a exportação a no máximo **9 páginas**.
- Usa layout compacto em duas colunas e agrupa variações do mesmo produto na mesma linha, como `Individual / Casal / Família` ou `P / M / G`.
- Repete cabeçalho e rodapé em cada página.
- Numera as páginas automaticamente.
- Mantém o cardápio organizado para impressão.

Se passar de 9 páginas, a ferramenta tenta concentrar o excesso na última página e mostra um aviso. Para melhorar o encaixe, reduza descrições longas, desative imagens ou separe o cardápio em PDFs por categoria.

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
- O botão **Organizar layout para pasta** força o formato A4, densidade compacta, sem imagens e com descrições resumidas para o PDF não quebrar.
- O botão **Zerar valores da categoria** usa o filtro de seção/categoria selecionado e define todos os preços daquela seção como `R$ 0,00`.

## Observação importante

Essa versão salva alterações no próprio navegador. Para transformar em uma plataforma com login, múltiplos clientes e banco de dados, o próximo passo é integrar com Firebase ou Supabase.
