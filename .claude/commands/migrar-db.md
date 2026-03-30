Aplica as migrações SQL pendentes do banco de dados.

Passos:
1. Verifique se o arquivo `apps/api/.env` existe e tem `DATABASE_URL` configurada
2. Execute `pnpm --filter api db:migrate` para aplicar as migrações pendentes
3. Execute `pnpm --filter api db:status` para confirmar o estado atual das migrações
4. Reporte quais migrações foram aplicadas ou se não havia nenhuma pendente
