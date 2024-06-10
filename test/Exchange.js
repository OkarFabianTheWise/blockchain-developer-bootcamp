const {expect} = require("chai");
const {ethers} = require("hardhat");

const tokens = (n)=> {
	return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe("Exchange", ()=> {
	// Tests go here
	let deployer, feeAccount, feePercent, exchange

	// Avoid duplicates
	beforeEach(async ()=> {
		// fetch Token from blkchain
		feePercent = 10
		accounts = await ethers.getSigners()
		deployer = accounts[0]
		feeAccount = accounts[1]
		const Exchange = await ethers.getContractFactory("Exchange")
		// deployed instance
		exchange = await Exchange.deploy(feeAccount.address, feePercent)
	})

	describe("Deployment", ()=> {
        
        it("tracks the fee account", async ()=> {
        	expect(await exchange.feeAccount()).to.equal(feeAccount.address)
        })

        it("tracks the fee percent", async ()=> {
        	expect(await exchange.feePercent()).to.equal(feePercent)
        })

		
	})


})
