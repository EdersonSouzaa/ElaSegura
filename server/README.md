# ElaSegura - Backend (Prisma + PostgreSQL)

Este diretório contém a configuração do banco de dados e o ORM (Prisma) para o aplicativo **ElaSegura**.

## 🚀 Como funciona

O backend utiliza o **Prisma 7** para gerenciar a comunicação com o banco de dados **PostgreSQL**. A estrutura foi desenhada para suportar as funcionalidades de segurança feminina, incluindo:
- Cadastro de Usuárias e Perfil.
- Gestão de Contatos de Confiança.
- Registro de Ocorrências (Emergências e Avisos).
- Histórico de Alertas SOS.

## 📋 Pré-requisitos

Para rodar este projeto, você precisará ter instalado:
- [Node.js](https://nodejs.org/) (v18 ou superior)
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/)

## 🛠️ Instalação e Configuração

Siga os passos abaixo para preparar o ambiente:

1. **Instale as dependências do Node.js:**
   ```bash
   npm install
   ```

2. **Suba o banco de dados PostgreSQL (via Docker):**
   ```bash
   docker-compose up -d
   ```

3. **Execute as migrações do Prisma:**
   Isso criará as tabelas no banco de dados.
   ```bash
   npx prisma migrate dev --name init_db
   ```

## ⚙️ Configurações do Banco de Dados

As credenciais configuradas no `docker-compose.yml` e no `.env` são:

- **Usuário (POSTGRES_USER):** `user`
- **Senha (POSTGRES_PASSWORD):** `password`
- **Banco de Dados (POSTGRES_DB):** `elasegura`
- **Porta:** `5432`
- **URL de Conexão:** `postgresql://user:password@localhost:5432/elasegura?schema=public`

## 📂 Estrutura de Arquivos

- `prisma/schema.prisma`: Definição das tabelas e relacionamentos.
- `prisma.config.ts`: Configuração do Prisma 7 (gerencia a URL do banco).
- `docker-compose.yml`: Configuração do container PostgreSQL.
- `.env`: Variáveis de ambiente (credenciais do banco).

## 🆘 Solução de Problemas

### Erro P1001 (Can't reach database server)
Certifique-se de que o container do Docker está rodando:
```bash
docker ps
```
Se não aparecer nada, rode `docker-compose up -d` novamente.

### Erro P1012 (Schema Validation)
No Prisma 7, a URL do banco não fica mais no `schema.prisma`. Ela é gerenciada pelo `prisma.config.ts` que lê do arquivo `.env`. Não altere o `schema.prisma` para adicionar a URL manualmente.
