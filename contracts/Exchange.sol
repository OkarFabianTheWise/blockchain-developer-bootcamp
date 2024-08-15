// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {
	address public feeAccount;
	uint256 public feePercent;
	// tokenaddress => useraddress => amount
	mapping(address => mapping(address => uint256)) public tokens;
    mapping(uint256 => _Order) public orders;
    mapping(uint256 => bool) public orderCancelled; // true or false (boolean / bool)
    mapping(uint256 => bool) public orderFilled;

    uint256 public ordersCount;

	event Deposit(
		address indexed token, 
		address indexed user, 
		uint256 amount, 
		uint256 balance
	);

	event Withdraw(
		address indexed token, 
		address indexed user, 
		uint256 amount, 
		uint256 balance
		);
    
    event Order(
		uint256 id,
		address user,
		address tokenGet,
		uint256 amountGet,
		address tokenGive,
		uint256 amountGive,
		uint256 timestamp
	);

	event Cancel(
		uint256 id,
		address user,
		address tokenGet,
		uint256 amountGet,
		address tokenGive,
		uint256 amountGive,
		uint256 timestamp
	);
    // emit a trade event
	event Trade(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        address creator,
        uint256 timestamp
    );

	struct _Order {
		// Attributes
		uint256 id; // Unique identifier for order
		address user; // user who made order
		address tokenGet; // Token to receive
		uint256 amountGet; // amount of token they receive
		address tokenGive; // address of token they pay
		uint256 amountGive; // amount they pay
		uint256 timestamp; // when Order was created
	}

	constructor(address __feeAccount, uint256 _feePercent) {
		feeAccount = __feeAccount;
		feePercent = _feePercent;
	}

	// Deposit tokens
	function depositToken(address _token, uint256 _amount) public {
		// Transfer tokens to exchange
		require(Token(_token).transferFrom(msg.sender, address(this), _amount), "transferFrom failed");
		// Update user balance
		tokens[_token][msg.sender] = tokens[_token][msg.sender] + _amount;
		// Emit an event
		emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
	}

	// Check balance
	function balanceOf(address _token, address _user) 
	public 
	view 
	returns (uint256) 
	{
		//
		return tokens[_token][_user];
	}

	// Withdraw from Exchange
	function withdrawTokens(
		address _token, 
		uint256 _amount
	) 
	public
	 {
		// require if balance is enough
		require(tokens[_token][msg.sender] >= _amount, "Insufficient User Balance");
		
		// Transfer tokens to user
		Token(_token).transfer(msg.sender, _amount);

		// Update user balance
		tokens[_token][msg.sender] = tokens[_token][msg.sender] - _amount;

        // Emit an event
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
	}
    // ----------------------
	// Make And Cancel Orders

	// Token Give(Token they wonna spend) - which token and how much
	// Token Get(Token they wonna receive) - which token and how much
	function makeOrder(
		address _tokenGet, 
		uint256 _amountGet, 
		address _tokenGive, 
		uint256 _amountGive
	) 
	public
	{
		// Require token balance
		require(balanceOf(_tokenGive, msg.sender) >= _amountGive);
		ordersCount = ordersCount + 1;
		uint256 timing = block.timestamp;
		orders[ordersCount] = _Order(
			ordersCount, // id
			msg.sender, // User
			_tokenGet, // tokenGet
			_amountGet, // amountGet
			_tokenGive, // tokenGive
			_amountGive, // amountGive
			timing // timestamp
		);

		// Emit event
		emit Order(
			ordersCount, 
			msg.sender, 
			_tokenGet, 
			_amountGet, 
			_tokenGive, 
			_amountGive,
			timing
		);
	}

	function cancelOrder(uint256 _id) public {
		// Fetch Order
		_Order storage _order = orders[_id];

        // Order must exist
		require(_order.id == _id);

		// Ensure caller is owner of order
		require(address(_order.user) == msg.sender);
		
		// Cancel Order
		orderCancelled[_id] = true;

		// Emit event
		emit Cancel(
			_order.id, 
			msg.sender, 
			_order.tokenGet, 
			_order.amountGet, 
			_order.tokenGive, 
			_order.amountGive,
			block.timestamp
		);
	}

	// ------------------------
    // EXECUTING ORDERS

    function fillOrder(uint256 _id) public {
    	// Debug: print orderCount and _id
	    // console.log("Order Count:", ordersCount);
	    // console.log("Order ID:", _id);
        // 1. Must be valid orderId
        require(_id > 0 && _id <= ordersCount, "Order does not exist");
        // 2. Order can't be filled
        require(!orderFilled[_id]);
        // 3. Order can't be cancelled
        require(!orderCancelled[_id]);

        // Fetch order
        _Order storage _order = orders[_id];

        // Execute the trade
        _trade(
            _order.id,
            _order.user,
            _order.tokenGet,
            _order.amountGet,
            _order.tokenGive,
            _order.amountGive
        );

        // Mark order as filled
        orderFilled[_order.id] = true;
    }

    function _trade(
        uint256 _orderId,
        address _user,
        address _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive
    ) internal {
        // Fee is paid by the user who filled the order (msg.sender)
        // Fee is deducted from _amountGet
        uint256 _feeAmount = (_amountGet * feePercent) / 100;
        // Execute the trade
        // msg.sender is the user who filled the order, while _user is who created the order
        // console.log("tokens[_tokenGet][msg.sender]:", tokens[_tokenGet][msg.sender]);

        tokens[_tokenGet][msg.sender] =
            tokens[_tokenGet][msg.sender] -
            (_amountGet + _feeAmount);

        tokens[_tokenGet][_user] = tokens[_tokenGet][_user] + _amountGet;

        // Charge fees
        tokens[_tokenGet][feeAccount] =
            tokens[_tokenGet][feeAccount] +
            _feeAmount;

        tokens[_tokenGive][_user] = tokens[_tokenGive][_user] - _amountGive;
        tokens[_tokenGive][msg.sender] =
            tokens[_tokenGive][msg.sender] +
            _amountGive;

        // Emit trade event
        emit Trade(
            _orderId,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            _user,
            block.timestamp
        );
    }

}
