// src/campay/campay.service.ts
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class CampayService {
  private readonly logger = new Logger(CampayService.name);
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly webhookKey: string;
  private readonly adminPhoneNumber: string;

  constructor(private configService: ConfigService) {
    // Récupération des variables d'environnement
    this.baseUrl = this.configService.get<string>('CAMPAY_BASE_URL') || 'https://demo.campay.net/api';
    this.token = this.configService.get<string>('CAMPAY_TOKEN') || '';
    this.webhookKey = this.configService.get<string>('CAMPAY_WEBHOOK_KEY') || '';
    this.adminPhoneNumber = this.configService.get<string>('ADMIN_PHONE_NUMBER') || '';

    if (!this.token) {
      this.logger.error('❌ CAMPAY_TOKEN est manquant dans le fichier .env');
    }
  }

  /**
   * 🔹 COLLECT : Mobile Money (Client) -> Ta balance Campay
   * Cette méthode déclenche le push USSD/OTP sur le téléphone du client.
   */
  async requestPayment(amount: number, phoneNumber: string, description: string) {
    const externalReference = uuidv4(); // Identifiant unique pour notre backend
    try {
      this.logger.log(`🚀 [COLLECT] Initialisation: ${amount} XAF | Client: ${phoneNumber}`);
      
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

      this.logger.log(`✅ [COLLECT] Requête acceptée par Campay. Référence: ${response.data.reference}`);
      
      return { 
        campayResponse: response.data, 
        externalReference 
      };
    } catch (error) {
      this.logger.error(`❌ [COLLECT] Erreur: ${error.response?.data?.message || error.message}`);
      throw new HttpException(
        error.response?.data?.message || 'Échec de la collecte Campay', 
        HttpStatus.BAD_GATEWAY
      );
    }
  }

  /**
   * 🔹 WITHDRAW : Ta balance Campay -> Ton numéro Admin (Payout)
   * Utilisé pour transférer l'argent récolté vers ton propre compte.
   */
  async withdraw(amount: number, description: string = "Transfert vers Admin") {
    const externalReference = uuidv4();
    
    if (!this.adminPhoneNumber) {
      throw new HttpException('Numéro Admin non configuré (ADMIN_PHONE_NUMBER)', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    try {
      this.logger.log(`🏧 [WITHDRAW] Retrait: ${amount} XAF vers Admin: ${this.adminPhoneNumber}`);

      const response = await axios.post(
        `${this.baseUrl}/withdraw/`,
        {
          amount: amount.toString(),
          to: this.adminPhoneNumber,
          currency: 'XAF',
          description: description,
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

      this.logger.log(`✅ [WITHDRAW] Succès : ${response.data.reference}`);
      return {
        success: true,
        data: response.data,
        externalReference
      };
    } catch (error) {
      this.logger.error(`❌ [WITHDRAW] Erreur: ${error.response?.data?.message || error.message}`);
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors du retrait',
        error: error.message
      };
    }
  }

  /**
   * 🔹 CHECK STATUS : Vérifier manuellement l'état d'une transaction
   */
  async getTransactionStatus(reference: string) {
    try {
      this.logger.log(`🔍 [STATUS] Vérification de la référence: ${reference}`);
      const response = await axios.get(`${this.baseUrl}/transaction/${reference}/`, {
        headers: { 
          'Authorization': `Token ${this.token}`,
          'Accept': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      this.logger.error(`❌ [STATUS] Erreur de vérification: ${error.message}`);
      return null;
    }
  }

  /**
   * 🔹 VALIDATE WEBHOOK : Vérifie la signature JWT envoyée par Campay
   */
  validateWebhookSignature(signature: string): boolean {
    try {
      if (!this.webhookKey) {
        this.logger.warn('⚠️ CAMPAY_WEBHOOK_KEY manquante. Sécurité compromise !');
        return true; // En développement seulement
      }
      
      jwt.verify(signature, this.webhookKey);
      this.logger.log('🔐 [WEBHOOK] Signature JWT vérifiée avec succès');
      return true;
    } catch (error) {
      this.logger.error(`🔐 [WEBHOOK] Signature Invalide : ${error.message}`);
      return false;
    }
  }
}