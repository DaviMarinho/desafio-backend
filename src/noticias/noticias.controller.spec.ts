import { Test, TestingModule } from '@nestjs/testing';
import { NoticiasController } from './noticias.controller';
import { NoticiasService } from './noticias.service';
import { CreateNoticiaDto } from './dto/create-noticia.dto';
import { UpdateNoticiaDto } from './dto/update-noticia.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

describe('NoticiasController', () => {
  let controller: NoticiasController;
  let service: jest.Mocked<NoticiasService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NoticiasController],
      providers: [
        {
          provide: NoticiasService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<NoticiasController>(NoticiasController);
    service = module.get(NoticiasService);
  });

  it('cria noticia', async () => {
    const dto: CreateNoticiaDto = { titulo: 't', descricao: 'd' };
    service.create.mockResolvedValue({ id: 1, ...dto } as any);

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 1, ...dto });
  });

  it('lista noticias com query', async () => {
    const query: PaginationQueryDto = { page: 2, limit: 5, search: 'x' };
    service.findAll.mockResolvedValue('ok' as any);

    const result = await controller.findAll(query);

    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result).toBe('ok');
  });

  it('retorna noticia por id', async () => {
    service.findOne.mockResolvedValue('item' as any);

    const result = await controller.findOne(10);

    expect(service.findOne).toHaveBeenCalledWith(10);
    expect(result).toBe('item');
  });

  it('atualiza noticia', async () => {
    const dto: UpdateNoticiaDto = { titulo: 'novo' };
    service.update.mockResolvedValue('upd' as any);

    const result = await controller.update(1, dto);

    expect(service.update).toHaveBeenCalledWith(1, dto);
    expect(result).toBe('upd');
  });

  it('remove noticia', async () => {
    service.remove.mockResolvedValue(undefined);

    await controller.remove(3);

    expect(service.remove).toHaveBeenCalledWith(3);
  });
});

