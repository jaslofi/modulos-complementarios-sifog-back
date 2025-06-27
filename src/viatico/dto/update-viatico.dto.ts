import { PartialType } from '@nestjs/mapped-types';
import { CreateViaticoDto } from './create-viatico.dto';

export class UpdateViaticoDto extends PartialType(CreateViaticoDto) {}
