const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());
const { interface, bytecode } = require('../eth/compile');

let accounts;
let netsBets;

console.log('interface: ' + interface);

beforeEach(async () => {
    // get list of all accounts
    accounts = await web3.eth.getAccounts();
    console.log('accounts[0] ' + accounts[0]);

    //deploy contract
    netsBets = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({ data: bytecode })
        .send({ from: accounts[0], gas: '1000000' })

    await netsBets.methods.placeBet(10).send({
        from: accounts[1],
        value: web3.utils.toWei('0.01', 'ether')
    });
    await netsBets.methods.placeBet(20).send({
        from: accounts[2],
        value: web3.utils.toWei('0.02', 'ether')
    });
    await netsBets.methods.placeBet(30).send({
        from: accounts[3],
        value: web3.utils.toWei('0.03', 'ether')
    });
});

describe('NetsBets Contract', () => {

    it('accounts available', () => {
        console.log(netsBets);
    });
/* 
    it('allows multi accounts to bet', async () => {      
        const totalBetSum = await netsBets.methods.showTotalBetSum().call({
            from: accounts[0]
        });
        
        console.log('totalBetSum wei: ' + totalBetSum);
        console.log('totalBetSum ether: ' + web3.utils.fromWei(totalBetSum, 'ether'));
        assert.equal('0.06', web3.utils.fromWei(totalBetSum, 'ether'));
    });

    it('prize transfer to single winner', async () => {      
        const initialBalance = await web3.eth.getBalance(accounts[1]);
        
        await netsBets.methods.transferPrizeToSingleWinner(10).send({ from: accounts[0] });
        const balanceAfterPrizeTransfer = await netsBets.methods.showTotalBetSum().call({ from: accounts[0] });
        
        const finalBalance = await web3.eth.getBalance(accounts[1]);
        const diff = finalBalance - initialBalance;
        console.log('initialBalance: ' + initialBalance + ' finalBalance: ' + finalBalance);
        console.log('diff: ' + diff);
        
        assert(diff > web3.utils.toWei('0.0599', 'ether')); // diff not included the gas fee
        assert.equal(0, balanceAfterPrizeTransfer);
    });

    it('prize transfer to winners list', async () => {      
        const initialBalance1 = await web3.eth.getBalance(accounts[1]);
        const initialBalance2 = await web3.eth.getBalance(accounts[2]);
        
        await netsBets.methods.transferPrizeToWinnerList([10, 20]).send({ from: accounts[0] });        
        
        const finalBalance1 = await web3.eth.getBalance(accounts[1]);
        const finalBalance2 = await web3.eth.getBalance(accounts[2]);
        const diff1 = finalBalance1 - initialBalance1;
        const diff2 = finalBalance2 - initialBalance2;

        console.log('diff1: ' + diff1);
        console.log('diff2: ' + diff2);
        
        assert.equal(diff1, web3.utils.toWei('0.03', 'ether'));
        assert.equal(diff2, web3.utils.toWei('0.03', 'ether'));
    }); */
})