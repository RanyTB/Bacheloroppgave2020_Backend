const nodemailer = require("nodemailer");

module.exports = async (user, subject, message) => {
  let transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: "apikey",
      pass:
        "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"
    }
  });

  await transporter.sendMail({
    from: '"Markus 👻" <markus1abc@gmail.com>',
    to: user.email,
    subject,
    text: ``,
    html: message
  });
};
