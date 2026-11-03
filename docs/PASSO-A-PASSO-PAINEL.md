# Passo a passo: painel administrativo da Bia Joias

Tudo abaixo é feito na conta da Vercel da cliente, no projeto **biajoias-fhwk**.
Não envie senhas por chat ou e-mail.

## 1. Criar o banco de dados (gratuito)

1. Entre em vercel.com e abra o projeto **biajoias-fhwk**.
2. Clique em **Storage**.
3. Clique em **Create Database**.
4. Escolha **Neon** (Serverless Postgres).
5. Dê um nome, por exemplo `biajoias-db`, e escolha a região mais próxima, se aparecer.
6. Escolha o plano **Free**.
7. Clique em **Create**.
8. Na etapa de conexão, selecione o projeto **biajoias-fhwk**, marque **Production** e clique em **Connect**.

Isso cria a variável `DATABASE_URL` automaticamente.

## 2. Criar a senha do painel e a chave de sessão

1. Vá em **Settings → Environment Variables**.
2. Clique em **Add Environment Variable**.
3. **Key:** `ADMIN_PASSWORD`
   **Value:** a senha do painel (forte, com pelo menos 16 caracteres).
   Marque **Production** e salve.
4. Clique em **Add Environment Variable** de novo.
5. **Key:** `SESSION_SECRET`
   **Value:** uma sequência aleatória com pelo menos 32 caracteres.
   Marque **Production** e salve.

## 3. Aplicar as configurações

1. Vá em **Deployments**.
2. Abra o deploy mais recente, clique nos três pontos e escolha **Redeploy**.

## 4. Testar

1. Abra `https://biajoias-fhwk.vercel.app/admin.html`.
2. Entre com a senha criada no passo 2.
3. Se aparecerem os números de visitas e a lista de pedidos (vazia no início), está funcionando.

## Observação importante

O plano gratuito da Vercel é para uso pessoal. Como a loja vende joias, o ideal é a cliente passar para o plano Pro quando o site entrar no ar de verdade.
