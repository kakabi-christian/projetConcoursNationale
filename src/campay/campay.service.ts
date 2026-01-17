import { Injectable, Logger, HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service'; 
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class CampayService {
  private readonly logger = new Logger(CampayService.name);
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly webhookKey: string;
  private readonly adminPhoneNumber: string;

  constructor(
    // 💡 L'injection correcte se fait ici dans le constructeur
    private readonly prisma: PrismaService, 
    private readonly configService: ConfigService
  ) {
    this.baseUrl = this.configService.get<string>('CAMPAY_BASE_URL') || 'https://demo.campay.net/api';
    this.token = this.configService.get<string>('CAMPAY_TOKEN') || '';
    this.webhookKey = this.configService.get<string>('CAMPAY_WEBHOOK_KEY') || '';
    this.adminPhoneNumber = this.configService.get<string>('ADMIN_PHONE_NUMBER') || '';

    if (!this.token) {
      this.logger.error('❌ CAMPAY_TOKEN est manquant dans le fichier .env');
    }
  }

  /**
   * 🔹 WITHDRAW : Balance Campay -> Numéro Admin (Payout)
   */
  async withdraw(amount: number, adminId: string, passwordConfirm: string) {
    this.logger.debug(`[START WITHDRAW] --- DEBUT DE LA PROCEDURE ---`);
    
    // Sécurité injection
    if (!this.prisma) {
        this.logger.error("❌ Erreur d'injection : PrismaService est undefined");
        throw new HttpException("Erreur de base de données", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // 1. Rechercher l'admin
    const foundAdmin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!foundAdmin) {
      this.logger.error(`❌ [WITHDRAW] Utilisateur ${adminId} introuvable`);
      throw new UnauthorizedException('Session invalide : Administrateur introuvable');
    }

    // 2. Vérifier le mot de passe
    if (!foundAdmin.password) {
      throw new UnauthorizedException('Mot de passe absent sur ce compte');
    }

    const isPassValid = await bcrypt.compare(passwordConfirm, foundAdmin.password);
    if (!isPassValid) {
      this.logger.warn(`⚠️ [WITHDRAW] Mauvais MDP pour ${foundAdmin.email}`);
      throw new UnauthorizedException('Mot de passe de confirmation incorrect');
    }

    // 3. Appel Campay
    const externalReference = uuidv4();
    if (!this.adminPhoneNumber || !this.token) {
      throw new HttpException('Configuration Campay incomplète', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    try {
      this.logger.log(`🚀 [WITHDRAW] ${amount} XAF vers ${this.adminPhoneNumber}`);
      const response = await axios.post(
        `${this.baseUrl}/withdraw/`,
        {
          amount: amount.toString(),
          to: this.adminPhoneNumber,
          currency: 'XAF',
          description: `Retrait Admin - Ref: ${externalReference}`,
          external_reference: externalReference,
        },
        {
          headers: {
            'Authorization': `Token ${this.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        },
      );

      return { success: true, data: response.data, externalReference };
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      this.logger.error(`❌ [WITHDRAW FAILED] ${errorMsg}`);
      throw new HttpException(`Campay: ${errorMsg}`, error.response?.status || HttpStatus.BAD_GATEWAY);
    }
  }

  /**
   * 🔹 COLLECT : Mobile Money (Client) -> Balance Campay
   */
  async requestPayment(amount: number, phoneNumber: string, description: string) {
    const externalReference = uuidv4();
    try {
      this.logger.log(`🚀 [COLLECT] ${amount} XAF | Client: ${phoneNumber}`);
      const response = await axios.post(
        `${this.baseUrl}/collect/`,
        {
          amount: amount.toString(),
          currency: 'XAF',
          from: phoneNumber,
          description: description,
          external_reference: externalReference,
        },
        {
          headers: {
            'Authorization': `Token ${this.token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return { campayResponse: response.data, externalReference };
    } catch (error) {
      this.logger.error(`❌ [COLLECT] ${error.response?.data?.message || error.message}`);
      throw new HttpException(error.response?.data?.message || 'Échec collecte', HttpStatus.BAD_GATEWAY);
    }
  }

  /**
   * 🔹 CHECK STATUS : Vérification manuelle
   */
  async getTransactionStatus(reference: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/transaction/${reference}/`, {
        headers: { 
          'Authorization': `Token ${this.token}`,
          'Accept': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      this.logger.error(`❌ [STATUS] Erreur: ${error.message}`);
      return null;
    }
  }

  /**
   * 🔹 VALIDATE WEBHOOK : Signature JWT
   */
  validateWebhookSignature(signature: string): boolean {
    try {
      if (!this.webhookKey) return true; // Dev only
      jwt.verify(signature, this.webhookKey);
      return true;
    } catch (error) {
      this.logger.error(`🔐 [WEBHOOK] Signature Invalide`);
      return false;
    }
  }
}