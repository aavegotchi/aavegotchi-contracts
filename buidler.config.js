/* global task usePlugin ethers */

usePlugin('@nomiclabs/buidler-waffle')
usePlugin('buidler-gas-reporter')

// This is a sample Buidler task. To learn how to create your own go to
// https://buidler.dev/guides/create-task.html
task('accounts', 'Prints the list of accounts', async () => {
  const accounts = await ethers.getSigners()

  for (const account of accounts) {
    console.log(await account.getAddress())
  }
})

const fs = require('fs')
const account = fs.readFileSync('.secret', 'utf8')

// You have to export an object to set up your config
// This object can have the following optional entries:
// defaultNetwork, networks, solc, and paths.
// Go to https://buidler.dev/config/ to learn more
module.exports = {
  networks: {
    kovan: {
      url: 'https://kovan.infura.io/v3/37b0df2bfa8d412580671665570d81dc',
      accounts: [account],
      gasPrice: 20000000000
    }
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 100,
    enabled: false
  },
  // This is a sample solc configuration that specifies which version of solc to use
  solc: {
    version: '0.7.1',
    optimizer: {
      enabled: true,
      runs: 20000
    }
  }
}
