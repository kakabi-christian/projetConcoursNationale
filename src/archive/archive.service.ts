import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArchiveDto } from './dto/create-archive.dto';
import { UpdateArchiveDto } from './dto/update-archive.dto';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { Response } from 'express'; 

@Injectable()
export class ArchiveService {
  constructor(private readonly prisma: PrismaService) {}

  // 🔹 1. RÉCUPÉRATION PHYSIQUE ET TÉLÉCHARGEMENT FORCÉ
  async downloadFile(filename: string, res: Response) {
    // Localisation du fichier dans le dossier racine/uploads
    const filePath = join(process.cwd(), 'uploads', filename);

    if (!existsSync(filePath)) {
      throw new NotFoundException('Le fichier physique est introuvable sur le serveur');
    }

    /**
     * Pourquoi ne pas utiliser de bibliothèque PDF ici ?
     * Parce que le fichier existe déjà. Nous ne le créons pas, nous le transmettons.
     * Le "Stream" est la méthode la plus rapide pour envoyer un fichier existant.
     */

    // On définit les en-têtes pour forcer le téléchargement (Download)
    // 'attachment' indique au navigateur de télécharger au lieu d'afficher.
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // On crée un flux de lecture (Stream)
    const file = createReadStream(filePath);

    // On lie le flux à la réponse Express
    file.pipe(res);
  }

  // 🔹 2. RÉCUPÉRER LES ARCHIVES SELON LES SPÉCIALITÉS DU CANDIDAT
  async findForCandidate(candidateId: string, query: { anneeId?: string; search?: string }) {
    const { anneeId, search } = query;

    // Récupérer les spécialités associées au candidat connecté
    const candidatSpecs = await this.prisma.candidatSpecialite.findMany({
      where: { candidatId: candidateId },
      select: { specialiteId: true },
    });

    const specialiteIds = candidatSpecs.map((s) => s.specialiteId);

    // Construction du filtre
    const where: any = {
      epreuve: {
        specialiteId: { in: specialiteIds },
      },
    };

    if (anneeId) where.anneeId = anneeId;
    if (search) {
      where.epreuve = {
        ...where.epreuve,
        nomEpreuve: { contains: search, mode: 'insensitive' },
      };
    }

    const data = await this.prisma.archive.findMany({
      where,
      include: {
        epreuve: { include: { specialite: true } },
        annee: true,
      },
      orderBy: { annee: { libelle: 'desc' } },
    });

    return {
      data,
      pagination: {
        total: data.length,
        page: 1,
        lastPage: 1
      }
    };
  }

  // 🔹 3. CRÉATION D'UNE ENTRÉE EN BASE DE DONNÉES
  async create(createArchiveDto: CreateArchiveDto) {
    return this.prisma.archive.create({
      data: createArchiveDto,
    });
  }

  // 🔹 4. LISTE GLOBALE (ADMIN/PUBLIC) AVEC PAGINATION
  async findAll(params: { 
    page: number; 
    limit: number; 
    search?: string; 
    epreuveId?: string; 
    anneeId?: string 
  }) {
    const { page, limit, search, epreuveId, anneeId } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (epreuveId) where.epreuveId = epreuveId;
    if (anneeId) where.anneeId = anneeId;
    if (search) {
      where.epreuve = {
        nomEpreuve: { contains: search, mode: 'insensitive' },
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.archive.findMany({
        where,
        skip,
        take: limit,
        include: {
          epreuve: { include: { filiere: true } },
          annee: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.archive.count({ where }),
    ]);

    const lastPage = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        total,
        page,
        lastPage,
        hasNextPage: page < lastPage,
        hasPreviousPage: page > 1,
      },
    };
  }

  // 🔹 5. ACTIONS UNITAIRES (CRUD)
  async findOne(id: string) {
    const archive = await this.prisma.archive.findUnique({
      where: { id },
      include: { epreuve: true, annee: true },
    });
    if (!archive) throw new NotFoundException(`Archive avec l'ID ${id} introuvable`);
    return archive;
  }

  async update(id: string, updateArchiveDto: UpdateArchiveDto) {
    await this.findOne(id);
    return this.prisma.archive.update({
      where: { id },
      data: updateArchiveDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.archive.delete({ where: { id } });
  }

  async findByEpreuve(epreuveId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.archive.findMany({
        where: { epreuveId },
        skip,
        take: limit,
        include: { epreuve: true, annee: true },
        orderBy: { annee: { libelle: 'desc' } },
      }),
      this.prisma.archive.count({ where: { epreuveId } }),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }
}