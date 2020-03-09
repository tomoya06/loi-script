const fs = require('fs');

const o1 = require('../output.1.json');
const o2 = require('../output.2.json');

const ooo = [...o1, ...o2].sort();

fs.writeFileSync('output.all.json', JSON.stringify(ooo, null, 2).toLowerCase());