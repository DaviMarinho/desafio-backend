# Prova Backend - NestJS API

## Descrição

API RESTful desenvolvida com NestJS para gerenciamento de notícias (CRUD completo). Utiliza Fastify como servidor HTTP, TypeORM para persistência de dados e PostgreSQL como banco de dados.

## Tecnologias Utilizadas

- **NestJS 11** - Framework Node.js progressivo para construção de aplicações server-side
- **Fastify** - Servidor HTTP de alta performance (2-3x mais rápido que Express)
- **TypeORM 0.3** - ORM (Object-Relational Mapping) para TypeScript e JavaScript
- **PostgreSQL 15** - Banco de dados relacional robusto e confiável
- **Docker & Docker Compose** - Containerização e orquestração de serviços
- **TypeScript** - Linguagem tipada que adiciona tipos estáticos ao JavaScript
- **Class Validator** - Validação declarativa de dados usando decorators
- **Class Transformer** - Transformação de objetos plain para instâncias de classe

## Pré-requisitos

- **Node.js 18+** e npm
- **Docker e Docker Compose** (para execução containerizada)
- **PostgreSQL 15** (se rodar localmente sem Docker)

## Instalação

### 1. Clone o repositório

```bash
git clone <repository-url>
cd prova-backend
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env` e ajuste os valores conforme necessário:

```bash
cp .env.example .env
```

Variáveis disponíveis:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres123
DB_DATABASE=prova_db

# Application Configuration
PORT=3000
NODE_ENV=development
```

## Executando a Aplicação

### Opção 1: Execução Local (com npm)

1. Certifique-se de que o PostgreSQL está rodando
2. Configure as variáveis de ambiente no `.env`
3. Execute o comando:

```bash
# Desenvolvimento (com hot-reload)
npm run start:dev

# Produção
npm run build
npm run start:prod
```

A API estará disponível em `http://localhost:3000`

### Opção 2: Execução com Docker (Recomendado)

```bash
# Construir e iniciar os containers
docker compose up -d

# Ver logs da API
docker compose logs -f api

# Parar os containers
docker compose down

# Parar e remover volumes (limpa o banco de dados)
docker compose down -v
```

A API estará disponível em `http://localhost:3000`
O PostgreSQL estará disponível em `localhost:5432`

## Estrutura do Projeto

```
src/
├── noticias/
│   ├── dto/
│   │   ├── create-noticia.dto.ts      # DTO para criação de notícia
│   │   ├── update-noticia.dto.ts      # DTO para atualização de notícia
│   │   └── pagination-query.dto.ts    # DTO para paginação e busca
│   ├── entities/
│   │   └── noticia.entity.ts          # Entidade TypeORM (schema do banco)
│   ├── noticias.controller.ts         # Controller REST (endpoints HTTP)
│   ├── noticias.service.ts            # Service (lógica de negócio)
│   └── noticias.module.ts             # Module (configuração do módulo)
├── app.controller.ts                   # Controller principal da aplicação
├── app.module.ts                       # Module raiz da aplicação
├── app.service.ts                      # Service principal da aplicação
└── main.ts                             # Entry point da aplicação
```

### Justificativa da Estrutura

A estrutura segue o padrão de **arquitetura modular** do NestJS:

- **Separação de responsabilidades**: Cada módulo gerencia seu próprio domínio (noticias)
- **Reutilização**: Módulos podem ser facilmente importados e reutilizados
- **Testabilidade**: Facilita testes unitários e de integração
- **Manutenibilidade**: Código organizado e fácil de navegar
- **Escalabilidade**: Adicionar novos módulos é simples e não afeta os existentes

## API Endpoints

### Base URL: `http://localhost:3000`

---

### 1. Criar Notícia

**POST** `/noticias`

Cria uma nova notícia no sistema.

**Body:**

```json
{
  "titulo": "Título da notícia",
  "descricao": "Descrição detalhada da notícia"
}
```

**Response (201 Created):**

```json
{
  "id": 1,
  "titulo": "Título da notícia",
  "descricao": "Descrição detalhada da notícia",
  "createdAt": "2025-12-09T10:30:00.000Z",
  "updatedAt": "2025-12-09T10:30:00.000Z"
}
```

**Validações:**

- `titulo`: Obrigatório, string, máximo 200 caracteres
- `descricao`: Obrigatório, string

**Possíveis Erros:**

- **400 Bad Request**: Dados inválidos (campos faltando ou violando validações)

---

### 2. Listar Notícias (com paginação e busca)

**GET** `/noticias?page=1&limit=10&search=termo`

Lista todas as notícias com suporte a paginação e busca.

**Query Parameters:**

