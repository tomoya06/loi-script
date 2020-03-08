const ADODB = require('node-adodb');
const connection = ADODB.open('Provider=Microsoft.Jet.OLEDB.4.0;Data Source=.\\data\\loilang.mdb;Jet OLEDB:Database Password=luiziuim');

process();

async function process() {
  const words = await connection.query('SELECT DISTINCT 字形 FROM 表1');
}