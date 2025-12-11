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
