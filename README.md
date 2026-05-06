# ElaSegura - Guia de Execução

Este projeto consiste em um aplicativo mobile (Frontend) e um servidor de API (Backend) com banco de dados PostgreSQL.

## 🚀 Como Executar o Projeto

### 1. Requisitos Próximos
- Node.js instalado
- PostgreSQL instalado e rodando no Windows
- Banco de dados criado no PostgreSQL chamado: `elasegura`

---

### 2. Configuração do Backend (API)
Abra um terminal na pasta `server`:

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Verificar o banco:**
   Certifique-se de que o PostgreSQL está rodando e que você criou o banco `elasegura`.

3. **Iniciar o servidor:**
   ```bash
   npm run dev
   ```
   *O servidor estará rodando em http://localhost:3000 e as tabelas serão criadas automaticamente.*

---

### 3. Configuração do Frontend (App)
Abra um terminal na pasta `ElaSegura`:

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Configurar o IP (Importante para Celular):**
   No arquivo `services/api.ts`, certifique-se de que o IP está correto para o seu computador atual.

3. **Iniciar o App:**
   ```bash
   npx expo start
   ```
   *Escaneie o QR Code com o app Expo Go no seu celular.*

---

## 🛠️ Tecnologias
- **Frontend:** React Native (Expo)
- **Backend:** Node.js + Express
- **Banco de Dados:** PostgreSQL (Direto via `pg`)
- **Autenticação:** JWT (JSON Web Token)

## 📌 Observação
Para que o celular consiga falar com o computador, ambos devem estar na **mesma rede Wi-Fi**.
