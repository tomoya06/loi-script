const fs = require('fs');
const _ = require('lodash');

const output = require('../output.all.json');

output.forEach(item => {
  const { pys, eg, add } = item;
  pys.forEach((pyItem, idx) => {
    if (!pyItem.py) {
      item.add.pycs = pys.splice(idx, 1).map(({ def }) => def);
    } else {
      const parsedPys = pyItem.py.match(/(\[\w+(?:(?:（.+）)?)\])/g).map(_pyItem => _pyItem.replace(/[\[\]）]/g, '').replace(/（/, '='));
      pyItem.pys = parsedPys;
      pyItem.jpys = parsedPys.map(py => py.replace(/[^a-z\s]/g, '').replace(/\s+/g, ' '))
      delete pyItem.py;
      delete pyItem.pid;
      delete pyItem.nid;
    }
  })
  
  item.defs = [...pys];
  delete item.pys;
  delete item.add;
  if (add) {
    item.add = add;
  }
  
  if (eg) {
    delete item.eg;
    item.egs = _.flatten(eg.map(egItem => egItem.egs));
    item.egs.forEach((egItem, idx) => {
      if (egItem.pys.some(pyList => pyList.some(pyListItem => pyListItem.match(/\]\[/)))) {
        console.log(egItem.w);
      }
      egItem.pys = egItem.pys.map(pyList => pyList.map(_pyItem => _pyItem.replace(/[\[\]）]/g, '').replace(/（/, '=')));
      egItem.jpys = egItem.pys.map(py => py.join(' ').replace(/[^a-z\s]/g, '').replace(/\s+/g, ' '));
      egItem.nid = idx;
    })
  }

})

fs.writeFileSync('./output.all.update.json', JSON.stringify(output, undefined, 2));
