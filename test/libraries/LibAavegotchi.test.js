const { expect } = require("chai");
const { ethers } = require("hardhat");
const truffleAssert = require("truffle-assertions");


describe("LibAavegotchi", () => {

    let Contract;
    beforeEach(async () => {
        const LibAavegotchiTest = await ethers.getContractFactory("LibAavegotchiTest");
        Contract = await LibAavegotchiTest.deploy();
        await Contract.deployed()
    })
   
    
    describe("toNumericTraits", async () => {

    })


    describe("rarityMultiplier", () => {

    })

    describe("singlePortalAavegotchiTraits", () => {

    })

    describe("portalAavegotchiTraits", () => {

    })

    describe("getAavegotchi", () => {

    })

    describe("modifiedTraitsAndRarityScore", () => {

    })

    describe("getNumericTraits", () => {

    })

    describe("kinship", () => {

    })

    describe("xpUntilNextLevel", () => {

        it ('should be 0 when experience is greater than 490050 (level 99) ', async () => {

            const experience = 490051

            const expected = 0

            const xp = await Contract.xpUntilNextLevel(experience)

        
            expect(xp).to.equal(expected)
        })

        it ('should be 50 when experience is 0 (level 1)', async () => {

            const experience = 0

            const expected = 50

            const xp = await Contract.xpUntilNextLevel(experience)

        
            expect(xp).to.equal(expected)
        })

        it ('should return 1 when experience is 1249 (level 5) ', async () => {

            const experience = 1249

            const expected = 1

            const xp = await Contract.xpUntilNextLevel(experience)

        
            expect(xp).to.equal(expected)
        })

    })

    describe("aavegotchiLevel", () => {


        it ('should return 99 when experience is greater than 490050 (level 99)', async () => {

            const experience = 490051

            const expected = 99

            const level = await Contract.aavegotchiLevel(experience)

            expect(level).to.equal(expected)
        })


        it ('should return 1 when experience is 0', async () => {

            const experience = 0

            const expected = 1

            const level = await Contract.aavegotchiLevel(experience)

            expect(level).to.equal(expected)
        })

        it ('should return 5 when experience is 1249', async () => {

            const experience = 1249

            const expected = 5 // Math.sqrt(2 * experience)/10 + 1

            const level = await Contract.aavegotchiLevel(experience)

            expect(level).to.equal(expected)
        })

        it ('should return 6 when experience is 1250', async () => {

            const experience = 1250

            const expected = 6 // Math.sqrt(2 * experience)/10 + 1

            const level = await Contract.aavegotchiLevel(experience)

            expect(level).to.equal(expected)
        })
    })

    describe("interact", () => {

    })

    describe("baseRarityScore", () => {

    })

    describe("purchase", () => {

    })

    describe("sqrt", () => {

        it ('sqrt should return correct value when x is a perfect sqaure', async () => {

            const x = 9

            const expected = 3

            const value = await Contract.sqrt(x);

            expect(value).to.equal(expected);
        })

        it ('sqrt should return correct value when x is not a perfect sqaure', async () => {

            const x = 11

            const expected = 3

            const value = await Contract.sqrt(x);

            expect(value).to.equal(expected);
        })

        it ('sqrt should return 0 when x is 0', async () => {

            const x = 0

            const expected = 0

            const value = await Contract.sqrt(x);

            expect(value).to.equal(expected);
        })
    })

    describe("validateAndLowerName", () => {
        it ('should revert when length is 0', async () => {
            const name = ''

            const expected = "LibAavegotchi: name can't be 0 chars"

            await truffleAssert.reverts(Contract.validateAndLowerName(name), expected);
        })

        it ('should revert when length is 26', async () => {
            const name = 'AAAAAAAAAAAAAAAAAAAAAAAAAA'

            const expected = "LibAavegotchi: name can't be greater than 25 characters";

            await truffleAssert.reverts(Contract.validateAndLowerName(name), expected);
        })

        it ('should revert when first char is a space', async () => {
            const name = ' test'

            const expected = "LibAavegotchi: first char of name can't be a space";

            await truffleAssert.reverts(Contract.validateAndLowerName(name), expected);
        })

        it ('should revert when last char is a space', async () => {
            const name = 'test '

            const expected = "LibAavegotchi: last char of name can't be a space";

            await truffleAssert.reverts(Contract.validateAndLowerName(name), expected);
        })

        it ('should revert when contains char less than 2F', async () => {
            const invalid = "\2F"

            const name = `test${invalid}`

            const expected = `LibAavegotchi: invalid character in Aavegotchi name.`;

            await truffleAssert.reverts(Contract.validateAndLowerName(name), expected);
        })

        it ('should revert when contains char greater than 0x7A', async () => {
            const invalid = "\x7B"

            const name = `test${invalid}`

            const expected = `LibAavegotchi: invalid character in Aavegotchi name.`;

            await truffleAssert.reverts(Contract.validateAndLowerName(name), expected);
        })

        it ('should lowercase string', async () => {
            const name = "LOWERCaSEMe132"

            const expected = "lowercaseme132"

            const res = await Contract.validateAndLowerName(name)

            expect(res).to.equal(expected);
        })
    })

    describe("transfer", () => {

    })




})