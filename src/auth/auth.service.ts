// src/auth/auth.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { LoginDto } from './dto/login.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { CreateUserStep1Dto } from './dto/RegisterCandidateStep1Dto';
import { RegisterCandidateStep2Dto } from './dto/RegisterCandidateStep2Dto';
import { RegisterCandidateStep3Dto } from './dto/RegisterCandidateStep3Dto';
import { RegisterCandidateStep4Dto } from './dto/RegisterCandidateStep4Dto';


@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  // Hash du mot de passe
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // ==================== REGISTER ADMIN ====================
  async registerAdmin(dto: RegisterAdminDto) {
    const { email, password, nom, prenom, telephone, region, departementId, roleId } = dto;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new ConflictException('Cet email existe déjà.');

    const hashedPassword = await this.hashPassword(password);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nom,
        prenom,
        telephone,
        region,
        userType: 'ADMIN',
        isVerified: true,
      },
    });

    const admin = await this.prisma.admin.create({
      data: {
        userId: user.id,
        departementId,
      },
    });

    if (roleId) {
      await this.prisma.userRole.create({
        data: { userId: user.id, roleId },
      });
    }

    return { message: 'Admin créé avec succès', user, admin };
  }

  // ==================== REGISTER CANDIDATE STEP 1 ====================
  async registerCandidateStep1(dto: CreateUserStep1Dto) {
    const { nom, prenom, email, telephone, region } = dto;

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new ConflictException('Cet email existe déjà.');

    // Créer l'utilisateur sans lier le reçu (déjà validé à l'étape précédente)
    const user = await this.prisma.user.create({
      data: {
        nom,
        prenom,
        email,
        telephone,
        region,
        userType: 'CANDIDATE',
        isVerified: true,
      },
    });

    return { message: 'Inscription étape 1 réussie', user };
  }

  // ==================== REGISTER CANDIDATE STEP 2 ====================
  async registerCandidateStep2(dto: RegisterCandidateStep2Dto) {
  // ✅ Extraire userId et data depuis le DTO
  const { userId, data } = dto;

  // Vérifier que l'utilisateur existe
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) throw new NotFoundException('Utilisateur non trouvé');

  // Vérifier si un candidat existe déjà pour cet utilisateur
  const existingCandidate = await this.prisma.candidate.findUnique({
    where: { userId },
  });

  if (existingCandidate && existingCandidate.dateNaissance) {
    throw new BadRequestException('Informations déjà enregistrées');
  }

  // Vérifier que la spécialité existe
  const specialite = await this.prisma.specialite.findUnique({
    where: { id: data.specialiteId },
  });
  if (!specialite) throw new NotFoundException('Spécialité non trouvée');

  // ✅ Créer ou mettre à jour le candidat
  let candidate;

  if (existingCandidate) {
    // Mettre à jour le candidat existant
    candidate = await this.prisma.candidate.update({
      where: { userId },
      data: {
        dateNaissance: new Date(data.dateNaissance),
        lieuNaissance: data.lieuNaissance,
        sexe: data.sexe,
        nationalite: data.nationalite,
        ville: data.ville,
        nomPere: data.nomPere || null,
        telephonePere: data.telephonePere || null,
        nomMere: data.nomMere || null,
        telephoneMere: data.telephoneMere || null,
      },
    });

    // ✅ Créer la relation CandidatSpecialite (éviter les doublons)
    await this.prisma.candidatSpecialite.upsert({
      where: {
        candidatId_specialiteId: {
          candidatId: candidate.id,
          specialiteId: data.specialiteId,
        },
      },
      create: {
        candidatId: candidate.id,
        specialiteId: data.specialiteId,
      },
      update: {}, // Rien à mettre à jour si existe déjà
    });
  } else {
    // Créer le candidat avec la spécialité
    candidate = await this.prisma.candidate.create({
      data: {
        userId,
        dateNaissance: new Date(data.dateNaissance),
        lieuNaissance: data.lieuNaissance,
        sexe: data.sexe,
        nationalite: data.nationalite,
        ville: data.ville,
        nomPere: data.nomPere || null,
        telephonePere: data.telephonePere || null,
        nomMere: data.nomMere || null,
        telephoneMere: data.telephoneMere || null,
        specialites: {
          create: {
            specialiteId: data.specialiteId,
          },
        },
      },
      include: {
        specialites: {
          include: {
            specialite: true,
          },
        },
      },
    });
  }

  // 🔥 MISE À JOUR DU REÇU ET DU PAIEMENT
  // Trouver tous les reçus non liés à un candidatId
  const receiptsToUpdate = await this.prisma.recu.findMany({
    where: {
      userId: userId,
      candidatId: null, // Seulement ceux qui n'ont pas encore de candidatId
    },
  });

  // Si des reçus existent, les mettre à jour
  if (receiptsToUpdate.length > 0) {
    await this.prisma.recu.updateMany({
      where: {
        id: { in: receiptsToUpdate.map(r => r.id) }, // On met à jour tous les reçus trouvés
      },
      data: {
        candidatId: candidate.id,
        estUtilise: true, // Marquer le reçu comme utilisé
      },
    });
  }

  // Trouver les paiements non associés à un candidatId
  const paymentsToUpdate = await this.prisma.paiement.findMany({
    where: {
      email: user.email,
      candidatId: null, // Seulement ceux qui n'ont pas encore de candidatId
    },
  });

  // Si des paiements existent, les mettre à jour
  if (paymentsToUpdate.length > 0) {
    await this.prisma.paiement.updateMany({
      where: {
        id: { in: paymentsToUpdate.map(p => p.id) }, // On met à jour tous les paiements trouvés
      },
      data: {
        candidatId: candidate.id,
      },
    });
  }

  // Récupérer le candidat avec ses spécialités
  const candidateWithSpecialites = await this.prisma.candidate.findUnique({
    where: { id: candidate.id },
    include: {
      specialites: {
        include: {
          specialite: true,
        },
      },
    },
  });

  return {
    message: 'Inscription étape 2 réussie',
    candidate: candidateWithSpecialites,
  };
}

  // ==================== REGISTER CANDIDATE STEP 3 ====================
  // ==================== REGISTER CANDIDATE STEP 3 ====================
