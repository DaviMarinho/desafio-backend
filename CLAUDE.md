# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NestJS 11 REST API for managing news articles (notícias) with PostgreSQL database, TypeORM, Fastify HTTP server, and in-memory caching. Uses Docker for containerization.

**Tech Stack:** NestJS 11, Fastify, TypeORM 0.3, PostgreSQL 15, TypeScript, Docker

## Essential Commands

### Development
```bash
npm run start:dev           # Start with hot-reload (requires PostgreSQL running)
npm run build               # Compile TypeScript
npm run start:prod          # Start production build
```

### Testing
```bash
npm run test:e2e            # Run E2E tests (requires PostgreSQL)
npm run test                # Run unit tests
npm run test:watch          # Unit tests in watch mode
npm run test:cov            # Tests with coverage report
```

**Important:** E2E tests require PostgreSQL to be running. Start database first:
```bash
docker compose up -d postgres
npm run test:e2e
```

### Docker Operations
```bash
docker compose up -d                    # Start all services (API + PostgreSQL)
docker compose down                     # Stop all services
docker compose down -v                  # Stop and remove data volumes
docker compose logs -f api              # Follow API logs
docker compose exec postgres psql -U postgres -d prova_db  # Access database
```

### Code Quality
```bash
npm run lint                # ESLint with auto-fix
npm run format              # Prettier formatting
```

## Architecture

### NestJS Modular Structure

The application follows **NestJS modular architecture** with clear separation of concerns:

- **Modules**: Self-contained feature units (`NoticiasModule`, `CacheModule`)
- **Controllers**: HTTP endpoints and request handling
- **Services**: Business logic and data operations
- **DTOs**: Request/response validation and transformation
- **Entities**: TypeORM database models

### Key Architectural Patterns

1. **Global Validation Pipeline** (`src/main.ts`):
   - `whitelist: true` - strips unknown properties
   - `forbidNonWhitelisted: true` - rejects extra properties
   - `transform: true` - auto-converts types (e.g., string "1" → number 1)
   - Applied globally to ALL endpoints

2. **Fastify Adapter** (not Express):
   - Created via `new FastifyAdapter()` in `main.ts`
   - 2-3x faster than Express
   - Server binds to `0.0.0.0` for Docker compatibility

3. **TypeORM Configuration** (`src/app.module.ts`):
   - Async configuration using `ConfigService`
   - `synchronize: true` only in development (auto-creates tables)
   - `autoLoadEntities: true` - automatically discovers entities
   - Connection retries on startup failure

### Cache System Architecture

**Location:** `src/common/cache/`

The cache is implemented as a **global module** with in-memory Map storage:

- **CacheService**: Provides `get()`, `set()`, `invalidateByPrefix()`, `generateKey()`
- **Default TTL**: 5 minutes (300 seconds)
- **Invalidation Strategy**: Prefix-based (e.g., all keys starting with `"noticias:"`)
- **Global Module**: Available throughout app without explicit imports

**Cache Integration Pattern:**
```typescript
// 1. Generate cache key from query parameters
const cacheKey = this.cacheService.generateKey('prefix', { page, limit, search });

// 2. Check cache before database query
const cached = this.cacheService.get(cacheKey);
if (cached) return cached;

// 3. Execute query and store result
const result = await this.repository.findAndCount(...);
this.cacheService.set(cacheKey, result);

// 4. Invalidate on write operations
this.cacheService.invalidateByPrefix('prefix'); // in create/update/delete
```

**Current Implementation:**
- `NoticiasService.findAll()` uses cache for paginated listings
- Cache invalidated on `create()`, `update()`, `remove()` operations
- Cache is process-local (not shared between instances)

### Database Schema

**Table:** `noticias`

| Column      | Type         | Constraints |
|-------------|--------------|-------------|
| id          | SERIAL       | PRIMARY KEY |
| titulo      | VARCHAR(200) | NOT NULL    |
| descricao   | TEXT         | NOT NULL    |
| created_at  | TIMESTAMP    | AUTO        |
| updated_at  | TIMESTAMP    | AUTO        |

**Important Notes:**
- TypeORM auto-creates/updates schema in development mode
- Production should use migrations (not implemented yet)
- Timestamps managed automatically by `@CreateDateColumn` and `@UpdateDateColumn`

## Testing Patterns

### E2E Test Structure (`test/noticias.e2e-spec.ts`)

Tests follow **BDD (Behavior-Driven Development)** style with Given/When/Then pattern:

```typescript
describe('Cenário: Description of scenario', () => {
  it('Given X, When Y, Then Z', async () => {
    // Given - Setup test data
    const data = { ... };

    // When - Execute action
    const response = await request(app.getHttpServer())
      .post('/endpoint')
      .send(data);

    // Then - Verify expectations
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');

    // And - Additional verification
    const saved = await repository.find();
    expect(saved).toHaveLength(1);
  });
});
```

**Test Setup Requirements:**
- Each test initializes full `AppModule` (integration test)
- Applies same `ValidationPipe` configuration as production
- Clears database before each test (`repository.clear()`)
- Closes app after each test to prevent connection leaks

**Running Specific Tests:**
```bash
npm run test:e2e -- noticias.e2e-spec     # Only news tests
npm run test:e2e -- --verbose             # Detailed output
```

## Configuration

**Environment Variables** (`.env`):
```
DB_HOST=localhost        # Use 'postgres' when running in Docker
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres123
DB_DATABASE=prova_db
PORT=3001
NODE_ENV=development     # Controls TypeORM synchronize & logging
FRONTEND_URL=http://localhost:3000  # For CORS configuration
```

