// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Rewardify {
    string public greeting = "Hello Monad!";

    function setGreeting(string memory _greeting) public {
        greeting = _greeting;
    }
}
