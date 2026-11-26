# ServeRest: testes automatizados com Cypress

![CI](https://github.com/erkmnasc/ServeRest/actions/workflows/ci.yml/badge.svg)

Testes E2E de frontend e testes de API (funcionais e de contrato) para a
aplicação [ServeRest](https://serverest.dev), com Cypress e JavaScript.

- Frontend: https://front.serverest.dev/
- API (Swagger): https://serverest.dev/

As mensagens e regras esperadas nos testes foram conferidas no código-fonte da
ServeRest (schemas Joi, controllers e constantes de mensagens), não só no
Swagger.

## Cenários

### Frontend (`cypress/e2e/frontend/`)

| # | Cenário | Tipo | Spec |
|---|---------|------|------|
| 1 | Login de administrador vai para a área administrativa | Positivo | `login.cy.js` |
| 2 | Login de usuário comum vai para a vitrine | Positivo | `login.cy.js` |
| 3 | Login inválido mostra alerta e mantém na tela | Negativo | `login.cy.js` |
| 4 | Cadastro de administrador pela interface, já autenticado | Positivo | `cadastro.cy.js` |
| 5 | Cadastro com email já usado mostra alerta | Negativo | `cadastro.cy.js` |
| 6 | Administrador cadastra produto e vê na listagem | Positivo | `produtos.cy.js` |
| 7 | Produto com nome duplicado mostra alerta | Negativo | `produtos.cy.js` |

### API (`cypress/e2e/api/`), 48 testes

- **`POST /login`**: login válido com contrato, senha errada e email
  inexistente (401 com a mesma mensagem), email inválido e campos ausentes
  (400).
- **`/usuarios`**: criação conferida com GET, listagem com filtro e contrato,
  alteração, PUT em id inexistente (cria, 201), exclusão, email duplicado no
  POST e no PUT, campos obrigatórios, `administrador` inválido, exclusão de
  usuário com carrinho (400).
- **`/produtos`**: criação autenticada, listagem, alteração, exclusão, sem
  token (401), usuário comum (403), nome duplicado, preço inválido, exclusão
  de produto que está em carrinho (400).
- **`/carrinhos`**: criação com baixa de estoque, concluir compra (estoque
  continua baixado), cancelar compra (estoque volta), sem token, produto
  inexistente, quantidade maior que o estoque, produto repetido, limite de
  um carrinho por usuário.

## Estrutura

```
cypress/
  e2e/api/         specs de API
  e2e/frontend/    specs de frontend
  pages/           page objects
  schemas/         JSON Schemas usados na validação de contrato (AJV)
  support/api/     chamadas HTTP da API (service layer)
  support/         comandos customizados (massa via API, sessão, contrato)
  utils/           geração de massa com Faker
load-tests/        testes de carga com k6 (só contra o backend local)
scripts/           execução com geração de evidência em PDF
evidencias/        PDFs gerados em cada execução
```

Algumas escolhas do projeto:

- A massa é criada pela API e removida no fim de cada spec. Emails e nomes de
  produto são gerados a cada execução, porque a base pública é compartilhada e
  resetada de tempos em tempos.
- A service layer usa `failOnStatusCode: false` e o status é sempre conferido
  no teste, o que facilita testar os fluxos de erro.
- Depois de cada POST ou DELETE, um GET confere se a mudança aconteceu mesmo.
- 401 e 403 de `/produtos` têm cenários separados (sem token e usuário sem
  perfil de admin).
- Nada de `cy.wait` fixo; o ESLint com o plugin do Cypress barra isso.
- Retry só no modo `run` (uma tentativa extra), para segurar instabilidade de
  rede no CI sem esconder erro no desenvolvimento.

## Como rodar

Precisa de Node.js 22 ou mais novo (ver `.nvmrc`).

```bash
npm install
npm run cy:open         # modo interativo
npm test                # tudo, headless
npm run test:api        # só API, contra serverest.dev
npm run test:frontend   # só frontend, no Chrome
npm run lint
npm run format:check
```

### Backend local

A instância pública às vezes cai (503). Para rodar os testes de API sem
depender dela:

```bash
npm run test:api:local
```

O comando sobe o ServeRest 3.5.0 local (`npx serverest@3.5.0`, sem instalar nada),
espera a porta 3000 responder, roda os testes com
`API_URL=http://localhost:3000` e derruba o servidor no fim. Também dá
para usar o container oficial: `docker compose up -d` e depois
`API_URL=http://localhost:3000 npm run test:api`.

O frontend sempre roda contra o ambiente público: o front da ServeRest tem a
URL da API fixa no código, então não dá para apontá-lo para um backend local
sem modificar a aplicação.

### Testes de carga (k6)

Dois cenários em `load-tests/`, feitos para rodar só contra o backend local
(carga no `serverest.dev` afetaria quem usa o ambiente público):

| Script | O que faz | Usuários virtuais |
|---|---|---|
| `usuarios.load.js` | cria, consulta e exclui usuário | 0 → 10 → 20 → 0 em 50s |
| `login.load.js` | `POST /login` com 20 usuários criados no `setup()` | 0 → 15 → 0 em 50s |

```bash
npm run test:load
npm run test:load:login
```

Os thresholds (`http_req_failed < 1%` e `p95 < 500ms`) fazem o k6 terminar com
erro se forem ultrapassados. O backend da ServeRest é uma aplicação de
demonstração, então os números servem para mostrar a técnica, não como
medida de capacidade.

## Relatório e evidência em PDF

A execução gera um relatório HTML do Mochawesome em
`cypress/reports/index.html`, com os screenshots dos momentos principais
(login, vitrine, produto cadastrado, alertas). Os comandos `npm test`,
`npm run test:api` e `npm run test:frontend` convertem esse relatório em PDF
na pasta `evidencias/`, mesmo quando algum teste falha (o código de saída do
Cypress é mantido). O nome do arquivo leva o escopo e a data, por exemplo
`ServeRest_Evidencia-API_2026-07-10_14-33-05.pdf`. Há um exemplo em
[`evidencias/exemplos/`](evidencias/exemplos/).

## CI

GitHub Actions em três jobs: lint e formatação, depois testes de API e de
frontend em paralelo. Os testes de API rodam contra o ServeRest num service
container, então o CI não depende da instância pública. Relatório, PDF e
screenshots de falha ficam como artefatos de cada execução.

## Observações

- O `cypress/support/e2e.js` ignora uma exceção conhecida do front público
  (`services/validateUser.js`, quando a API responde com erro), filtrando pela
  mensagem exata. Qualquer outra exceção da aplicação continua falhando o
  teste.
- O ambiente público tem limite de requisições (429), por isso os testes não
  rodam em paralelo contra ele.

## Próximos passos

- Tags de smoke e regressão com `@cypress/grep`
- Testes de acessibilidade com `cypress-axe`
- Publicar o resumo do k6 como artefato do CI
