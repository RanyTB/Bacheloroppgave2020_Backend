const { Category } = require("./models/category");
const { Product } = require("./models/product");
const { User } = require("./models/user");
const { Rental } = require("./models/rental");
const config = require("config");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

let gamingConsoles;
let boardGames;
let ps4;
let xbox;
let switchCat;

const insertCategories = () => {
  gamingConsoles = new Category({
    name: "Gaming Consoles"
  });

  boardGames = new Category({
    name: "Board Games"
  });

  ps4 = new Category({
    name: "ps4",
    parent: {
      _id: gamingConsoles._id,
      name: gamingConsoles.name
    }
  });

  xbox = new Category({
    name: "Xbox",
    parent: {
      _id: gamingConsoles._id,
      name: gamingConsoles.name
    }
  });

  switchCat = new Category({
    name: "switch",
    parent: {
      _id: gamingConsoles._id,
      name: gamingConsoles.name
    }
  });

  return Promise.all([
    gamingConsoles.save(),
    boardGames.save(),
    ps4.save(),
    xbox.save(),
    switchCat.save()
  ]);
};

const insertUsers = async () => {
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash("12345678", salt);

  const adminUser = new User({
    firstName: "markusAdmin",
    lastName: "hellestveitAdmin",
    email: "markus.bikilla.hellestveit@gmail.com",
    password,
    phone: "22222222",
    isAdmin: true,
    isActive: true
  });

  const regularUser = new User({
    firstName: "markusNonAdmin",
    lastName: "hellestveitNonAdmin",
    email: "markus1abc@gmail.com",
    password,
    phone: "22222222",
    isActive: true
  });

  return Promise.all([adminUser.save(), regularUser.save()]);
};
const insertProducts = () => {
  const ps4Console = new Product({
    name: "Playstation 4",
    category: {
      _id: ps4._id,
      name: ps4.name
    },
    entities: [
      {
        identifier: "PS4_1",
        availableForRental: true,
        remarks: "Scratches"
      },
      {
        identifier: "PS4_2",
        availableForRental: true,
        remarks: "Scratches"
      },
      {
        identifier: "PS4_3",
        availableForRental: true,
        remarks: "Scratches"
      },
      {
        identifier: "PS4_4",
        availableForRental: true,
        remarks: "Scratches"
      }
    ],
    numberOfLoans: 10,
    description: "A Playstation 4 console",
    details: [
      {
        displayName: "Maximum players",
        value: "4"
      }
    ]
  });

  const switchConsole = new Product({
    name: "Nintendo Switch",
    category: {
      _id: switchCat._id,
      name: switchCat.name
    },
    entities: [
      {
        identifier: "Switch_1",
        availableForRental: true,
        remarks: "Good condition"
      }
    ],
    numberOfLoans: 10,
    description: "Nintendo switch console",
    details: [
      {
        displayName: "Maximum players",
        value: "4"
      }
    ]
  });

  const xboxConsole = new Product({
    name: "Xbox one",
    category: {
      _id: xbox._id,
      name: xbox.name
    },
    entities: [
      {
        identifier: "XB1_1",
        availableForRental: true,
        remarks: "Scratches"
      }
    ],
    numberOfLoans: 10,
    description: "A Xbox one console",
    details: [
      {
        displayName: "Maximum players",
        value: "4"
      }
    ]
  });

  const monopol = new Product({
    name: "Monopoly",
    category: {
      _id: boardGames._id,
      name: boardGames.name
    },
    entities: [
      {
        identifier: "MP1",
        availableForRental: true,
        remarks: "Scratches"
      }
    ],
    numberOfLoans: 10,
    description: "Monopoly board game",
    details: [
      {
        displayName: "Maximum players",
        value: "8"
      }
    ]
  });

  const battleship = new Product({
    name: "Battleship",
    category: {
      _id: boardGames._id,
      name: boardGames.name
    },
    entities: [
      {
        identifier: "BS1",
        availableForRental: true,
        remarks: "Scratches"
      }
    ],
    numberOfLoans: 10,
    description: "Battleship board game",
    details: [
      {
        displayName: "Maximum players",
        value: "2"
      }
    ]
  });

  return Promise.all([
    ps4Console.save(),
    xboxConsole.save(),
    switchConsole.save(),
    monopol.save(),
    battleship.save()
  ]);
};

const removeAll = async () => {
  return Promise.all([
    Category.deleteMany({}),
    Product.deleteMany({}),
    User.deleteMany({}),
    Rental.deleteMany({})
  ]);
};

async function seed() {
  await mongoose.connect(config.get("DB_URI"), {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  await removeAll();
  await insertCategories();
  await insertProducts();
  await insertUsers();

  await mongoose.disconnect();
}

try {
  seed();
  console.log("Seeding database complete!");
} catch (e) {
  console.log("Seed failed!");
}
