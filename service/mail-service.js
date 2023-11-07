const nodemailer = require("nodemailer");

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendActivationMail(to, link) {
    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: "Активація аккаунту на " + process.env.API_URL,
      text: "",
      html: `
                    <div>
                        <h1>Для активації аккаунту перейдіть за посиланням</h1>
                        <a href="${link}">${link}</a>
                    </div>
                `,
    });
  }

  async sendResetPasswordLetter(to, link) {
    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: "Відновлення доступу на " + process.env.CLIENT_URL,
      text: "",
      html: `
            <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9e9e9; border-radius: 10px; background-color: #f9f9f9; color: #333; text-align: center;">
              <h2 style="color: #666; font-size: 24px;">Зміна паролю</h2>
              <p style="color: #666; font-size: 16px;">Для зміни паролю на ${process.env.CLIENT_URL} натисніть кнопку скидання паролю </p>
              <a href="${link}" style="display: inline-block; margin-top: 15px; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px; font-size: 16px;">Скинути пароль</a>
              <p style="color: #666; font-size: 14px; margin-top: 20px;">Якщо ви не відправляли цей лист, проігноруйте його та не повідомляйте нікому свій пароль від аккаунту</p>
            </div>
            `,
    });
  }
}

module.exports = new MailService();
