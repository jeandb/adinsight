import nodemailer from 'nodemailer'
import { env } from '../../config/env'

function createTransport() {
  if (!env.SMTP_HOST) {
    // Em dev sem SMTP configurado: loga o email no console
    return nodemailer.createTransport({ jsonTransport: true })
  }
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: false,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  })
}

const transport = createTransport()

interface SendInviteOptions {
  to: string
  inviterName: string
  role: string
  activateUrl: string
}

export async function sendInviteEmail(opts: SendInviteOptions): Promise<void> {
  const message = {
    from: env.SMTP_FROM ?? 'AdInsight <noreply@adinsight.com>',
    to: opts.to,
    subject: 'Convite para o AdInsight',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Você foi convidado para o AdInsight</h2>
        <p><strong>${opts.inviterName}</strong> convidou você com o perfil <strong>${opts.role}</strong>.</p>
        <p>Clique no botão abaixo para criar sua senha e acessar o sistema:</p>
        <a href="${opts.activateUrl}"
           style="display:inline-block;padding:12px 24px;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Ativar minha conta
        </a>
        <p style="color:#6b7280;font-size:12px;margin-top:24px">
          Este link expira em 48 horas. Se você não esperava este convite, ignore este email.
        </p>
      </div>
    `,
  }

  const info = await transport.sendMail(message)

  // Em dev sem SMTP, exibe o link no console para facilitar testes
  if (!env.SMTP_HOST) {
    const parsed = JSON.parse((info as unknown as { message: string }).message)
    console.log('\n📧 [DEV] Email de convite (SMTP não configurado)')
    console.log('   Para:', opts.to)
    console.log('   Link:', opts.activateUrl)
    console.log('   Subject:', parsed.subject, '\n')
  }
}
