import { PrismaClient, UserType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'kakabichristian@gmail.com';
  const password = 'tkkc2006';
  
  console.log('\n========================================================');
  console.log('🚀 MISE À JOUR IDEMPOTENTE : SUPERADMIN & PERMISSIONS');
  console.log('========================================================\n');

  // --- ÉTAPE 1 : HASHAGE ---
  const hashedPassword = await bcrypt.hash(password, 10);

  // --- ÉTAPE 2 : RÔLE SUPERADMIN ---
  // On cherche d'abord si le rôle existe par son nom
  let role = await prisma.role.findFirst({ where: { name: 'SUPERADMIN' } });

  if (!role) {
    role = await prisma.role.create({
      data: {
        name: 'SUPERADMIN',
        description: 'Accès total et souverain',
      },
    });
    console.log(`✅ Rôle SUPERADMIN créé (ID: ${role.id})`);
  } else {
    console.log(`ℹ️ Rôle SUPERADMIN déjà existant (ID: ${role.id})`);
  }

  // --- ÉTAPE 3 : SYNCHRONISATION DES PERMISSIONS ---
  console.log(`[3/5] 📜 Synchronisation des permissions...`);
  const allPermissions = await prisma.permission.findMany();
  
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: perm.id,
        },
      },
      update: {}, 
      create: {
        roleId: role.id,
        permissionId: perm.id,
      },
    });
  }
  console.log(`✅ ${allPermissions.length} permissions vérifiées/liées.\n`);

  // --- ÉTAPE 4 : USER & ADMIN PROFILE ---
  // On retire l'upsert imbriqué des 'roles' ici pour éviter les doublons de création
  const superAdmin = await prisma.user.upsert({
    where: { email: email },
    update: { 
      password: hashedPassword,
      userType: UserType.SUPERADMIN,
      isVerified: true,
      admin: {
        upsert: {
          create: { codeAdmin: 'SUPER-001' },
          update: { codeAdmin: 'SUPER-001' }
        }
      }
    },
    create: {
      email: email,
      password: hashedPassword,
      nom: 'KAKABI',
      prenom: 'Christian',
      userType: UserType.SUPERADMIN,
      isVerified: true,
      admin: {
        create: { codeAdmin: 'SUPER-001' }
      }
    },
    include: { admin: true }
  });

  // --- ÉTAPE 5 : LIEN USER_ROLE (Contrôle d'unicité) ---
  // C'est ici qu'on garantit qu'il n'y a qu'une seule liaison User <-> Role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdmin.id,
        roleId: role.id
      }
    },
    update: {}, // Si le lien existe, on ne touche à rien
    create: {
      userId: superAdmin.id,
      roleId: role.id
    }
  });

  console.log('========================================================');
  console.log('🏁 BILAN DE L\'OPÉRATION TERMINÉE');
  console.log('========================================================');
  console.log(`👤 UTILISATEUR   : ${superAdmin.prenom} ${superAdmin.nom}`);
  console.log(`🆔 CODE ADMIN    : ${superAdmin.admin?.codeAdmin}`); 
  console.log(`🛡️  RÔLE          : SUPERADMIN`);
  console.log(`🔓 PERMISSIONS   : ${allPermissions.length} synchronisées`);
  console.log('========================================================\n');
}

main()
  .catch(e => { 
    console.error('❌ ERREUR CRITIQUE :', e); 
    process.exit(1); 
  })
  .finally(async () => { 
    await prisma.$disconnect(); 
  });