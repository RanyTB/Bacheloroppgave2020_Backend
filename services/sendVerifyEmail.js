const nodemailer = require("nodemailer");
const config = require("config");

module.exports = async (emailAddress, token) => {
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
    to: emailAddress,
    subject: "Hello ✔",
    text: ``,
    html: `Click the following link to verify your email address ${config.get(
      "frontendBaseURL"
    )}/verify-email/${token}`
  });
};
