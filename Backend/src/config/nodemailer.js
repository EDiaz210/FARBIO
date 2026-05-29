import nodemailer from "nodemailer";

const createTransport = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

const sendMail = async ({ to, subject, html }) => {
  const transporter = createTransport();

  if (!transporter) {
    console.warn("[MAIL] SMTP no configurado. Se omite envio a:", to);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
};

const sendMailToRegister = async (email, token) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const confirmUrl = `${frontendUrl}/confirmar/${token}`;

  await sendMail({
    to: email,
    subject: "Confirma tu cuenta",
    html: `<p>Gracias por registrarte.</p><p>Confirma tu cuenta aqui: <a href=\"${confirmUrl}\">${confirmUrl}</a></p>`,
  });
};

const sendMailToRecoveryPassword = async (email, token) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const recoverUrl = `${frontendUrl}/recuperarpassword/${token}`;

  await sendMail({
    to: email,
    subject: "Recuperar contrasena",
    html: `<p>Recibimos una solicitud para recuperar tu cuenta.</p><p>Usa este enlace: <a href=\"${recoverUrl}\">${recoverUrl}</a></p>`,
  });
};

export { sendMailToRegister, sendMailToRecoveryPassword };
