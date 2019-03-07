pragma solidity ^0.4.17;
contract NetsBets {
        address public manager;
        mapping(uint => address) public players;
    
    constructor () public {
        manager = msg.sender;
    }
    
    function placeBet(uint playerNum) public payable {
        players[playerNum] = msg.sender;
    }
    
    function showTotalBetSum() public view returns (uint256) {
        return address(this).balance;
    }
    
    function transferPrizeToWinnerList(uint[] winnerCodeList) public {
        require(msg.sender == manager);
        uint totalWinners = winnerCodeList.length;
        uint eachPrize;
        if(totalWinners > 0) {
            eachPrize = address(this).balance / totalWinners;
        }
        for (uint i = 0; i < winnerCodeList.length; i++) {
            players[winnerCodeList[i]].transfer(eachPrize);
        }
    }
    
     function transferPrizeToSingleWinner(uint winner) public {
        require(msg.sender == manager);
        players[winner].transfer(address(this).balance);
    }
}