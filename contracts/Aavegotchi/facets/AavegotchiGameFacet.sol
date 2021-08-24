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

// import "hardhat/console.sol";

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

    event PetOperatorRegistered(address indexed _address);
    event PetOperatorSet(uint256 indexed _tokenId, address indexed _petOperator);

    function aavegotchiNameAvailable(string calldata _name) external view returns (bool available_) {
        available_ = s.aavegotchiNamesUsed[LibAavegotchi.validateAndLowerName(_name)];
    }

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

    function revenueShares() external view returns (RevenueSharesIO memory) {
        return RevenueSharesIO(0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF, s.daoTreasury, s.rarityFarming, s.pixelCraft);
    }

    function portalAavegotchiTraits(uint256 _tokenId)
        external
        view
        returns (PortalAavegotchiTraitsIO[PORTAL_AAVEGOTCHIS_NUM] memory portalAavegotchiTraits_)
    {
        portalAavegotchiTraits_ = LibAavegotchi.portalAavegotchiTraits(_tokenId);
    }

    function ghstAddress() external view returns (address contract_) {
        contract_ = s.ghstContract;
    }

    function getNumericTraits(uint256 _tokenId) external view returns (int16[NUMERIC_TRAITS_NUM] memory numericTraits_) {
        numericTraits_ = LibAavegotchi.getNumericTraits(_tokenId);
    }

    function availableSkillPoints(uint256 _tokenId) public view returns (uint256) {
        uint256 level = LibAavegotchi.aavegotchiLevel(s.aavegotchis[_tokenId].experience);
        uint256 skillPoints = (level / 3);
        uint256 usedSkillPoints = s.aavegotchis[_tokenId].usedSkillPoints;
        require(skillPoints >= usedSkillPoints, "AavegotchiGameFacet: Used skill points is greater than skill points");
        return skillPoints - usedSkillPoints;
    }

    function aavegotchiLevel(uint256 _experience) external pure returns (uint256 level_) {
        level_ = LibAavegotchi.aavegotchiLevel(_experience);
    }

    function xpUntilNextLevel(uint256 _experience) external pure returns (uint256 requiredXp_) {
        requiredXp_ = LibAavegotchi.xpUntilNextLevel(_experience);
    }

    function rarityMultiplier(int16[NUMERIC_TRAITS_NUM] memory _numericTraits) external pure returns (uint256 multiplier_) {
        multiplier_ = LibAavegotchi.rarityMultiplier(_numericTraits);
    }

    //Calculates the base rarity score, including collateral modifier
    function baseRarityScore(int16[NUMERIC_TRAITS_NUM] memory _numericTraits) external pure returns (uint256 rarityScore_) {
        rarityScore_ = LibAavegotchi.baseRarityScore(_numericTraits);
    }

    //Only valid for claimed Aavegotchis
    function modifiedTraitsAndRarityScore(uint256 _tokenId)
        external
        view
        returns (int16[NUMERIC_TRAITS_NUM] memory numericTraits_, uint256 rarityScore_)
    {
        (numericTraits_, rarityScore_) = LibAavegotchi.modifiedTraitsAndRarityScore(_tokenId);
    }

    function kinship(uint256 _tokenId) external view returns (uint256 score_) {
        score_ = LibAavegotchi.kinship(_tokenId);
    }

    function claimAavegotchi(
        uint256 _tokenId,
        uint256 _option,
        uint256 _stakeAmount
    ) external onlyUnlocked(_tokenId) onlyAavegotchiOwner(_tokenId) {
        Aavegotchi storage aavegotchi = s.aavegotchis[_tokenId];
        require(aavegotchi.status == LibAavegotchi.STATUS_OPEN_PORTAL, "AavegotchiGameFacet: Portal not open");
        require(_option < PORTAL_AAVEGOTCHIS_NUM, "AavegotchiGameFacet: Only 10 aavegotchi options available");
        uint256 randomNumber = s.tokenIdToRandomNumber[_tokenId];

        InternalPortalAavegotchiTraitsIO memory option = LibAavegotchi.singlePortalAavegotchiTraits(randomNumber, _option);
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
        LibERC20.transferFrom(option.collateralType, owner, escrow, _stakeAmount);
        LibERC721Marketplace.cancelERC721Listing(address(this), _tokenId, owner);
    }

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

    function pet() external {
        address operator = LibMeta.msgSender();

        //todo: check balance to ensure owner has enough GHST

        //Get all the tokenIDs attached to the petOperator
        uint256[] memory tokenIds = s.petOperatorTokenIds[operator];
        address ghstContract = s.ghstContract;
        for (uint256 i; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            address owner = s.aavegotchis[tokenId].owner;
            //Can't pet burned Aavegotchis
            if (owner == address(0)) {
                continue;

                //Petting Aavegotchis held by Diamond is free
            } else if (address(this) == owner) {
                LibAavegotchi.interact(tokenId);
            } else {
                //It costs 0.3 GHST to Pet. 0.1 GHST goes to Pixelcraft, 0.2 goes to Pet Operator

                uint256 petRate = s.petOperatorInfo[operator].rate;

                uint256 balance = IERC20(ghstContract).balanceOf(owner);

                if (balance >= petRate && LibAavegotchi.interact(tokenId)) {
                    //todo: check rounding errors for divisible by 3 and 7

                    uint256 operatorShare = (petRate / 10) * 7;
                    uint256 pixelCraftShare = (petRate / 10) * 3;

                    LibERC20.transferFrom(ghstContract, owner, s.pixelCraft, pixelCraftShare);
                    LibERC20.transferFrom(ghstContract, owner, operator, operatorShare);
                }
            }
        }
    }

    function petOperatorTokenIds(address _petOperator) external view returns (uint256[] memory tokenIds_) {
        tokenIds_ = s.petOperatorTokenIds[_petOperator];
    }

    function petOperator(uint256 _tokenId) external view returns (address petOperator_) {
        petOperator_ = s.petOperators[_tokenId];
    }

    function removePetOperator(uint256[] calldata _tokenIds) external {
        address sender = LibMeta.msgSender();
        for (uint256 i; i < _tokenIds.length; i++) {
            uint256 tokenId = _tokenIds[i];
            address l_petOperator = s.petOperators[tokenId];
            if (l_petOperator != address(0)) {
                address owner = s.aavegotchis[tokenId].owner;
                require(owner == sender || l_petOperator == sender, "AavegotchiGameFacet: Not authorized to remove pet operator");
                LibAavegotchi.removePetOperator(tokenId);
            }
        }
    }

    //todo: test
    function registerAsPetOperator(
        uint256 _rate,
        string calldata _name,
        string calldata _description
    ) external {
        //First check if the petOperator is managing any Aavegotchis
        address sender = LibMeta.msgSender();

        require(s.petOperatorTokenIds[sender].length == 0, "AavegotchiGameFacet: Cannot update Pet Operator information with managed Aavegotchis");

        //todo: test
        require(_rate >= 3e17, "AavegotchiGameFacet: Pet rate too low");

        s.petOperatorInfo[sender].rate = _rate;
        s.petOperatorInfo[sender].name = _name;
        s.petOperatorInfo[sender].description = _description;

        emit PetOperatorRegistered(sender);
    }

    struct PetOperatorInfo {
        uint256 rate_;
        string name_;
        string description_;
    }

    function petOperatorInfo(address _operator) external view returns (PetOperatorInfo memory info_) {
        info_.rate_ = s.petOperatorInfo[_operator].rate;
        info_.name_ = s.petOperatorInfo[_operator].name;
        info_.description_ = s.petOperatorInfo[_operator].description;
    }

    function setPetOperator(address _petOperator, uint256[] calldata _tokenIds) external {
        require(_petOperator != address(0), "AavegotchiGameFacet: pet operator can't be address(0)");

        //todo: test
        require(s.petOperatorInfo[_petOperator].rate > 0, "AavegotchiGameFacet: Pet Operator not registered");

        address sender = LibMeta.msgSender();
        for (uint256 i; i < _tokenIds.length; i++) {
            uint256 tokenId = _tokenIds[i];
            address owner = s.aavegotchis[tokenId].owner;
            require(owner == sender, "AavegotchiGameFacet: Must be owner to set petter");

            //PO Already set
            if (s.petOperators[tokenId] == _petOperator) {
                continue;
            }

            //Replace PO with new one
            if (s.petOperators[tokenId] != address(0)) {
                LibAavegotchi.removePetOperator(tokenId);
            }
            s.petOperatorTokenIds[_petOperator].push(tokenId);
            s.petOperators[tokenId] = _petOperator;
            emit PetOperatorSet(tokenId, _petOperator);
        }
        require(s.petOperatorTokenIds[_petOperator].length < 11, "AavegotchiGameFacet: Pet operator can't have more than 10 aavegotchis");
    }

    function interact(uint256[] calldata _tokenIds) external {
        address sender = LibMeta.msgSender();
        for (uint256 i; i < _tokenIds.length; i++) {
            uint256 tokenId = _tokenIds[i];
            address owner = s.aavegotchis[tokenId].owner;
            require(
                sender == owner || s.operators[owner][sender] || s.approved[tokenId] == sender,
                "AavegotchiGameFacet: Not owner of token or approved"
            );
            require(s.aavegotchis[tokenId].status == LibAavegotchi.STATUS_AAVEGOTCHI, "LibAavegotchi: Only valid for Aavegotchi");
            LibAavegotchi.interact(tokenId);
        }
    }

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
}
