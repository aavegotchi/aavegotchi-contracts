// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import {LibAavegotchi, AavegotchiInfo, NUMERIC_TRAITS_NUM, AavegotchiCollateralTypeInfo, PortalAavegotchiTraitsIO, InternalPortalAavegotchiTraitsIO, PORTAL_AAVEGOTCHIS_NUM} from "../libraries/LibAavegotchi.sol";

import {LibAppStorage} from "../libraries/LibAppStorage.sol";

import {IERC20} from "../../shared/interfaces/IERC20.sol";
import {LibStrings} from "../../shared/libraries/LibStrings.sol";
import {Modifiers, Haunt, Aavegotchi} from "../libraries/LibAppStorage.sol";
import {LibERC20} from "../../shared/libraries/LibERC20.sol";
import {CollateralEscrow} from "../CollateralEscrow.sol";
import {LibMeta} from "../../shared/libraries/LibMeta.sol";
import {LibERC721Marketplace} from "../libraries/LibERC721Marketplace.sol";

import {LibGotchiLending} from "../libraries/LibGotchiLending.sol";

import {LibBitmapHelpers} from "../libraries/LibBitmapHelpers.sol";

contract AavegotchiGameFacet is Modifiers {
    /// @dev This emits when the approved address for an NFT is changed or
    ///  reaffirmed. The zero address indicates there is no approved address.
    ///  When a Transfer event emits, this also indicates that the approved
    ///  address for that NFT (if any) is reset to none.

    /// @dev This emits when an operator is enabled or disabled for an owner.
    ///  The operator can manage all NFTs of the owner.

    event ClaimAavegotchi(uint256 indexed _tokenId);

    event SetAavegotchiName(uint256 indexed _tokenId, string _oldName, string _newName);

    event SetBatchId(uint256 indexed _batchId, uint256[] tokenIds);

    event SpendSkillpoints(uint256 indexed _tokenId, int16[4] _values);

    event LockAavegotchi(uint256 indexed _tokenId, uint256 _time);
    event UnLockAavegotchi(uint256 indexed _tokenId, uint256 _time);

    ///@notice Check if a string `_name` has not been assigned to another NFT
    ///@param _name Name to check
    ///@return available_ True if the name has not been taken, False otherwise
    function aavegotchiNameAvailable(string calldata _name) external view returns (bool available_) {
        available_ = s.aavegotchiNamesUsed[LibAavegotchi.validateAndLowerName(_name)];
    }

    ///@notice Check the latest Haunt identifier and details
    ///@return hauntId_ The latest haunt identifier
    ///@return haunt_ A struct containing the details about the latest haunt`

    function currentHaunt() external view returns (uint256 hauntId_, Haunt memory haunt_) {
        hauntId_ = s.currentHauntId;
        haunt_ = s.haunts[hauntId_];
    }

    struct RevenueSharesIO {
        address burnAddress;
        address daoAddress;
        address rarityFarming;
        address pixelCraft;
    }

    ///@notice Check all addresses relating to revenue deposits including the burn address
    ///@return RevenueSharesIO A struct containing all addresses relating to revenue deposits
    function revenueShares() external view returns (RevenueSharesIO memory) {
        return RevenueSharesIO(0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF, s.daoTreasury, s.rarityFarming, s.pixelCraft);
    }

    ///@notice Query all details associated with an NFT like collateralType,numericTraits e.t.c
    ///@param _tokenId Identifier of the NFT to query
    ///@return portalAavegotchiTraits_ A struct containing all details about the NFT with identifier `_tokenId`

    function portalAavegotchiTraits(
        uint256 _tokenId
    ) external view returns (PortalAavegotchiTraitsIO[PORTAL_AAVEGOTCHIS_NUM] memory portalAavegotchiTraits_) {
        portalAavegotchiTraits_ = LibAavegotchi.portalAavegotchiTraits(_tokenId);
    }

    ///@notice Query the $GHST token address
    ///@return contract_ the deployed address of the $GHST token contract
    function ghstAddress() external view returns (address contract_) {
        contract_ = s.ghstContract;
    }

    ///@notice Query the numeric traits of an NFT
    ///@dev Only valid for claimed Aavegotchis
    ///@param _tokenId The identifier of the NFT to query
    ///@return numericTraits_ A six-element array containing integers,each representing the traits of the NFT with identifier `_tokenId`
    function getNumericTraits(uint256 _tokenId) external view returns (int16[NUMERIC_TRAITS_NUM] memory numericTraits_) {
        numericTraits_ = LibAavegotchi.getNumericTraits(_tokenId);
    }

    ///@notice Query the available skill points that can be used for an NFT
    ///@dev Will throw if the amount of skill points available is greater than or equal to the amount of skill points which have been used
    ///@param _tokenId The identifier of the NFT to query
    ///@return   An unsigned integer which represents the available skill points of an NFT with identifier `_tokenId`
    function availableSkillPoints(uint256 _tokenId) public view returns (uint256) {
        uint256 skillPoints = _calculateSkillPoints(_tokenId);
        uint256 usedSkillPoints = s.aavegotchis[_tokenId].usedSkillPoints;
        require(skillPoints >= usedSkillPoints, "AavegotchiGameFacet: Used skill points is greater than skill points");
        return skillPoints - usedSkillPoints;
    }

    function _calculateSkillPoints(uint256 _tokenId) internal view returns (uint256) {
        uint256 level = LibAavegotchi.aavegotchiLevel(s.aavegotchis[_tokenId].experience);
        uint256 skillPoints = (level / 3);

        uint256 claimTime = s.aavegotchis[_tokenId].claimTime;
        uint256 ageDifference = block.timestamp - claimTime;
        return skillPoints + _skillPointsByAge(ageDifference);
    }

    function _skillPointsByAge(uint256 _age) internal pure returns (uint256) {
        uint256 skillPointsByAge = 0;
        uint256[10] memory fibSequence = [uint256(1), 2, 3, 5, 8, 13, 21, 34, 55, 89];
        for (uint256 i = 0; i < fibSequence.length; i++) {
            if (_age > fibSequence[i] * 2300000) {
                skillPointsByAge++;
            } else {
                break;
            }
        }
        return skillPointsByAge;
    }

    ///@notice Calculate level given the XP(experience points)
    ///@dev Only valid for claimed Aavegotchis
    ///@param _experience the current XP gathered by an NFT
    ///@return level_ The level of an NFT with experience `_experience`
    function aavegotchiLevel(uint256 _experience) external pure returns (uint256 level_) {
        level_ = LibAavegotchi.aavegotchiLevel(_experience);
    }

    ///@notice Calculate the XP needed for an NFT to advance to the next level
    ///@dev Only valid for claimed Aavegotchis
    ///@param _experience The current XP points gathered by an NFT
    ///@return requiredXp_ The XP required for the NFT to move to the next level
    function xpUntilNextLevel(uint256 _experience) external pure returns (uint256 requiredXp_) {
        requiredXp_ = LibAavegotchi.xpUntilNextLevel(_experience);
    }

    ///@notice Compute the rarity multiplier of an NFT
    ///@dev Only valid for claimed Aavegotchis
    ///@param _numericTraits An array of six integers each representing a numeric trait of an NFT
    ///return multiplier_ The rarity multiplier of an NFT with numeric traits `_numericTraits`
    function rarityMultiplier(int16[NUMERIC_TRAITS_NUM] memory _numericTraits) external pure returns (uint256 multiplier_) {
        multiplier_ = LibAavegotchi.rarityMultiplier(_numericTraits);
    }

    ///@notice Calculates the base rarity score, including collateral modifier
    ///@dev Only valid for claimed Aavegotchis
    ///@param _numericTraits An array of six integers each representing a numeric trait of an NFT
    ///@return rarityScore_ The base rarity score of an NFT with numeric traits `_numericTraits`
    function baseRarityScore(int16[NUMERIC_TRAITS_NUM] memory _numericTraits) external pure returns (uint256 rarityScore_) {
        rarityScore_ = LibAavegotchi.baseRarityScore(_numericTraits);
    }

    ///@notice Check the modified traits and rarity score of an NFT(as a result of equipped wearables)
    ///@dev Only valid for claimed Aavegotchis
    ///@param _tokenId Identifier of the NFT to query
    ///@return numericTraits_ An array of six integers each representing a numeric trait(modified) of an NFT with identifier `_tokenId`
    ///@return rarityScore_ The modified rarity score of an NFT with identifier `_tokenId`
    //Only valid for claimed Aavegotchis
    function modifiedTraitsAndRarityScore(
        uint256 _tokenId
    ) external view returns (int16[NUMERIC_TRAITS_NUM] memory numericTraits_, uint256 rarityScore_) {
        (numericTraits_, rarityScore_) = LibAavegotchi.modifiedTraitsAndRarityScore(_tokenId);
    }

    ///@notice Check the kinship of an NFT
    ///@dev Only valid for claimed Aavegotchis
    ///@dev Default kinship value is 50
    ///@param _tokenId Identifier of the NFT to query
    ///@return score_ The kinship of an NFT with identifier `_tokenId`
    function kinship(uint256 _tokenId) external view returns (uint256 score_) {
        score_ = LibAavegotchi.kinship(_tokenId);
    }

    struct TokenIdsWithKinship {
        uint256 tokenId;
        uint256 kinship;
        uint256 lastInteracted;
    }

    ///@notice Query the tokenId,kinship and lastInteracted values of a set of NFTs belonging to an address
    ///@dev Will throw if `_count` is greater than the number of NFTs owned by `_owner`
    ///@param _owner Address to query
    ///@param _count Number of NFTs to check
    ///@param _skip Number of NFTs to skip while querying
    ///@param all If true, query all NFTs owned by `_owner`; if false, query `_count` NFTs owned by `_owner`
    ///@return tokenIdsWithKinship_ An array of structs where each struct contains the `tokenId`,`kinship`and `lastInteracted` of each NFT
    function tokenIdsWithKinship(
        address _owner,
        uint256 _count,
        uint256 _skip,
        bool all
    ) external view returns (TokenIdsWithKinship[] memory tokenIdsWithKinship_) {
        uint32[] memory tokenIds = s.ownerTokenIds[_owner];
        uint256 length = all ? tokenIds.length : _count;
        tokenIdsWithKinship_ = new TokenIdsWithKinship[](length);

        if (!all) {
            require(_skip + _count <= tokenIds.length, "gameFacet: Owner does not have up to that amount of tokens");
        }

        for (uint256 i; i < length; i++) {
            uint256 offset = i + _skip;
            uint32 tokenId = tokenIds[offset];
            if (s.aavegotchis[tokenId].status == 3) {
                tokenIdsWithKinship_[i].tokenId = tokenId;
                tokenIdsWithKinship_[i].kinship = LibAavegotchi.kinship(tokenId);
                tokenIdsWithKinship_[i].lastInteracted = s.aavegotchis[tokenId].lastInteracted;
            }
        }
    }

    ///@notice Allows the owner of an NFT(Portal) to claim an Aavegotchi provided it has been unlocked
    ///@dev Will throw if the Portal(with identifier `_tokenid`) has not been opened(Unlocked) yet
    ///@dev If the NFT(Portal) with identifier `_tokenId` is listed for sale on the baazaar while it is being unlocked, that listing is cancelled
    ///@param _tokenId The identifier of NFT to claim an Aavegotchi from
    ///@param _option The index of the aavegotchi to claim(1-10)
    ///@param _stakeAmount Minimum amount of collateral tokens needed to be sent to the new aavegotchi escrow contract
    function claimAavegotchi(uint256 _tokenId, uint256 _option, uint256 _stakeAmount) external onlyUnlocked(_tokenId) onlyAavegotchiOwner(_tokenId) {
        Aavegotchi storage aavegotchi = s.aavegotchis[_tokenId];
        require(aavegotchi.status == LibAavegotchi.STATUS_OPEN_PORTAL, "AavegotchiGameFacet: Portal not open");
        require(_option < PORTAL_AAVEGOTCHIS_NUM, "AavegotchiGameFacet: Only 10 aavegotchi options available");
        uint256 randomNumber = s.tokenIdToRandomNumber[_tokenId];
        uint256 hauntId = s.aavegotchis[_tokenId].hauntId;

        InternalPortalAavegotchiTraitsIO memory option = LibAavegotchi.singlePortalAavegotchiTraits(hauntId, randomNumber, _option);
        aavegotchi.randomNumber = option.randomNumber;
        aavegotchi.numericTraits = option.numericTraits;
        aavegotchi.collateralType = option.collateralType;
        aavegotchi.minimumStake = option.minimumStake;
        aavegotchi.lastInteracted = uint40(block.timestamp - 12 hours);
        aavegotchi.interactionCount = 50;
        aavegotchi.claimTime = uint40(block.timestamp);
        
        require(_stakeAmount >= option.minimumStake, "AavegotchiGameFacet: _stakeAmount less than minimum stake");

        aavegotchi.status = LibAavegotchi.STATUS_AAVEGOTCHI;
        emit ClaimAavegotchi(_tokenId);

        address escrow = address(new CollateralEscrow(option.collateralType));
        aavegotchi.escrow = escrow;
        address owner = LibMeta.msgSender();
        // LibERC20.transferFrom(option.collateralType, owner, escrow, _stakeAmount);
        LibERC721Marketplace.cancelERC721Listing(address(this), _tokenId, owner);
    }

    ///@notice Allows the owner of a NFT to set a name for it
    ///@dev only valid for claimed aavegotchis
    ///@dev Will throw if the name has been used for another claimed aavegotchi
    ///@param _tokenId the identifier if the NFT to name
    ///@param _name Preferred name to give the claimed aavegotchi

    function setAavegotchiName(uint256 _tokenId, string calldata _name) external onlyUnlocked(_tokenId) onlyAavegotchiOwner(_tokenId) {
        require(s.aavegotchis[_tokenId].status == LibAavegotchi.STATUS_AAVEGOTCHI, "AavegotchiGameFacet: Must claim Aavegotchi before setting name");
        string memory lowerName = LibAavegotchi.validateAndLowerName(_name);
        string memory existingName = s.aavegotchis[_tokenId].name;
        if (bytes(existingName).length > 0) {
            delete s.aavegotchiNamesUsed[LibAavegotchi.validateAndLowerName(existingName)];
        }
        require(!s.aavegotchiNamesUsed[lowerName], "AavegotchiGameFacet: Aavegotchi name used already");
        s.aavegotchiNamesUsed[lowerName] = true;
        s.aavegotchis[_tokenId].name = _name;
        emit SetAavegotchiName(_tokenId, existingName, _name);
    }

    ///@notice Allow the owner of an NFT to interact with them.thereby increasing their kinship(petting)
    ///@dev only valid for claimed aavegotchis
    ///@dev Kinship will only increase if the lastInteracted minus the current time is greater than or equal to 12 hours
    ///@param _tokenIds An array containing the token identifiers of the claimed aavegotchis that are to be interacted with
    function interact(uint256[] calldata _tokenIds) external {
        address sender = LibMeta.msgSender();
        for (uint256 i; i < _tokenIds.length; i++) {
            uint256 tokenId = _tokenIds[i];
            address owner = s.aavegotchis[tokenId].owner;

            //If the owner is the bridge or GBM Contract, anyone can pet the gotchis inside
            if (owner != address(this) && owner != 0xD5543237C656f25EEA69f1E247b8Fa59ba353306) {
                // Check lending status of aavegotchi and allow original pet operators
                bool isOriginalPetOperator;
                uint32 listingId = s.aavegotchiToListingId[uint32(tokenId)];
                if ((listingId != 0) && (s.gotchiLendings[listingId].timeAgreed > 0)) {
                    address lender = s.gotchiLendings[listingId].lender;
                    isOriginalPetOperator = s.operators[lender][sender] || s.petOperators[lender][sender];
                }
                require(
                    sender == owner ||
                        s.operators[owner][sender] ||
                        s.approved[tokenId] == sender ||
                        s.petOperators[owner][sender] ||
                        isOriginalPetOperator,
                    "AavegotchiGameFacet: Not owner of token or approved"
                );
            }

            require(s.aavegotchis[tokenId].status == LibAavegotchi.STATUS_AAVEGOTCHI, "LibAavegotchi: Only valid for Aavegotchi");
            LibAavegotchi.interact(tokenId);
        }
    }

    function setRealmAddress(address _realm) public onlyOwner {
        s.realmAddress = _realm;
    }

    ///@notice Allow the owner of an NFT to spend skill points for it(basically to boost the numeric traits of that NFT)
    ///@dev only valid for claimed aavegotchis
    ///@param _tokenId The identifier of the NFT to spend the skill points on
    ///@param _values An array of four integers that represent the values of the skill points
    function spendSkillPoints(uint256 _tokenId, int16[4] calldata _values) external onlyUnlocked(_tokenId) onlyAavegotchiOwner(_tokenId) {
        //To test (Dan): Prevent underflow (is this ok?), see require below
        uint256 totalUsed;
        for (uint256 index; index < _values.length; index++) {
            totalUsed += LibAppStorage.abs(_values[index]);

            s.aavegotchis[_tokenId].numericTraits[index] += _values[index];
        }
        // handles underflow
        require(availableSkillPoints(_tokenId) >= totalUsed, "AavegotchiGameFacet: Not enough skill points");
        //Increment used skill points
        s.aavegotchis[_tokenId].usedSkillPoints += totalUsed;
        emit SpendSkillpoints(_tokenId, _values);
    }

    function isAavegotchiLocked(uint256 _tokenId) external view returns (bool isLocked) {
        isLocked = s.aavegotchis[_tokenId].locked;
    }

    ///@notice Allow the current owner/borrower of an NFT to reduce kinship while channelling alchemica
    ///@dev will revert if the gotchi kinship is too low to channel or if the lending listing does not enable channeling
    ///@param _gotchiId Id of the Gotchi used to channel
    function reduceKinshipViaChanneling(uint32 _gotchiId) external {
        //only realmDiamond can reduce kinship
        require(msg.sender == s.realmAddress, "GotchiLending: Only Realm can reduce kinship via channeling");
        //no need to do checks on _gotchiId since realmDiamond handles that
        //first check if aavegotchi is lent
        if (LibGotchiLending.isAavegotchiLent(_gotchiId)) {
            //short-circuit here
            uint32 listingId = s.aavegotchiToListingId[_gotchiId];
            if (LibBitmapHelpers.getValueInByte(0, s.gotchiLendings[listingId].permissions) == 0) {
                revert("This listing has no permissions set");
            }

            //check if channelling is allowed for the listing
            //check that the modifier is at least 1
            //more checks can be introduced if more modifiers are added
            if (LibBitmapHelpers.getValueInByte(0, s.gotchiLendings[listingId].permissions) > 0) {
                //more checks can be introduced here as different permissions are added
                LibAavegotchi._reduceAavegotchiKinship(_gotchiId, 2);
            } else {
                revert("Channeling not enabled by listing owner");
            }
        }
        //if aavegotchi is not lent
        else {
            LibAavegotchi._reduceAavegotchiKinship(_gotchiId, 2);
        }

        LibAavegotchi.interact(_gotchiId);
    }
}
