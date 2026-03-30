Mostre um resumo completo do estado atual do projeto.

Verifique e reporte:
1. Estrutura de arquivos principal dos apps (`apps/api/src/` e `apps/web/src/`)
2. Dependências instaladas (`cat apps/api/package.json` e `cat apps/web/package.json`)
3. Status do git (`git status` e `git log --oneline -10`)
4. Status das migrações do banco (`pnpm --filter api db:status`)
5. Variáveis de ambiente presentes em `apps/api/.env` (sem mostrar os valores, apenas os nomes)

Apresente tudo de forma organizada e aponte qualquer problema encontrado.
