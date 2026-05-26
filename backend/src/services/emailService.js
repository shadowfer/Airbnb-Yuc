

const nodemailer = require('nodemailer');


const createTransporter = () => {
  if (process.env.NODE_ENV === 'production' && process.env.SENDGRID_API_KEY) {

    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }


  return nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true,
  });
};


const sendPasswordResetEmail = async (to, resetUrl) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Hospedaje App" <${process.env.EMAIL_FROM || 'noreply@hospedaje.com'}>`,
    to,
    subject: 'Recupera tu contraseña',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #FF385C, #E31C5F); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🏠 Hospedaje App</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #1e293b; margin-top: 0;">Recupera tu contraseña</h2>
          <p style="color: #475569; line-height: 1.6;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta.
            Haz clic en el botón de abajo para crear una nueva contraseña:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}"
               style="background: linear-gradient(135deg, #FF385C, #E31C5F); color: white;
                      padding: 14px 32px; border-radius: 8px; text-decoration: none;
                      font-weight: 600; font-size: 16px; display: inline-block;">
              Restablecer Contraseña
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
            Si no solicitaste este cambio, ignora este correo.
            El enlace expirará en 15 minutos.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="color: #94a3b8; font-size: 12px;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
            <a href="${resetUrl}" style="color: #FF385C;">${resetUrl}</a>
          </p>
        </div>
      </div>
    `,
  };

  const result = await transporter.sendMail(mailOptions);


  if (process.env.NODE_ENV !== 'production') {
    console.log('\n📧 ═══════════════════════════════════════════');
    console.log('   CORREO DE RECUPERACIÓN (modo desarrollo)');
    console.log('═══════════════════════════════════════════════');
    console.log(`   Para: ${to}`);
    console.log(`   URL de reset: ${resetUrl}`);
    console.log('═══════════════════════════════════════════════\n');
  }

  return result;
};

module.exports = {
  sendPasswordResetEmail,
  createTransporter,
};