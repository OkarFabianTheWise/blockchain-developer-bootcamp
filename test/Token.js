const {expect} = require("chai");
const {ethers} = require("hardhat");

const tokens = (n)=> {
	return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe("Token", ()=> {
	// Tests go here
	let token, accounts, deployer

	// Avoid duplicates
	beforeEach(async ()=> {
		// fetch Token from blkchain
		const Token = await ethers.getContractFactory("Token")
		// deployed instance
		token = await Token.deploy("Dapp University", "DAPP", '1000000')
		accounts = await ethers.getSigners()
		deployer = accounts[0]
	})

	describe("Deployment", ()=> {
        const name = "Dapp University"
        const symbol = "DAPP"
        const decimals = "18"
        const totalSupply = tokens("1000000")
		it("has a name", async ()=> {
			console.log(`Token Name: ${name}`)
			expect(await token.name()).to.equal("Dapp University")
		  })

	    it("has correct symbol", async ()=> {
			// Read token symbol
			// check symbol is correct
			expect(await token.symbol()).to.equal("DAPP")
		})

		it("has correct decimals", async ()=> {
			// Read token decimals
			// check decimals is correct
			expect(await token.decimals()).to.equal(18)
		})

		it("has correct totalSupply", async ()=> {
			// Read token totalSupply
			// check totalSupply is correct
			expect(await token.totalSupply()).to.equal(tokens('1000000'))
		})

		it("assigns totalSupply", async ()=> {
			// Read token totalSupply
			// check totalSupply is correct
			console.log(`deployer: ${deployer.address}`)
			expect(await token.balanceOf(deployer.address)).to.equal(totalSupply)
		})
	})

	// Describe Spending...

	// Describe approving...

	// Describe ...

})