- `page` (opcional): Número da página (padrão: 1, mínimo: 1)
- `limit` (opcional): Itens por página (padrão: 10, mínimo: 1, máximo: 100)
- `search` (opcional): Termo de busca (busca em título e descrição, case-insensitive)

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": 1,
      "titulo": "Título da notícia",
      "descricao": "Descrição detalhada da notícia",
      "createdAt": "2025-12-09T10:30:00.000Z",
      "updatedAt": "2025-12-09T10:30:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

**Exemplos:**

```bash
# Listar todas (primeira página, 10 itens)
curl http://localhost:3000/noticias

# Página 2 com 5 itens
curl "http://localhost:3000/noticias?page=2&limit=5"

# Buscar notícias com termo "tecnologia"
curl "http://localhost:3000/noticias?search=tecnologia"
```

---

### 3. Buscar Notícia por ID

**GET** `/noticias/:id`

Busca uma notícia específica pelo ID.

**Response (200 OK):**

```json
{
  "id": 1,
  "titulo": "Título da notícia",
  "descricao": "Descrição detalhada da notícia",
  "createdAt": "2025-12-09T10:30:00.000Z",
  "updatedAt": "2025-12-09T10:30:00.000Z"
}
```

**Possíveis Erros:**

- **404 Not Found**: Notícia com o ID especificado não foi encontrada
- **400 Bad Request**: ID inválido (não é um número inteiro)

---

### 4. Atualizar Notícia

**PATCH** `/noticias/:id`

Atualiza uma notícia existente (atualização parcial).

**Body (campos opcionais):**

```json
{
  "titulo": "Novo título",
  "descricao": "Nova descrição"
}
```

**Response (200 OK):**

```json
{
  "id": 1,
  "titulo": "Novo título",
  "descricao": "Nova descrição",
  "createdAt": "2025-12-09T10:30:00.000Z",
  "updatedAt": "2025-12-09T10:35:00.000Z"
}
```

**Possíveis Erros:**

- **404 Not Found**: Notícia com o ID especificado não foi encontrada
- **400 Bad Request**: Dados inválidos ou ID inválido

---

### 5. Deletar Notícia

**DELETE** `/noticias/:id`

Remove uma notícia do sistema.

**Response (204 No Content):** Sem conteúdo no body

**Possíveis Erros:**

- **404 Not Found**: Notícia com o ID especificado não foi encontrada
- **400 Bad Request**: ID inválido (não é um número inteiro)

---

## Decisões Técnicas

### Por que Fastify?

**Performance Superior:**

- 2-3x mais rápido que Express em benchmarks
- Menor uso de memória e sobrecarga
- Otimizado para alto throughput

**Recursos Modernos:**

- Suporte nativo a async/await
- Validação e serialização JSON baseada em schema
- Sistema de plugins robusto
- Logging estruturado integrado

### Por que TypeORM?

**Integração com TypeScript:**

- Totalmente tipado e type-safe
- Autocomplete e IntelliSense completo
- Detecta erros em tempo de compilação

**Recursos Avançados:**

- Suporte a Active Record e Data Mapper patterns
- Migrations para controle de versão do schema
- Query Builder fluente para queries complexas
- Suporte a relacionamentos e transações
- Logging de queries para debugging

### Arquitetura Modular

**Separação de Responsabilidades:**

- Cada módulo gerencia seu próprio domínio
- DTOs para validação e transformação de dados
- Services para lógica de negócio
- Controllers para endpoints HTTP

**Benefícios:**

- **Testabilidade**: Facilita testes unitários e de integração
- **Reutilização**: Módulos podem ser importados em outros projetos
- **Manutenibilidade**: Código organizado e fácil de entender
- **Escalabilidade**: Adicionar novos recursos é simples e não afeta código existente

### Validação Global

**ValidationPipe configurado globalmente:**

- `whitelist: true` - Remove propriedades não decoradas automaticamente
- `forbidNonWhitelisted: true` - Retorna erro se propriedades extras forem enviadas
- `transform: true` - Transforma payloads para tipos corretos (string → number, etc)

**Segurança:**

- Previne ataques de mass assignment
- Valida todos os inputs automaticamente
- Mensagens de erro claras em português

## Comandos Úteis

