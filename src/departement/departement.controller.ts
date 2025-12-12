import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { DepartementService } from './departement.service';
import { CreateDepartementDto } from './dto/create-departement.dto';
import { UpdateDepartementDto } from './dto/update-departement.dto';

@Controller('departements')
export class DepartementController {
  constructor(private readonly departementService: DepartementService) {}

  @Post()
  create(@Body() dto: CreateDepartementDto) {
    return this.departementService.create(dto);
  }

  @Get()
  findAll() {
    return this.departementService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.departementService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDepartementDto) {
    return this.departementService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.departementService.remove(id);
  }
}
