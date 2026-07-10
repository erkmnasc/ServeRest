# ServeRest — Testes Automatizados com Cypress

![CI](https://github.com/erkmnasc/ServeRest/actions/workflows/ci.yml/badge.svg)

Suíte de testes automatizados para a aplicação [ServeRest](https://serverest.dev), cobrindo cenários **E2E de frontend** e **testes de API** (funcionais + contrato), desenvolvida com **Cypress + JavaScript**.

- **Frontend:** https://front.serverest.dev/
- **API (Swagger):** https://serverest.dev/

> Os cenários e as mensagens esperadas foram validados diretamente contra o **código-fonte oficial da ServeRest** (schemas Joi, controllers e constantes de mensagens), garantindo assertivas fiéis ao contrato real da aplicação — e não apenas ao Swagger.

## Cenários implementados

### Frontend (E2E) — `cypress/e2e/frontend/`

| # | Cenário | Tipo | Spec |
|---|---------|------|------|
| 1 | Login de administrador redireciona para a área administrativa | Positivo | `login.cy.js` |
| 2 | Login de usuário comum redireciona para a vitrine de compras | Positivo | `login.cy.js` |
| 3 | Login inválido exibe alerta e mantém o usuário na tela | Negativo | `login.cy.js` |
| 4 | Cadastro de administrador pela interface com autenticação automática | Positivo | `cadastro.cy.js` |
| 5 | Cadastro com email duplicado exibe alerta | Negativo | `cadastro.cy.js` |
| 6 | Administrador cadastra produto e o visualiza na listagem | Positivo | `produtos.cy.js` |
| 7 | Produto com nome duplicado exibe alerta | Negativo | `produtos.cy.js` |

### API — `cypress/e2e/api/`

| Endpoint | Cenários | Spec |
|----------|----------|------|
| `POST /login` | Autenticação válida com validação de contrato · senha incorreta (401) · email inexistente com mesma mensagem genérica (401, anti-enumeração) · email inválido (400) · `password`/`email` ausentes (400) · todos os obrigatórios em uma resposta (400) | `login.api.cy.js` |
| `/usuarios` | Criação com round-trip GET (201/200) · listagem com filtro por query + contrato da lista (200) · alteração via PUT (200) · **PUT em id inexistente cria — upsert (201)** · exclusão confirmada (200→400) · email duplicado no POST (400) · email duplicado no PUT (400) · todos os campos obrigatórios em uma resposta (400) · `administrador` inválido (400) · consulta a id inexistente (400) · **DELETE de id inexistente não é erro (200)** · **DELETE de usuário com carrinho (400, dependência)** | `usuarios.api.cy.js` |
| `/produtos` | Criação autenticada com round-trip (201/200) · listagem com filtro + contrato da lista (200) · alteração via PUT (200) · **PUT em id inexistente cria — upsert (201)** · exclusão confirmada (200→400) · **sem token → 401** · **usuário comum → 403** (POST e PUT) · nome duplicado no POST e no PUT (400) · preço inválido (400) · campos obrigatórios em uma resposta (400) · **DELETE de id inexistente (200)** · **DELETE de produto em carrinho (400, dependência)** | `produtos.api.cy.js` |
| `/carrinhos` | Criação autenticada com round-trip GET + contrato (201/200) · **baixa de estoque ao criar** · listagem pública + contrato · **concluir compra: mantém estoque baixado (200)** · **cancelar compra: reabastece estoque (200)** · sem token → 401 · produto inexistente (400) · **quantidade > estoque (400)** · produto duplicado (400) · **limite de 1 carrinho por usuário (400)** · quantidade não positiva / lista vazia (400, schema) · id inexistente (400) · concluir sem carrinho (200) | `carrinhos.api.cy.js` |

## Arquitetura

```
cypress/
├── e2e/
│   ├── api/            # Specs de testes de API (funcionais + contrato)
│   └── frontend/       # Specs de testes E2E de frontend
├── pages/              # Page Objects (POM)
├── schemas/            # JSON Schemas para validação de contrato (AJV)
├── support/
│   ├── api/            # Service Layer da API ServeRest
│   └── commands.js     # Comandos customizados (setup via API, sessão, contrato)
└── utils/
    └── dataFactory.js  # Data Factory com Faker

load-tests/              # Cenários de carga (k6) — somente contra backend local
scripts/                 # Wrapper de execução + geração da evidência em PDF
```

## Padrões de projeto e boas práticas

| Padrão / prática | Onde | Por quê |
|---|---|---|
| **Page Object Model** | `cypress/pages/` | Isola seletores e interações; specs focam no comportamento |
| **Service Layer** | `support/api/serverestApi.js` | Centraliza chamadas HTTP; specs de API focam nas assertivas |
| **Data Factory** | `utils/dataFactory.js` | Massa dinâmica com Faker; testes independentes, sem dados hardcoded |
| **Validação de contrato** | `schemas/` + `cy.validateSchema` | JSON Schema (AJV) garante a estrutura das respostas, além dos valores |
| **Setup de estado via API** | `commands.js` | Preparar massa pela API é mais rápido e estável do que pela UI |
| **`cy.session`** | `commands.js` (`loginViaUi`) | Cacheia a sessão autenticada entre testes e specs |
| **Teardown via API** | hooks `after()` | Cada spec remove a massa que criou, preservando a base compartilhada |
| **Seletores `data-testid`** | Page Objects | Estáveis e desacoplados de CSS/estrutura visual |
| **Lint + formatação** | ESLint (plugin Cypress) + Prettier | Bloqueia anti-padrões (`cy.wait` fixo) e mantém estilo consistente |
| **Evidência em PDF por execução** | `scripts/` | Gerada sempre, mesmo com falhas — auditável sem precisar reabrir o Cypress |

## Decisões técnicas relevantes

- **`failOnStatusCode: false` na service layer** — a validação do status passa a ser responsabilidade explícita das assertivas, permitindo testar fluxos de erro como cidadãos de primeira classe.
- **Round-trip nos testes de API** — após cada `POST`/`DELETE`, uma consulta `GET` confirma o efeito real na base, não apenas a resposta da operação.
- **401 vs 403 em `/produtos`** — cenários separados para falha de **autenticação** (sem token) e de **autorização** (usuário autenticado sem perfil admin).
- **Erros de validação de campo** — a API retorna `{"campo": "mensagem"}` (e não `{"message": ...}`); as assertivas usam `deep.eq` para validar o corpo integral do erro.
- **Login sem `cy.session` no spec de login** — quando o login é o comportamento sob teste, a sessão não deve ser cacheada; nos demais specs, `loginViaUi` usa `cy.session`.
- **Sem `cy.wait` fixo** — sincronização exclusivamente por assertivas e retry-ability nativa (regra reforçada pelo ESLint).
- **Retry apenas em CI** (`runMode: 1`) — mitiga flakiness de rede no pipeline sem mascarar problemas locais.
- **Sem fixtures estáticas** — a base do ServeRest é pública e resetada periodicamente; dados fixos gerariam colisões e dependência de estado. Toda massa é gerada por factory e removida no teardown.
- **Token JWT expira em 600s** — tokens são obtidos por teste/spec, nunca reaproveitados entre execuções.

## Como executar

Pré-requisito: **Node.js 20+** (ver `.nvmrc`). Nada além disso — **não é necessário Docker** para rodar o projeto.

```bash
npm install
```

### Modo interativo (com interface do Cypress)

```bash
npm run cy:open
```

### Modo headless (linha de comando, sem interface — ideal para CI e validação rápida)

Estes comandos rodam **direto contra a API/front públicos** (`serverest.dev`), sem nenhum setup de ambiente. É a forma mais simples para quem quer só clonar e validar:

```bash
npm test              # toda a suíte (API + frontend), headless
npm run test:api      # somente testes de API, headless
npm run test:frontend # somente E2E de frontend, headless (Chrome)
```

### Qualidade de código

```bash
npm run lint
npm run format:check
```

## Onde os testes rodam — online vs. local

O projeto suporta **duas fontes de backend**, e a escolha é só do avaliador — sem alterar código:

| Forma | Comando | Backend usado | Precisa de quê? |
|---|---|---|---|
| **Online (padrão)** | `npm run test:api` | `serverest.dev` público | Só `npm install` |
| **Local via Node** | `npm run test:api:local` | Backend subido pelo pacote `serverest` (devDependency) | Só `npm install` (sem Docker) |
| **Local via Docker** | `docker compose up -d` + `CYPRESS_apiUrl=http://localhost:3000 npm run test:api` | Container oficial `paulogoncalvesbh/serverest` | Docker |

> **Para quem só quer validar rapidamente:** use `npm run test:api` (ou `npm test`). Roda online, headless, sem Docker, sem subir nada. O backend local é uma conveniência para determinismo (a instância pública cai com 503 de vez em quando), **não um requisito**.

A escolha do alvo é feita pela variável de ambiente **`CYPRESS_apiUrl`** (padrão: `https://serverest.dev`). Os specs de frontend sempre usam o front público — ver a decisão de escopo mais abaixo.

## Ambiente local do backend (opcional, para determinismo)

Quando quiser rodar os testes de API sem depender da instância pública, o projeto sobe um backend ServeRest local e aponta a suíte para ele automaticamente:

```bash
# Sobe o backend local (porta 3000), roda os testes de API contra ele e encerra o processo ao final
npm run test:api:local

# Equivalente em modo interativo (cypress open)
npm run cy:open:local

# Só subir o backend local, sem rodar testes (útil para os testes de carga)
npm run serverest:local
```

Por baixo dos panos: `start-server-and-test` sobe o backend (pacote `serverest`, instalado como devDependency), espera `http://localhost:3000/usuarios` responder, roda os testes com `CYPRESS_apiUrl=http://localhost:3000` e derruba o processo ao final — sem passos manuais e **sem Docker**.

**Alternativa via Docker**, caso prefira o container oficial em vez do pacote Node:

```bash
docker compose up -d
# ou, sem compose:
docker run -p 3000:3000 paulogoncalvesbh/serverest:latest
```

Com o container de pé em `localhost:3000`, rode `npm run test:api` passando `CYPRESS_apiUrl=http://localhost:3000` (ou exporte a variável antes do comando).

**Decisão de escopo — por que só a API roda local:** o frontend público (`front.serverest.dev`) tem a URL da API **hardcoded** no seu código-fonte (`src/services/utils.js`), sem variável de ambiente. Ou seja, a UI sempre fala com `serverest.dev`, nunca com um backend local — apontar o setup/teardown dos specs de frontend para um backend diferente do que a UI usa quebraria a massa de dados (usuário criado num backend, a UI procurando noutro). Rodar o frontend 100% local exigiria fazer fork do repositório da aplicação sob teste só para corrigir essa URL, o que foi conscientemente descartado para não misturar "testar a aplicação" com "modificar a aplicação". Os specs de frontend continuam contra o ambiente público, com retries e o teardown resiliente descrito abaixo.

## Testes de carga (k6)

`load-tests/` contém dois cenários de carga com [k6](https://k6.io/), escritos para rodar **exclusivamente contra o backend local** — nunca contra `serverest.dev`, que é uma instância pública e compartilhada (carga artificial ali afetaria outras pessoas usando o ambiente).

| Script | Cenário | Rampa |
|---|---|---|
| `load-tests/usuarios.load.js` | CRUD de `/usuarios` (criar → consultar → excluir) por iteração | 0→10→20→0 VUs em 50s |
| `load-tests/login.load.js` | `POST /login` contra um pool de 20 usuários pré-criados em `setup()` | 0→15→0 VUs em 50s |

```bash
# Instalar o k6 (uma vez): https://k6.io/docs/get-started/installation/
winget install GrafanaLabs.k6   # Windows

# Sobe o backend local, roda o cenário e derruba o backend ao final
npm run test:load          # CRUD de /usuarios
npm run test:load:login    # login sob carga
```

Thresholds definidos em cada script (`http_req_failed < 1%`, `p95 < 500ms`) fazem o k6 sair com código de erro se a taxa de falha ou a latência estourarem — dá pra plugar no CI como gate de performance. Vale o registro: o backend do ServeRest é uma aplicação de demonstração (armazenamento em arquivo, processo único), não dimensionada para produção — os scripts demonstram a metodologia (rampas, thresholds, cenários realistas de login vs. escrita) mais do que servem como benchmark de capacidade real.

## Relatórios e evidência em PDF

A execução headless gera um **relatório HTML (Mochawesome)** em `cypress/reports/index.html`, com gráficos e screenshots embutidos em caso de falha — cenários que falham já vêm com o erro e o stack trace expandidos por padrão, sem precisar interagir com o relatório.

`npm test`, `npm run test:api` e `npm run test:frontend` passam por um wrapper (`scripts/run-tests-with-report.js`) que, **independentemente do resultado da suíte**, converte esse HTML em PDF logo em seguida — a evidência é salva mesmo quando há cenários falhando, e o código de saída real do Cypress continua sendo propagado (a suíte falhando segue derrubando o comando/CI normalmente). Cada execução gera um arquivo carimbado com data/hora em `cypress/reports/pdf/`, sem sobrescrever execuções anteriores:

```bash
cypress/reports/
├── index.html
└── pdf/
    └── relatorio-2026-07-10T14-30-00-000Z.pdf
```

A conversão usa `puppeteer-core` apontando para o Chrome já instalado na máquina (o mesmo usado por `--browser chrome`), em vez de baixar um segundo Chromium — em runners Linux/CI usa `google-chrome-stable`; no Windows, o Chrome instalado em `Program Files`. Para gerar o PDF de um relatório já existente sem rodar a suíte de novo: `npm run report:pdf`.

## CI

Pipeline em GitHub Actions com três estágios: **lint/formatação** → **testes de API** e **testes E2E de frontend** em paralelo.

- **Testes de API**: rodam contra um backend ServeRest local, subido como *service container* Docker (`paulogoncalvesbh/serverest`) — não dependem da disponibilidade da instância pública para o CI ficar verde.
- **Testes de frontend**: rodam contra `front.serverest.dev` / `serverest.dev` (ver decisão de escopo acima).

Relatório HTML, evidência em PDF e screenshots de falha são publicados como artefatos de cada job.

## Observações sobre o ambiente

A base pública do ServeRest é **compartilhada e resetada periodicamente**, e a instância sofre instabilidade (503) com alguma frequência. Por isso:

- Os testes de API rodam contra um **backend local** (ver seção acima) — determinísticos e independentes da instância pública;
- Emails e nomes de produto são únicos por execução (factory + Faker);
- Cada spec cria e remove sua própria massa de dados, com **teardown resiliente**: os hooks `after()` checam se o setup (`before()`) de fato criou o recurso antes de tentar removê-lo, para que uma falha de setup não derrube o teardown com um erro secundário (`Cannot read properties of undefined`) que mascara a causa raiz no relatório;
- Um handler de `uncaught:exception` em `cypress/support/e2e.js` ignora — de forma cirúrgica, filtrando pela mensagem exata — uma exceção não tratada conhecida do frontend público (`services/validateUser.js`) que estoura quando a API responde com erro, sem suprimir outras exceções da aplicação;
- A suíte evita paralelismo agressivo contra o ambiente público, que possui rate limiter (HTTP 429).

## Possíveis evoluções

- Tags de execução seletiva com `@cypress/grep` (smoke vs. regressão);
- Execução paralela com Cypress Cloud;
- Testes de acessibilidade com `cypress-axe`;
- Stack 100% local (fork do frontend com URL da API configurável via env + docker-compose orquestrando os dois serviços), eliminando também a dependência externa dos specs de frontend;
- Publicar o resumo do k6 (`--summary-export`) como artefato do CI e plotar tendência de latência entre execuções.
