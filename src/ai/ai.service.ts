import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  private client: OpenAI;

  constructor(private prisma: PrismaService) {
    this.client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }

  async getContextData(userId?: string) {
    // 1. DONNÉES GLOBALES (Concours, Filières, Centres)
    const [concoursOuverts, filieres, centres] = await Promise.all([
      this.prisma.concours.findMany({
        where: { statut: 'OUVERT' },
        include: { session: true }
      }),
      this.prisma.filiere.findMany({
        include: { departement: true, specialites: true }
      }),
      this.prisma.centreExamen.findMany()
    ]);

    let context = `--- CONFIGURATION DU SYSTÈME ---\n`;
    context += `Concours ouverts: ${concoursOuverts.map(c => `${c.intitule} (Code: ${c.code}, Prix: ${c.montant}FCFA)`).join('; ')}.\n`;
    context += `Filières: ${filieres.map(f => f.intitule).join(', ')}.\n`;
    context += `Centres dispos: ${centres.map(c => c.intitule).join(', ')}.\n`;

    // 2. DONNÉES SPÉCIFIQUES AU CANDIDAT
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          candidate: {
            include: {
              dossier: true,
              enrollements: {
                include: { 
                    concours: true, 
                    salle: { include: { batiment: true } } 
                }
              },
              paiements: true,
              recus: true
            }
          }
        }
      });

      if (user && user.candidate) {
        const can = user.candidate;
        context += `\n--- INFOS CANDIDAT CONNECTÉ ---\n`;
        context += `Identité: ${user.nom} ${user.prenom} (Matricule: ${can.matricule || 'En attente'}).\n`;
        context += `Statut Dossier: ${can.dossier?.statut || 'BROUILLON'}. `;
        if (can.dossier?.commentaire) context += `Note Admin: ${can.dossier.commentaire}. `;
        
        if (can.enrollements.length > 0) {
          context += `Inscriptions: ` + can.enrollements.map(e => {
            let info = `${e.concours.intitule}`;
            if (e.salle) info += ` (Salle: ${e.salle.codeClasse}, Bât: ${e.salle.batiment.nom}, Table: ${e.numeroTable})`;
            return info;
          }).join(' | ') + `.\n`;
        }
        
        const paye = can.paiements.filter(p => p.statut === 'SUCCESS').length;
        context += `Paiements réussis: ${paye}. Reçus générés: ${can.recus.length}.\n`;
      }
    }
    return context;
  }

  async getChatResponse(userPrompt: string, userId?: string) {
    const context = await this.getContextData(userId);

    try {
      const response = await this.client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `Tu es l'assistant du portail de concours.
            DONNÉES TEMPS RÉEL DE LA BD :
            ${context}

            CONSIGNES :
            - Si l'utilisateur est présent dans les "INFOS CANDIDAT", tutoie-le et réponds précisément sur son dossier ou sa salle.
            - Si le candidat n'est pas détecté, explique-lui qu'il doit se connecter pour voir son statut.
            - Sois bref et professionnel.`
          },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4, // Très bas pour ne pas inventer de données
      });

      return response.choices[0].message?.content;
    } catch (error) {
      console.error("❌ Erreur Groq:", error);
      return "Erreur technique avec l'IA.";
    }
  }
}