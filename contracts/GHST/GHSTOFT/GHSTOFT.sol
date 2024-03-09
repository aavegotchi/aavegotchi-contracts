import {OFT} from "./oft/OFT.sol";

pragma solidity ^0.8.20;

///////////////////////////////////////////////
// This contract must be deployed to the DESTINATION chain
///////////////////////////////////////////////

contract GHSTOFT is OFT {
    constructor(string memory _name, string memory _symbol, address _lzEndpoint, address _delegate) OFT(_name, _symbol, _lzEndpoint, _delegate) {}
}
