// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "../libraries/LibAppStorage.sol";
import "../../shared/interfaces/IERC20.sol";
import "../../shared/libraries/LibStrings.sol";
import "../libraries/LibSvg.sol";
import "../../shared/libraries/LibDiamond.sol";
import "../../shared/libraries/LibERC20.sol";
import "./VrfFacet.sol";
// import "hardhat/console.sol";
import "../CollateralEscrow.sol";
import "../libraries/LibVrf.sol";
import "../libraries/LibMeta.sol";
import "../libraries/LibERC721Marketplace.sol";

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

interface IERC721MaretplaceFacet {
    function updateERC721Listing(
        address _erc721TokenAddress,
        uint256 _erc721TokenId,
        address _owner
    ) external;
}

contract AavegotchiFacet is LibAppStorageModifiers {
    bytes4 private constant ERC721_RECEIVED = 0x150b7a02;
    uint256 internal constant EQUIPPED_WEARABLE_SLOTS = 16;
    uint256 internal constant PORTAL_AAVEGOTCHIS_NUM = 10;

    /***********************************|
   |             Events                |
   |__________________________________*/

    // event AavegotchiBatched(uint256 indexed _batchId, uint256[] tokenIds);
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

    event ClaimAavegotchi(uint256 indexed _tokenId);

    event SetAavegotchiName(uint256 indexed _tokenId, string _oldName, string _newName);

    event SetBatchId(uint256 indexed _batchId, uint256[] tokenIds);

    event SpendSkillpoints(uint256 indexed _tokenId, int8[4] _values);

    event LockAavegotchi(uint256 indexed _tokenId, uint256 _time);
    event UnLockAavegotchi(uint256 indexed _tokenId, uint256 _time);

    /***********************************|
   |             Read Functions         |
   |__________________________________*/

    function totalSupply() external view returns (uint256 totalSupply_) {
        totalSupply_ = s.totalSupply;
    }

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
        return RevenueSharesIO(0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF, s.daoTreasury, s.rarityFarming, s.pixelCraft);
    }

    struct InternalPortalAavegotchiTraitsIO {
        uint256 randomNumber;
        uint256 numericTraits;
        address collateralType;
        uint256 minimumStake;
    }

    function toNumericTraits(uint256 _randomNumber, uint256 _modifiers) internal pure returns (uint256 numericTraits_) {
        for (uint256 i; i < LibAppStorage.NUMERIC_TRAITS_NUM; i++) {
            uint256 value = uint8(_randomNumber >> (i * 8));
            if (value > 99) {
                value /= 2;
                if (value > 99) {
                    value = uint256(keccak256(abi.encodePacked(_randomNumber, i))) % 100;
                }
            }
            int256 mod = int8(int256(_modifiers >> (i * 8)));
            // set slot
            numericTraits_ |= uint256((int256(value) + mod) & 0xffff) << (16 * i);
        }
    }

    function singlePortalAavegotchiTraits(uint256 _randomNumber, uint256 _option)
        internal
        view
        returns (InternalPortalAavegotchiTraitsIO memory singlePortalAavegotchiTraits_)
    {
        uint256 randomNumberN = uint256(keccak256(abi.encodePacked(_randomNumber, _option)));
        singlePortalAavegotchiTraits_.randomNumber = randomNumberN;
        address collateralType = s.collateralTypes[randomNumberN % s.collateralTypes.length];
        singlePortalAavegotchiTraits_.numericTraits = toNumericTraits(randomNumberN, s.collateralTypeInfo[collateralType].modifiers);
        singlePortalAavegotchiTraits_.collateralType = collateralType;

        AavegotchiCollateralTypeInfo memory collateralInfo = s.collateralTypeInfo[collateralType];
        uint16 conversionRate = collateralInfo.conversionRate;

        //Get rarity multiplier
        uint256 multiplier = rarityMultiplier(singlePortalAavegotchiTraits_.numericTraits);

        //First we get the base price of our collateral in terms of DAI
        uint256 collateralDAIPrice = ((10**IERC20(collateralType).decimals()) / conversionRate);

        //Then multiply by the rarity multiplier
        singlePortalAavegotchiTraits_.minimumStake = collateralDAIPrice * multiplier;
    }

    struct PortalAavegotchiTraitsIO {
        uint256 randomNumber;
        int256[] numericTraits;
        uint256 numericTraitsUint;
        address collateralType;
        uint256 minimumStake;
    }

    function portalAavegotchiTraits(uint256 _tokenId)
        external
        view
        returns (PortalAavegotchiTraitsIO[PORTAL_AAVEGOTCHIS_NUM] memory portalAavegotchiTraits_)
    {
        require(s.aavegotchis[_tokenId].status == LibAppStorage.STATUS_OPEN_PORTAL, "AavegotchiFacet: Portal not open");

        uint256 randomNumber = s.tokenIdToRandomNumber[_tokenId];

        for (uint256 i; i < portalAavegotchiTraits_.length; i++) {
            InternalPortalAavegotchiTraitsIO memory single = singlePortalAavegotchiTraits(randomNumber, i);
            portalAavegotchiTraits_[i].randomNumber = single.randomNumber;
            portalAavegotchiTraits_[i].collateralType = single.collateralType;
            portalAavegotchiTraits_[i].minimumStake = single.minimumStake;
            portalAavegotchiTraits_[i].numericTraitsUint = single.numericTraits;
            portalAavegotchiTraits_[i].numericTraits = new int256[](LibAppStorage.NUMERIC_TRAITS_NUM);
            for (uint256 j; j < LibAppStorage.NUMERIC_TRAITS_NUM; j++) {
                portalAavegotchiTraits_[i].numericTraits[j] = int16(int256(single.numericTraits >> (j * 16)));
            }
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
        uint256 status;
        int256[] numericTraits;
        int256[] modifiedNumericTraits;
        uint256[EQUIPPED_WEARABLE_SLOTS] equippedWearables;
        address collateral;
        address escrow;
        uint256 stakedAmount;
        uint256 minimumStake;
        //New
        uint256 kinship; //The kinship value of this Aavegotchi. Default is 50.
        uint256 lastInteracted;
        uint256 experience; //How much XP this Aavegotchi has accrued. Begins at 0.
        uint256 toNextLevel;
        uint256 usedSkillPoints; //number of skill points used
        uint256 level; //the current aavegotchi level
        uint256 hauntId;
        uint256 baseRarityScore;
        uint256 modifiedRarityScore;
        bool locked;
    }

    function getNumericTraits(uint256 _tokenId) public view returns (uint256 numericTraits_) {
        //Check if trait boosts from consumables are still valid
        int256 boostDecay = int256((block.timestamp - s.aavegotchis[_tokenId].lastTemporaryBoost) / 24 hours);
        uint256 temporaryTraitBoosts = s.aavegotchis[_tokenId].temporaryTraitBoosts;
        uint256 numericTraits = s.aavegotchis[_tokenId].numericTraits;
        for (uint256 i; i < LibAppStorage.NUMERIC_TRAITS_NUM; i++) {
            int256 number = int16(int256(numericTraits >> (i * 16)));
            int256 boost = int8(int256(temporaryTraitBoosts >> (i * 8)));

            if (boost > 0) {
                if (boost > boostDecay) {
                    number += boost - boostDecay;
                }
            } else {
                if ((boost * -1) > boostDecay) {
                    number += boost + boostDecay;
                }
            }
            numericTraits_ |= uint256(number & 0xffff) << (i * 16);
        }
    }

    function getAavegotchi(uint256 _tokenId) public view returns (AavegotchiInfo memory aavegotchiInfo_) {
        aavegotchiInfo_.tokenId = _tokenId;
        aavegotchiInfo_.owner = s.aavegotchis[_tokenId].owner;
        aavegotchiInfo_.randomNumber = s.aavegotchis[_tokenId].randomNumber;
        aavegotchiInfo_.status = s.aavegotchis[_tokenId].status;
        aavegotchiInfo_.hauntId = s.aavegotchis[_tokenId].hauntId;
        if (aavegotchiInfo_.status == LibAppStorage.STATUS_AAVEGOTCHI) {
            aavegotchiInfo_.name = s.aavegotchis[_tokenId].name;
            uint256 l_equippedWearables = s.aavegotchis[_tokenId].equippedWearables;
            for (uint16 i; i < EQUIPPED_WEARABLE_SLOTS; i++) {
                aavegotchiInfo_.equippedWearables[i] = uint16(l_equippedWearables >> (i * 16));
            }
            aavegotchiInfo_.collateral = s.aavegotchis[_tokenId].collateralType;
            aavegotchiInfo_.escrow = s.aavegotchis[_tokenId].escrow;
            aavegotchiInfo_.stakedAmount = IERC20(aavegotchiInfo_.collateral).balanceOf(aavegotchiInfo_.escrow);
            aavegotchiInfo_.minimumStake = s.aavegotchis[_tokenId].minimumStake;
            aavegotchiInfo_.kinship = kinship(_tokenId);
            aavegotchiInfo_.lastInteracted = s.aavegotchis[_tokenId].lastInteracted;
            aavegotchiInfo_.experience = s.aavegotchis[_tokenId].experience;
            aavegotchiInfo_.toNextLevel = xpUntilNextLevel(s.aavegotchis[_tokenId].experience);
            aavegotchiInfo_.level = LibAppStorage.aavegotchiLevel(s.aavegotchis[_tokenId].experience);
            aavegotchiInfo_.usedSkillPoints = s.aavegotchis[_tokenId].usedSkillPoints;
            uint256 numericTraits = s.aavegotchis[_tokenId].numericTraits;
            aavegotchiInfo_.numericTraits = new int256[](LibAppStorage.NUMERIC_TRAITS_NUM);
            for (uint256 i; i < LibAppStorage.NUMERIC_TRAITS_NUM; i++) {
                aavegotchiInfo_.numericTraits[i] = int16(int256(numericTraits >> (i * 16)));
            }
            aavegotchiInfo_.baseRarityScore = baseRarityScore(numericTraits);
            (aavegotchiInfo_.modifiedNumericTraits, aavegotchiInfo_.modifiedRarityScore) = modifiedTraitsAndRarityScore(_tokenId);
            aavegotchiInfo_.locked = s.aavegotchis[_tokenId].locked;
        }
        return aavegotchiInfo_;
    }

    function availableSkillPoints(uint256 _tokenId) public view returns (uint256) {
        uint256 level = LibAppStorage.aavegotchiLevel(s.aavegotchis[_tokenId].experience);
        uint256 skillPoints = (level / 3);
        uint256 usedSkillPoints = s.aavegotchis[_tokenId].usedSkillPoints;
        require(skillPoints >= usedSkillPoints, "AavegotchiFacet: Used skill points is greater than skill points");
        return skillPoints - usedSkillPoints;
    }

    function abs(int8 x) private pure returns (uint256) {
        require(x != -128, "AavegotchiFacet: x can't be -128");
        return uint256(int256(x >= 0 ? x : -x));
    }

    function aavegotchiLevel(uint32 _experience) public pure returns (uint256 level_) {
        level_ = LibAppStorage.aavegotchiLevel(_experience);
    }

    function xpUntilNextLevel(uint32 _experience) public pure returns (uint256 requiredXp_) {
        uint256 currentLevel = aavegotchiLevel(_experience);
        requiredXp_ = (((currentLevel)**2) * 50) - _experience;
    }

    function rarityMultiplier(uint256 _numericTraits) public pure returns (uint256 multiplier) {
        uint256 rarityScore = baseRarityScore(_numericTraits);
        if (rarityScore < 300) return 10;
        else if (rarityScore >= 300 && rarityScore < 450) return 10;
        else if (rarityScore >= 450 && rarityScore <= 525) return 25;
        else if (rarityScore >= 526 && rarityScore <= 580) return 100;
        else if (rarityScore >= 581) return 1000;
    }

    //Calculates the base rarity score, including collateral modifier
    function baseRarityScore(uint256 _numericTraits) public pure returns (uint256 _rarityScore) {
        for (uint256 i; i < LibAppStorage.NUMERIC_TRAITS_NUM; i++) {
            int256 number = int16(int256(_numericTraits >> (i * 16)));
            if (number >= 50) {
                _rarityScore += uint256(number) + 1;
            } else {
                _rarityScore += uint256(int256(100) - number);
            }
        }
    }

    //Only valid for claimed Aavegotchis
    function modifiedTraitsAndRarityScore(uint256 _tokenId) public view returns (int256[] memory numericTraits_, uint256 rarityScore_) {
        require(s.aavegotchis[_tokenId].status == LibAppStorage.STATUS_AAVEGOTCHI, "AavegotchiFacet: Must be claimed");
        numericTraits_ = new int256[](LibAppStorage.NUMERIC_TRAITS_NUM);
        Aavegotchi storage aavegotchi = s.aavegotchis[_tokenId];
        uint256 equippedWearables = aavegotchi.equippedWearables;
        uint256 numericTraitsUint = getNumericTraits(_tokenId);
        uint256 wearableBonus;
        for (uint256 slot; slot < EQUIPPED_WEARABLE_SLOTS; slot++) {
            uint256 wearableId = uint16(equippedWearables >> (16 * slot));
            if (wearableId == 0) {
                continue;
            }
            ItemType storage itemType = s.itemTypes[wearableId];
            //Add on trait modifiers
            uint256 traitModifiers = itemType.traitModifiers;
            uint256 newNumericTraits;
            for (uint256 j; j < LibAppStorage.NUMERIC_TRAITS_NUM; j++) {
                int256 number = int16(int256(numericTraitsUint >> (j * 16)));
                int256 traitModifier = int8(int256(traitModifiers >> (j * 8)));
                number += traitModifier;
                // clear bits first then assign
                newNumericTraits |= (uint256(number) & 0xffff) << (j * 16);
            }

            numericTraitsUint = newNumericTraits;
            wearableBonus += itemType.rarityScoreModifier;
        }
        uint256 baseRarity = baseRarityScore(numericTraitsUint);
        rarityScore_ = baseRarity + wearableBonus;
        for (uint256 i; i < LibAppStorage.NUMERIC_TRAITS_NUM; i++) {
            int256 number = int16(int256(numericTraitsUint >> (i * 16)));
            numericTraits_[i] = number;
        }
    }

    function kinship(uint256 _tokenId) public view returns (uint256 score_) {
        Aavegotchi storage aavegotchi = s.aavegotchis[_tokenId];
        uint256 lastInteracted = aavegotchi.lastInteracted;
        uint256 interactionCount = aavegotchi.interactionCount;
        uint256 interval = block.timestamp - lastInteracted;

        uint256 daysSinceInteraction = interval / 24 hours;

        if (interactionCount > daysSinceInteraction) {
            score_ = interactionCount - daysSinceInteraction;
        }
    }

    function allAavegotchiIdsOfOwner(address _owner) external view returns (uint256[] memory tokenIds_) {
        tokenIds_ = new uint256[](s.aavegotchiBalance[_owner]);
        uint256 l_totalSupply = s.totalSupply;
        uint256 ownerIndex;
        for (uint256 tokenId; tokenId < l_totalSupply; tokenId++) {
            if (_owner == s.aavegotchis[tokenId].owner) {
                tokenIds_[ownerIndex] = tokenId;
                ownerIndex++;
            }
        }
    }

    function allAavegotchisOfOwner(address _owner) external view returns (AavegotchiInfo[] memory aavegotchiInfos_) {
        aavegotchiInfos_ = new AavegotchiInfo[](s.aavegotchiBalance[_owner]);
        uint256 l_totalSupply = s.totalSupply;
        uint256 ownerIndex;
        for (uint256 tokenId; tokenId < l_totalSupply; tokenId++) {
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
   |             Write Functions        |
   |__________________________________*/

    function claimAavegotchi(
        uint256 _tokenId,
        uint256 _option,
        uint256 _stakeAmount
    ) external onlyAavegotchiOwner(_tokenId) {
        Aavegotchi storage aavegotchi = s.aavegotchis[_tokenId];
        require(aavegotchi.status == LibAppStorage.STATUS_OPEN_PORTAL, "AavegotchiFacet: Portal not open");
        require(_option < PORTAL_AAVEGOTCHIS_NUM, "AavegotchiFacet: Only 10 aavegotchi options available");

        uint256 randomNumber = s.tokenIdToRandomNumber[_tokenId];

        InternalPortalAavegotchiTraitsIO memory option = singlePortalAavegotchiTraits(randomNumber, _option);
        aavegotchi.randomNumber = option.randomNumber;
        aavegotchi.numericTraits = option.numericTraits;
        aavegotchi.collateralType = option.collateralType;
        aavegotchi.minimumStake = uint88(option.minimumStake);
        aavegotchi.lastInteracted = uint40(block.timestamp - 12 hours);
        aavegotchi.interactionCount = 50;
        aavegotchi.claimTime = uint40(block.timestamp);

        require(_stakeAmount >= option.minimumStake, "AavegotchiFacet: _stakeAmount less than minimum stake");

        aavegotchi.status = LibAppStorage.STATUS_AAVEGOTCHI;
        emit ClaimAavegotchi(_tokenId);

        address escrow = address(new CollateralEscrow(option.collateralType));
        aavegotchi.escrow = escrow;
        address owner = LibMeta.msgSender();
        LibERC20.transferFrom(option.collateralType, owner, escrow, _stakeAmount);

        bytes32 listingId = keccak256(abi.encodePacked(address(this), _tokenId, owner));
        LibERC721Marketplace.cancelERC721Listing(listingId, owner);
    }

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
        emit SetAavegotchiName(_tokenId, existingName, _name);
    }

    function interact(uint256[] calldata _tokenIds) external {
        for (uint256 i; i < _tokenIds.length; i++) {
            uint256 tokenId = _tokenIds[i];
            address owner = s.aavegotchis[tokenId].owner;
            require(owner != address(0), "AavegotchiFacet: Invalid tokenId, is not owned or doesn't exist");
            require(
                LibMeta.msgSender() == owner || s.operators[owner][LibMeta.msgSender()] || s.approved[tokenId] == LibMeta.msgSender(),
                "AavegotchiFacet: Not owner of token or approved"
            );
            LibAppStorage.interact(tokenId);
        }
    }

    function spendSkillPoints(uint256 _tokenId, int8[4] calldata _values) external onlyUnlocked(_tokenId) onlyAavegotchiOwner(_tokenId) {
        uint256 numericTraits = s.aavegotchis[_tokenId].numericTraits;
        //To test (Dan): Prevent underflow (is this ok?), see require below
        uint256 totalUsed = 0;
        for (uint8 index = 0; index < _values.length; index++) {
            totalUsed += abs(_values[index]);

            uint256 position = index * 16;
            // get trait
            int256 trait = int16(int256(numericTraits >> position));
            trait += _values[index];
            // clear trait value
            numericTraits &= ~(uint256(0xffff) << position);
            // set trait value
            numericTraits |= uint256(trait & 0xffff) << position;
        }
        // handles underflow
        require(availableSkillPoints(_tokenId) >= totalUsed, "AavegotchiFacet: Not enough skill points");
        s.aavegotchis[_tokenId].numericTraits = numericTraits;
        //Increment used skill points
        s.aavegotchis[_tokenId].usedSkillPoints += uint16(totalUsed);
        emit SpendSkillpoints(_tokenId, _values);
    }

    // /**@notice Prevnts assets and items from being moved from Aavegotchi during lock period, except by gameManager. */
    // function lockAavegotchi(uint256 _tokenId) external onlyUnlocked(_tokenId) {
    //     require(s.aavegotchis[_tokenId].status == LibAppStorage.STATUS_AAVEGOTCHI, "AavegotchiFacet: Must be claimed");
    //     require(LibMeta.msgSender() == s.aavegotchis[_tokenId].owner, "AavegotchiFacet: Only owner can lock aavegotchi");
    //     //s.aavegotchis[_tokenId].lockBlock = block.number;
    //     s.aavegotchis[_tokenId].locked = true;
    //     emit LockAavegotchi(_tokenId, block.timestamp);
    // }

    // function unLockAavegotchi(uint256 _tokenId) external {
    //     require(s.aavegotchis[_tokenId].status == LibAppStorage.STATUS_AAVEGOTCHI, "AavegotchiFacet: Must be claimed");
    //     address owner = LibMeta.msgSender();
    //     require(owner == s.aavegotchis[_tokenId].owner, "AavegotchiFacet: Only owner can lock aavegotchi");
    //     //require(s.aavegotchis[_tokenId].lockBlock != block.number, "AavegotchiFacet: Cannot lock in same transaction as other sensitve action");
    //     bytes32 listingId = s.erc721TokenToListingId[address(this)][_tokenId][owner];
    //     if (listingId != 0) {
    //         ERC721Listing storage listing = s.erc721Listings[listingId];
    //         require(listing.sold == true || listing.cancelled == true, "AavegotchFacet: can't unlock while listed");
    //     }
    //     s.aavegotchis[_tokenId].locked = false;
    //     emit UnLockAavegotchi(_tokenId, block.timestamp);
    // }

    /// @notice Transfers the ownership of an NFT from one address to another address
    /// @dev Throws unless `LibMeta.msgSender()` is the current owner, an authorized
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
                ERC721_RECEIVED == ERC721TokenReceiver(_to).onERC721Received(LibMeta.msgSender(), _from, _tokenId, _data),
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
                ERC721_RECEIVED == ERC721TokenReceiver(_to).onERC721Received(LibMeta.msgSender(), _from, _tokenId, ""),
                "ERC721: Transfer rejected/failed by _to"
            );
        }
    }

    /// @notice Transfer ownership of an NFT -- THE CALLER IS RESPONSIBLE
    ///  TO CONFIRM THAT `_to` IS CAPABLE OF RECEIVING NFTS OR ELSE
    ///  THEY MAY BE PERMANENTLY LOST
    /// @dev Throws unless `LibMeta.msgSender()` is the current owner, an authorized
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
        address sender = LibMeta.msgSender();
        require(owner != address(0), "ERC721: Invalid tokenId or can't be transferred");
        require(
            sender == owner || sender == address(this) || s.operators[owner][sender] || sender == s.approved[_tokenId],
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
        IERC721MaretplaceFacet(address(this)).updateERC721Listing(address(this), _tokenId, _from);
    }

    /// @notice Change or reaffirm the approved address for an NFT
    /// @dev The zero address indicates there is no approved address.
    ///  Throws unless `LibMeta.msgSender()` is the current NFT owner, or an authorized
    ///  operator of the current owner.
    /// @param _approved The new approved NFT controller
    /// @param _tokenId The NFT to approve
    function approve(address _approved, uint256 _tokenId) external {
        address owner = s.aavegotchis[_tokenId].owner;
        require(owner == LibMeta.msgSender() || s.operators[owner][LibMeta.msgSender()], "ERC721: Not owner or operator of token.");
        s.approved[_tokenId] = _approved;
        emit Approval(owner, _approved, _tokenId);
    }

    /// @notice Enable or disable approval for a third party ("operator") to manage
    ///  all of `LibMeta.msgSender()`'s assets
    /// @dev Emits the ApprovalForAll event. The contract MUST allow
    ///  multiple operators per owner.
    /// @param _operator Address to add to the set of authorized operators
    /// @param _approved True if the operator is approved, false to revoke approval
    function setApprovalForAll(address _operator, bool _approved) external {
        s.operators[LibMeta.msgSender()][_operator] = _approved;
        emit ApprovalForAll(LibMeta.msgSender(), _operator, _approved);
    }

    function name() external pure returns (string memory) {
        return "Aavegotchi";
    }

    /// @notice An abbreviated name for NFTs in this contract
    function symbol() external pure returns (string memory) {
        return "GOTCHI";
    }

    /// @notice A distinct Uniform Resource Identifier (URI) for a given asset.
    /// @dev Throws if `_tokenId` is not a valid NFT. URIs are defined in RFC
    ///  3986. The URI may point to a JSON file that conforms to the "ERC721
    ///  Metadata JSON Schema".
    function tokenURI(uint256 _tokenId) external pure returns (string memory) {
        string memory uid = LibStrings.uintStr(_tokenId);
        return string(abi.encodePacked("https://aavegotchi.com/metadata/aavegotchis/", uid)); //Here is your URL!
    }
}
