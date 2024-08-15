const {expect} = require("chai");
const {ethers} = require("hardhat");

const tokens = (n)=> {
	return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe("Exchange", ()=> {
	// Tests go here
	let deployer, feeAccount, feePercent, exchange, user1, token1

	// Avoid duplicates
	beforeEach(async ()=> {
		const Exchange = await ethers.getContractFactory("Exchange")
		const Token = await ethers.getContractFactory("Token")

        //Deploy tokens
		token1 = await Token.deploy("Dapp University", "Dapp", "1000000")
		token2 = await Token.deploy("Mock Dai", "mDAI", "1000000")

		// fetch Token from blkchain
		feePercent = 10
		accounts = await ethers.getSigners()
		deployer = accounts[0]
		feeAccount = accounts[1]
		user1 = accounts[2]
		user2 = accounts[3]
		
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

	}) // Deployment

	describe("Depositing Tokens", ()=> {
		let transaction, result
		let amount = tokens(10)

		beforeEach(async ()=> {
			transaction = await token1.connect(deployer).transfer(user1.address, amount)
			result = await transaction.wait()
			transaction = await token1.connect(user1).approve(exchange.address, amount)
			result = await transaction.wait()
			transaction = await exchange.connect(user1).depositToken(token1.address, amount)
			result = await transaction.wait()
		})

		describe("Success", async()=> {
			it("tracks token deposit", async()=> {
				expect(await token1.balanceOf(exchange.address)).to.equal(amount)
				expect(await exchange.tokens(token1.address, 
					user1.address)).to.equal(amount)
				expect(await exchange.balanceOf(token1.address, 
					user1.address)).to.equal(amount)
			})

			it("emits on Deposit event", async()=> {
	    		// dig into result
	    		const eventLog = result.events[1]
	    		expect(eventLog.event).to.equal("Deposit")

	    		const args = eventLog.args
	    		//console.log(args._to)
	    		expect(args.token).to.equal(token1.address)
	    		expect(args.user).to.equal(user1.address)
	    		expect(args.amount).to.equal(amount)
	    		expect(args.balance).to.equal(amount)
    		})
		})
		describe("Failure", async()=> {
			it("emits fails when no tokens are approved", async()=> {
				await expect(exchange.connect(user1).depositToken(token1.address, amount)).to.be.reverted
			})
		})
	})

	describe("Withdrawing Tokens", ()=> {
		let transaction, result
		let amount = tokens(10)

		beforeEach(async ()=> {
			transaction = await token1.connect(deployer).transfer(user1.address, amount)
			result = await transaction.wait()
			transaction = await token1.connect(user1).approve(exchange.address, amount)
			result = await transaction.wait()
			transaction = await exchange.connect(user1).depositToken(token1.address, amount)
			result = await transaction.wait()
			transaction = await exchange.connect(user1).withdrawTokens(token1.address, amount)
			result = await transaction.wait()
		})

		describe("Success", async()=> {
			it("tracks token withdrawal", async()=> {
				expect(await token1.balanceOf(exchange.address)).to.equal(0)
				expect(await exchange.tokens(token1.address, 
					user1.address)).to.equal(0)
				expect(await token1.balanceOf(user1.address)).to.equal(amount)
			})

			it("emits a Withdraw event", async()=> {
	    		// dig into result
	    		const eventLog = result.events[1]
	    		expect(eventLog.event).to.equal("Withdraw")

	    		const args = eventLog.args
	    		//console.log(args._to)
	    		expect(args.token).to.equal(token1.address)
	    		expect(args.user).to.equal(user1.address)
	    		expect(args.amount).to.equal(amount)
	    		expect(args.balance).to.equal(0)
    		})
		})
		describe("Failure", async()=> {
			it("fails for insufficient balance", async()=> {
				await expect(exchange.connect(user1).withdrawTokens(token1.address, amount)).to.be.reverted
			})
		})
	}) // Withdrawing

    describe("Checking Balances", ()=> {
		let transaction, result
		let amount = tokens(1)

		beforeEach(async ()=> {
			transaction = await token1.connect(deployer).transfer(user1.address, amount)
			result = await transaction.wait()
			transaction = await token1.connect(user1).approve(exchange.address, amount)
			result = await transaction.wait()
			transaction = await exchange.connect(user1).depositToken(token1.address, amount)
			result = await transaction.wait()
		})

		describe("Success", async()=> {
			it("it returns balance", async()=> {
				//expect(await token1.balanceOf(exchange.address)).to.equal(amount)
				expect(await exchange.tokens(token1.address, 
					user1.address)).to.equal(amount)
			})

		})
	})

	describe("Making Orders", ()=> {

		let transaction, result
        let amount = tokens(10)
		

		describe("Success", async()=> {
			beforeEach(async ()=> {
				transaction = await token1.connect(deployer).transfer(user1.address, amount)
				result = await transaction.wait()

				transaction = await token1.connect(
					user1
					).approve(
					exchange.address, 
					amount)
				result = await transaction.wait()

				transaction = await exchange.connect(
					user1
					).depositToken(
					token1.address, 
					amount)
				result = await transaction.wait()

				transaction = await exchange.connect(
					user1
					).makeOrder(
					token2.address, 
					tokens(5), 
					token1.address, 
					tokens(5))
				result = await transaction.wait()
			})

			
			it("it tracks newly created order", async()=> {
				expect(await exchange.ordersCount()).to.equal(1)
			})

			it("emits an Order event", async()=> {
	    		// dig into result
	    		const eventLog = result.events[0]
	    		expect(eventLog.event).to.equal("Order")

	    		const args = eventLog.args
	    		expect(args.id).to.equal(1)
	    		expect(args.user).to.equal(user1.address)
	    		expect(args.tokenGet).to.equal(token2.address)
	    		expect(args.amountGet).to.equal(tokens(5))
	    		expect(args.tokenGive).to.equal(token1.address)
	    		expect(args.amountGive).to.equal(tokens(5))
	    		expect(args.timestamp).to.at.least(1)
    		})

		})

		describe("Failure", async()=> {
			it("rejects orders with no balance", async()=> {
				await expect(exchange.connect(
				user1
				).makeOrder(
				token2.address, 
				tokens(5), 
				token1.address, 
				tokens(5))).to.be.reverted
			})

		})
	})

	describe("Order actions", async ()=> {
		let transaction, result
        let amount = tokens(2)

		beforeEach(async ()=> {
			// Give tokens to user1
		    transaction = await token1.connect(deployer).transfer(user1.address, amount)
		    result = await transaction.wait()

			// user1 deposits tokens
		    transaction = await token1.connect(user1).approve(exchange.address, amount)
		    result = await transaction.wait()

		    transaction = await exchange.connect(user1).depositToken(token1.address, tokens(1))
		    result = await transaction.wait()

			// Give tokens to user2
		    transaction = await token2.connect(deployer).transfer(user2.address, tokens(100))
		    result = await transaction.wait()

		    // user2 deposits tokens
		    transaction = await token2.connect(user2).approve(exchange.address, amount)
		    result = await transaction.wait()

		    transaction = await exchange.connect(user2).depositToken(token2.address, amount)
		    result = await transaction.wait()

		    // Make an order
		    transaction = await exchange.connect(user1).makeOrder(token2.address, tokens(1), token1.address, tokens(1))
		    result = await transaction.wait()
		})

		// Cancel Test
		describe("Cancelling orders", async ()=> {
			beforeEach(async () => {
		        transaction = await exchange.connect(user1).cancelOrder(1)
		    	result = await transaction.wait()
	        })

		    describe("Success", async ()=> {
				//
				it("updates cancel Orders", async ()=> {
			    	expect(await exchange.orderCancelled(1)).to.equal(true)
			    })

			    it("emits a Cancel event", async()=> {
		    		// dig into result
		    		const eventLog = result.events[0]
		    		expect(eventLog.event).to.equal("Cancel")

		    		const args = eventLog.args
		    		expect(args.id).to.equal(1)
		    		expect(args.user).to.equal(user1.address)
		    		expect(args.tokenGet).to.equal(token2.address)
		    		expect(args.amountGet).to.equal(tokens(1))
		    		expect(args.tokenGive).to.equal(token1.address)
		    		expect(args.amountGive).to.equal(tokens(1))
		    		expect(args.timestamp).to.at.least(1)
	    		})
			})

			describe("Failure", async ()=> {
				it("rejects invalid id", async ()=> {
					await expect(exchange.connect(user1).cancelOrder(999)).to.be.reverted
				})
				it("rejects unauthorized cancellation", async ()=> {
					await expect(exchange.connect(user2).cancelOrder(999)).to.be.reverted
				})

			})

	    })

	    describe('Filling orders', async () => {
	    	describe('Success', () => {

		        beforeEach(async () => {
		        	// user2 fills order
		            transaction = await exchange.connect(user2).fillOrder(1)
		            result = await transaction.wait()
		        })

		        it('executes the trade and charge fees', async () => {
		        	// Token Give
		            expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(tokens(0))
		            expect(await exchange.balanceOf(token1.address, user2.address)).to.equal(tokens(1))
		            expect(await exchange.balanceOf(token1.address, feeAccount.address)).to.equal(tokens(0))
		            // Token get
		            expect(await exchange.balanceOf(token2.address, user1.address)).to.equal(tokens(1))
		            expect(await exchange.balanceOf(token2.address, user2.address)).to.equal(tokens(0.9))
		            expect(await exchange.balanceOf(token2.address, feeAccount.address)).to.equal(tokens(0.1))
		        })

		        it('updates filled orders', async () => {
		            expect(await exchange.orderFilled(1)).to.equal(true)
		        })

		        it('emits a Trade event', async () => {
		            const event = result.events[0]
		            expect(event.event).to.equal('Trade')

		            const args = event.args
		            expect(args.id).to.equal(1)
		            expect(args.user).to.equal(user2.address)
		            expect(args.tokenGet).to.equal(token2.address)
		            expect(args.amountGet).to.equal(tokens(1))
			        expect(args.tokenGive).to.equal(token1.address)
			        expect(args.amountGive).to.equal(tokens(1))
			        expect(args.creator).to.equal(user1.address)
			        expect(args.timestamp).to.at.least(1)
		        })

		    })

		    describe('Failure', () => {
		        it('rejects invalid order ids', async () => {
			        const invalidOrderId = 99999
			        await expect(exchange.connect(user2).fillOrder(invalidOrderId)).to.be.reverted
		        })

		        it('rejects already filled orders', async () => {
			        transaction = await exchange.connect(user2).fillOrder(1)
			        await transaction.wait()

			        await expect(exchange.connect(user2).fillOrder(1)).to.be.reverted
		        })

		        it('Rejects canceled orders', async () => {
			        transaction = await exchange.connect(user1).cancelOrder(1)
			        await transaction.wait()

			        await expect(exchange.connect(user2).fillOrder(1)).to.be.reverted
		        })

		    })

		})

	})

})
