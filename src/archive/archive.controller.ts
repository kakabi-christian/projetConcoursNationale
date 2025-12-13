import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { ArchiveService } from './archive.service';
import { CreateArchiveDto } from './dto/create-archive.dto';
import { UpdateArchiveDto } from './dto/update-archive.dto';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('archives')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ArchiveController {
  constructor(private readonly archiveService: ArchiveService) {}

  @Post('upload')
  @Permissions('creer_archive')
  @UseInterceptors(
    FileInterceptor('file', {
    storage: diskStorage({
      destination: join(process.cwd(), 'uploads'), // ✅ dossier public
      filename: (req, file, cb) => {
        const uniqueSuffix = uuidv4() + extname(file.originalname);
        cb(null, uniqueSuffix);
      },
    }),
  }),
    
  )
  
  async uploadArchive(
    @UploadedFile() file: Express.Multer.File,
    @Body() createArchiveDto: CreateArchiveDto,
  ) {
    // fileUrl correspond à l'URL publique
    createArchiveDto.fileUrl = `/uploads/${file.filename}`;
    return this.archiveService.create(createArchiveDto);
  }

  @Get()
  @Public()
  findAll() {
    return this.archiveService.findAll();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.archiveService.findOne(id);
  }

  @Patch(':id')
  @Permissions('modifier_archive')
  update(@Param('id') id: string, @Body() updateArchiveDto: UpdateArchiveDto) {
    return this.archiveService.update(id, updateArchiveDto);
  }

  @Delete(':id')
  @Permissions('supprimer_archive')
  remove(@Param('id') id: string) {
    return this.archiveService.remove(id);
  }

  @Get('epreuve/:id')
  @Public()
  findByEpreuve(@Param('id') id: string) {
    return this.archiveService.findByEpreuve(id);
  }
}
