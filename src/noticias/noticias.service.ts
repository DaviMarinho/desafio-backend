import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Noticia } from './entities/noticia.entity';
import { CreateNoticiaDto } from './dto/create-noticia.dto';
import { UpdateNoticiaDto } from './dto/update-noticia.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { CacheService } from '../common/cache/cache.service';

@Injectable()
export class NoticiasService {
  private readonly CACHE_PREFIX = 'noticias';

  constructor(
    @InjectRepository(Noticia)
    private readonly noticiaRepository: Repository<Noticia>,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Creates a new noticia
   */
  async create(createNoticiaDto: CreateNoticiaDto): Promise<Noticia> {
    try {
      const noticia = this.noticiaRepository.create(createNoticiaDto);
      const result = await this.noticiaRepository.save(noticia);

      // Invalidate cache on create
      this.cacheService.invalidateByPrefix(this.CACHE_PREFIX);

      return result;
    } catch (error) {
      throw new InternalServerErrorException(
        'Erro ao criar notícia',
        error.message,
      );
    }
  }

  /**
   * Finds all noticias with pagination and optional search
   */
  async findAll(paginationQuery: PaginationQueryDto) {
    const { page = 1, limit = 10, search } = paginationQuery;

    // Generate cache key based on parameters
    const cacheKey = this.cacheService.generateKey(this.CACHE_PREFIX, {
      page,
      limit,
      search: search || 'all',
    });

    // Try to get from cache
    const cachedResult = this.cacheService.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // If not in cache, fetch from database
    const skip = (page - 1) * limit;

    try {
      // Build where clause for search
      const whereClause = search
        ? [
            { titulo: ILike(`%${search}%`) },
            { descricao: ILike(`%${search}%`) },
          ]
        : {};

      // Execute query with pagination
      const [data, total] = await this.noticiaRepository.findAndCount({
        where: whereClause,
        skip,
        take: limit,
        order: {
          createdAt: 'DESC', // Most recent first
        },
      });

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      const result = {
        data,
        total,
        page,
        limit,
        totalPages,
      };

      // Store in cache
      this.cacheService.set(cacheKey, result);

      return result;
    } catch (error) {
      throw new InternalServerErrorException(
        'Erro ao buscar notícias',
        error.message,
      );
    }
  }

  /**
   * Finds a single noticia by id
   */
  async findOne(id: number): Promise<Noticia> {
    try {
      const noticia = await this.noticiaRepository.findOne({
        where: { id },
      });

      if (!noticia) {
        throw new NotFoundException(`Notícia com ID ${id} não encontrada`);
      }

      return noticia;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erro ao buscar notícia',
        error.message,
      );
    }
  }

  /**
   * Updates a noticia by id
   */
  async update(
    id: number,
    updateNoticiaDto: UpdateNoticiaDto,
  ): Promise<Noticia> {
    try {
      // Check if exists
      const noticia = await this.findOne(id);

      // Update fields
      Object.assign(noticia, updateNoticiaDto);

      // Save and return
      const result = await this.noticiaRepository.save(noticia);

      // Invalidate cache on update
      this.cacheService.invalidateByPrefix(this.CACHE_PREFIX);

      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erro ao atualizar notícia',
        error.message,
      );
    }
  }

  /**
   * Removes a noticia by id
   */
  async remove(id: number): Promise<void> {
    try {
      // Check if exists (throws NotFoundException if not found)
      const noticia = await this.findOne(id);

      // Remove
      await this.noticiaRepository.remove(noticia);

      // Invalidate cache on remove
      this.cacheService.invalidateByPrefix(this.CACHE_PREFIX);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erro ao remover notícia',
        error.message,
      );
    }
  }
}
