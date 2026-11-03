# Configurar o painel administrativo

O painel fica em `/admin.html`. Ele não dá acesso aos dados enquanto as variáveis de ambiente não estiverem configuradas no Vercel.

1. No projeto do Vercel, adicione um banco PostgreSQL pelo Marketplace (Neon é uma opção compatível). A integração precisa disponibilizar a variável `DATABASE_URL` para o ambiente Production.
2. Em Project Settings → Environment Variables, crie `ADMIN_PASSWORD` com uma senha exclusiva e forte, com pelo menos 16 caracteres.
3. Crie `SESSION_SECRET` com pelo menos 32 caracteres aleatórios. Gere no PowerShell com: `$buffer = New-Object byte[] 48; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buffer); [Convert]::ToBase64String($buffer)`.
4. Salve as variáveis para Production e faça um novo deploy.
5. Abra `https://SEU-DOMINIO/admin.html` e entre com a senha administrativa.

O código cria as tabelas `page_views` e `orders` automaticamente na primeira chamada. Não coloque valores dessas variáveis no GitHub, em arquivos HTML/JavaScript ou em mensagens.

As visitas são contadas por navegador, usando um identificador aleatório guardado no navegador e armazenado no banco apenas como hash. Os pedidos guardam nome, e-mail, telefone, endereço, itens, total e forma de pagamento para consulta no painel. O checkout registra a solicitação; a confirmação do pagamento continua fora do site até que um gateway seja conectado.