const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Node = require('../models/Node');
const User = require('../models/User');

let mongoServer;

const setupTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
};

const teardownTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

const createTestHierarchy = async () => {
  const srbija = await Node.create({ name: 'Srbija', type: 'office', parentId: null, ancestors: [] });
  const vojvodina = await Node.create({ name: 'Vojvodina', type: 'office', parentId: srbija._id, ancestors: [srbija._id] });
  const gradBeograd = await Node.create({ name: 'Grad Beograd', type: 'office', parentId: srbija._id, ancestors: [srbija._id] });
  const noviBeograd = await Node.create({ name: 'Novi Beograd', type: 'office', parentId: gradBeograd._id, ancestors: [srbija._id, gradBeograd._id] });
  const bezanija = await Node.create({ name: 'Bezanija', type: 'office', parentId: noviBeograd._id, ancestors: [srbija._id, gradBeograd._id, noviBeograd._id] });
  const radnja6 = await Node.create({ name: 'Radnja 6', type: 'store', parentId: bezanija._id, ancestors: [srbija._id, gradBeograd._id, noviBeograd._id, bezanija._id] });
  const subotica = await Node.create({ name: 'Subotica', type: 'office', parentId: vojvodina._id, ancestors: [srbija._id, vojvodina._id] });
  const radnja1 = await Node.create({ name: 'Radnja 1', type: 'store', parentId: subotica._id, ancestors: [srbija._id, vojvodina._id, subotica._id] });

  return { srbija, vojvodina, gradBeograd, noviBeograd, bezanija, radnja6, subotica, radnja1 };
};

const createTestUsers = async (nodes) => {
  const ceoManager = await User.create({
    name: 'Petar', lastName: 'Petrovic', username: 'petar_ceo',
    password: 'password123', role: 'manager', nodeId: nodes.srbija._id
  });
  
  const noviBeogradManager = await User.create({
    name: 'Jovan', lastName: 'Jovanovic', username: 'jovan_novibeograd',
    password: 'password123', role: 'manager', nodeId: nodes.noviBeograd._id
  });
  
  const bezanijaEmployee = await User.create({
    name: 'Dejan', lastName: 'Dejic', username: 'dejan_emp_bezanija',
    password: 'password123', role: 'employee', nodeId: nodes.bezanija._id
  });
  
  const radnja6Employee = await User.create({
    name: 'Igor', lastName: 'Igoric', username: 'igor_emp_radnja6',
    password: 'password123', role: 'employee', nodeId: nodes.radnja6._id
  });
  
  const vojvodinaManager = await User.create({
    name: 'Ana', lastName: 'Anic', username: 'ana_vojvodina',
    password: 'password123', role: 'manager', nodeId: nodes.vojvodina._id
  });

  return { ceoManager, noviBeogradManager, bezanijaEmployee, radnja6Employee, vojvodinaManager };
};

module.exports = {
  setupTestDB,
  teardownTestDB,
  clearTestDB,
  createTestHierarchy,
  createTestUsers
};