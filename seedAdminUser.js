const { User } = require("./models/user");
const bcrypt = require("bcrypt");
const config = require("config");
const mongoose = require("mongoose");

const email = "admin@admin.com";
const password = "defaultAccentureAdmin";

const insertUser = async () => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const adminUser = new User({
    firstName: "Default",
    lastName: "Admin",
    email,
    password: hashedPassword,
    phone: "98765432",
    isAdmin: true,
    isActive: true,
  });

  return adminUser.save();
};

const removeUser = async () => {
  return User.deleteMany({ email });
};

async function seed() {
  await mongoose.connect(config.get("DB_URI"), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await removeUser();
  await insertUser();
  await mongoose.disconnect();
}

console.log("Inserting admin user");
seed()
  .then(() => console.log("Done"))
  .catch((ex) => console.log("Failed: ", ex));
