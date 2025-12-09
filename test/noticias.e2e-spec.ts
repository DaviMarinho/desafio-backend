import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Noticia } from '../src/noticias/entities/noticia.entity';
import { Repository } from 'typeorm';

describe('Notícias API (e2e) - BDD Style', () => {
  let app: INestApplication<App>;
  let noticiaRepository: Repository<Noticia>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same configuration as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Get repository reference for cleanup
    noticiaRepository = moduleFixture.get<Repository<Noticia>>(
      getRepositoryToken(Noticia),
    );

    // Clear database before each test
    await noticiaRepository.clear();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Criação de Notícias - POST /noticias', () => {
    describe('Cenário: Criação de notícia com dados válidos', () => {
      it('Given que tenho dados válidos de uma notícia, When eu envio uma requisição POST, Then a notícia deve ser criada com sucesso', async () => {
        // Given - Dados válidos preparados
        const noticiaValida = {
          titulo: 'Teste de Notícia BDD',
          descricao: 'Esta é uma descrição válida para teste BDD',
        };

        // When - Envio requisição POST
        const response = await request(app.getHttpServer())
          .post('/noticias')
          .send(noticiaValida);

        // Then - Verifico resposta e dados retornados
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.titulo).toBe(noticiaValida.titulo);
        expect(response.body.descricao).toBe(noticiaValida.descricao);
        expect(response.body).toHaveProperty('createdAt');
        expect(response.body).toHaveProperty('updatedAt');

        // And - Verifico que foi persistido no banco
        const noticiasSalvas = await noticiaRepository.find();
        expect(noticiasSalvas).toHaveLength(1);
        expect(noticiasSalvas[0].titulo).toBe(noticiaValida.titulo);
      });
    });

    describe('Cenário: Tentativa de criação com título vazio', () => {
      it('Given que o título está vazio, When eu envio uma requisição POST, Then devo receber erro 400 de validação', async () => {
        // Given - Dados inválidos: título vazio
        const noticiaTituloVazio = {
          titulo: '',
          descricao: 'Descrição válida',
        };

        // When - Envio requisição POST
        const response = await request(app.getHttpServer())
          .post('/noticias')
          .send(noticiaTituloVazio);

        // Then - Verifico erro de validação
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(Array.isArray(response.body.message)).toBe(true);
        expect(response.body.message).toEqual(
          expect.arrayContaining([
            expect.stringContaining('título não pode estar vazio'),
          ]),
        );

        // And - Verifico que nada foi persistido
        const noticiasSalvas = await noticiaRepository.find();
        expect(noticiasSalvas).toHaveLength(0);
      });
    });

    describe('Cenário: Tentativa de criação com descrição vazia', () => {
      it('Given que a descrição está vazia, When eu envio uma requisição POST, Then devo receber erro 400 de validação', async () => {
        // Given - Dados inválidos: descrição vazia
        const noticiaDescricaoVazia = {
          titulo: 'Título válido',
          descricao: '',
        };

        // When - Envio requisição POST
        const response = await request(app.getHttpServer())
          .post('/noticias')
          .send(noticiaDescricaoVazia);

        // Then - Verifico erro de validação
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(Array.isArray(response.body.message)).toBe(true);
        expect(response.body.message).toEqual(
          expect.arrayContaining([
            expect.stringContaining('descrição não pode estar vazia'),
          ]),
        );

        // And - Verifico que nada foi persistido
        const noticiasSalvas = await noticiaRepository.find();
        expect(noticiasSalvas).toHaveLength(0);
      });
    });

    describe('Cenário: Tentativa de criação com título excedendo 200 caracteres', () => {
      it('Given que o título tem mais de 200 caracteres, When eu envio uma requisição POST, Then devo receber erro 400 de validação', async () => {
        // Given - Dados inválidos: título com 201 caracteres
        const tituloLongo = 'A'.repeat(201);
        const noticiaTituloLongo = {
          titulo: tituloLongo,
          descricao: 'Descrição válida',
        };

        // When - Envio requisição POST
        const response = await request(app.getHttpServer())
          .post('/noticias')
          .send(noticiaTituloLongo);

        // Then - Verifico erro de validação
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(Array.isArray(response.body.message)).toBe(true);
        expect(response.body.message).toEqual(
          expect.arrayContaining([
            expect.stringContaining('título deve ter no máximo 200 caracteres'),
          ]),
        );

        // And - Verifico que nada foi persistido
        const noticiasSalvas = await noticiaRepository.find();
        expect(noticiasSalvas).toHaveLength(0);
      });
    });

    describe('Cenário: Tentativa de criação com campos ausentes', () => {
      it('Given que não envio título nem descrição, When eu envio uma requisição POST, Then devo receber múltiplos erros 400 de validação', async () => {
        // Given - Dados inválidos: objeto vazio
        const noticiaVazia = {};

        // When - Envio requisição POST
        const response = await request(app.getHttpServer())
          .post('/noticias')
          .send(noticiaVazia);

        // Then - Verifico múltiplos erros de validação
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(Array.isArray(response.body.message)).toBe(true);
        expect(response.body.message.length).toBeGreaterThanOrEqual(2);

        // And - Verifico que nada foi persistido
        const noticiasSalvas = await noticiaRepository.find();
        expect(noticiasSalvas).toHaveLength(0);
      });
    });
  });

  describe('Listagem de Notícias - GET /noticias', () => {
    describe('Cenário: Listagem com cache funcionando', () => {
      it('Given que existem notícias cadastradas, When faço duas requisições idênticas, Then a segunda deve retornar do cache', async () => {
        // Given - Criar notícia no banco
        const noticia = noticiaRepository.create({
          titulo: 'Notícia para teste de cache',
          descricao: 'Descrição para teste de cache',
        });
        await noticiaRepository.save(noticia);

        // When - Primeira requisição
        const response1 = await request(app.getHttpServer())
          .get('/noticias')
          .query({ page: 1, limit: 10 });

        // Then - Primeira requisição bem sucedida
        expect(response1.status).toBe(200);
        expect(response1.body.data).toHaveLength(1);

        // When - Segunda requisição com mesmos parâmetros
        const response2 = await request(app.getHttpServer())
          .get('/noticias')
          .query({ page: 1, limit: 10 });

        // Then - Resultados devem ser idênticos
        expect(response2.status).toBe(200);
        expect(response2.body).toEqual(response1.body);
      });
    });

    describe('Cenário: Invalidação de cache após criação', () => {
      it('Given que tenho cache populado, When crio uma nova notícia, Then o cache deve ser invalidado', async () => {
        // Given - Cache populado com listagem
        await request(app.getHttpServer())
          .get('/noticias')
          .query({ page: 1, limit: 10 });

        const contadorInicial = (await noticiaRepository.find()).length;

        // When - Criar nova notícia
        await request(app.getHttpServer())
          .post('/noticias')
          .send({
            titulo: 'Nova notícia',
            descricao: 'Nova descrição',
          });

        // Then - Listagem deve refletir nova notícia
        const responseListagem = await request(app.getHttpServer())
          .get('/noticias')
          .query({ page: 1, limit: 10 });

        expect(responseListagem.status).toBe(200);
        expect(responseListagem.body.data).toHaveLength(contadorInicial + 1);
      });
    });
  });
});
