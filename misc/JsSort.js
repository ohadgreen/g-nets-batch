function printArray(array) {
    array.map((b, i) => console.log(`${i} - ${b.score}`));
};

function jsSort (array) {
    return array.sort((a, b) => { return (a.score - b.score)});
};

let bets = [ 
    {
        "winner" : "homeTeam",
        "pointsDiff" : 3,
        "betString" : "Nets by 3",
        "score" : 0,
        "rank" : 99
    }, 
    {
        "winner" : "awayTeam",
        "pointsDiff" : 7,
        "betString" : "Bucks by 7",
        "score" : 2,
        "rank" : 3
    }, 
    {   
        "winner" : "awayTeam",
        "pointsDiff" : 10,
        "betString" : "Bucks by 10",
        "score" : 7,
        "rank" : 1
    },
    {   
        "winner" : "awayTeam",
        "pointsDiff" : 10,
        "betString" : "Bucks by 10",
        "score" : 4,
        "rank" : 2
    },
    {
        "winner" : "homeTeam",
        "pointsDiff" : 3,
        "betString" : "Nets by 3",
        "score" : 0,
        "rank" : 99
    }, 
];

console.log('original array');
printArray(bets);
const orderedArray = jsSort(bets);
console.log('ordered array');
printArray(orderedArray);
