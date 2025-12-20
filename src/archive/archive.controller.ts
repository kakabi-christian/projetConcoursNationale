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
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiConsumes, 
  ApiBody, 
  ApiBearerAuth, 
  ApiQuery, 
  ApiParam, 
  ApiResponse 
} from '@nestjs/swagger'; // Imports Swagger
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

@ApiTags('Archives')
@ApiBearerAuth()
@Controller('archives')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ArchiveController {
  constructor(private readonly archiveService: ArchiveService) {}

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
  @ApiOperation({ summary: 'Uploader un fichier d\'archive et créer l\'entrée' })
  @ApiConsumes('multipart/form-data') // Spécifie que c'est un envoi de fichier
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Le fichier PDF ou Image' },
        epreuveId: { type: 'string' },
        anneeId: { type: 'string' },
      },
    },
  })
  async uploadArchive(
    @UploadedFile() file: Express.Multer.File,
    @Body() createArchiveDto: CreateArchiveDto,
  ) {
    createArchiveDto.fileUrl = `/uploads/${file.filename}`;
    return this.archiveService.create(createArchiveDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Lister les archives avec filtres et pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'epreuveId', required: false, type: String })
  @ApiQuery({ name: 'anneeId', required: false, type: String })
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
  @ApiOperation({ summary: 'Obtenir une archive par son ID' })
  @ApiParam({ name: 'id', description: 'ID de l\'archive' })
  findOne(@Param('id') id: string) {
    return this.archiveService.findOne(id);
  }

  @Patch(':id')
  @Permissions('modifier_archive')
  @ApiOperation({ summary: 'Mettre à jour une archive' })
  update(@Param('id') id: string, @Body() updateArchiveDto: UpdateArchiveDto) {
    return this.archiveService.update(id, updateArchiveDto);
  }

  @Delete(':id')
  @Permissions('supprimer_archive')
  @ApiOperation({ summary: 'Supprimer une archive' })
  remove(@Param('id') id: string) {
    return this.archiveService.remove(id);
  }

  @Get('epreuve/:id')
  @Public()
  @ApiOperation({ summary: 'Lister les archives d\'une épreuve spécifique' })
  @ApiParam({ name: 'id', description: 'ID de l\'épreuve' })
  findByEpreuve(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.archiveService.findByEpreuve(id, Number(page), Number(limit));
  }
}