const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const { interface, bytecode } = require('./compile');
const keys = require("../config/keys");

console.log('mneumonic: ', keys.MNEUMONIC);
console.log('infura url: ', keys.INFURA_URL);

const provider = new HDWalletProvider(
    keys.MNEUMONIC, //mneumonic for the rinkeby account
    keys.INFURA_URL //infura endpoint
);

const web3 = new Web3(provider);

// async-await can only be used inside of functions
const deploy = async () => {
    const accounts = await web3.eth.getAccounts();
    console.log('trying to deploy from account:', accounts[0]);

    const result =await new web3.eth.Contract(JSON.parse(interface)) // contract interface = ABI
        .deploy({ data: '0x' + bytecode })
        .send({ gas: '1000000', from: accounts[0] });
        console.log('interface: ', interface);
        
        console.log('contract deployed to: ', result.options.address);
        // 0x40c670CB98d07D2391beFa34Ac17a88296a4Bf6c     
};

deploy();