import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateNoticiaDto {
  @IsNotEmpty({ message: 'O título não pode estar vazio' })
  @IsString({ message: 'O título deve ser uma string' })
  @MaxLength(200, { message: 'O título deve ter no máximo 200 caracteres' })
  titulo: string;

  @IsNotEmpty({ message: 'A descrição não pode estar vazia' })
  @IsString({ message: 'A descrição deve ser uma string' })
  descricao: string;
}
