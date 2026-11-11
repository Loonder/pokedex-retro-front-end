# Pokédex Retrô — Kanto + Johto

Projeto acadêmico de Web Development Front-End. A página explora os 251 primeiros Pokémon com dados reais da [PokéAPI](https://pokeapi.co/docs/v2), em uma interface responsiva feita exclusivamente com HTML, CSS e JavaScript.

## Executar

Abra `index.html` no navegador ou, para desenvolvimento local, execute um servidor HTTP na pasta do projeto:

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`. É necessária conexão com a internet para a primeira carga dos dados e imagens.

## Funcionalidades

- Cards criados por JavaScript usando `document.createElement()` e `appendChild()`; o HTML contém apenas o contêiner vazio.
- `fetch()` consulta a lista e os detalhes dos Pokémon, com validação de resposta e tratamento de erros.
- Filtros de Kanto e Johto, busca por nome ou número, paginação de 12 cards e layout adaptável a telas pequenas.
- Cada card mostra nome, imagem, número, região, tipos, altura e peso obtidos da API.
- Cache local de 24 horas para respeitar a política de uso da PokéAPI. O botão **Atualizar dados** remove o cache do projeto e consulta a API novamente.

## Estrutura

```text
index.html       Estrutura e contêiner dos cards
css/style.css    Estilos e responsividade
js/app.js        Requisições, cache, filtros e criação dinâmica dos cards
assets/          Favicon em SVG
```

## API utilizada

- Listagem: `https://pokeapi.co/api/v2/pokemon?limit=251&offset=0`
- Detalhes: `https://pokeapi.co/api/v2/pokemon/{id}/`
- Acesso: público, somente leitura, sem token.
- Resposta: JSON. A listagem oferece `results[]` com nome e URL; o detalhe oferece `id`, `name`, `sprites`, `types`, `height` e `weight`.
- A documentação informa que o limite fixo de requisições foi removido, mas pede cache local e uso responsável.

Documentação: [PokéAPI v2](https://pokeapi.co/docs/v2). Dados e imagens pertencem aos respectivos autores. Este projeto é exclusivamente educacional e não tem afiliação com a The Pokémon Company.
