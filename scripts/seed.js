const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Node = require('../models/Node');
const User = require('../models/User');
const config = require('../config');

const seedDatabase = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    await Node.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared existing data');

    const srbija = await Node.create({ name: 'Srbija', type: 'office', parentId: null, ancestors: [] });

    const vojvodina = await Node.create({ name: 'Vojvodina', type: 'office', parentId: srbija._id, ancestors: [srbija._id] });
    const gradBeograd = await Node.create({ name: 'Grad Beograd', type: 'office', parentId: srbija._id, ancestors: [srbija._id] });

    const severnobackiOkrug = await Node.create({ name: 'Severnobacki okrug', type: 'office', parentId: vojvodina._id, ancestors: [srbija._id, vojvodina._id] });
    const juznobackiOkrug = await Node.create({ name: 'Juznobacki okrug', type: 'office', parentId: vojvodina._id, ancestors: [srbija._id, vojvodina._id] });
    const noviBeograd = await Node.create({ name: 'Novi Beograd', type: 'office', parentId: gradBeograd._id, ancestors: [srbija._id, gradBeograd._id] });
    const vracar = await Node.create({ name: 'Vracar', type: 'office', parentId: gradBeograd._id, ancestors: [srbija._id, gradBeograd._id] });

    const subotica = await Node.create({ name: 'Subotica', type: 'office', parentId: severnobackiOkrug._id, ancestors: [srbija._id, vojvodina._id, severnobackiOkrug._id] });
    const noviSad = await Node.create({ name: 'Novi Sad', type: 'office', parentId: juznobackiOkrug._id, ancestors: [srbija._id, vojvodina._id, juznobackiOkrug._id] });
    const bezanija = await Node.create({ name: 'Bezanija', type: 'office', parentId: noviBeograd._id, ancestors: [srbija._id, gradBeograd._id, noviBeograd._id] });
    const neimar = await Node.create({ name: 'Neimar', type: 'office', parentId: vracar._id, ancestors: [srbija._id, gradBeograd._id, vracar._id] });
    const crveniKrst = await Node.create({ name: 'Crveni krst', type: 'office', parentId: vracar._id, ancestors: [srbija._id, gradBeograd._id, vracar._id] });

    const detelinara = await Node.create({ name: 'Detelinara', type: 'office', parentId: noviSad._id, ancestors: [srbija._id, vojvodina._id, juznobackiOkrug._id, noviSad._id] });
    const liman = await Node.create({ name: 'Liman', type: 'office', parentId: noviSad._id, ancestors: [srbija._id, vojvodina._id, juznobackiOkrug._id, noviSad._id] });

    const radnja1 = await Node.create({ name: 'Radnja 1', type: 'store', parentId: subotica._id, ancestors: [srbija._id, vojvodina._id, severnobackiOkrug._id, subotica._id] });
    const radnja2 = await Node.create({ name: 'Radnja 2', type: 'store', parentId: detelinara._id, ancestors: [srbija._id, vojvodina._id, juznobackiOkrug._id, noviSad._id, detelinara._id] });
    const radnja3 = await Node.create({ name: 'Radnja 3', type: 'store', parentId: detelinara._id, ancestors: [srbija._id, vojvodina._id, juznobackiOkrug._id, noviSad._id, detelinara._id] });
    const radnja4 = await Node.create({ name: 'Radnja 4', type: 'store', parentId: liman._id, ancestors: [srbija._id, vojvodina._id, juznobackiOkrug._id, noviSad._id, liman._id] });
    const radnja5 = await Node.create({ name: 'Radnja 5', type: 'store', parentId: liman._id, ancestors: [srbija._id, vojvodina._id, juznobackiOkrug._id, noviSad._id, liman._id] });
    const radnja6 = await Node.create({ name: 'Radnja 6', type: 'store', parentId: bezanija._id, ancestors: [srbija._id, gradBeograd._id, noviBeograd._id, bezanija._id] });
    const radnja7 = await Node.create({ name: 'Radnja 7', type: 'store', parentId: neimar._id, ancestors: [srbija._id, gradBeograd._id, vracar._id, neimar._id] });
    const radnja8 = await Node.create({ name: 'Radnja 8', type: 'store', parentId: crveniKrst._id, ancestors: [srbija._id, gradBeograd._id, vracar._id, crveniKrst._id] });
    const radnja9 = await Node.create({ name: 'Radnja 9', type: 'store', parentId: crveniKrst._id, ancestors: [srbija._id, gradBeograd._id, vracar._id, crveniKrst._id] });

    console.log('Created all nodes');

    const hashedPassword = await bcrypt.hash('password123', 10);

    await User.create([
      { name: 'Petar', lastName: 'Petrovic', username: 'petar_ceo', password: hashedPassword, role: 'manager', nodeId: srbija._id },
      { name: 'Ana', lastName: 'Anic', username: 'ana_vojvodina', password: hashedPassword, role: 'manager', nodeId: vojvodina._id },
      { name: 'Marko', lastName: 'Markovic', username: 'marko_beograd', password: hashedPassword, role: 'manager', nodeId: gradBeograd._id },
      { name: 'Jovan', lastName: 'Jovanovic', username: 'jovan_novibeograd', password: hashedPassword, role: 'manager', nodeId: noviBeograd._id },
      { name: 'Milica', lastName: 'Milic', username: 'milica_vracar', password: hashedPassword, role: 'manager', nodeId: vracar._id },
      { name: 'Stefan', lastName: 'Stefanovic', username: 'stefan_subotica', password: hashedPassword, role: 'manager', nodeId: subotica._id },
      { name: 'Nikola', lastName: 'Nikolic', username: 'nikola_novisad', password: hashedPassword, role: 'manager', nodeId: noviSad._id },
      { name: 'Ivana', lastName: 'Ivic', username: 'ivana_radnja1', password: hashedPassword, role: 'manager', nodeId: radnja1._id },
      { name: 'Dragan', lastName: 'Dragic', username: 'dragan_radnja6', password: hashedPassword, role: 'manager', nodeId: radnja6._id },
      { name: 'Jelena', lastName: 'Jelic', username: 'jelena_emp_srbija', password: hashedPassword, role: 'employee', nodeId: srbija._id },
      { name: 'Milan', lastName: 'Milanovic', username: 'milan_emp_vojvodina', password: hashedPassword, role: 'employee', nodeId: vojvodina._id },
      { name: 'Sanja', lastName: 'Sanjic', username: 'sanja_emp_novibeograd', password: hashedPassword, role: 'employee', nodeId: noviBeograd._id },
      { name: 'Dejan', lastName: 'Dejic', username: 'dejan_emp_bezanija', password: hashedPassword, role: 'employee', nodeId: bezanija._id },
      { name: 'Tamara', lastName: 'Tamaric', username: 'tamara_emp_radnja1', password: hashedPassword, role: 'employee', nodeId: radnja1._id },
      { name: 'Igor', lastName: 'Igoric', username: 'igor_emp_radnja6', password: hashedPassword, role: 'employee', nodeId: radnja6._id },
      { name: 'Vesna', lastName: 'Vesic', username: 'vesna_emp_radnja7', password: hashedPassword, role: 'employee', nodeId: radnja7._id },
      { name: 'Bojan', lastName: 'Bojic', username: 'bojan_emp_radnja3', password: hashedPassword, role: 'employee', nodeId: radnja3._id },
    ]);

    console.log('Created all users');
    console.log('\nSeed completed successfully!');
    console.log('\nTest credentials:');
    console.log('  Manager (Srbija - top level): petar_ceo / password123');
    console.log('  Manager (Novi Beograd): jovan_novibeograd / password123');
    console.log('  Employee (Bezanija): dejan_emp_bezanija / password123');

    await mongoose.connection.close();
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seedDatabase();