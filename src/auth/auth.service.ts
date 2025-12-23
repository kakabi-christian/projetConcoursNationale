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
  logger: any;
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  // Hash du mot de passe
// Hash du mot de passe
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // Générateur rapide : ADMIN-2025-XXXX
  private genCode = () => `ADMIN-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // ==================== REGISTER ADMIN ====================
// src/auth/auth.service.ts

// src/auth/auth.service.ts

async registerAdmin(dto: RegisterAdminDto) {
  const { email, password, nom, prenom, telephone, region, departementId, roleId, userType } = dto;

  // 1. Vérification si l'utilisateur existe déjà
  const existingUser = await this.prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new ConflictException('Cet email existe déjà.');

  // On génère le hash pour la base de données
  const hashedPassword = await this.hashPassword(password);
  // On génère le code admin unique (ex: ADM-2025-XXXX)
  const adminCode = this.genCode();

  try {
    // 2. Transaction sécurisée pour créer l'utilisateur et son profil admin
    const result = await this.prisma.$transaction(async (tx) => {
      return await tx.user.create({
        data: {
          email,
          password: hashedPassword, // On stocke le mot de passe haché
          nom,
          prenom,
          telephone,
          region,
          userType: userType || 'ADMIN',
          isVerified: true,
          admin: {
            create: {
              codeAdmin: adminCode,
              ...(departementId && departementId.trim() !== "" 
                ? { departement: { connect: { id: departementId } } } 
                : {}),
            },
          },
          roles: (roleId && roleId.trim() !== "") ? {
            create: [
              { role: { connect: { id: roleId } } }
            ]
          } : undefined,
        },
        include: { admin: true }
      });
    });

    // 3. ENVOI DE L'EMAIL (Hors transaction pour ne pas bloquer la DB en cas de lenteur SMTP)
    // IMPORTANT: On envoie le 'password' original (en clair) reçu dans le DTO
    try {
      await this.emailService.sendAdminCredentials(
        email, 
        `${prenom} ${nom}`, 
        adminCode, 
        password // C'est ici que l'admin reçoit son mot de passe pour se connecter
      );
      this.logger.log(`Identifiants envoyés avec succès à ${email}`);
    } catch (e) {
      // On log l'erreur mais on ne crash pas l'inscription car l'admin est déjà créé en DB
      console.error("L'email n'a pas pu être envoyé mais l'admin est créé:", e.message);
    }

    return { 
      message: 'Compte administrateur créé et identifiants envoyés par email.', 
      user: { id: result.id, email: result.email }, 
      admin: result.admin 
    };

  } catch (error) {
    console.error("Erreur lors de la création de l'admin:", error);
    if (error.code === 'P2003') {
      throw new BadRequestException("Le département ou le rôle sélectionné est invalide.");
    }
    throw error;
  }
}
/**
 * Vérifie la progression de l'inscription d'un candidat
 * @returns 0 si terminé, sinon le numéro de l'étape à remplir
 */
private async checkCandidateProgress(userId: string): Promise<number> {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    include: {
      candidate: {
        include: {
          documents: true,
          enrollements: true,
        },
      },
    },
  });

  if (!user) return 1; // Devrait être impossible au login

  // ÉTAPE 2 : Infos personnelles (le candidat n'a pas encore de date de naissance)
  if (!user.candidate || !user.candidate.dateNaissance) {
    return 2;
  }

  // ÉTAPE 3 : Infos académiques & Matricule (pas de documents ou pas de matricule)
  if (!user.candidate.matricule || !user.candidate.documents) {
    return 3;
  }

  // ÉTAPE 4 : Choix des centres (pas d'enrôlement)
  if (!user.candidate.enrollements || user.candidate.enrollements.length === 0) {
    return 4;
  }

  // Inscription complète
  return 0;
}
  // ==================== REGISTER CANDIDATE STEP 1 ====================
  async registerCandidateStep1(dto: CreateUserStep1Dto) {
  const { nom, prenom, password, email, telephone, region } = dto;

  const hashedPassword = await this.hashPassword(password);

  const user = await this.prisma.user.upsert({
    where: { email: email },
    update: {
      // Données à mettre à jour si l'utilisateur existe déjà
      nom,
      prenom,
      password: hashedPassword,
      telephone,
      region,
      isVerified: true,
    },
    create: {
      // Données à insérer si l'utilisateur n'existe pas
      email,
      nom,
      prenom,
      password: hashedPassword,
      telephone,
      region,
      userType: 'CANDIDATE',
      isVerified: true,
    },
  });

  return { message: 'Inscription (upsert) réussie', user };
}
  // ==================== REGISTER CANDIDATE STEP 2 ====================
async registerCandidateStep2(dto: RegisterCandidateStep2Dto) {
  const { userId, data } = dto;

  // Vérifier que l'utilisateur existe
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundException('Utilisateur non trouvé');

  // Vérifier si un candidat existe déjà pour cet utilisateur
  const existingCandidate = await this.prisma.candidate.findUnique({ where: { userId } });
  if (existingCandidate && existingCandidate.dateNaissance) {
    throw new BadRequestException('Informations déjà enregistrées');
  }

  // Vérifier que la spécialité existe
  const specialite = await this.prisma.specialite.findUnique({ where: { id: data.specialiteId } });
  if (!specialite) throw new NotFoundException('Spécialité non trouvée');

  // 🔹 Transaction pour tout mettre à jour de manière sûre
  const result = await this.prisma.$transaction(async (tx) => {
    let candidate;

    // Créer ou mettre à jour le candidat
    if (existingCandidate) {
      candidate = await tx.candidate.update({
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

      await tx.candidatSpecialite.upsert({
        where: { 
          candidatId_specialiteId: { 
            candidatId: candidate.id, 
            specialiteId: data.specialiteId 
          } 
        },
        create: { candidatId: candidate.id, specialiteId: data.specialiteId },
        update: {},
      });
    } else {
      candidate = await tx.candidate.create({
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
          specialites: { create: { specialiteId: data.specialiteId } },
        },
        include: { specialites: { include: { specialite: true } } },
      });
    }

    // Mettre à jour tous les reçus non liés à un candidat
    await tx.recu.updateMany({
      where: {
        AND: [{ candidatId: null }],
        OR: [
          { userId: user.id },
          { telephone: user.telephone },
        ],
      },
      data: { candidatId: candidate.id, estUtilise: true },
    });

    // Mettre à jour tous les paiements non liés à un candidat
    await tx.paiement.updateMany({
      where: { email: user.email, candidatId: null },
      data: { candidatId: candidate.id },
    });

    // Retourner le candidat avec ses spécialités
    return tx.candidate.findUnique({
      where: { id: candidate.id },
      include: { specialites: { include: { specialite: true } } },
    });
  });

  return { message: 'Inscription étape 2 réussie', candidate: result };
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
async findAllAdmins(page: number, limit: number) {
  const skip = (page - 1) * limit;

  // 1. Récupérer les données et le compte total en parallèle
  const [admins, total] = await this.prisma.$transaction([
    this.prisma.user.findMany({
      where: {
        userType: { in: ['ADMIN', 'SUPERADMIN'] },
      },
      include: {
        admin: {
          include: {
            departement: true, // Pour afficher le nom du département
          }
        },
        roles: {
          include: {
            role: true, // Pour afficher le nom du rôle
          }
        }
      },
      skip: skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.user.count({
      where: { userType: { in: ['ADMIN', 'SUPERADMIN'] } }
    }),
  ]);

  // 2. Calcul de la méta-donnée pour le frontend
  const lastPage = Math.ceil(total / limit);

  return {
    data: admins,
    meta: {
      total,
      page,
      lastPage,
    },
  };
}
// ==================== UPDATE ADMIN ====================
async updateAdmin(id: string, dto: Partial<RegisterAdminDto>) {
  const { email, nom, prenom, telephone, region, departementId, roleId, userType } = dto;

  // 1. Vérifier si l'admin existe
  const existingUser = await this.prisma.user.findUnique({
    where: { id },
    include: { admin: true }
  });
  if (!existingUser) throw new NotFoundException("Cet administrateur n'existe pas.");

  // 2. Transaction pour mettre à jour User et son profil Admin + Rôles
  return await this.prisma.$transaction(async (tx) => {
    // Mise à jour de l'utilisateur
    const updatedUser = await tx.user.update({
      where: { id },
      data: {
        email,
        nom,
        prenom,
        telephone,
        region,
        userType,
        // Mise à jour du profil Admin (département)
        admin: {
          update: {
            departementId: departementId || undefined,
          }
        },
        // Mise à jour des rôles (on supprime les anciens et on met le nouveau)
        roles: roleId ? {
          deleteMany: {}, // Supprime les anciennes relations UserRole pour cet user
          create: [{ roleId: roleId }]
        } : undefined,
      },
      include: { admin: true, roles: { include: { role: true } } }
    });

    return updatedUser;
  });
}

// ==================== DELETE ADMIN ====================
async deleteAdmin(id: string) {
  // 1. Vérifier si l'utilisateur existe
  const user = await this.prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundException("Administrateur non trouvé.");

  // 2. Suppression (Cascade delete doit être géré en BDD ou manuellement ici)
  // Si ton schéma Prisma n'a pas 'onDelete: Cascade', on supprime manuellement :
  await this.prisma.$transaction([
    // Supprimer le profil admin
    this.prisma.admin.deleteMany({ where: { userId: id } }),
    // Supprimer les relations de rôles
    this.prisma.userRole.deleteMany({ where: { userId: id } }),
    // Supprimer l'utilisateur final
    this.prisma.user.delete({ where: { id } }),
  ]);

  return { message: "Administrateur supprimé avec succès." };
}


  // ==================== LOGIN ====================
// src/auth/auth.service.ts
async login(
  loginDto: LoginDto,
  userType: 'ADMIN' | 'CANDIDATE' | 'SUPERADMIN',
) {
  console.log('=== LOGIN START ===');

  // ===================== 1. LOGIN CANDIDAT =====================
  if (userType === 'CANDIDATE') {
    const { password, numeroRecu } = loginDto;

    if (!password || !numeroRecu) {
      throw new BadRequestException('Numéro de reçu et mot de passe requis');
    }

    const paiement = await this.prisma.paiement.findFirst({
      where: { recu: { numeroRecu } },
      include: { 
        candidat: { include: { user: true } }, 
        recu: true 
      },
    });

    if (!paiement || !paiement.candidat?.user) {
      throw new UnauthorizedException('Numéro de reçu invalide ou compte introuvable');
    }

    const user = paiement.candidat.user;
    const isValidPassword = await bcrypt.compare(password, user.password ?? '');
    if (!isValidPassword) throw new UnauthorizedException('Mot de passe incorrect');
    // --- 🎯 VÉRIFICATION DE LA PROGRESSION ---
// --- Fin de la logique de vérification du mot de passe ---
  
  // 🎯 VÉRIFICATION DE LA PROGRESSION
  const registrationStep = await this.checkCandidateProgress(user.id);

  // GÉNÉRATION DU TOKEN (Contient déjà le candidateId pour la sécurité)
  const access_token = await this.jwtService.signAsync({
    sub: user.id,
    userType: 'CANDIDATE',
    candidateId: paiement.candidatId,
    registrationStep
  });

  // --- MISE À JOUR DU RETOUR ---
  return { 
    access_token, 
    user: {
      ...user,                  // On déverse les infos de l'entité User (nom, email, etc.)
      candidateId: paiement.candidatId // On injecte l'ID du profil Candidat
    }, 
    registrationStep 
  };
}

  // ===================== 2. LOGIN ADMIN / SUPERADMIN =====================
  const { codeAdmin, password } = loginDto;

  if (!codeAdmin || !password) {
    throw new BadRequestException('Code admin et mot de passe requis');
  }

  // 💡 UTILISATION DE findFirst pour éviter l'erreur sur AdminWhereUniqueInput
  // 💡 ET AJOUT de l'include pour récupérer l'objet 'user'
  const adminProfile = await this.prisma.admin.findFirst({
    where: { codeAdmin: codeAdmin },
    include: {
      user: {
        include: {
          roles: {
            include: {
              role: {
                include: { permissions: { include: { permission: true } } },
              },
            },
          },
          admin: true, // Pour récupérer les infos de profil admin
        },
      },
    },
  });

  // Sécurité : on vérifie que le profil ET le user existent
  if (!adminProfile || !adminProfile.user) {
    throw new UnauthorizedException('Code administrateur incorrect');
  }

  const user = adminProfile.user;

  // Vérification du type
  if (user.userType !== 'ADMIN' && user.userType !== 'SUPERADMIN') {
    throw new UnauthorizedException('Accès refusé');
  }

  const isValid = await bcrypt.compare(password, user.password ?? '');
  if (!isValid) throw new UnauthorizedException('Mot de passe incorrect');

  if (!user.isVerified) throw new UnauthorizedException('Compte non vérifié');

  // Extraction des permissions
  const permissions = user.roles?.flatMap((ur) => 
    ur.role.permissions.map((p) => p.permission.name)
  ) || [];

  const access_token = await this.jwtService.signAsync({
    sub: user.id,
    email: user.email,
    userType: user.userType,
    permissions,
  });

  return { 
    access_token, 
    user: {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      userType: user.userType,
      admin: user.admin
    }, 
    permissions 
  };
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