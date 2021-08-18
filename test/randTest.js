const BN = require("bn.js");
const { soliditySha3 } = require("web3-utils");
const allAvgs = [];
const l = 0;
function avr(arr) {
  var totalS = 0;
  for (var i in arr) {
    totalS += arr[i];
  }
  return totalS / arr.length;
}
const maxRandNo = 10;
let eachRandNum;
const traits = [];
traits.length = 6;
let modif = [1, 0, 0, -1, 2, 0];
let val1;

for (let i = 0; i < maxRandNo; i++) {
  eachRandNum = Math.floor(Math.random() * 10 ** 17);
  for (let j = 0; j < traits.length; j++) {
    let val = eachRandNum >> (j * 8);
    //console.log(val);
    if (val < 200) {
      val1 = val % 100;
    } else {
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
  console.log(traits);
  //console.log(avr(traits));
  allAvgs.push(avr(traits));
}
console.log(avr(allAvgs));
