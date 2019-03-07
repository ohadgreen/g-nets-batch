const Web3 = require('web3');
const Tx = require('ethereumjs-tx');
const INFURA_ENDPIONT = "https://rinkeby.infura.io/v3/7e9c3cde23b1417a9ecb5d406cbad449";
const MANAGER_PRIVATE_KEY = 'F14AF6671359CFD57D44949C6710A366C0603DB249BBE6204B8FA2EE8F4EA217';
const MANAGER_ADDRESS = '0x7F05A2FEa6C948Fa46310eb718d12e8f06bD1e31';

const JORDAN_ADDRESS = '0x7ca499ee52834bCEabb754C79B2E27146b2A9D22';
const JORDAN_PRIVATE_KEY = '99ACCBEB4B87234B5050A87D97434C65328E8E7466E7091B2BEDE0AC06900C83';

const MAGIC_ADDRESS = '0xe731cf9aa56e14fcDc23CdB5B0bb6800367A394F';
const MAGIC_PRIVATE_KEY = '1C9B347B72E44C77B85BC54CB34CFB62E0B2128C2A73819409ED9BA0560FC1EA';

const CONTRACT_ADDRESS = '0x40c670CB98d07D2391beFa34Ac17a88296a4Bf6c';
const { interface } = require('./compile');

const web3js = new Web3(new Web3.providers.HttpProvider(INFURA_ENDPIONT));
const contract = new web3js.eth.Contract(JSON.parse(interface), CONTRACT_ADDRESS);

const callContract = async () => {        
    const contractBalance = await contract.methods.showTotalBetSum().call();
    console.log('balance: ' + contractBalance);

    const txnDetails = await placeBetDetails('0.03', MAGIC_ADDRESS, 30);
    // const txnDetails = await transferPrizeToSingleWinnerTxnDetails();
    // const winnerList = [10,20];
    // const txnDetails = await transferPrizeToWinnerListTxnDetails(winnerList);
    console.log('place bet txn details: ' + JSON.stringify(txnDetails));

    const contractTxn = new Tx(txnDetails);
    contractTxn.sign(Buffer.from(MAGIC_PRIVATE_KEY, 'hex'));
    // contractTxn.sign(Buffer.from(MANAGER_PRIVATE_KEY, 'hex'));
    const serializedTxn = contractTxn.serialize();
    const txnId = await web3js.eth.sendSignedTransaction('0x' + serializedTxn.toString('hex'));
    console.log('txnId: ' + JSON.stringify(txnId));
};

callContract();

async function placeBetDetails(betSum, playerAddress, playerCode) {
    const amount = web3js.utils.toHex(web3js.utils.toWei(betSum, 'ether') );
    let nonce = await web3js.eth.getTransactionCount(playerAddress);
    console.log('nonce: ' + nonce);
    //creating raw tranaction
    const placeBetDetails = {
        "from": playerAddress, 
        "gasPrice": web3js.utils.toHex(20 * 1e9),
        "gasLimit": web3js.utils.toHex(210000),
        "to": CONTRACT_ADDRESS,
        "value": amount,
        "data": contract.methods.placeBet(web3js.utils.toHex(playerCode)).encodeABI(),
        "nonce": nonce
    }
    return placeBetDetails;
}

async function transferPrizeToSingleWinnerTxnDetails() {
    const winnerCode = 20;
    let nonce = await web3js.eth.getTransactionCount(MANAGER_ADDRESS);
    console.log('nonce: ' + nonce);
    //creating raw tranaction
    const placeBetDetails = {
        "from": MANAGER_ADDRESS, 
        "gasPrice": web3js.utils.toHex(20 * 1e9),
        "gasLimit": web3js.utils.toHex(210000),
        "to": CONTRACT_ADDRESS,
        "value": "0x0",
        "data": contract.methods.transferPrizeToSingleWinner(web3js.utils.toHex(winnerCode)).encodeABI(),
        "nonce": nonce
    }
    return placeBetDetails;
}

async function transferPrizeToWinnerListTxnDetails(winnerArrayInt) {
    const winnerArrayHex = intArrayToHex(winnerArrayInt);
    const hex10 = web3js.utils.toHex(10);
    const hex20 = web3js.utils.toHex(20);
    console.log('10: ' + hex10 + ' hex20: ' + hex20);

    let nonce = await web3js.eth.getTransactionCount(MANAGER_ADDRESS);
    console.log('nonce: ' + nonce);
    //creating raw tranaction
    const prizeToWinnersTxnDetails = {
        "from": MANAGER_ADDRESS, 
        "gasPrice": web3js.utils.toHex(20 * 1e9),
        "gasLimit": web3js.utils.toHex(210000),
        "to": CONTRACT_ADDRESS,
        "value": "0x0",
        "data": contract.methods.transferPrizeToWinnerList([hex10, hex20]).encodeABI(),
        "nonce": nonce
    }
    return prizeToWinnersTxnDetails;
}

function intArrayToHex(intArray){
    console.log('original int array: ' + JSON.stringify(intArray));
    const hexArray = intArray.map(x => {
        x = x + 0xFFFFFFFF + 1;  // twos complement
        x = x.toString(16); // to hex
        x = ("00000000"+x).substr(-8); // zero-pad to 8-digits
    return x
    }).join('');
    console.log('hex array: ' + hexArray);
}