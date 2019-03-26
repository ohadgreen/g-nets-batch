const Web3 = require('web3');
const Tx = require('ethereumjs-tx');
const keys = require("../config/keys");
const INTERFACE = [{"constant": false,"inputs": [{"name": "playerNum","type": "uint256"}],"name": "placeBet","outputs": [],"payable": true,"stateMutability": "payable","type": "function"},{"constant": false,"inputs": [{"name": "winner","type": "uint256"}],"name": "transferPrizeToSingleWinner","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": false,"inputs": [{"name": "winnerCodeList","type": "uint256[]"}],"name": "transferPrizeToWinnerList","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"inputs": [],"payable": false,"stateMutability": "nonpayable","type": "constructor"},{"constant": true,"inputs": [],"name": "manager","outputs": [{"name": "","type": "address"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": true,"inputs": [{"name": "","type": "uint256"}],"name": "players","outputs": [{"name": "","type": "address"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": true,"inputs": [],"name": "showTotalBetSum","outputs": [{"name": "","type": "uint256"}],"payable": false,"stateMutability": "view","type": "function"}];

const web3js = new Web3(new Web3.providers.HttpProvider(keys.INFURA_ENDPOINT));
const contract = new web3js.eth.Contract(INTERFACE, keys.CONTRACT_ADDRESS);

module.exports = {
    distributePrizeToWinners: async winnerIntCodeList => {
        console.log('contract address: ' + keys.CONTRACT_ADDRESS);
        const txnDetails = await transferPrizeToWinnerListTxnDetails(winnerIntCodeList);
        const contractTxn = new Tx(txnDetails);
        contractTxn.sign(Buffer.from(keys.MANAGER_PRIVATE_KEY, 'hex'));
        const serializedTxn = contractTxn.serialize();
        const txnId = await web3js.eth.sendSignedTransaction('0x' + serializedTxn.toString('hex'));
        return txnId;
    }
}

const callContract = async () => {        
    const contractBalance = await contract.methods.showTotalBetSum().call();
    console.log('balance: ' + contractBalance);

    // const txnDetails = await placeBetDetails('0.01', keys.JORDAN_ADDRESS, keys.JORDAN_INT_CODE);
    // const txnDetails = await transferPrizeToSingleWinnerTxnDetails();

    const winnerIntCodeList = [keys.JORDAN_INT_CODE];
    const txnDetails = await transferPrizeToWinnerListTxnDetails(winnerIntCodeList);
    console.log('place bet txn details: ' + JSON.stringify(txnDetails));

    const contractTxn = new Tx(txnDetails);
    // contractTxn.sign(Buffer.from(keys.JORDAN_PRIVATE_KEY, 'hex'));
    contractTxn.sign(Buffer.from(keys.MANAGER_PRIVATE_KEY, 'hex'));
    const serializedTxn = contractTxn.serialize();
    const txnId = await web3js.eth.sendSignedTransaction('0x' + serializedTxn.toString('hex'));
    console.log('txnId: ' + JSON.stringify(txnId));
};

// callContract();

async function placeBetDetails(betSum, playerAddress, playerCode) {
    const amount = web3js.utils.toHex(web3js.utils.toWei(betSum, 'ether') );
    let nonce = await web3js.eth.getTransactionCount(playerAddress);
    console.log('nonce: ' + nonce);
    //creating raw tranaction
    const placeBetDetails = {
        "from": playerAddress, 
        "gasPrice": web3js.utils.toHex(20 * 1e9),
        "gasLimit": web3js.utils.toHex(210000),
        "to": keys.CONTRACT_ADDRESS,
        "value": amount,
        "data": contract.methods.placeBet(web3js.utils.toHex(playerCode)).encodeABI(),
        "nonce": nonce
    }
    return placeBetDetails;
}

async function transferPrizeToSingleWinnerTxnDetails() {
    const winnerCode = 20;
    let nonce = await web3js.eth.getTransactionCount(keys.MANAGER_ADDRESS);
    console.log('nonce: ' + nonce);
    //creating raw tranaction
    const placeBetDetails = {
        "from": keys.MANAGER_ADDRESS, 
        "gasPrice": web3js.utils.toHex(20 * 1e9),
        "gasLimit": web3js.utils.toHex(210000),
        "to": keys.CONTRACT_ADDRESS,
        "value": "0x0",
        "data": contract.methods.transferPrizeToSingleWinner(web3js.utils.toHex(winnerCode)).encodeABI(),
        "nonce": nonce
    }
    return placeBetDetails;
}

async function transferPrizeToWinnerListTxnDetails(winnerIntCodeList) {
    const winnerArrayHex = intArrayToHexArray(winnerIntCodeList);
    let nonce = await web3js.eth.getTransactionCount(keys.MANAGER_ADDRESS);
    //creating raw tranaction
    const prizeToWinnersTxnDetails = {
        "from": keys.MANAGER_ADDRESS, 
        "gasPrice": web3js.utils.toHex(20 * 1e9),
        "gasLimit": web3js.utils.toHex(210000),
        "to": keys.CONTRACT_ADDRESS,
        "value": "0x0",
        "data": contract.methods.transferPrizeToWinnerList(winnerArrayHex).encodeABI(),
        "nonce": nonce
    }
    return prizeToWinnersTxnDetails;
}

function intArrayToHexArray(intArray){
    // console.log('original int array: ' + JSON.stringify(intArray));
    let hexArray = [];
    intArray.map(intcode => hexArray.push(web3js.utils.toHex(intcode)));
    // console.log('hex array: ' + hexArray);
    return hexArray;
}