// SPDX-License-Identifier: MIT
pragma solidity 0.7.1;
pragma experimental ABIEncoderV2;

import "../libraries/LibA.sol";
import "./SVGStorage.sol";
import "./GHSTERC20.sol";

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
    function onERC721Received(
        address _operator,
        address _from,
        uint256 _tokenId,
        bytes calldata _data
    ) external returns (bytes4);
}

contract AavegotchiNFT {
    bytes4 private constant ERC721_RECEIVED = 0x150b7a02;

    event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);
    event TransferSingle(address indexed _operator, address indexed _from, address indexed _to, uint256 _id, uint256 _value);

    /// @dev This emits when the approved address for an NFT is changed or
    ///  reaffirmed. The zero address indicates there is no approved address.
    ///  When a Transfer event emits, this also indicates that the approved
    ///  address for that NFT (if any) is reset to none.
    event Approval(address indexed _owner, address indexed _approved, uint256 indexed _tokenId);

    /// @dev This emits when an operator is enabled or disabled for an owner.
    ///  The operator can manage all NFTs of the owner.
    event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved);

    function buyPortals(uint256 _ghst) external {
        LibA.Storage storage ags = LibA.diamondStorage();
        require(_ghst >= 100e18, "AavegotchiNFT: Not enough GHST to buy portal");
        for (uint256 i; i < _ghst / 100e18; i++) {
            uint256 tokenId = ags.totalSupply++;
            uint32 ownerIndex = uint32(ags.aavegotchiOwnerEnumeration[msg.sender].length);
            ags.aavegotchiOwnerEnumeration[msg.sender].push(tokenId);
            ags.aavegotchis[tokenId].owner = msg.sender;
            ags.aavegotchis[tokenId].ownerEnumerationIndex = ownerIndex;
            ags.aavegotchis[tokenId].isPortal = true;
            emit Transfer(address(0), msg.sender, tokenId);
            emit TransferSingle(msg.sender, address(0), msg.sender, tokenId, 1);
        }
        uint256 amount = _ghst - (_ghst % 100e18);
        uint256 burnAmount = amount / 10;
        GHSTERC20(ags.ghstDiamond).transferFrom(msg.sender, address(-1), burnAmount);
        GHSTERC20(ags.ghstDiamond).transferFrom(msg.sender, address(this), amount - burnAmount);
    }

    function ghstAddress() external view returns (address contract_) {
        contract_ = LibA.diamondStorage().ghstDiamond;
    }

    // Given an aavegotchi token id, return the combined SVG of its layers and its wearables
    function getAavegotchiSVG(uint256 _tokenId) public view returns (string memory ag) {
        LibA.Storage storage ags = LibA.diamondStorage();
        bytes memory svg;
        if (ags.aavegotchis[_tokenId].isPortal) {
            svg = LibA.getSVG(ags.itemsSVG, 0);
        } else {
            bytes32 traits = ags.aavegotchis[_tokenId].traits;
            require(traits != 0, "AavegotchiNFT: _tokenId does not exist");
            uint256 svgId;
            // Find and get up to 16 SVG layers
            for (uint256 i; i < 16; i++) {
                svgId = uint256((traits << (i * 16)) >> 240);
                if (svgId > 0) {
                    svg = abi.encodePacked(svg, LibA.getSVG(ags.aavegotchiLayersSVG, svgId));
                }
            }
            // add any wearables here
            uint256 count = ags.wearablesSVG.length;
            for (uint256 i = 0; i < count; i++) {
                if (ags.nftBalances[address(this)][_tokenId][i << 240] > 0) {
                    svg = abi.encodePacked(svg, LibA.getSVG(ags.wearablesSVG, i));
                }
            }
        }
        bytes memory header = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">';
        bytes memory footer = "</svg>";
        ag = string(abi.encodePacked(header, svg, footer));
    }

    // get the first Aavegotchi that someone uses. This function is for demo purposes.
    function getFirstAavegotchi(address _owner) external view returns (uint256 tokenId, string memory svg) {
        LibA.Storage storage ags = LibA.diamondStorage();
        require(_owner != address(0), "Aavegotchi: Owner can't be zero address");
        uint256 bal = ags.aavegotchiOwnerEnumeration[_owner].length;
        if (bal > 0) {
            tokenId = ags.aavegotchiOwnerEnumeration[_owner][0];
            svg = getAavegotchiSVG(tokenId);
        }
    }

    /// @notice Count all NFTs assigned to an owner
    /// @dev NFTs assigned to the zero address are considered invalid, and this
    ///  function throws for queries about the zero address.
    /// @param _owner An address for whom to query the balance
    /// @return balance The number of NFTs owned by `_owner`, possibly zero
    function balanceOf(address _owner) external view returns (uint256 balance) {
        LibA.Storage storage ags = LibA.diamondStorage();
        balance = ags.aavegotchiOwnerEnumeration[_owner].length;
    }

    /// @notice Find the owner of an NFT
    /// @dev NFTs assigned to zero address are considered invalid, and queries
    ///  about them do throw.
    /// @param _tokenId The identifier for an NFT
    /// @return owner The address of the owner of the NFT
    function ownerOf(uint256 _tokenId) external view returns (address owner) {
        LibA.Storage storage ags = LibA.diamondStorage();
        owner = ags.aavegotchis[_tokenId].owner;
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
    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId,
        bytes calldata _data
    ) external {
        transferFromInternal(_from, _to, _tokenId);
        uint256 size;
        assembly {
            size := extcodesize(_to)
        }
        if (size > 0) {
            require(
                ERC721_RECEIVED == ERC721TokenReceiver(_to).onERC721Received(msg.sender, _from, _tokenId, _data),
                "ERC721: Transfer rejected/failed by _to"
            );
        }
    }

    /// @notice Transfers the ownership of an NFT from one address to another address
    /// @dev This works identically to the other function with an extra data parameter,
    ///  except this function just sets data to "".
    /// @param _from The current owner of the NFT
    /// @param _to The new owner
    /// @param _tokenId The NFT to transfer
    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) external {
        transferFromInternal(_from, _to, _tokenId);
        uint256 size;
        assembly {
            size := extcodesize(_to)
        }
        if (size > 0) {
            require(
                ERC721_RECEIVED == ERC721TokenReceiver(_to).onERC721Received(msg.sender, _from, _tokenId, ""),
                "ERC721: Transfer rejected/failed by _to"
            );
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
    function transferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) external {
        transferFromInternal(_from, _to, _tokenId);
    }

    // This function is used by transfer functions
    function transferFromInternal(
        address _from,
        address _to,
        uint256 _tokenId
    ) internal {
        require(_to != address(0), "ER721: Can't transfer to 0 address");
        LibA.Storage storage ags = LibA.diamondStorage();
        address owner = ags.aavegotchis[_tokenId].owner;
        uint256 index = ags.aavegotchis[_tokenId].ownerEnumerationIndex;
        require(owner != address(0), "ERC721: Invalid tokenId or can't be transferred");
        require(
            msg.sender == owner || ags.operators[owner][msg.sender] || ags.approved[_tokenId] == msg.sender,
            "ERC721: Not owner or approved to transfer"
        );
        require(_from == owner, "ERC721: _from is not owner, transfer failed");
        ags.aavegotchis[_tokenId].owner = _to;
        ags.aavegotchis[_tokenId].ownerEnumerationIndex = uint32(ags.aavegotchiOwnerEnumeration[_to].length);
        ags.aavegotchiOwnerEnumeration[_to].push(_tokenId);
        uint256 lastIndex = ags.aavegotchiOwnerEnumeration[_from].length - 1;
        if (index != lastIndex) {
            uint256 lastTokenId = ags.aavegotchiOwnerEnumeration[_from][lastIndex];
            ags.aavegotchiOwnerEnumeration[_from][index] = lastTokenId;
            ags.aavegotchis[lastTokenId].ownerEnumerationIndex = uint32(index);
        }
        ags.aavegotchiOwnerEnumeration[_from].pop();
        if (ags.approved[_tokenId] != address(0)) {
            delete ags.approved[_tokenId];
            emit Approval(owner, address(0), _tokenId);
        }
        emit Transfer(_from, _to, _tokenId);
        emit TransferSingle(msg.sender, _from, _to, _tokenId, 1);
    }

    /// @notice Change or reaffirm the approved address for an NFT
    /// @dev The zero address indicates there is no approved address.
    ///  Throws unless `msg.sender` is the current NFT owner, or an authorized
    ///  operator of the current owner.
    /// @param _approved The new approved NFT controller
    /// @param _tokenId The NFT to approve
    function approve(address _approved, uint256 _tokenId) external {
        LibA.Storage storage ags = LibA.diamondStorage();
        address owner = ags.aavegotchis[_tokenId].owner;
        require(owner == msg.sender || ags.operators[owner][msg.sender], "ERC721: Not owner or operator of token.");
        ags.approved[_tokenId] = _approved;
        emit Approval(owner, _approved, _tokenId);
    }

    /// @notice Enable or disable approval for a third party ("operator") to manage
    ///  all of `msg.sender`'s assets
    /// @dev Emits the ApprovalForAll event. The contract MUST allow
    ///  multiple operators per owner.
    /// @param _operator Address to add to the set of authorized operators
    /// @param _approved True if the operator is approved, false to revoke approval
    function setApprovalForAll(address _operator, bool _approved) external {
        LibA.Storage storage ags = LibA.diamondStorage();
        ags.operators[msg.sender][_operator] = _approved;
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

    /// @notice Get the approved address for a single NFT
    /// @dev Throws if `_tokenId` is not a valid NFT.
    /// @param _tokenId The NFT to find the approved address for
    /// @return approved The approved address for this NFT, or the zero address if there is none
    function getApproved(uint256 _tokenId) external view returns (address approved) {
        LibA.Storage storage ags = LibA.diamondStorage();
        require(_tokenId < ags.totalSupply, "ERC721: tokenId is invalid");
        approved = ags.approved[_tokenId];
    }

    /// @notice Query if an address is an authorized operator for another address
    /// @param _owner The address that owns the NFTs
    /// @param _operator The address that acts on behalf of the owner
    /// @return approved True if `_operator` is an approved operator for `_owner`, false otherwise
    function isApprovedForAll(address _owner, address _operator) external view returns (bool approved) {
        LibA.Storage storage ags = LibA.diamondStorage();
        approved = ags.operators[_owner][_operator];
    }
}