async registerCandidateStep3(dto: RegisterCandidateStep3Dto) {
  const { candidateId, numeroCni, typeExamen, serie, Mention } = dto;

  // Vérifier que le candidat existe
  const candidate = await this.prisma.candidate.findUnique({
    where: { id: candidateId },
  });
  if (!candidate) throw new NotFoundException('Candidat non trouvé');

  // Vérifier si des documents existent déjà
  const existingDocuments = await this.prisma.documents.findUnique({
    where: { candidateId },
  });

  if (existingDocuments) {
    throw new BadRequestException('Documents déjà enregistrés pour ce candidat');
  }

  // 🎯 GÉNÉRER LE MATRICULE
  const matricule = await this.generateMatricule();

  // Mettre à jour le candidat avec le matricule
  await this.prisma.candidate.update({
    where: { id: candidateId },
    data: { matricule },
  });

  // Créer les documents
  const documents = await this.prisma.documents.create({
    data: {
      candidateId,
      numeroCni: numeroCni || null,
      typeExamen,
      serie: serie || null,
      Mention,
    },
  });

  // Récupérer le candidat avec le matricule
  const updatedCandidate = await this.prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      documents: true,
      specialites: {
        include: {
          specialite: true,
        },
      },
    },
  });

  return {
    message: 'Inscription étape 3 réussie - Matricule généré',
    matricule,
    candidate: updatedCandidate,
    documents,
  };
}

