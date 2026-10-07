const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendMfaCodeEmail(email, code) {
  // Mostrar también en consola para facilitar pruebas de desarrollo
  console.log(`\n==================================================`);
  console.log(`📧 [MFA EMAIL] Destinatario: ${email}`);
  console.log(`🔑 Código MFA de 6 dígitos: ${code}`);
  console.log(`⏰ Válido por 5 minutos`);
  console.log(`==================================================\n`);

  // Intentar envío real si se han configurado credenciales SMTP
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Código de Autenticación - TechStore',
        html: `
          <h2>TechStore - Autenticación de Seguridad</h2>
          <p>Tu código de verificación MFA es: <b style="font-size: 20px; color: #2563eb;">${code}</b></p>
          <p>Este código expira en <b>5 minutos</b>.</p>
          <p>Si no solicitaste este código, ignora este mensaje.</p>
        `
      });
    } catch (error) {
      console.warn('⚠️ No se pudo enviar el correo real (revisa tu .env). Se usará el código mostrado en consola.');
    }
  }
}

module.exports = { sendMfaCodeEmail };