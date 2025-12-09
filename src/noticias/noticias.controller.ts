import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { NoticiasService } from './noticias.service';
import { CreateNoticiaDto } from './dto/create-noticia.dto';
import { UpdateNoticiaDto } from './dto/update-noticia.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Controller('noticias')
export class NoticiasController {
  constructor(private readonly noticiasService: NoticiasService) {}

  /**
   * POST /noticias - Create a new noticia
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createNoticiaDto: CreateNoticiaDto) {
    return this.noticiasService.create(createNoticiaDto);
  }

  /**
   * GET /noticias - Get all noticias with pagination and search
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.noticiasService.findAll(paginationQuery);
  }

  /**
   * GET /noticias/:id - Get a single noticia by id
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.noticiasService.findOne(id);
  }

  /**
   * PATCH /noticias/:id - Update a noticia by id
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNoticiaDto: UpdateNoticiaDto,
  ) {
    return this.noticiasService.update(id, updateNoticiaDto);
  }

  /**
   * DELETE /noticias/:id - Remove a noticia by id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.noticiasService.remove(id);
  }
}
