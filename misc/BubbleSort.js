function bubbleSort(items) {
  var length = items.length;
  //Number of passes
  for (var i = 0; i < length; i++) {
    //Notice that j < (length - i)
    for (var j = 0; j < length - i - 1; j++) {
      //Compare the adjacent positions
      if (items[j].totalBehind > items[j + 1].totalBehind) {
        //Swap the numbers
        var tmp = items[j]; //Temporary variable to hold the current number
        items[j] = items[j + 1]; //Replace current number with adjacent number
        items[j + 1] = tmp; //Replace adjacent number with current number
      }
    }
  }

  for (let i = 0; i < length; i++){
      items[i].rank = i + 1;
  }
}

const games = [
  { id: 1, totalBehind: 20, rank: undefined },
  { id: 6, totalBehind: 20, rank: undefined },
  { id: 2, totalBehind: 14.5, rank: undefined },
  { id: 3, totalBehind: 31, rank: undefined },
  { id: 4, totalBehind: 5.5, rank: undefined },
  { id: 5, totalBehind: 6.5, rank: undefined }
];
// bubbleSort(games);
// console.log(games);


function getHour() {
  const today = new Date();
  const hour = new Date().getHours();
  console.log('hour: ' + today.getHours() + ' ' + hour);
};

getHour();
