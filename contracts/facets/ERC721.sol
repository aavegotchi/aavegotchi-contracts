// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "../libs/ALib.sol";

/// @dev Note: the ERC-165 identifier for this interface is 0x150b7a02.
interface ERC721TokenReceiver {
    /// @notice Handle the receipt of an NFT
    /// @dev The ERC721 smart contract calls this function on the recipient
    ///  after a `transfer`. This function MAY throw to revert and reject the
    ///  transfer. Return of other than the magic value MUST result in the
    ///  transaction being reverted.
    ///  Note: the contract address is always the message sender.
    /// @param _operator The address which called `safeTransferFrom` function
    /// @param _from The address which previously owned the token
    /// @param _tokenId The NFT identifier which is being transferred
    /// @param _data Additional data with no specified format
    /// @return `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
    ///  unless throwing
    function onERC721Received(address _operator, address _from, uint256 _tokenId, bytes calldata _data) external returns(bytes4);
}


contract ERC721 {

    bytes4 private constant ERC721_RECEIVED = 0x150b7a02;

    event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);

    /// @dev This emits when the approved address for an NFT is changed or
    ///  reaffirmed. The zero address indicates there is no approved address.
    ///  When a Transfer event emits, this also indicates that the approved
    ///  address for that NFT (if any) is reset to none.
    event Approval(address indexed _owner, address indexed _approved, uint256 indexed _tokenId);

    /// @dev This emits when an operator is enabled or disabled for an owner.
    ///  The operator can manage all NFTs of the owner.
    event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved);

    function mintAavegotchi(bytes32 _traits) external {
        ALib.Storage storage aStorage = ALib.getStorage();
        uint tokenId = aStorage.totalSupply++;
        uint32 ownerIndex = uint32(aStorage.aavegotchis[msg.sender].length);
        aStorage.aavegotchis[msg.sender].push(tokenId);
        aStorage.owner[tokenId] = ALib.OwnerAndIndex({owner: msg.sender, index: ownerIndex});
        aStorage.traits[tokenId] = _traits;
    }

    function getAavegotchi(uint _tokenId) external view returns(string memory ag) {
        ALib.Storage storage aStorage = ALib.getStorage();
        SVGStorage svgStorage = aStorage.svgStorage;
        bytes32 traits = aStorage.traits[_tokenId];
        require(traits != 0, "ERC721: _tokenId does not exist");
        uint svgId;
        bytes memory svg;
        for(uint i; i < 16; i++) {
            svgId = uint((traits << i*16) >> 240);
            if(svgId > 0) {
                svg = abi.encodePacked(svg, svgStorage.getSVGLayer(svgId));
            }
            else {
                ag = string(svg);
                break;
            }

        }
    }

    /// @notice Count all NFTs assigned to an owner
    /// @dev NFTs assigned to the zero address are considered invalid, and this
    ///  function throws for queries about the zero address.
    /// @param _owner An address for whom to query the balance
    /// @return balance The number of NFTs owned by `_owner`, possibly zero
    function balanceOf(address _owner) external view returns (uint256 balance) {
        ALib.Storage storage aStorage = ALib.getStorage();
        balance = aStorage.aavegotchis[_owner].length;
    }

    /// @notice Find the owner of an NFT
    /// @dev NFTs assigned to zero address are considered invalid, and queries
    ///  about them do throw.
    /// @param _tokenId The identifier for an NFT
    /// @return owner The address of the owner of the NFT
    function ownerOf(uint256 _tokenId) external view returns (address owner) {
        ALib.Storage storage aStorage = ALib.getStorage();
        owner = aStorage.owner[_tokenId].owner;
    }

    /// @notice Transfers the ownership of an NFT from one address to another address
    /// @dev Throws unless `msg.sender` is the current owner, an authorized
    ///  operator, or the approved address for this NFT. Throws if `_from` is
    ///  not the current owner. Throws if `_to` is the zero address. Throws if
    ///  `_tokenId` is not a valid NFT. When transfer is complete, this function
    ///  checks if `_to` is a smart contract (code size > 0). If so, it calls
    ///  `onERC721Received` on `_to` and throws if the return value is not
    ///  `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`.
    /// @param _from The current owner of the NFT
    /// @param _to The new owner
    /// @param _tokenId The NFT to transfer
    /// @param _data Additional data with no specified format, sent in call to `_to`
    function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes calldata _data) external {
        transferFromInternal(_from, _to, _tokenId);
        uint size;
        assembly { size := extcodesize(_to) }
        if (size > 0) {            
            require(ERC721_RECEIVED == ERC721TokenReceiver(_to).onERC721Received(msg.sender, _from, _tokenId, _data), "ERC721: Transfer rejected/failed by _to");
        }
    }

    /// @notice Transfers the ownership of an NFT from one address to another address
    /// @dev This works identically to the other function with an extra data parameter,
    ///  except this function just sets data to "".
    /// @param _from The current owner of the NFT
    /// @param _to The new owner
    /// @param _tokenId The NFT to transfer
    function safeTransferFrom(address _from, address _to, uint256 _tokenId) external {
        transferFromInternal(_from, _to, _tokenId);
        uint size;
        assembly { size := extcodesize(_to) }
        if (size > 0) {            
            require(ERC721_RECEIVED == ERC721TokenReceiver(_to).onERC721Received(msg.sender, _from, _tokenId, ""), "ERC721: Transfer rejected/failed by _to");
        }
    }

    /// @notice Transfer ownership of an NFT -- THE CALLER IS RESPONSIBLE
    ///  TO CONFIRM THAT `_to` IS CAPABLE OF RECEIVING NFTS OR ELSE
    ///  THEY MAY BE PERMANENTLY LOST
    /// @dev Throws unless `msg.sender` is the current owner, an authorized
    ///  operator, or the approved address for this NFT. Throws if `_from` is
    ///  not the current owner. Throws if `_to` is the zero address. Throws if
    ///  `_tokenId` is not a valid NFT.
    /// @param _from The current owner of the NFT
    /// @param _to The new owner
    /// @param _tokenId The NFT to transfer
    function transferFrom(address _from, address _to, uint256 _tokenId) external {
        transferFromInternal(_from, _to, _tokenId);
    }

    function transferFromInternal(address _from, address _to, uint256 _tokenId) internal {
        require(_to != address(0), "ER721: Can't transfer to 0 address");
        ALib.Storage storage aStorage = ALib.getStorage();                
        address owner = aStorage.owner[_tokenId].owner;
        uint index = aStorage.owner[_tokenId].index;
        require(owner != address(0), "ERC721: Invalid tokenId or can't be transferred");
        require(msg.sender == owner 
            || aStorage.operators[owner][msg.sender] 
            || aStorage.approved[_tokenId] == msg.sender, "ERC721: Not owner or approved to transfer");        
        require(_from == owner, "ERC721: _from is not owner, transfer failed");        
        aStorage.owner[_tokenId] = ALib.OwnerAndIndex({
            owner: _to, index: uint32(aStorage.aavegotchis[_to].length)
        });
        aStorage.aavegotchis[_to].push(_tokenId);        

        uint lastIndex = aStorage.aavegotchis[_from].length - 1;
        if(index != lastIndex) {
            uint lastTokenId = aStorage.aavegotchis[_from][lastIndex];
            aStorage.aavegotchis[_from][index] = lastTokenId;
            aStorage.owner[lastTokenId].index = uint32(index);
        }
        aStorage.aavegotchis[_from].pop();
        if(aStorage.approved[_tokenId] != address(0)) {
            delete aStorage.approved[_tokenId];
            emit Approval(owner, address(0), _tokenId);
        }
        emit Transfer(_from, _to, _tokenId);
    }

    /// @notice Change or reaffirm the approved address for an NFT
    /// @dev The zero address indicates there is no approved address.
    ///  Throws unless `msg.sender` is the current NFT owner, or an authorized
    ///  operator of the current owner.
    /// @param _approved The new approved NFT controller
    /// @param _tokenId The NFT to approve
    function approve(address _approved, uint256 _tokenId) external {
        ALib.Storage storage aStorage = ALib.getStorage();
        address owner = aStorage.owner[_tokenId].owner;
        require(owner == msg.sender || aStorage.operators[owner][msg.sender], "ERC721: Not owner or operator of token.");
        aStorage.approved[_tokenId] = _approved;
        emit Approval(owner, _approved, _tokenId);

    }

    /// @notice Enable or disable approval for a third party ("operator") to manage
    ///  all of `msg.sender`'s assets
    /// @dev Emits the ApprovalForAll event. The contract MUST allow
    ///  multiple operators per owner.
    /// @param _operator Address to add to the set of authorized operators
    /// @param _approved True if the operator is approved, false to revoke approval
    function setApprovalForAll(address _operator, bool _approved) external {
        ALib.Storage storage aStorage = ALib.getStorage();
        aStorage.operators[msg.sender][_operator] = _approved;
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

    /// @notice Get the approved address for a single NFT
    /// @dev Throws if `_tokenId` is not a valid NFT.
    /// @param _tokenId The NFT to find the approved address for
    /// @return approved The approved address for this NFT, or the zero address if there is none    
    function getApproved(uint256 _tokenId) external view returns (address approved) {
        ALib.Storage storage aStorage = ALib.getStorage();
        require(_tokenId < aStorage.totalSupply, "ERC721: tokenId is invalid");  
        approved = aStorage.approved[_tokenId];
    }

    /// @notice Query if an address is an authorized operator for another address
    /// @param _owner The address that owns the NFTs
    /// @param _operator The address that acts on behalf of the owner
    /// @return approved True if `_operator` is an approved operator for `_owner`, false otherwise
    function isApprovedForAll(address _owner, address _operator) external view returns (bool approved) {
        ALib.Storage storage aStorage = ALib.getStorage();
        approved = aStorage.operators[_owner][_operator];
    }
}