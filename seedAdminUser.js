const { User } = require("./models/user");
const bcrypt = require("bcrypt");
const config = require("config");
const mongoose = require("mongoose");

const insertUser = async () => {
  const salt = await bcrypt.genSalt(10);
  const password = "admin";
  const hashedPassword = await bcrypt.hash(password, salt);

  const adminUser = new User({
    firstName: "Default",
    lastName: "Admin",
    email: "defaultAdmin@admin.com",
    password: hashedPassword,
    phone: "98765432",
    isAdmin: true,
    isActive: true,
  });

  return adminUser.save();
};

async function seed() {
  await mongoose.connect(config.get("DB_URI"), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await insertUser();
  await mongoose.disconnect();
}

console.log("Inserting user");
seed()
  .then(() => console.log("Done"))
  .catch((ex) => console.log("Failed: ", ex));
