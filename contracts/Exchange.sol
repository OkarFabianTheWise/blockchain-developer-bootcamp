// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {
	address public feeAccount;
	uint256 public feePercent;
	// tokenaddress => useraddress => amount
	mapping(address => mapping(address => uint256)) public tokens;

	event Deposit(address indexed token, address indexed user, uint256 amount, uint256 balance);

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
}
