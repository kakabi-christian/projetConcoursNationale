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
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiConsumes, 
  ApiBody, 
  ApiBearerAuth, 
  ApiQuery, 
  ApiParam, 
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import express from 'express'; // ✅ IMPORT CRUCIAL
import { ArchiveService } from './archive.service';
import { CreateArchiveDto } from './dto/create-archive.dto';
import { UpdateArchiveDto } from './dto/update-archive.dto';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('Archives')
@ApiBearerAuth()
@Controller('archives')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ArchiveController {
  constructor(private readonly archiveService: ArchiveService) {}

  @Get('my-speciality')
  @ApiOperation({ summary: 'Récupérer les archives filtrées par la spécialité du candidat connecté' })
  async findMySpecialityArchives(
    @Req() req: any,
    @Query('anneeId') anneeId?: string,
    @Query('search') search?: string,
  ) {
    const candidateId = req.user.candidateId; 
    return this.archiveService.findForCandidate(candidateId, { anneeId, search });
  }

  // --- NOUVELLE ROUTE DE TÉLÉCHARGEMENT ---
  @Public() 
  @Get('download/:filename')
  @ApiOperation({ summary: 'Télécharger ou afficher un fichier archive' })
  async getFile(@Param('filename') filename: string, @Res() res: express.Response) {
    return this.archiveService.downloadFile(filename, res);
  }

  @Post('upload')
  @Permissions('creer_archive')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4() + extname(file.originalname);
          cb(null, uniqueSuffix);
        },
      }),
    }),
  )
  @ApiOperation({ summary: 'Uploader un fichier d\'archive' })
  @ApiConsumes('multipart/form-data')
  async uploadArchive(
    @UploadedFile() file: Express.Multer.File,
    @Body() createArchiveDto: CreateArchiveDto,
  ) {
    createArchiveDto.fileUrl = `/uploads/${file.filename}`;
    return this.archiveService.create(createArchiveDto);
  }

  @Get()
  @Public()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('epreuveId') epreuveId?: string,
    @Query('anneeId') anneeId?: string,
  ) {
    return this.archiveService.findAll({
      page: Number(page),
      limit: Number(limit),
      search,
      epreuveId,
      anneeId,
    });
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
}