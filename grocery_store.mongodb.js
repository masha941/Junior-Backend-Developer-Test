const database = 'grocery_store';
use(database);

db.offices.drop();
db.users.drop();

const hashedPwd = "$2b$10$92IXMTstB76If6a9Ag9qc.9l6dwXpsK5vUvL4y.pX8zWjZ9e3fM6W";

db.offices.insertMany([
  { _id: 9938431, name: "Srbija", parentId: null, managerId: 1632733 },
  { _id: 5525900, name: "Vojvodina", parentId: 9938431, managerId: 8374632 },
  { _id: 1223312, name: "Grad Beograd", parentId: 9938431, managerId: 4192032 },
  { _id: 5834591, name: "Severnobacki okrug", parentId: 5525900, managerId: 3182373 },
  { _id: 3126321, name: "Subotica", parentId: 5834591, managerId: 9381232 },
  { _id: 8192011, name: "Radnja 1", officeId: 5834591, managerId: 1567767 }
]);

db.users.insertMany([
  {
    _id: 5252395,
    name: "Ana",
    lastName: "Anic",
    username: "ana_431",
    password: hashedPwd,
    role: "manager",
    parentId: null,
    officeId: 9938431,
    storeId: null
  },
  {
    _id: 3270002,
    name: "Sonja",
    lastName: "Sonjic",
    username: "sonjas592",
    password: hashedPwd,
    role: "manager",
    parentId: 5252395,
    officeId: 5525900, 
    storeId: null
  },
  {
    _id: 1567767, 
    name: "Aleksa",
    lastName: "Aleksic",
    username: "aleksa455",
    password: hashedPwd,
    role: "manager",
    parentId: 6354211,
    officeId: null,
    storeId: 8192011 
  },
  {
    _id: 9933453,
    name: "Marko",
    lastName: "Markovic",
    username: "marko_313",
    password: hashedPwd,
    role: "employee",
    parentId: 1567767, 
    officeId: null,
    storeId: 8192011
  }
]);