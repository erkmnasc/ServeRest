# Evidências de exemplo (versionadas)

Esta subpasta guarda **uma amostra curada** da evidência em PDF, versionada no
repositório para que qualquer pessoa (ex.: um recrutador avaliando o projeto)
veja o resultado de uma execução **sem precisar rodar os testes nem baixar
artefatos do CI**.

Diferente da pasta `evidencias/` (onde cada execução gera um PDF com carimbo de
data/hora, ignorado pelo git), os arquivos **aqui são versionados**.

O PDF de exemplo inclui os **screenshots da aplicação em execução** (login,
cadastro, listagem de produtos) embutidos no relatório — capturados pelos
`cy.screenshot()` dos specs de frontend.

## Como atualizar a amostra

```bash
npm run test:frontend
# copie o PDF gerado em evidencias/ para cá com nome estável:
#   evidencias/exemplos/ServeRest_Evidencia-Frontend.pdf
```
