const BN = require("bn.js");
const { soliditySha3 } = require("web3-utils");
const allAvgs = [];
const l = 0;
let finalArray;
function avr(arr) {
  var totalS = 0;
  for (var i in arr) {
    totalS += arr[i];
  }
  return totalS / arr.length;
}
const maxRandNo = 1000;
let eachRandNum;
const traits = [];
traits.length = 6;
let modif = [1, 0, 0, -1, 2, 0];
let val1;
const moduloArr = [];
var eachNum = new Uint8Array(maxRandNo);

for (let i = 0; i < maxRandNo; i++) {
  eachRandNum = Math.floor(Math.random() * 10 ** 17);
  for (let j = 0; j < traits.length; j++) {
    let val = eachRandNum >>> (j * 8);
    eachNum[i] = val;
    moduloArr.push(eachNum[i]);
    //console.log(val);
    if (eachNum[i] > 99) {
      val1 = eachNum[i] - 100;
    }
    if (eachNum[i] > 99) {
      val = soliditySha3(eachRandNum, j);
      val1 = new BN(val) % 100;
    }
    //console.log(val1);
    traits[j] = val1 + modif[j];
    var total = 0;
    total += traits[j];
    //console.log(traits[j]);
  }
  //console.log("average of", total / 6);
  //console.log(traits);
  //console.log(avr(traits));
  allAvgs.push(avr(traits));
}
console.log(avr(allAvgs));
console.log("modulus array is", avr(moduloArr));
finalArray = Uint8Array.from(moduloArr);
console.log(avr(finalArray));
