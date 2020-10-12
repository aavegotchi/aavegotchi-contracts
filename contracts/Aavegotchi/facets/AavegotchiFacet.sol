// SPDX-License-Identifier: MIT
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

import "../libraries/LibAppStorage.sol";
import "../../shared/interfaces/IERC20.sol";
import "../libraries/LibSVG.sol";
import "../../shared/libraries/LibDiamond.sol";
import "../../shared/libraries/LibERC20.sol";

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

contract AavegotchiFacet {
    using LibAppStorage for AppStorage;
    AppStorage internal s;
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

    function addCollateralTypes(LibAppStorage.AavegotchiCollateralTypeInput[] memory _collateralTypes) external {
        LibDiamond.enforceIsContractOwner();
        s.addCollateralTypes(_collateralTypes);
    }

    function removeCollateralType(address _collateralType) external {
        uint256 index = s.collateralTypeIndexes[_collateralType];
        require(index > 0, "Aavegotchi: _collateral does not exist");
        index--;
        uint256 lastIndex = s.collateralTypes.length - 1;
        if (index != lastIndex) {
            address lastCollateral = s.collateralTypes[lastIndex];
            s.collateralTypes[index] = lastCollateral;
            s.collateralTypeIndexes[lastCollateral] = index + 1;
        }
        s.collateralTypes.pop();
        delete s.collateralTypeIndexes[_collateralType];
        delete s.collateralTypeInfo[_collateralType];
    }

    function collaterals() external view returns (address[] memory collateralTypes_) {
        collateralTypes_ = s.collateralTypes;
    }

    function aavegotchiNameAvailable(string memory _name) external view returns (bool available_) {
        available_ = s.aavegotchiNamesUsed[_name];
    }

    function setAavegotchiName(uint256 _tokenId, string memory _name) external {
        require(bytes(_name).length > 0, "AavegotchiFacet: _name can't be empty");
        require(bytes(_name).length < 26, "AavegotchiFacet: _name can't be greater than 25 characters");
        require(s.aavegotchiNamesUsed[_name] == false, "AavegotchiFacet: Aavegotchi name used already");
        require(msg.sender == s.aavegotchis[_tokenId].owner, "AavegotchiFacet: Only aavegotchi owner can set the name");
        string memory existingName = s.aavegotchis[_tokenId].name;
        // require(bytes(s.aavegotchis[_tokenId].name).length == 0, "AavegotchiFacet: Aavegotchi name already set");
        if (bytes(existingName).length > 0) {
            delete s.aavegotchiNamesUsed[existingName];
        }
        s.aavegotchiNamesUsed[_name] = true;
        s.aavegotchis[_tokenId].name = _name;
    }

    function buyPortals(uint256 _ghst) external {
        require(_ghst >= 100e18, "AavegotchiNFT: Not enough GHST to buy portal");
        for (uint256 i; i < _ghst / 100e18; i++) {
            uint256 tokenId = s.totalSupply++;
            uint32 ownerIndex = uint32(s.aavegotchiOwnerEnumeration[msg.sender].length);
            s.aavegotchiOwnerEnumeration[msg.sender].push(tokenId);
            s.aavegotchis[tokenId].owner = msg.sender;
            s.aavegotchis[tokenId].ownerEnumerationIndex = ownerIndex;
            emit Transfer(address(0), msg.sender, tokenId);
            emit TransferSingle(msg.sender, address(0), msg.sender, tokenId, 1);
        }
        uint256 amount = _ghst - (_ghst % 100e18);
        uint256 burnAmount = amount / 10;
        IERC20(s.ghstContract).transferFrom(msg.sender, address(0), burnAmount);
        IERC20(s.ghstContract).transferFrom(msg.sender, address(this), amount - burnAmount);
    }

    function openPortal(uint256 _tokenId) external {
        require(s.aavegotchis[_tokenId].status == 0, "AavegotchiFacet: Portal is not closed");
        require(msg.sender == s.aavegotchis[_tokenId].owner, "AavegotchiFacet: Only aavegotchi owner can open a portal");
        s.aavegotchis[_tokenId].randomNumber = uint256(keccak256(abi.encodePacked(block.timestamp)));
        // status is open portal
        s.aavegotchis[_tokenId].status = 1;
    }

    struct PortalAavegotchiTraits {
        uint256 randomNumber;
        uint8[7] numericTraits;
        address collateralType;
        uint256 minimumStake;
    }

    function portalAavegotchiTraits(uint256 _tokenId) external view returns (PortalAavegotchiTraits[10] memory portalAavegotchiTraits_) {
        uint256 randomNumber = s.aavegotchis[_tokenId].randomNumber;
        require(s.aavegotchis[_tokenId].status == 1, "AavegotchiFacet: Portal not open");
        for (uint256 i; i < 10; i++) {
            uint256 randomNumberN = uint256(keccak256(abi.encodePacked(randomNumber, i)));
            portalAavegotchiTraits_[i].randomNumber = randomNumberN;
            for (uint256 j; j < 7; j++) {
                portalAavegotchiTraits_[i].numericTraits[j] = uint8(randomNumberN >> (j * 8)) % 100;
            }
            address collateralType = s.collateralTypes[(randomNumberN >> 248) % s.collateralTypes.length];
            portalAavegotchiTraits_[i].collateralType = collateralType;
            portalAavegotchiTraits_[i].minimumStake = 10**IERC20(collateralType).decimals();
        }
    }

    function claimAavegotchiFromPortal(
        uint256 _tokenId,
        uint256 _option,
        uint256 _stakeAmount
    ) external {
        require(s.aavegotchis[_tokenId].status == 1, "AavegotchiFacet: Portal not open");
        require(msg.sender == s.aavegotchis[_tokenId].owner, "AavegotchiFacet: Only aavegotchi owner can claim aavegotchi from a portal");
        uint256 randomNumber = uint256(keccak256(abi.encodePacked(s.aavegotchis[_tokenId].randomNumber, _option)));
        s.aavegotchis[_tokenId].randomNumber = randomNumber;
        for (uint256 j; j < 7; j++) {
            s.aavegotchis[_tokenId].numericTraits.push(uint8(randomNumber >> (j * 8)) % 100);
        }
        address collateralType = s.collateralTypes[(randomNumber >> 248) % s.collateralTypes.length];
        s.aavegotchis[_tokenId].collateralType = collateralType;
        s.aavegotchis[_tokenId].status = 2;
        uint256 minimumStake = 10**IERC20(collateralType).decimals();
        require(_stakeAmount >= minimumStake, "AavegotchiFacet: _stakeAmount less than minimum stake");
        s.aavegotchis[_tokenId].stakedAmount = uint128(_stakeAmount);
        LibERC20.transferFrom(collateralType, msg.sender, address(this), _stakeAmount);
    }

    function ghstAddress() external view returns (address contract_) {
        contract_ = s.ghstContract;
    }

    function bytes3ToColorString(bytes3 _color) internal pure returns (string memory) {
        bytes memory numbers = "0123456789ABCDEF";
        bytes memory toString = new bytes(6);
        uint256 pos = 0;
        for (uint256 i; i < 3; i++) {
            toString[pos] = numbers[uint8(_color[i] >> 4)];
            pos++;
            toString[pos] = numbers[uint8(_color[i] & 0x0f)];
            pos++;
        }
        return string(toString);
    }

    // Given an aavegotchi token id, return the combined SVG of its layers and its wearables
    function getAavegotchiSVG(uint256 _tokenId) public view returns (string memory ag_) {
        require(s.aavegotchis[_tokenId].owner != address(0), "AavegotchiFacet: _tokenId does not exist");
        address collateralType = s.aavegotchis[_tokenId].collateralType;
        bytes memory svg;
        uint8 status = s.aavegotchis[_tokenId].status;
        if (status == 0) {
            // sealed closed portal
            svg = LibSVG.getSVG(s.itemsSVG, 0);
        } else if (status == 1) {
            // open portal
            svg = LibSVG.getSVG(s.itemsSVG, 1);
        } else {
            // add standard layers
            for (uint256 i; i < 5; i++) {
                svg = abi.encodePacked(svg, LibSVG.getSVG(s.aavegotchiLayersSVG, i));
            }
            // add collateral type layer
            svg = abi.encodePacked(svg, LibSVG.getSVG(s.itemsSVG, s.collateralTypeInfo[collateralType].svgId));
        }
        string memory primaryColor = bytes3ToColorString(s.collateralTypeInfo[collateralType].primaryColor);
        string memory secondaryColor = bytes3ToColorString(s.collateralTypeInfo[collateralType].secondaryColor);
        string memory cheekColor = bytes3ToColorString(s.collateralTypeInfo[collateralType].cheekColor);

        ag_ = string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
                "<style>.primaryColor{fill:#",
                primaryColor,
                ";}.secondaryColor{fill:#",
                secondaryColor,
                ";}.cheekColor{fill:#",
                cheekColor,
                ";}</style>",
                svg,
                "</svg>"
            )
        );
    }

    // get the first Aavegotchi that someone uses. This function is for demo purposes.
    function getFirstAavegotchi(address _owner) external view returns (uint256 tokenId_, string memory svg_) {
        require(_owner != address(0), "Aavegotchi: Owner can't be zero address");
        uint256 bal = s.aavegotchiOwnerEnumeration[_owner].length;
        if (bal > 0) {
            tokenId_ = s.aavegotchiOwnerEnumeration[_owner][0];
            svg_ = getAavegotchiSVG(tokenId_);
        }
    }

    /// @notice Count all NFTs assigned to an owner
    /// @dev NFTs assigned to the zero address are considered invalid, and this
    ///  function throws for queries about the zero address.
    /// @param _owner An address for whom to query the balance
    /// @return balance_ The number of NFTs owned by `_owner`, possibly zero
    function balanceOf(address _owner) external view returns (uint256 balance_) {
        balance_ = s.aavegotchiOwnerEnumeration[_owner].length;
    }

    /// @notice Enumerate NFTs assigned to an owner
    /// @dev Throws if `_index` >= `balanceOf(_owner)` or if
    ///  `_owner` is the zero address, representing invalid NFTs.
    /// @param _owner An address where we are interested in NFTs owned by them
    /// @param _index A counter less than `balanceOf(_owner)`
    /// @return tokenId_ The token identifier for the `_index`th NFT assigned to `_owner`,
    ///   (sort order not specified)
    function tokenOfOwnerByIndex(address _owner, uint256 _index) external view returns (uint256 tokenId_) {
        uint256 balance = s.aavegotchiOwnerEnumeration[_owner].length;
        require(_index < balance, "AavegotchiNFT: Does not have token at index");
        require(_owner != address(0), "AavegotchiNFT:Owner can't be address(0");
        tokenId_ = s.aavegotchiOwnerEnumeration[_owner][_index];
    }

    struct AavegotchiInfo {
        uint256 tokenId;
        string name;
        address owner;
        uint256 randomNumber;
        uint8 status;
        uint8[] numericTraits;
        address collateral;
        uint256 stakedAmount;
    }

    function getAavegotchi(uint256 _tokenId) public view returns (AavegotchiInfo memory aavegotchiInfo_) {
        aavegotchiInfo_.tokenId = _tokenId;
        aavegotchiInfo_.name = s.aavegotchis[_tokenId].name;
        aavegotchiInfo_.owner = s.aavegotchis[_tokenId].owner;
        aavegotchiInfo_.randomNumber = s.aavegotchis[_tokenId].randomNumber;
        aavegotchiInfo_.status = s.aavegotchis[_tokenId].status;
        aavegotchiInfo_.numericTraits = s.aavegotchis[_tokenId].numericTraits;
        aavegotchiInfo_.collateral = s.aavegotchis[_tokenId].collateralType;
        aavegotchiInfo_.stakedAmount = s.aavegotchis[_tokenId].stakedAmount;
        return aavegotchiInfo_;
    }

    function allAavegotchiIdsOfOwner(address _owner) external view returns (uint256[] memory tokenIds_) {
        tokenIds_ = s.aavegotchiOwnerEnumeration[_owner];
    }

    function allAavegotchisOfOwner(address _owner) external view returns (AavegotchiInfo[] memory aavegotchiInfos_) {
        //Haven't tested but should work -- yes sir
        uint256[] memory tokenIds = s.aavegotchiOwnerEnumeration[_owner];
        aavegotchiInfos_ = new AavegotchiInfo[](tokenIds.length);

        for (uint256 index; index < tokenIds.length; index++) {
            aavegotchiInfos_[index] = getAavegotchi(tokenIds[index]);
        }
    }

    /// @notice Find the owner of an NFT
    /// @dev NFTs assigned to zero address are considered invalid, and queries
    ///  about them do throw.
    /// @param _tokenId The identifier for an NFT
    /// @return owner_ The address of the owner of the NFT
    function ownerOf(uint256 _tokenId) external view returns (address owner_) {
        owner_ = s.aavegotchis[_tokenId].owner;
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
        address owner = s.aavegotchis[_tokenId].owner;
        uint256 index = s.aavegotchis[_tokenId].ownerEnumerationIndex;
        require(owner != address(0), "ERC721: Invalid tokenId or can't be transferred");
        require(
            msg.sender == owner || s.operators[owner][msg.sender] || s.approved[_tokenId] == msg.sender,
            "ERC721: Not owner or approved to transfer"
        );
        require(_from == owner, "ERC721: _from is not owner, transfer failed");
        s.aavegotchis[_tokenId].owner = _to;
        s.aavegotchis[_tokenId].ownerEnumerationIndex = uint32(s.aavegotchiOwnerEnumeration[_to].length);
        s.aavegotchiOwnerEnumeration[_to].push(_tokenId);
        uint256 lastIndex = s.aavegotchiOwnerEnumeration[_from].length - 1;
        if (index != lastIndex) {
            uint256 lastTokenId = s.aavegotchiOwnerEnumeration[_from][lastIndex];
            s.aavegotchiOwnerEnumeration[_from][index] = lastTokenId;
            s.aavegotchis[lastTokenId].ownerEnumerationIndex = uint32(index);
        }
        s.aavegotchiOwnerEnumeration[_from].pop();
        if (s.approved[_tokenId] != address(0)) {
            delete s.approved[_tokenId];
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
        address owner = s.aavegotchis[_tokenId].owner;
        require(owner == msg.sender || s.operators[owner][msg.sender], "ERC721: Not owner or operator of token.");
        s.approved[_tokenId] = _approved;
        emit Approval(owner, _approved, _tokenId);
    }

    /// @notice Enable or disable approval for a third party ("operator") to manage
    ///  all of `msg.sender`'s assets
    /// @dev Emits the ApprovalForAll event. The contract MUST allow
    ///  multiple operators per owner.
    /// @param _operator Address to add to the set of authorized operators
    /// @param _approved True if the operator is approved, false to revoke approval
    function setApprovalForAll(address _operator, bool _approved) external {
        s.operators[msg.sender][_operator] = _approved;
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

    /// @notice Get the approved address for a single NFT
    /// @dev Throws if `_tokenId` is not a valid NFT.
    /// @param _tokenId The NFT to find the approved address for
    /// @return approved_ The approved address for this NFT, or the zero address if there is none
    function getApproved(uint256 _tokenId) external view returns (address approved_) {
        require(_tokenId < s.totalSupply, "ERC721: tokenId is invalid");
        approved_ = s.approved[_tokenId];
    }

    /// @notice Query if an address is an authorized operator for another address
    /// @param _owner The address that owns the NFTs
    /// @param _operator The address that acts on behalf of the owner
    /// @return approved_ True if `_operator` is an approved operator for `_owner`, false otherwise
    function isApprovedForAll(address _owner, address _operator) external view returns (bool approved_) {
        approved_ = s.operators[_owner][_operator];
    }
}
