// backend/src/email/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    try {
      const emailService = this.configService.get<string>('EMAIL_SERVICE');
      const emailUser = this.configService.get<string>('EMAIL_USER');
      const emailPass = this.configService.get<string>('EMAIL_PASS');

      // Configuration flexible (Gmail, Outlook, etc.)
      this.transporter = nodemailer.createTransport({
        service: emailService || 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
            tls: {
        rejectUnauthorized: false, // ⚠️ autorise les certificats auto-signés
      },
      });

      this.transporter.verify((error, success) => {
        if (error) {
          this.logger.error('Email transporter configuration error:', error.message);
        } else {
          this.logger.log('Email transporter is ready to send messages ✅');
        }
      });
    } catch (error) {
      this.logger.error('Error during transporter initialization:', error.message);
    }
  }
  async sendOtpEmail(to: string, code: string) {
  try {
    const subject = '🔐 Code de vérification pour votre reçu';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Code de vérification</h2>
        <p>Bonjour,</p>
        <p>Vous avez demandé à récupérer votre reçu de paiement.</p>
        <p>Votre code de vérification est :</p>
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff; border-radius: 8px; margin: 20px 0;">
          ${code}
        </div>
        <p style="color: #e74c3c;">⚠️ Ce code expire dans <strong>10 minutes</strong>.</p>
        <p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #7f8c8d; font-size: 12px;">Système de gestion des concours</p>
      </div>
    `;
    await this.sendMail(to, subject, html);
  } catch (error) {
    this.logger.error(`Error in sendOtpEmail: ${error.message}`);
    throw error;
  }
}

  private async sendMail(to: string, subject: string, html: string) {
    const from = this.configService.get<string>('EMAIL_USER');
    const mailOptions = { from, to, subject, html };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${to} with subject: "${subject}"`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw new Error('Email sending failed');
    }
  }

  async sendVerificationEmail(to: string, code: string) {
    try {
      const subject = 'Your verification code';
      const html = `
        <p>Hello,</p>
        <p>Your verification code is: <strong>${code}</strong></p>
        <p>This code will expire in <strong>10 minutes</strong>.</p>
      `;
      await this.sendMail(to, subject, html);
    } catch (error) {
      this.logger.error(`Error in sendVerificationEmail: ${error.message}`);
    }
  }

  async resendVerificationEmail(to: string, code: string) {
    try {
      const subject = 'Resend verification code';
      const html = `
        <p>Hello,</p>
        <p>Your new verification code is: <strong>${code}</strong></p>
        <p>This code will expire in <strong>10 minutes</strong>.</p>
      `;
      await this.sendMail(to, subject, html);
    } catch (error) {
      this.logger.error(`Error in resendVerificationEmail: ${error.message}`);
    }
  }
  // backend/src/email/email.service.ts

async sendAdminCredentials(to: string, nom: string, codeAdmin: string, password: string) {
  try {
    const subject = '🚀 Vos identifiants de connexion Administrateur';
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #007bff; color: white; padding: 20px; text-align: center;">
          <h1>Bienvenue dans l'équipe !</h1>
        </div>
        <div style="padding: 20px; color: #333;">
          <p>Bonjour <strong>${nom}</strong>,</p>
          <p>Votre compte administrateur a été créé avec succès. Voici vos accès confidentiels :</p>
          
          <div style="background-color: #f4f7f6; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 5px solid #007bff;">
            <p style="margin: 5px 0;"><strong>Identifiant (Email) :</strong> ${to}</p>
            <p style="margin: 5px 0;"><strong>Code Admin :</strong> <span style="color: #007bff; font-weight: bold;">${codeAdmin}</span></p>
            <p style="margin: 5px 0;"><strong>Mot de passe :</strong> ${password}</p>
          </div>

          <p style="color: #666; font-size: 0.9em;">⚠️ Par mesure de sécurité, nous vous conseillons de modifier votre mot de passe dès votre première connexion.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${this.configService.get('FRONTEND_URL') || '#'}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Se connecter au Dashboard</a>
          </div>
        </div>
        <div style="background-color: #f9f9f9; color: #999; padding: 15px; text-align: center; font-size: 12px;">
          Ceci est un message automatique, merci de ne pas y répondre.
        </div>
      </div>
    `;
    await this.sendMail(to, subject, html);
  } catch (error) {
    this.logger.error(`Erreur lors de l'envoi des identifiants admin: ${error.message}`);
  }
}

  async sendResetPasswordEmail(to: string, resetToken: string) {
    try {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

      const subject = 'Reset your password';
      const html = `
        <p>Hello,</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}" target="_blank">${resetLink}</a>
        <p>This link will expire in <strong>30 minutes</strong>.</p>
      `;
      await this.sendMail(to, subject, html);
    } catch (error) {
      this.logger.error(`Error in sendResetPasswordEmail: ${error.message}`);
    }
  }
}
