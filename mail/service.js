const nodemailer = require("nodemailer");
const config = require("../const/config");

async function send(to, code) {
    const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: true,
        auth: {
            user: config.smtpUser,
            pass: config.smtpPass,
        },
    });
    const info = await transporter.sendMail({
        from: `"Base" <${config.smtpUser}>`,
        to: to,
        subject: "Verification Code",
        text: code,
    });
}

module.exports = send;