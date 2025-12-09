import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CacheService } from '../common/cache/cache.service';
import { NoticiasService } from './noticias.service';
import { Noticia } from './entities/noticia.entity';
import { PaginationQueryDto } from './dto/pagination-query.dto';

const createRepositoryMock = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('NoticiasService', () => {
  let service: NoticiasService;
  let repository: ReturnType<typeof createRepositoryMock>;
  let cacheService: CacheService;

  const noticiaBase: Noticia = {
    id: 1,
    titulo: 'Titulo',
    descricao: 'Descricao',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  };

  beforeEach(() => {
    repository = createRepositoryMock();
    cacheService = new CacheService();
    service = new NoticiasService(repository as any, cacheService);
  });

  describe('create', () => {
    it('cria noticia e invalida cache', async () => {
      repository.create.mockReturnValue(noticiaBase);
      repository.save.mockResolvedValue(noticiaBase);
      const invalidateSpy = jest.spyOn(cacheService, 'invalidateByPrefix');

      const result = await service.create({
        titulo: noticiaBase.titulo,
        descricao: noticiaBase.descricao,
      });

      expect(repository.create).toHaveBeenCalledWith({
        titulo: noticiaBase.titulo,
        descricao: noticiaBase.descricao,
      });
      expect(repository.save).toHaveBeenCalledWith(noticiaBase);
      expect(invalidateSpy).toHaveBeenCalledWith('noticias');
      expect(result).toEqual(noticiaBase);
    });

    it('lança InternalServerError ao falhar', async () => {
      repository.create.mockReturnValue(noticiaBase);
      repository.save.mockRejectedValue(new Error('db error'));

      await expect(
        service.create({
          titulo: noticiaBase.titulo,
          descricao: noticiaBase.descricao,
        }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('findAll', () => {
    const pagination: PaginationQueryDto = { page: 2, limit: 5, search: 'a' };

    it('retorna resultado em cache quando existir', async () => {
      const cached = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      const cacheKey = cacheService.generateKey('noticias', {
        page: pagination.page,
        limit: pagination.limit,
        search: pagination.search,
      });
      cacheService.set(cacheKey, cached);

      const result = await service.findAll(pagination);

      expect(result).toBe(cached);
      expect(repository.findAndCount).not.toHaveBeenCalled();
    });

    it('busca no repositório quando cache vazio e grava cache', async () => {
      const data = [noticiaBase];
      repository.findAndCount.mockResolvedValue([data, 1]);
      const cacheSpy = jest.spyOn(cacheService, 'set');

      const result = await service.findAll(pagination);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
          order: { createdAt: 'DESC' },
        }),
      );
      expect(result).toEqual({
        data,
        total: 1,
        page: 2,
        limit: 5,
        totalPages: 1,
      });
      expect(cacheSpy).toHaveBeenCalled();
    });

    it('lança InternalServerError ao falhar', async () => {
      repository.findAndCount.mockRejectedValue(new Error('db error'));

      await expect(service.findAll({})).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('findOne', () => {
    it('retorna noticia existente', async () => {
      repository.findOne.mockResolvedValue(noticiaBase);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(noticiaBase);
    });

    it('lança NotFound quando não encontrar', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(2)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('propaga InternalServerError em falha inesperada', async () => {
      repository.findOne.mockRejectedValue(new Error('db error'));

      await expect(service.findOne(3)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('update', () => {
    it('atualiza noticia e invalida cache', async () => {
      repository.findOne.mockResolvedValue({ ...noticiaBase });
      repository.save.mockResolvedValue({ ...noticiaBase, titulo: 'Novo' });
      const invalidateSpy = jest.spyOn(cacheService, 'invalidateByPrefix');

      const result = await service.update(1, { titulo: 'Novo' });

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ titulo: 'Novo' }),
      );
      expect(invalidateSpy).toHaveBeenCalledWith('noticias');
      expect(result.titulo).toBe('Novo');
    });

    it('propaga NotFound em update', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update(1, { titulo: 'x' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lança InternalServerError em erro inesperado', async () => {
      repository.findOne.mockResolvedValue({ ...noticiaBase });
      repository.save.mockRejectedValue(new Error('db error'));

      await expect(service.update(1, { titulo: 'x' })).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('remove', () => {
    it('remove noticia e invalida cache', async () => {
      repository.findOne.mockResolvedValue({ ...noticiaBase });
      const invalidateSpy = jest.spyOn(cacheService, 'invalidateByPrefix');

      await service.remove(1);

      expect(repository.remove).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1 }),
      );
      expect(invalidateSpy).toHaveBeenCalledWith('noticias');
    });

    it('propaga NotFound em remove', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lança InternalServerError em falha inesperada', async () => {
      repository.findOne.mockResolvedValue({ ...noticiaBase });
      repository.remove.mockRejectedValue(new Error('db error'));

      await expect(service.remove(1)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });
});

