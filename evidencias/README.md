# Evidências de Execução

Esta pasta armazena as **evidências em PDF** geradas automaticamente a cada execução
headless da suíte (`npm test`, `npm run test:api`, `npm run test:frontend`).

O PDF é uma conversão fiel do relatório HTML (Mochawesome), com o resumo de
resultados, os cenários (passados e falhados) e, em caso de falha, o erro e o
screenshot embutidos. A evidência é gerada **mesmo quando há cenários falhando**.

## Convenção de nome

```
ServeRest_Evidencia-<Escopo>_<AAAA-MM-DD>_<HH-MM-SS>.pdf
```

| Campo | Valores | Origem |
|-------|---------|--------|
| Escopo | `API`, `Frontend`, `Suite-Completa`, `Relatorio` | variável `EVIDENCE_SCOPE` (definida por cada script npm) |
| Data | `AAAA-MM-DD` | data local da execução |
| Hora | `HH-MM-SS` | hora local da execução |

Exemplos:

```
ServeRest_Evidencia-API_2026-07-10_14-33-05.pdf
ServeRest_Evidencia-Frontend_2026-07-10_14-40-12.pdf
ServeRest_Evidencia-Suite-Completa_2026-07-10_15-02-58.pdf
```

O carimbo de data/hora garante que execuções sucessivas **não se sobrescrevem** e
que a listagem fica naturalmente ordenada por ordem cronológica.

## Versionamento

Os arquivos `.pdf` desta pasta são ignorados pelo git (ver `.gitignore`): são
artefatos regenerados a cada execução. No CI, cada job publica sua evidência como
_artifact_ do GitHub Actions. Para gerar o PDF a partir de um relatório já existente,
sem reexecutar os testes: `npm run report:pdf`.
