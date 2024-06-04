const {expect} = require("chai");
const {ethers} = require("hardhat");

describe("Token", ()=> {
	// Tests go here
	it("has a name", async ()=> {
		// fetch Token from blkchain
		const Token = await ethers.getContractFactory("Token")
		// deployed instance
		let token = await Token.deploy()
		// Read token name
		const name = await token.name()
		// check name is correct
		console.log(`Token Name: ${name}`)
		expect(name).to.equal("My Token")
	})
})