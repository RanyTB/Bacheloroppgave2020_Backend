const { User } = require("../models/user");
const sendEmail = require("./sendEmail");

module.exports = async (subject, message) => {
  const admins = await User.find({ isAdmin: true });

  admins.forEach((admin) => {
    sendEmail(admin, subject, message);
  });
};
