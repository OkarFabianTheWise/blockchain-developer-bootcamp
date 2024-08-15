const config = require('../src/config.json')

async function main() {
	const tokens = (n)=> {
		return ethers.utils.parseUnits(n.toString(), 'ether')
	   }

	  const wait = (seconds) => {
	  	const milliseconds = seconds * 1000
	  	return new Promise(resolve => setTimeout(resolve, milliseconds))
	  }

	// Fetch accounts
	accounts = await ethers.getSigners()
	console.log(`Accounts Fetched:\n${accounts[0].address}\n${accounts[1].address}....\n`)
    
    // Fetch network
    const { chainId } = await ethers.provider.getNetwork()
    console.log(`Using chainId: ${chainId}`)

    // Fetch deployed tokens
    const Dapp = await ethers.getContractAt('Token', config[chainId].Dapp.address)
    console.log(`Dapp Token fetched: ${Dapp.address}`)

    const mETH = await ethers.getContractAt('Token', config[chainId].mETH.address)
    console.log(`mETH Token fetched: ${mETH.address}`)

    const mDAI = await ethers.getContractAt('Token', config[chainId].mDAI.address)
    console.log(`mDAI Token fetched: ${mDAI.address}`)
    
    const Exchange = await ethers.getContractAt('Exchange', config[chainId].exchange.address)
    console.log(`Exchange Token fetched: ${Exchange.address}`)
    
    // Define sender and receiver
    const sender = accounts[0]
    const receiver = accounts[1]
    let amount = tokens(10000)

    
	// Distribute tokens
    // user1 transfers 10,000 ETH
    let transaction, result
    transaction = await mETH.connect(sender).transfer(receiver.address, amount)
    result = await transaction.wait()
    console.log(`Transfered ${amount} tokens from ${sender.address}\n`)

    // Setup Exchange users
    const user1 = accounts[0]
    const user2 = accounts[1]
    amount = tokens(10000)
    
    // User1 approves 10,000 Dapp
    transaction = await Dapp.connect(user1).approve(Exchange.address, amount)
    result = await transaction.wait()
    console.log(`Approved ${amount} tokens from ${user1.address}\n`)

	// Deposit tokens to exchange
	transaction = await Exchange.connect(user1).depositToken(Dapp.address, amount)
    result = await transaction.wait()
    console.log(`Deposited ${amount} Ether from ${user1.address}\n`)

    // User2 approves mETH
    transaction = await mETH.connect(user2).approve(Exchange.address, amount)
    result = await transaction.wait()
    console.log(`Approved ${amount} tokens from ${user2.address}\n`)

	// Deposit mETH tokens to exchange
	transaction = await Exchange.connect(user2).depositToken(mETH.address, amount)
    result = await transaction.wait()
    console.log(`Deposited ${amount} Ether from ${user2.address}\n`)

	// Make orders
	let orderId

	// User1 makes order to get tokens
	transaction = await Exchange.connect(user1).makeOrder(mETH.address, tokens(100), Dapp.address, tokens(5))
	result = await transaction.wait()
	console.log(`makeOrder from ${user1.address}\n`)

	// User1 Cancels order
	orderId = result.events[0].args.id
	transaction = await Exchange.connect(user1).cancelOrder(orderId)
	result = await transaction.wait()
	console.log(`Cancelled Order from ${user1.address}\n`)
    
    // sleep by 1 sec
    await wait(1)

    /////////////////////////////////////////////////////////////////////////
	// Seed Fill orders
    // User1 makes order to get tokens
	transaction = await Exchange.connect(user1).makeOrder(mETH.address, tokens(100), Dapp.address, tokens(10))
	result = await transaction.wait()
	console.log(`makeOrder from ${user1.address}\n`)
    
    orderId = result.events[0].args.id
	transaction = await Exchange.connect(user2).fillOrder(orderId)
	result = await transaction.wait()
	console.log(`Filled Order from ${user2.address}\n`)

    // sleep by 1 sec
    await wait(1)

	// User1 makes another order to get tokens
	transaction = await Exchange.connect(user1).makeOrder(mETH.address, tokens(50), Dapp.address, tokens(15))
	result = await transaction.wait()
	console.log(`makeOrder from ${user1.address}\n`)

	orderId = result.events[0].args.id
	transaction = await Exchange.connect(user2).fillOrder(orderId)
	result = await transaction.wait()
	console.log(`Filled another Order from ${user2.address}\n`)

	// sleep by 1 sec
    await wait(1)

    // User1 makes 3rd order to get tokens
	transaction = await Exchange.connect(user1).makeOrder(mETH.address, tokens(200), Dapp.address, tokens(20))
	result = await transaction.wait()
	console.log(`make 3rd from ${user1.address}\n`)

	orderId = result.events[0].args.id
	transaction = await Exchange.connect(user2).fillOrder(orderId)
	result = await transaction.wait()
	console.log(`Filled another Order from ${user2.address}\n`)
    
    // sleep by 1 sec
    await wait(1)

    //////////////////////////////////////////
    // Seed Open orders
    for(let i =1; i <= 10; i++) {
    	transaction = await Exchange.connect(user1).makeOrder(mETH.address, tokens(10 * i), Dapp.address, tokens(10))
    	result = await transaction.wait()
    	console.log(`USER1 Made order from ${user1.address}`)
    	await wait(1)
    }
     
    // User2 makes 10 orders
    for(let i =1; i <= 10; i++) {
    	transaction = await Exchange.connect(user2).makeOrder(Dapp.address, tokens(10), mETH.address, tokens(10 * i))
    	result = await transaction.wait()
    	console.log(`USER2 Made order from ${user2.address}`)
    	await wait(1)
    }
}

main()
.then(()=> process.exit(0))
.catch((error)=> {
	console.log(error);
	process.exit(1)
})