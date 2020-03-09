const { Category } = require("./models/category");
const { Product } = require("./models/product");
const config = require("config");
const mongoose = require("mongoose");

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
        availableForRental: false,
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
        availableForRental: false,
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
        availableForRental: false,
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
        availableForRental: false,
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
        availableForRental: false,
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
  return Promise.all([Category.deleteMany({}), Product.deleteMany({})]);
};

async function seed() {
  await mongoose.connect(config.get("DB_URI"), {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  await removeAll();
  await insertCategories();
  await insertProducts();

  await mongoose.disconnect();
}

try {
  seed();
  console.log("Seeding database complete!");
} catch (e) {
  console.log("Seed failed!");
}
