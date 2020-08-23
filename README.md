# Aavegotchi Contracts



## Storing SVGs Layers on the Blockchain

There are two ways to store data on the Ethereum blockchain: contract storage and storing data as contracts.

I did actual testing on a test blockchain network and discovered these metrics:

Metrics:

* Storing 1000 bytes in contract storage is 722,017 gas.

* Storing 1000 bytes as a contract is 313,810 gas.

* Storing 200 bytes in contract storage 207,455 gas.

* Storing 200 bytes as a contract is 140,681 gas.

Storing bytes as a contract has a high fixed cost: 21,000 for the transaction, 20,000 for contract storage, 31,000 for creating a contract.

Fixed cost: 21,000 + 20,000 + 31,000 = 72,000 gas

The total cost is the fixed cost plus between 343.4 and 241.81 gas per byte.

Because of the high fixed gas cost it makes sense to add multiple SVG files to the blockchain in one transaction and store them together as a single contract.
So I implemented the `setSVGContract` function to do that.

Calling the `setSVGContract` function with 10 SVG files, each 1000 bytes in size reduces the gas cost of storing 1000 bytes of data to 245,426 gas.  All 10 SVG files are stored as a single contract. This is not theoretical but results from actual testing.  

This is good because we probably want to upload multiple SVG files to the blockchain at the same time anyway.

Any number of SVG files can be stored as the same contract until their combined size reaches 24KB, which is the max contract size limit.

## SVG Retrieval 

Retrieving SVG files from the blockchain is easy. Each SVG has a unique identifier.  A contract function such as `getSVG(uint _id)` is called that returns an SVG file as a string.  The identifiers start at 0 and increment each time a new SVG is uploaded to the blockchain. 





