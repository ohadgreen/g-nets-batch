const path = require('path');
const fs = require('fs');
const solc = require('solc');

const contractPath = path.resolve(__dirname, 'contracts', 'netsBetsContract.sol');
const source = fs.readFileSync(contractPath, 'utf8');
const compiledContract = solc.compile(source, 1);

// console.log(compiledContract);
module.exports = compiledContract.contracts[':NetsBets'];