**Database Connection:**
- Local development: `DB_HOST=localhost` (PostgreSQL on host)
- Docker Compose: `DB_HOST=postgres` (service name in docker-compose.yml)
- E2E tests: Use localhost (tests run on host, not in container)

**CORS Configuration:**
- Backend accepts requests from `FRONTEND_URL` (default: `http://localhost:3001`)
- Configured in `src/main.ts` with Fastify CORS plugin
- Allows credentials and common HTTP methods

## Common Patterns When Adding Features

### Adding a New Module

1. Generate module structure:
   ```bash
   nest generate module features/feature-name
   nest generate controller features/feature-name
   nest generate service features/feature-name
   ```

2. Create DTOs with validation:
   ```typescript
   import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

   export class CreateFeatureDto {
     @IsNotEmpty({ message: 'Campo não pode estar vazio' })
     @IsString({ message: 'Campo deve ser string' })
     @MaxLength(200, { message: 'Máximo 200 caracteres' })
     field: string;
   }
   ```

3. Create TypeORM entity:
   ```typescript
   import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

   @Entity('table_name')
   export class FeatureEntity {
     @PrimaryGeneratedColumn()
     id: number;

     @Column({ type: 'varchar', length: 200, nullable: false })
     field: string;

     @CreateDateColumn({ name: 'created_at' })
     createdAt: Date;
   }
   ```

4. Register entity in module:
   ```typescript
   import { TypeOrmModule } from '@nestjs/typeorm';

   @Module({
     imports: [TypeOrmModule.forFeature([FeatureEntity])],
     // ...
   })
   ```

### Using Cache in New Services

```typescript
import { CacheService } from '../common/cache/cache.service';

@Injectable()
export class YourService {
  private readonly CACHE_PREFIX = 'your-feature';

  constructor(
    @InjectRepository(Entity)
    private repository: Repository<Entity>,
    private cacheService: CacheService, // Auto-injected (global module)
  ) {}

  async findAll(params: QueryDto) {
    // Check cache
    const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, params);
    const cached = this.cacheService.get(cacheKey);
    if (cached) return cached;

    // Query database
    const result = await this.repository.find(...);

    // Store in cache
    this.cacheService.set(cacheKey, result);
    return result;
  }

  async create(dto: CreateDto) {
    const entity = await this.repository.save(...);

    // Invalidate all cached queries for this feature
    this.cacheService.invalidateByPrefix(this.CACHE_PREFIX);

    return entity;
  }
}
```

## API Endpoints Reference

**Base URL:** `http://localhost:3001`

| Method | Endpoint         | Description                    | Status Codes       |
|--------|------------------|--------------------------------|--------------------|
| POST   | /noticias        | Create news article            | 201, 400           |
| GET    | /noticias        | List with pagination & search  | 200                |
| GET    | /noticias/:id    | Get by ID                      | 200, 404           |
| PATCH  | /noticias/:id    | Partial update                 | 200, 400, 404      |
| DELETE | /noticias/:id    | Delete article                 | 204, 404           |

**Query Parameters for GET /noticias:**
- `page` (optional, default: 1, min: 1)
- `limit` (optional, default: 10, min: 1, max: 100)
- `search` (optional) - searches in both `titulo` and `descricao` fields (case-insensitive)

**Response Format for Paginated Lists:**
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

## Important Constraints

1. **Error Messages in Portuguese**: All validation messages use Portuguese (see DTOs)
2. **Fastify, Not Express**: Don't assume Express middleware patterns
3. **TypeORM 0.3 Syntax**: Uses newer syntax (e.g., `ILike()` for case-insensitive search)
4. **Docker Required for Full Testing**: E2E tests need PostgreSQL running
5. **No Migrations**: Schema sync is automatic in dev mode (not production-ready)
6. **In-Memory Cache**: Not persistent, not distributed (single process only)

## Integration with Frontend

This backend integrates with the React frontend in `../prova-frontend`.

**Running Integrated Stack:**
```bash
# From project root (desafio/)
docker-compose up

# Or locally
cd ../
docker-compose up -d postgres  # Start database
cd prova-backend
npm run start:dev              # Start backend on port 3001
# In another terminal
cd prova-frontend
npm start                      # Start frontend on port 3000
```

**Key Integration Points:**
- Frontend runs on port 3000, backend on port 3001
- CORS configured to accept requests from `http://localhost:3000`
- Backend returns paginated responses with structure: `{ data, total, page, limit, totalPages }`
- All validation errors returned in Portuguese
- No authentication implemented (frontend sends fake token)

## Troubleshooting

**"Cannot connect to database" during tests:**
- Start PostgreSQL: `docker compose up -d postgres`
- Check `.env` has `DB_HOST=localhost` (not `postgres`)

**Port 3001 already in use:**
- Change `PORT` to another value in `.env`
- Or kill existing process: `lsof -ti:3001 | xargs kill -9`

**Tests timeout:**
- Database connection is slow or failed
- Increase Jest timeout in test file: `jest.setTimeout(10000)`

**TypeORM synchronize not working:**
- Check `NODE_ENV=development` in `.env`
- Verify entity is registered in module's `TypeOrmModule.forFeature([])`

**CORS errors from frontend:**
- Verify `FRONTEND_URL` in `.env` matches frontend port
- Check if frontend is using correct `REACT_APP_API_URL`
- Restart backend after changing CORS configuration
