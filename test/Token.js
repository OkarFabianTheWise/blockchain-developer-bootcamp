const {expect} = require("chai");
const {ethers} = require("hardhat");

const tokens = (n)=> {
	return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe("Token", ()=> {
	// Tests go here
	let token, accounts, deployer, receiver, exchange

	// Avoid duplicates
	beforeEach(async ()=> {
		// fetch Token from blkchain
		const Token = await ethers.getContractFactory("Token")
		// deployed instance
		token = await Token.deploy("Dapp University", "DAPP", '1000000')
		accounts = await ethers.getSigners()
		deployer = accounts[0]
		receiver = accounts[1]
		exchange = accounts[2]
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
    describe("Sending Tokens", async ()=> {
    	let amount, transaction, result

    	describe("Success", ()=> {
    		beforeEach(async ()=> {
	    		amount = tokens('100')
	    		// Connect
	    		// Transfer token
	    		transaction = await token.connect(deployer).transfer(
	    			receiver.address, 
	    			amount)
	    		result = await transaction.wait()

	    	})

	    	it("transfers token balance", async ()=> {
	    		// Ensure that tokens were transfered (balance changed)
	    		expect(await token.balanceOf(deployer.address)).to.equal(tokens(999900))
	    		expect(await token.balanceOf(receiver.address)).to.equal(amount)
	    	})

	    	it("emits a Transfer event", async()=> {
	    		// dig into result
	    		const eventLog = result.events[0]
	    		expect(eventLog.event).to.equal("Transfer")

	    		const args = eventLog.args
	    		//console.log(args._to)
	    		expect(args._to).to.equal(receiver.address)
	    		expect(args._value).to.equal(amount)
	    		//console.log(event)
    		})
    	})

    	describe("Failure", ()=> {
    		it("rejects insufficient balances", async ()=> {
    			// Transfer more tokens than dedployer has
    			const invalidAmount = tokens(10000000)
    			await expect(token.connect(
    				deployer
    				).transfer(
    				receiver.address, 
    				invalidAmount)).to.be.reverted
    		})

    		it("rejects invalid recipient", async ()=> {
    			await expect(token.connect(deployer).transfer("0x0000000000000000000000000000000000000000", amount)).to.be.reverted
    		})
    	})

    })

	// Describe approving...
    describe("Approving Tokens", ()=> {
    	let amount, transaction, result

    	beforeEach(async ()=> {
    		amount = tokens(100)
    		transaction = await token.connect(deployer).approve(
    			exchange.address, 
    			amount)
    		result = await transaction.wait()
    	})

    	describe("Success", async ()=> {
            //
            it("allocates an allowance for delegated token spender", async ()=> {
            	expect(await token.allowance(deployer.address, 
            		exchange.address)).to.equal(amount)
            })

            it("emits on Approval event", async()=> {
	    		// dig into result
	    		const eventLog = result.events[0]
	    		expect(eventLog.event).to.equal("Approval")

	    		const args = eventLog.args
	    		//console.log(args._to)
	    		expect(args.owner).to.equal(deployer.address)
	    		expect(args.spender).to.equal(exchange.address)
	    		expect(args.value).to.equal(amount)
	    		//console.log(event)
    		})
    	})

    	describe("Failure", async ()=> {
    		//
    		it("rejects invalid spenders", async ()=> {
    			await expect(token.connect(deployer).approve("0x0000000000000000000000000000000000000000", amount)).to.be.reverted
    		})
    	})
    })

	// Describe ...
	describe("Delegated Token Transfers", ()=> {
		let amount, transaction, result

		beforeEach(async ()=> {
    		amount = tokens(100)
    		transaction = await token.connect(deployer).approve(
    			exchange.address, 
    			amount)
    		result = await transaction.wait()
    	})

		describe("Success", async ()=> {
			beforeEach(async ()=> {
	    		amount = tokens(100)
	    		transaction = await token.connect(exchange).transferFrom(
	    			deployer.address, receiver.address, 
	    			amount)
	    		result = await transaction.wait()
    	    })

    	    it("transfers token balances", async ()=> {
    			expect(await token.balanceOf(deployer.address)).to.be.equal(ethers.utils.parseUnits('999900', 'ether'))
    			expect(await token.balanceOf(receiver.address)).to.be.equal(amount)
	    	})
	    	it("resets the allowance", async ()=> {
    			expect(await token.allowance(deployer.address, exchange.address)).to.be.equal(0)
    			expect(await token.balanceOf(receiver.address)).to.be.equal(amount)
	    	})
	    	it("emits a Transfer event", async()=> {
	    		// dig into result
	    		const eventLog = result.events[0]
	    		expect(eventLog.event).to.equal("Transfer")

	    		const args = eventLog.args
	    		//console.log(args._to)
	    		expect(args._to).to.equal(receiver.address)
	    		expect(args._value).to.equal(amount)
	    		//console.log(event)
    		})
		})

		describe("Failure", async ()=> {
			// Attempt to send too many tokens
			const invalidAmount = tokens(100000000)
			await expect(token.connect(exchange).transferFrom(
	    			deployer.address, receiver.address, 
	    			invalidAmount)).to.be.reverted
		})
	})

})
