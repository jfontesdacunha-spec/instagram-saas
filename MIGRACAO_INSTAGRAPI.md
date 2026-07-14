
# Guia de Migração: InstaFlow + Instagrapi

Este guia explica como configurar o novo sistema de postagem automática usando a biblioteca `instagrapi`.

## Estrutura do Sistema

1.  **Frontend (Next.js):** Continua na Vercel. Ele agora envia as ordens de postagem para o Worker.
2.  **Worker (Python):** Um novo servidor que lida com o login real do Instagram, 2FA e postagens.

## Como Instalar o Worker

Você precisará de um servidor que suporte Python (ex: VPS, Railway, Render, ou um Cloud Computer).

1.  **Copie os arquivos:**
    *   `worker.py`: Contém a lógica do Instagram.
    *   `main.py`: Expõe a API para o seu frontend.

2.  **Instale as dependências:**
    ```bash
    pip install instagrapi fastapi uvicorn requests python-dotenv
    ```

3.  **Rode o Worker:**
    ```bash
    python main.py
    ```
    *O servidor rodará na porta 8000 por padrão.*

## Configurações no Next.js (Vercel)

Adicione a seguinte variável de ambiente no seu painel da Vercel:

*   `INSTAGRAPI_WORKER_URL`: A URL onde o seu Worker Python está rodando (ex: `https://seu-worker.com`).

## Como Conectar Contas

Agora, em vez de usar o botão oficial do Instagram, você deve enviar uma requisição para a nova rota:
`/api/instagram/instagrapi-login`

**Dados necessários:**
- `username`: Usuário do Instagram.
- `password`: Senha do Instagram.
- `verificationCode`: (Opcional) Código 2FA se o Instagram solicitar.

## Observações Importantes

- **Segurança:** O sistema salva um arquivo de "sessão" na pasta `./sessions`. Isso é o que permite postar sem pedir 2FA toda vez. Proteja essa pasta!
- **Proxies:** Recomendo fortemente configurar um proxy por conta para evitar bloqueios, especialmente com 30 contas.
- **2FA:** Se o login falhar pedindo 2FA, o sistema retornará um erro avisando. Você deve então pedir o código ao usuário e tentar o login novamente enviando o `verificationCode`.
