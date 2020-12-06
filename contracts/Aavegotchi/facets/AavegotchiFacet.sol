// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import "../libraries/LibAppStorage.sol";
import "../../shared/interfaces/IERC20.sol";
import "../libraries/LibSvg.sol";
import "../../shared/libraries/LibDiamond.sol";
import "../../shared/libraries/LibERC20.sol";
import "hardhat/console.sol";
import "../CollateralEscrow.sol";
import "../libraries/LibVrf.sol";

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
    // using LibAppStorage for AppStorage;
    AppStorage internal s;
    bytes4 private constant ERC721_RECEIVED = 0x150b7a02;
    uint256 internal constant NUMERIC_TRAITS_NUM = 6;
    uint256 internal constant EQUIPPED_WEARABLE_SLOTS = 16;
    uint256 internal constant PORTAL_AAVEGOTCHIS_NUM = 10;

    /***********************************|
   |             Events                |
   |__________________________________*/

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

    /***********************************|
   |             Modifiers              |
   |__________________________________*/

    modifier onlyUnlocked(uint256 _tokenId) {
        require(s.aavegotchis[_tokenId].unlockTime <= block.timestamp, "Only callable on unlocked Aavegotchis");
        _;
    }

    modifier onlyAavegotchiOwner(uint256 _tokenId) {
        require(msg.sender == s.aavegotchis[_tokenId].owner, "AavegotchiFacet: Only aavegotchi owner can increase stake");
        _;
    }

    /***********************************|
   |             View Functions           |
   |__________________________________*/

    function aavegotchiNameAvailable(string memory _name) external view returns (bool available_) {
        available_ = s.aavegotchiNamesUsed[_name];
    }

    function currentHaunt() public view returns (uint16 hauntId_, Haunt memory haunt_) {
        hauntId_ = s.currentHauntId;
        haunt_ = s.haunts[hauntId_];
    }

    struct RevenueSharesIO {
        address burnAddress;
        address daoAddress;
        address rarityFarming;
        address pixelCraft;
    }

    function revenueShares() external view returns (RevenueSharesIO memory) {
        return RevenueSharesIO(0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF, s.dao, s.rarityFarming, s.pixelCraft);
    }

    struct PortalAavegotchiTraitsIO {
        uint256 randomNumber;
        int256 numericTraits;
        address collateralType;
        uint256 minimumStake;
    }

    function toNumericTraits(uint256 _randomNumber) internal pure returns (int256 numericTraits_) {
        uint256 numericTraits;
        for (uint256 i; i < NUMERIC_TRAITS_NUM; i++) {
            uint256 value = uint8(_randomNumber >> (i * 8));
            if (value > 99) {
                value /= 2;
                if (value > 99) {
                    value = uint256(keccak256(abi.encodePacked(_randomNumber, i))) % 100;
                }
            }
            // set slot
            numericTraits |= value << (16 * i);
        }
        numericTraits_ = int256(numericTraits);
    }

    function singlePortalAavegotchiTraits(uint256 _randomNumber, uint256 _option)
        internal
        view
        returns (PortalAavegotchiTraitsIO memory singlePortalAavegotchiTraits_)
    {
        uint256 randomNumberN = uint256(keccak256(abi.encodePacked(_randomNumber, _option)));
        singlePortalAavegotchiTraits_.randomNumber = randomNumberN;
        singlePortalAavegotchiTraits_.numericTraits = toNumericTraits(randomNumberN);
        address collateralType = s.collateralTypes[randomNumberN % s.collateralTypes.length];
        singlePortalAavegotchiTraits_.collateralType = collateralType;

        AavegotchiCollateralTypeInfo memory collateralInfo = s.collateralTypeInfo[collateralType];
        uint16 conversionRate = collateralInfo.conversionRate;

        //Get rarity multiplier
        uint256 multiplier = rarityMultiplier(singlePortalAavegotchiTraits_.numericTraits, collateralType);

        //First we get the base price of our collateral in terms of DAI
        uint256 collateralDAIPrice = ((10**IERC20(collateralType).decimals()) / conversionRate);

        //Then multiply by the rarity multiplier
        singlePortalAavegotchiTraits_.minimumStake = collateralDAIPrice * multiplier;
    }

    function portalAavegotchiTraits(uint256 _tokenId)
        public
        view
        returns (PortalAavegotchiTraitsIO[PORTAL_AAVEGOTCHIS_NUM] memory portalAavegotchiTraits_)
    {
        uint256 randomNumber = s.aavegotchis[_tokenId].randomNumber;
        require(s.aavegotchis[_tokenId].status == LibAppStorage.STATUS_OPEN_PORTAL, "AavegotchiFacet: Portal not open");
        for (uint256 i; i < portalAavegotchiTraits_.length; i++) {
            portalAavegotchiTraits_[i] = singlePortalAavegotchiTraits(randomNumber, i);
        }
    }

    function ghstAddress() external view returns (address contract_) {
        contract_ = s.ghstContract;
    }

    /// @notice Count all NFTs assigned to an owner
    /// @dev NFTs assigned to the zero address are considered invalid, and this.
    ///  function throws for queries about the zero address.
    /// @param _owner An address for whom to query the balance
    /// @return balance_ The number of NFTs owned by `_owner`, possibly zero
    function balanceOf(address _owner) external view returns (uint256 balance_) {
        balance_ = s.aavegotchiBalance[_owner];
    }

    struct AavegotchiInfo {
        uint256 tokenId;
        string name;
        address owner;
        uint256 randomNumber;
        uint8 status;
        int256[] numericTraits;
        uint256[EQUIPPED_WEARABLE_SLOTS] equippedWearables;
        address collateral;
        address escrow;
        uint256 stakedAmount;
        uint256 minimumStake;
        //New
        int256 interactionCount; //The kinship value of this Aavegotchi. Default is 50.
        uint40 lastInteracted;
        uint256 experience; //How much XP this Aavegotchi has accrued. Begins at 0.
        uint256 usedSkillPoints; //number of skill points used
        uint32 level; //the current aavegotchi level
        uint256 batchId;
        uint256 hauntId;
    }

    function getNumericTraits(uint256 _tokenId) public view returns (int256 numericTraits_) {
        //Check if trait boosts from consumables are still valid
        int256 boostDecay = int256((block.timestamp - s.aavegotchis[_tokenId].lastTemporaryBoost) / 24 hours);
        int256 temporaryTraitBoosts = s.aavegotchis[_tokenId].temporaryTraitBoosts;
        int256 numericTraits = s.aavegotchis[_tokenId].numericTraits;
        for (uint256 i; i < NUMERIC_TRAITS_NUM; i++) {
            int256 number = int16(numericTraits >> (i * 16));
            int256 boost = int16(temporaryTraitBoosts >> (i * 16));

            if (boost > 0) {
                console.log("i:", i);
                console.log("boost");
                console.logInt(boost);
            }

            if (boost > 0) {
                if (boost > boostDecay) {
                    number += boost - boostDecay;
                }
            } else {
                if ((boost * -1) > boostDecay) {
                    number += boost + boostDecay;
                }
            }
            numericTraits_ |= number << (i * 16);
        }
    }

    function getAavegotchi(uint256 _tokenId) public view returns (AavegotchiInfo memory aavegotchiInfo_) {
        aavegotchiInfo_.tokenId = _tokenId;
        aavegotchiInfo_.name = s.aavegotchis[_tokenId].name;
        aavegotchiInfo_.owner = s.aavegotchis[_tokenId].owner;
        aavegotchiInfo_.randomNumber = s.aavegotchis[_tokenId].randomNumber;
        aavegotchiInfo_.status = s.aavegotchis[_tokenId].status;
        int256 numericTraits = getNumericTraits(_tokenId);
        aavegotchiInfo_.numericTraits = new int256[](NUMERIC_TRAITS_NUM);
        for (uint256 i; i < NUMERIC_TRAITS_NUM; i++) {
            int256 number = int16(numericTraits >> (i * 16));
            aavegotchiInfo_.numericTraits[i] = number;
        }
        uint256 l_equippedWearables = s.aavegotchis[_tokenId].equippedWearables;
        for (uint16 i; i < EQUIPPED_WEARABLE_SLOTS; i++) {
            aavegotchiInfo_.equippedWearables[i] = uint16(l_equippedWearables >> (i * 16));
        }
        aavegotchiInfo_.collateral = s.aavegotchis[_tokenId].collateralType;
        aavegotchiInfo_.escrow = s.aavegotchis[_tokenId].escrow;
        if (aavegotchiInfo_.collateral == address(0)) {
            aavegotchiInfo_.stakedAmount = 0;
        } else {
            aavegotchiInfo_.stakedAmount = IERC20(aavegotchiInfo_.collateral).balanceOf(aavegotchiInfo_.escrow);
        }
        aavegotchiInfo_.minimumStake = s.aavegotchis[_tokenId].minimumStake;
        aavegotchiInfo_.interactionCount = s.aavegotchis[_tokenId].interactionCount;
        aavegotchiInfo_.lastInteracted = s.aavegotchis[_tokenId].lastInteracted;
        aavegotchiInfo_.experience = s.aavegotchis[_tokenId].experience;
        aavegotchiInfo_.level = aavegotchiLevel(s.aavegotchis[_tokenId].experience);
        aavegotchiInfo_.usedSkillPoints = s.aavegotchis[_tokenId].usedSkillPoints;
        aavegotchiInfo_.batchId = s.aavegotchis[_tokenId].batchId;
        aavegotchiInfo_.hauntId = s.aavegotchis[_tokenId].hauntId;
        return aavegotchiInfo_;
    }

    function availableSkillPoints(uint256 _tokenId) public view returns (uint256) {
        uint256 level = aavegotchiLevel(s.aavegotchis[_tokenId].experience);
        uint256 skillPoints = (level / 3);
        uint256 usedSkillPoints = s.aavegotchis[_tokenId].usedSkillPoints;
        //1 skill point per 3 levels. To do (done): Check if this underflows
        require(skillPoints >= usedSkillPoints, "AavegotchiFacet: Used skill points is greater than skill points");
        return skillPoints - usedSkillPoints;
    }

    function abs(int8 x) private pure returns (uint256) {
        return uint256(x >= 0 ? x : -x);
    }

    function aavegotchiLevel(uint32 _experience) public pure returns (uint32 level_) {
        level_ = LibAppStorage.aavegotchiLevel(_experience);
    }

    function rarityMultiplier(int256 _numericTraits, address _collateralType) public view returns (uint256 multiplier) {
        int256 rarityScore = baseRarityScore(_numericTraits, _collateralType);
        if (rarityScore < 300) return 10;
        else if (rarityScore >= 300 && rarityScore < 450) return 10;
        else if (rarityScore >= 450 && rarityScore <= 525) return 25;
        else if (rarityScore >= 526 && rarityScore <= 580) return 100;
        else if (rarityScore >= 581) return 1000;
    }

    //Calculates the base rarity score, including collateral modifier
    function baseRarityScore(int256 _numericTraits, address collateralType) public view returns (int256 _rarityScore) {
        AavegotchiCollateralTypeInfo memory collateralInfo = s.collateralTypeInfo[collateralType];
        uint256 modifiers = collateralInfo.modifiers;
        for (uint256 i; i < NUMERIC_TRAITS_NUM; i++) {
            int256 number = int16(_numericTraits >> (i * 16));
            int256 mod = int8(modifiers >> (i * 8));

            if (number >= 50) {
                _rarityScore = _rarityScore + number + mod;
            } else {
                _rarityScore = _rarityScore + (100 - number) + mod;
            }
        }
    }

    struct ModifiedRarityScore {
        int256 rarityScore_;
        int256[NUMERIC_TRAITS_NUM] numericTraits_;
    }

    //Only valid for claimed Aavegotchis
    function modifiedRarityScore(uint256 _tokenId) external view returns (ModifiedRarityScore memory info_) {
        require(s.aavegotchis[_tokenId].status == LibAppStorage.STATUS_AAVEGOTCHI, "AavegotchiFacet: Must be claimed");
        Aavegotchi storage aavegotchi = s.aavegotchis[_tokenId];
        uint256 equippedWearables = aavegotchi.equippedWearables;
        int256 numericTraits = getNumericTraits(_tokenId);
        int256 wearableBonus;
        for (uint256 slot; slot < 16; slot++) {
            uint256 wearableId = uint16(equippedWearables >> (16 * slot));
            if (wearableId == 0) {
                continue;
            }
            ItemType storage itemType = s.itemTypes[wearableId];
            //Add on trait modifiers
            int256 traitModifiers = itemType.traitModifiers;
            uint256 newNumericTraits;
            for (uint256 j; j < NUMERIC_TRAITS_NUM; j++) {
                int256 number = int16(numericTraits >> (j * 16));
                int256 traitModifier = int8(traitModifiers >> (j * 8));
                number += traitModifier;
                // clear bits first then assign
                newNumericTraits |= (uint256(number) & 0xffff) << (j * 16);
            }

            numericTraits = int256(newNumericTraits);
            wearableBonus += itemType.rarityScoreModifier;
        }
        address collateral = s.aavegotchis[_tokenId].collateralType;
        int256 baseRarity = baseRarityScore(numericTraits, collateral);
        info_.rarityScore_ = baseRarity + wearableBonus;
        for (uint256 i; i < NUMERIC_TRAITS_NUM; i++) {
            int256 number = int16(numericTraits >> (i * 16));
            info_.numericTraits_[i] = number;
        }
    }

    function kinship(uint256 _tokenId) external view returns (uint256 score) {
        Aavegotchi storage aavegotchi = s.aavegotchis[_tokenId];
        uint256 lastInteracted = aavegotchi.lastInteracted;
        int16 interactionCount = int16(aavegotchi.interactionCount);
        uint256 interval = block.timestamp - lastInteracted;

        int16 daysSinceInteraction = int16(interval / 86400);
        int16 baseKinship = 50;

        if (daysSinceInteraction > baseKinship + interactionCount) {
            score = 0;
        } else {
            score = uint256(baseKinship + interactionCount - daysSinceInteraction);
        }
    }

    function allAavegotchiIdsOfOwner(address _owner) external view returns (uint256[] memory tokenIds_) {
        tokenIds_ = new uint256[](s.aavegotchiBalance[_owner]);
        uint256 totalSupply = s.totalSupply;
        uint256 ownerIndex;
        for (uint256 tokenId; tokenId < totalSupply; tokenId++) {
            if (_owner == s.aavegotchis[tokenId].owner) {
                tokenIds_[ownerIndex] = tokenId;
                ownerIndex++;
            }
        }
    }

    function allAavegotchisOfOwner(address _owner) external view returns (AavegotchiInfo[] memory aavegotchiInfos_) {
        aavegotchiInfos_ = new AavegotchiInfo[](s.aavegotchiBalance[_owner]);
        uint256 totalSupply = s.totalSupply;
        uint256 ownerIndex;
        for (uint256 tokenId; tokenId < totalSupply; tokenId++) {
            if (_owner == s.aavegotchis[tokenId].owner) {
                aavegotchiInfos_[ownerIndex] = getAavegotchi(tokenId);
                ownerIndex++;
            }
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

    /***********************************|
   |             Only owner             |
   |__________________________________*/

    function setAavegotchiName(uint256 _tokenId, string memory _name) external onlyUnlocked(_tokenId) onlyAavegotchiOwner(_tokenId) {
        require(bytes(_name).length > 0, "AavegotchiFacet: _name can't be empty");
        require(s.aavegotchis[_tokenId].status == LibAppStorage.STATUS_AAVEGOTCHI, "AavegotchiFacet: Must choose Aavegotchi before setting name");
        require(bytes(_name).length < 26, "AavegotchiFacet: _name can't be greater than 25 characters");
        require(s.aavegotchiNamesUsed[_name] == false, "AavegotchiFacet: Aavegotchi name used already");
        string memory existingName = s.aavegotchis[_tokenId].name;
        if (bytes(existingName).length > 0) {
            delete s.aavegotchiNamesUsed[existingName];
        }
        s.aavegotchiNamesUsed[_name] = true;
        s.aavegotchis[_tokenId].name = _name;
    }

    function setBatchId(uint256[] calldata _tokenIds) external {
        for (uint256 i; i < _tokenIds.length; i++) {
            uint256 tokenId = _tokenIds[i];
            require(msg.sender == s.aavegotchis[tokenId].owner, "AavegotchiFacet: Only aavegotchi owner can set a batchId");
            require(s.aavegotchis[tokenId].batchId == 0, "AavegotchiFacet: batchId already set");
            LibVrf.Storage storage vrf_ds = LibVrf.diamondStorage();
            s.aavegotchis[tokenId].batchId = vrf_ds.nextBatchId;
            vrf_ds.batchCount++;
        }
    }

    function openPortals(uint256[] calldata _tokenIds) external {
        for (uint256 i; i < _tokenIds.length; i++) {
            uint256 tokenId = _tokenIds[i];
            require(s.aavegotchis[tokenId].status == LibAppStorage.STATUS_CLOSED_PORTAL, "AavegotchiFacet: Portal is not closed");
            require(msg.sender == s.aavegotchis[tokenId].owner, "AavegotchiFacet: Only aavegotchi owner can open a portal");
            uint256 batchRandomNumber = LibVrf.getBatchRandomNumber(s.aavegotchis[tokenId].batchId);
            require(batchRandomNumber != 0, "AavegotchiFacet: No random number for this portal");

            s.aavegotchis[tokenId].randomNumber = uint256(keccak256(abi.encodePacked(batchRandomNumber, tokenId)));
            // status is open portal
            s.aavegotchis[tokenId].status = LibAppStorage.STATUS_OPEN_PORTAL;
        }
    }

    function spendSkillPoints(uint256 _tokenId, int8[4] calldata _values) external onlyUnlocked(_tokenId) onlyAavegotchiOwner(_tokenId) {
        int256 numericTraits = s.aavegotchis[_tokenId].numericTraits;
        //To test (Dan): Prevent underflow (is this ok?), see require below
        uint256 totalUsed = 0;
        for (uint8 index = 0; index < _values.length; index++) {
            totalUsed += abs(_values[index]);

            uint256 position = index * 16;
            // get trait
            int256 trait = int16(numericTraits >> position);
            trait += _values[index];
            // clear trait value
            numericTraits &= ~(int256(0xffff) << position);
            // set trait value
            numericTraits |= trait << position;
        }
        // handles underflow
        require(availableSkillPoints(_tokenId) >= totalUsed, "AavegotchiFacet: Not enough skill points");
        s.aavegotchis[_tokenId].numericTraits = numericTraits;
        //Increment used skill points
        s.aavegotchis[_tokenId].usedSkillPoints += uint16(totalUsed);
    }

    function claimAavegotchi(
        uint256 _tokenId,
        uint256 _option,
        uint256 _stakeAmount
    ) external onlyAavegotchiOwner(_tokenId) {
        Aavegotchi storage aavegotchi = s.aavegotchis[_tokenId];
        require(aavegotchi.status == LibAppStorage.STATUS_OPEN_PORTAL, "AavegotchiFacet: Portal not open");

        PortalAavegotchiTraitsIO memory option = singlePortalAavegotchiTraits(aavegotchi.randomNumber, _option);
        aavegotchi.randomNumber = option.randomNumber;
        aavegotchi.numericTraits = option.numericTraits;
        aavegotchi.collateralType = option.collateralType;
        aavegotchi.minimumStake = uint88(option.minimumStake);

        //New traits
        aavegotchi.experience = 0;
        aavegotchi.usedSkillPoints = 0;

        //Kinship
        aavegotchi.claimTime = uint40(block.timestamp);
        aavegotchi.lastInteracted = uint40(block.timestamp);

        require(_stakeAmount >= option.minimumStake, "AavegotchiFacet: _stakeAmount less than minimum stake");

        aavegotchi.status = LibAppStorage.STATUS_AAVEGOTCHI;

        address escrow = address(new CollateralEscrow(option.collateralType));
        aavegotchi.escrow = escrow;
        LibERC20.transferFrom(option.collateralType, msg.sender, escrow, _stakeAmount);
    }

    function interact(uint256 _tokenId) public {
        address owner = s.aavegotchis[_tokenId].owner;
        require(owner != address(0), "AavegotchiFacet: Invalid tokenId, is not owned or doesn't exist");
        require(
            msg.sender == owner || s.operators[owner][msg.sender] || s.approved[_tokenId] == msg.sender,
            "AavegotchiFacet: Not owner of token or approved"
        );
        LibAppStorage.interact(_tokenId);
    }

    //Prevnts assets and items from being moved from Aavegotchi during lock period, except by gameManager.
    function lockAavegotchi(uint256 _tokenId, uint256 _lockDuration) external {
        require(s.aavegotchis[_tokenId].status == LibAppStorage.STATUS_AAVEGOTCHI, "AavegotchiFacet: Must be claimed");
        require(msg.sender == s.aavegotchis[_tokenId].owner, "AavegotchiFacet: Only aavegotchi owner can claim aavegotchi from a portal");
        s.aavegotchis[_tokenId].unlockTime = block.timestamp + _lockDuration;
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
        internalTransferFrom(_from, _to, _tokenId);
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
        internalTransferFrom(_from, _to, _tokenId);
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
        internalTransferFrom(_from, _to, _tokenId);
    }

    // This function is used by transfer functions
    function internalTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) internal {
        require(_to != address(0), "ER721: Can't transfer to 0 address");
        address owner = s.aavegotchis[_tokenId].owner;
        require(owner != address(0), "ERC721: Invalid tokenId or can't be transferred");
        require(
            msg.sender == owner || s.operators[owner][msg.sender] || s.approved[_tokenId] == msg.sender,
            "AavegotchiFacet: Not owner or approved to transfer"
        );
        require(_from == owner, "ERC721: _from is not owner, transfer failed");
        s.aavegotchis[_tokenId].owner = _to;
        s.aavegotchiBalance[_from]--;
        s.aavegotchiBalance[_to]++;
        if (s.approved[_tokenId] != address(0)) {
            delete s.approved[_tokenId];
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
}