```bash
# Desenvolvimento
npm run start:dev          # Inicia em modo desenvolvimento (hot-reload)

# Build
npm run build              # Compila o projeto TypeScript

# Produção
npm run start:prod         # Inicia em modo produção

# Testes
npm run test               # Executa testes unitários
npm run test:watch         # Testes em modo watch
npm run test:cov           # Testes com cobertura
npm run test:e2e           # Testes end-to-end

# Linting
npm run lint               # Verifica problemas de código

# Formatação
npm run format             # Formata código com Prettier

# Docker
docker compose up -d                    # Iniciar containers em background
docker compose down                     # Parar containers
docker compose logs -f api              # Ver logs da API em tempo real
docker compose exec api sh              # Acessar shell do container da API
docker compose exec postgres psql -U postgres -d prova_db  # Acessar PostgreSQL
docker compose restart api              # Reiniciar apenas a API
docker compose build --no-cache         # Rebuild forçado sem cache
```

## Validações Implementadas

### CreateNoticiaDto

- **titulo**:
  - Obrigatório (`@IsNotEmpty`)
  - Deve ser string (`@IsString`)
  - Máximo 200 caracteres (`@MaxLength(200)`)
- **descricao**:
  - Obrigatório (`@IsNotEmpty`)
  - Deve ser string (`@IsString`)

### UpdateNoticiaDto

- Todos os campos opcionais (usa `PartialType`)
- Mesmas validações do CreateNoticiaDto quando fornecidos

### PaginationQueryDto

- **page**:
  - Opcional
  - Inteiro (`@IsInt`)
  - Mínimo 1 (`@Min(1)`)
  - Padrão: 1
- **limit**:
  - Opcional
  - Inteiro (`@IsInt`)
  - Mínimo 1, máximo 100 (`@Min(1)`, `@Max(100)`)
  - Padrão: 10
- **search**:
  - Opcional
  - String (`@IsString`)

## Tratamento de Erros

A API implementa tratamento de erros consistente:

- **400 Bad Request**: Dados de entrada inválidos (validação falhou)
- **404 Not Found**: Recurso não encontrado
- **500 Internal Server Error**: Erro interno do servidor

Todas as mensagens de erro estão em **português** para melhor experiência do usuário.

**Exemplo de erro de validação:**

```json
{
  "statusCode": 400,
  "message": [
    "O título não pode estar vazio",
    "A descrição não pode estar vazia"
  ],
  "error": "Bad Request"
}
```

**Exemplo de erro 404:**

```json
{
  "statusCode": 404,
  "message": "Notícia com ID 999 não encontrada",
  "error": "Not Found"
}
```

## Banco de Dados

### Schema da tabela `noticias`

| Campo       | Tipo         | Constraints                   |
| ----------- | ------------ | ----------------------------- |
| id          | SERIAL       | PRIMARY KEY                   |
| titulo      | VARCHAR(200) | NOT NULL                      |
| descricao   | TEXT         | NOT NULL                      |
| created_at  | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP     |
| updated_at  | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP     |

### Sincronização Automática

- **Desenvolvimento**: `synchronize: true` (TypeORM cria/atualiza tabelas automaticamente)
- **Produção**: Recomendado usar migrations (desabilitar synchronize)

### Acessando o banco diretamente

```bash
# Via Docker
docker compose exec postgres psql -U postgres -d prova_db

# Comandos úteis PostgreSQL
\dt                    # Listar tabelas
\d noticias           # Descrever estrutura da tabela
SELECT * FROM noticias;  # Ver todas as notícias
```

## Testando a API

### Usando cURL

```bash
# Criar notícia
curl -X POST http://localhost:3000/noticias \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Primeira notícia","descricao":"Esta é a primeira notícia de teste"}'

# Listar notícias
curl http://localhost:3000/noticias

# Buscar por ID
curl http://localhost:3000/noticias/1

# Atualizar
curl -X PATCH http://localhost:3000/noticias/1 \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Notícia Atualizada"}'

# Deletar
curl -X DELETE http://localhost:3000/noticias/1

# Paginação
curl "http://localhost:3000/noticias?page=1&limit=5"

# Busca
curl "http://localhost:3000/noticias?search=primeira"
```

### Usando HTTP Client (VSCode REST Client, Postman, Insomnia)

Importe a collection ou crie requests com os endpoints acima.

## Melhorias Futuras

- [ ] Implementar autenticação e autorização (JWT)
- [ ] Adicionar testes unitários e E2E completos
- [ ] Implementar rate limiting para prevenir abuso
- [ ] Adicionar documentação Swagger/OpenAPI
- [ ] Implementar soft delete (deleção lógica)
- [ ] Adicionar cache com Redis
- [ ] Implementar logs estruturados (Winston, Pino)
- [ ] Adicionar health check endpoint
- [ ] Implementar migrations TypeORM
- [ ] Adicionar CI/CD pipeline
- [ ] Implementar upload de imagens para notícias
- [ ] Adicionar categorias e tags para notícias

## Licença

UNLICENSED

---

**Desenvolvido com NestJS e Fastify**