// 🎯 FONCTION POUR GÉNÉRER UN MATRICULE UNIQUE
private async generateMatricule(): Promise<string> {
  const year = new Date().getFullYear();
  
  // Compter le nombre de candidats existants pour générer un numéro séquentiel
  const count = await this.prisma.candidate.count();
  const sequenceNumber = (count + 1).toString().padStart(5, '0');
  
  const matricule = `CAND-${year}-${sequenceNumber}`;
  
  // Vérifier si le matricule existe déjà (au cas où)
  const existingCandidate = await this.prisma.candidate.findUnique({
    where: { matricule },
  });
  
  if (existingCandidate) {
    // Générer un matricule avec un timestamp pour garantir l'unicité
    const timestamp = Date.now().toString().slice(-4);
    return `CAND-${year}-${sequenceNumber}-${timestamp}`;
  }
  
  return matricule;
}
 // ==================== GET ALL CENTRES ====================
  async getAllCentreDepot() {
    return this.prisma.centreDepot.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllCentreExamen() {
    return this.prisma.centreExamen.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
async registerCandidateStep4(candidateId: string, dto: RegisterCandidateStep4Dto) {
  const { centreDepotId, centreExamenId } = dto;

  const candidate = await this.prisma.candidate.findUnique({ where: { id: candidateId } });
  if (!candidate) throw new NotFoundException('Candidat non trouvé');

  const centreDepot = await this.prisma.centreDepot.findUnique({ where: { id: centreDepotId } });
  if (!centreDepot) throw new NotFoundException('Centre de dépôt non trouvé');

  const centreExamen = await this.prisma.centreExamen.findUnique({ where: { id: centreExamenId } });
  if (!centreExamen) throw new NotFoundException('Centre d’examen non trouvé');

  const paiement = await this.prisma.paiement.findFirst({ where: { candidatId: candidateId } });
  if (!paiement) throw new NotFoundException('Paiement introuvable pour ce candidat');
  if (!paiement.concoursId) throw new NotFoundException('Concours introuvable pour ce paiement');

  const concours = await this.prisma.concours.findUnique({ where: { id: paiement.concoursId } });
  if (!concours) throw new NotFoundException('Concours non trouvé');
  // if (!concours.sessionId) throw new NotFoundException('Session du concours non trouvée');

  const enrollement = await this.prisma.enrollement.create({
    data: {
      candidatId: candidateId,
      concoursId: concours.id,
      centreDepotId,
      centreExamenId,
      // sessionId: concours.sessionId, // ✅ Utilisation directe
    },
  });

  await this.prisma.paiement.update({
    where: { id: paiement.id },
    data: { enrollementId: enrollement.id },
  });

  return {
    message: 'Inscription étape 4 réussie - Centres enregistrés',
    enrollement,
  };
}


  // ==================== LOGIN ====================
  async login(loginDto: LoginDto, userType: 'ADMIN' | 'CANDIDATE') {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: {
        roles: {
          include: {
            role: { include: { permissions: { include: { permission: true } } } },
          },
        },
        admin: { include: { departement: true } },
      },
    });

    if (!user) throw new UnauthorizedException('Email ou mot de passe incorrect.');
    if (user.userType !== userType) {
      throw new UnauthorizedException(`Utilisateur n'est pas un ${userType.toLowerCase()}.`);
    }

    if (userType === 'ADMIN') {
      const isPasswordMatching = await bcrypt.compare(loginDto.password, user.password);
      if (!isPasswordMatching) throw new UnauthorizedException('Mot de passe incorrect.');
    }

    if (!user.isVerified) throw new UnauthorizedException('Compte non vérifié.');

    const permissions =
      user.roles?.flatMap((userRole) =>
        userRole.role.permissions.map((p) => p.permission.name),
      ) || [];

    const payload: any = {
      sub: user.id,
      email: user.email,
      userType: user.userType,
      permissions,
    };

    if (userType === 'ADMIN' && user.admin?.departement) {
      payload.departement = user.admin.departement.nomDep;
    }

    const access_token = await this.jwtService.signAsync(payload);

    return { access_token, permissions, user };
  }

async getCandidateInfo(candidateId: string) {
  const candidate = await this.prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      user: true,
      documents: true,
      specialites: { include: { specialite: true } }, // 🔹 inclure la relation Specialite
      enrollements: {
        include: { concours: true, session: true, centreDepot: true, centreExamen: true },
      },
      paiements: true,
    },
  });

  if (!candidate) throw new NotFoundException('Candidat introuvable');

  const firstEnrollement = candidate.enrollements[0];

  return {
    nom: candidate.user?.nom || null,
    prenom: candidate.user?.prenom || null,
    email: candidate.user?.email || null,
    telephone: candidate.user?.telephone || null,
    region: candidate.user?.region || null,
    dateNaissance: candidate.dateNaissance || null,
    lieuNaissance: candidate.lieuNaissance || null,
    sexe: candidate.sexe || null,
    nationalite: candidate.nationalite || null,
    ville: candidate.ville || null,
    nomPere: candidate.nomPere || null,
    telephonePere: candidate.telephonePere || null,
    nomMere: candidate.nomMere || null,
    telephoneMere: candidate.telephoneMere || null,
    // 🔹 Renvoyer la première spécialité du candidat, ou null si aucune
    specialite: candidate.specialites[0]?.specialite?.libelle || null,
    numeroCni: candidate.documents?.numeroCni || null,
    typeExamen: candidate.documents?.typeExamen || null,
    serie: candidate.documents?.serie || null,
    mention: candidate.documents?.Mention || null,
    centreDepot: firstEnrollement?.centreDepot?.intitule || null,
    centreExamen: firstEnrollement?.centreExamen?.intitule || null,
  };
}


  
   
}