const { expect } = require('chai');
const { sideViewsUpgrade } = require('../scripts/upgrades/upgrade-sideViews.js');

describe("Side Views", async function () {
  this.timeout(300000);

  it.only("Should render particular gotchi side view", async function() {
    await sideViewsUpgrade();
    console.log("Test");
  });
});
