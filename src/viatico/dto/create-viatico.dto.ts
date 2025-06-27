import { IsOptional, IsDateString, IsString } from 'class-validator';

export class CreateViaticoDto {

    @IsOptional()
    @IsDateString()
    fechaInicio?: string;

    @IsOptional()
    @IsDateString()
    fechaFin?: string;

    @IsOptional()
    @IsString()
    filtroFolio?: string;
}
