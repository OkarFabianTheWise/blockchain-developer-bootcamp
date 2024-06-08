// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Token {
	string public name;
	string public symbol;
	uint256 public decimals = 18;
	uint256 public totalSupply;
    
    // Track balances
    mapping(address => uint256) public balanceOf;
    // Track allowances
    mapping(address => mapping(address => uint256)) public allowance;

    // Event emitting
    event Transfer(
    	address indexed _from, 
    	address indexed _to, 
    	uint256 _value
    );

    event Approval(
    	address indexed owner, 
    	address indexed spender, 
    	uint256 value
    );
    

	constructor(string memory _name, 
		string memory _symbol, 
		uint256 _totalSupply) 
	{
		name = _name;
		symbol = _symbol;
		totalSupply = _totalSupply * (10**decimals);
		balanceOf[msg.sender] = totalSupply;
	}

	// Transfer tokens
	function transfer(address _to, uint256 _value) 
	public 
	returns (bool success) 
	{
		// Require caller has enough tokens to send
		require(balanceOf[msg.sender] >= _value, "Insufficient Amount");
		_transfer(msg.sender, _to, _value);
        return true;
	}

	function _transfer(address _from, 
		address _to, 
		uint256 _value) internal {
		require(_to != address(0));
		// Deduct tokens from sender
		balanceOf[_from] = balanceOf[_from] - _value;
		// Credit tokens to receiver
		balanceOf[_to] = balanceOf[_to] + _value;
		// Emit Event
        emit Transfer(_from, _to, _value);
	}

	function approve(address _spender, uint256 _value) 
	public 
	returns(bool success) {
		// code goes here
		require(_spender != address(0));
		allowance[msg.sender][_spender] = _value;
		emit Approval(msg.sender, _spender, _value);
		return true;
	}

	function transferFrom(address _from,
		address _to, 
		uint256 _value) 
	    public
		returns(bool success) {
		// check approval
		require(_value <= balanceOf[_from]);
		require(_value <= allowance[_from][msg.sender]);
		allowance[_from][msg.sender] = allowance[_from][msg.sender] - _value;
		// Spend tokens
		_transfer(_from, _to, _value);
		return true;
	}
}
