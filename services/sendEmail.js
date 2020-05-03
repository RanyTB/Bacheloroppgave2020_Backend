const nodemailer = require("nodemailer");
const config = require("config");

module.exports = async (user, subject, message) => {
  const mailServer = config.get("mailServer");

  let transporter = nodemailer.createTransport({
    host: mailServer.host,
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: mailServer.user,
      pass: mailServer.pass,
    },
  });

  await transporter.sendMail({
    from: '"Markus 👻" <markus1abc@gmail.com>',
    to: user.email,
    subject,
    text: ``,
    html: message,
  });
};
