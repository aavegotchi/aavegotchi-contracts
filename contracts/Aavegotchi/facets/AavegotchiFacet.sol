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
        uint256 rarityMultiplier = calculateRarityMultiplier(singlePortalAavegotchiTraits_.numericTraits, collateralType);

        //First we get the base price of our collateral in terms of DAI
        uint256 collateralDAIPrice = ((10**IERC20(collateralType).decimals()) / conversionRate);

        //Then multiply by the rarity multiplier
        singlePortalAavegotchiTraits_.minimumStake = collateralDAIPrice * rarityMultiplier;
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

    function portalAavegotchisSvg(uint256 _tokenId) external view returns (string[PORTAL_AAVEGOTCHIS_NUM] memory svg_) {
        require(s.aavegotchis[_tokenId].status == LibAppStorage.STATUS_OPEN_PORTAL, "AavegotchiFacet: Portal not open");
        PortalAavegotchiTraitsIO[PORTAL_AAVEGOTCHIS_NUM] memory l_portalAavegotchiTraits = portalAavegotchiTraits(_tokenId);
        for (uint256 i; i < svg_.length; i++) {
            address collateralType = l_portalAavegotchiTraits[i].collateralType;
            int256 numericTraits = l_portalAavegotchiTraits[i].numericTraits;
            svg_[i] = string(
                abi.encodePacked(
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
                    getAavegotchiSvgLayers(collateralType, numericTraits),
                    "</svg>"
                )
            );
        }
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

    struct SvgLayerDetails {
        string primaryColor;
        string secondaryColor;
        string cheekColor;
        bytes background;
        bytes collateral;
        int256 trait;
        int256[18] eyeShapeTraitRange;
        bytes eyeShape;
        string eyeColor;
        int256[8] eyeColorTraitRanges;
        string[7] eyeColors;
    }

    function getAavegotchiSvgLayers(address _collateralType, int256 _numericTraits) internal view returns (bytes memory svg_) {
        SvgLayerDetails memory details;
        details.primaryColor = bytes3ToColorString(s.collateralTypeInfo[_collateralType].primaryColor);
        details.secondaryColor = bytes3ToColorString(s.collateralTypeInfo[_collateralType].secondaryColor);
        details.cheekColor = bytes3ToColorString(s.collateralTypeInfo[_collateralType].cheekColor);

        // aavagotchi body
        svg_ = LibSvg.getSvg("aavegotchi", 2);
        details.background = LibSvg.getSvg("aavegotchi", 3);
        details.collateral = LibSvg.getSvg("collaterals", s.collateralTypeInfo[_collateralType].svgId);

        details.trait = uint16(_numericTraits >> (4 * 16));
        details.eyeShape;
        details.eyeShapeTraitRange = [int256(0), 1, 2, 5, 7, 10, 15, 20, 25, 42, 58, 75, 80, 85, 90, 93, 95, 98];
        for (uint256 i; i < details.eyeShapeTraitRange.length - 1; i++) {
            if (details.trait >= details.eyeShapeTraitRange[i] && details.trait < details.eyeShapeTraitRange[i + 1]) {
                details.eyeShape = LibSvg.getSvg("eyeShapes", i);
                break;
            }
        }
        // eyeShapeTrait is 98 or 99
        if (details.eyeShape.length == 0) {
            details.eyeShape = LibSvg.getSvg("eyeShapes", s.collateralTypeInfo[_collateralType].eyeShapeSvgId);
        }

        details.trait = uint16(_numericTraits >> (5 * 16));
        details.eyeColorTraitRanges = [int256(0), 2, 10, 25, 75, 90, 98, 100];
        details.eyeColors = [
            "FF00FF", // mythical_low
            "0064FF", // rare_low
            "5D24BF", // uncommon_low
            details.primaryColor, // common
            "36818E", // uncommon_high
            "EA8C27", // rare_high
            "51FFA8" // mythical_high
        ];
        for (uint256 i; i < details.eyeColorTraitRanges.length - 1; i++) {
            if (details.trait >= details.eyeColorTraitRanges[i] && details.trait < details.eyeColorTraitRanges[i + 1]) {
                details.eyeColor = details.eyeColors[i];
                break;
            }
        }

        svg_ = abi.encodePacked(
            "<style>.primary{fill:#",
            details.primaryColor,
            ";}.secondary{fill:#",
            details.secondaryColor,
            ";}.cheek{fill:#",
            details.cheekColor,
            ";}.eyeColor{fill:#",
            details.eyeColor,
            ";}</style>",
            details.background,
            svg_,
            details.collateral,
            details.eyeShape
        );
    }

    function getAavegotchiSvgLayers(uint256 _tokenId) internal view returns (bytes memory svg_) {
        svg_ = getAavegotchiSvgLayers(s.aavegotchis[_tokenId].collateralType, s.aavegotchis[_tokenId].numericTraits);

        //Wearables
        uint256 equippedWearables = s.aavegotchis[_tokenId].equippedWearables;
        bytes memory wearablesSvg;
        for (uint256 slotPosition; slotPosition < EQUIPPED_WEARABLE_SLOTS; slotPosition++) {
            uint256 wearableId = uint16(equippedWearables >> (slotPosition * 16));
            if (wearableId > 0) {
                WearableType storage wearableType = s.wearableTypes[wearableId];
                // right hand, then flip the wearable
                if (slotPosition == 5) {
                    wearablesSvg = abi.encodePacked(
                        wearablesSvg,
                        '<g transform="scale(-1, 1) translate(-64, 0)">',
                        LibSvg.getSvg("wearables", wearableType.svgId),
                        "</g>"
                    );
                } else {
                    wearablesSvg = abi.encodePacked(wearablesSvg, LibSvg.getSvg("wearables", wearableType.svgId));
                }
            }
        }
        if (wearablesSvg.length > 0) {
            svg_ = abi.encodePacked(svg_, wearablesSvg);
        }
    }

    // Given an aavegotchi token id, return the combined SVG of its layers and its wearables

    //To do: would be great if we could move this to SvgStorageFacet

    function getAavegotchiSvg(uint256 _tokenId) public view returns (string memory ag_) {
        require(s.aavegotchis[_tokenId].owner != address(0), "AavegotchiFacet: _tokenId does not exist");

        bytes memory svg;
        uint8 status = s.aavegotchis[_tokenId].status;
        if (status == LibAppStorage.STATUS_CLOSED_PORTAL) {
            // sealed closed portal
            svg = LibSvg.getSvg("aavegotchi", 0);
        } else if (status == LibAppStorage.STATUS_OPEN_PORTAL) {
            // open portal
            svg = LibSvg.getSvg("aavegotchi", 1);
        } else if (status == LibAppStorage.STATUS_AAVEGOTCHI) {
            svg = getAavegotchiSvgLayers(_tokenId);
        }
        ag_ = string(abi.encodePacked('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">', svg, "</svg>"));
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
        int256 numericTraits;
        uint256[EQUIPPED_WEARABLE_SLOTS] equippedWearables;
        address collateral;
        address escrow;
        uint256 stakedAmount;
        uint256 minimumStake;
        //New
        int256 interactionCount; //The kinship value of this Aavegotchi. Default is 50.
        uint256 experience; //How much XP this Aavegotchi has accrued. Begins at 0.
        uint256 usedSkillPoints; //number of skill points used
        uint32 level; //the current aavegotchi level
        uint256 batchId;
        uint256 hauntId;
    }

    function getAavegotchi(uint256 _tokenId) public view returns (AavegotchiInfo memory aavegotchiInfo_) {
        aavegotchiInfo_.tokenId = _tokenId;
        aavegotchiInfo_.name = s.aavegotchis[_tokenId].name;
        aavegotchiInfo_.owner = s.aavegotchis[_tokenId].owner;
        aavegotchiInfo_.randomNumber = s.aavegotchis[_tokenId].randomNumber;
        aavegotchiInfo_.status = s.aavegotchis[_tokenId].status;
        aavegotchiInfo_.numericTraits = s.aavegotchis[_tokenId].numericTraits;
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
        aavegotchiInfo_.experience = s.aavegotchis[_tokenId].experience;
        aavegotchiInfo_.level = calculateAavegotchiLevel(s.aavegotchis[_tokenId].experience);
        aavegotchiInfo_.usedSkillPoints = s.aavegotchis[_tokenId].usedSkillPoints;
        aavegotchiInfo_.batchId = s.aavegotchis[_tokenId].batchId;
        aavegotchiInfo_.hauntId = s.aavegotchis[_tokenId].hauntId;
        return aavegotchiInfo_;
    }

    function availableSkillPoints(uint256 _tokenId) public view returns (uint32) {

       uint32 level = calculateAavegotchiLevel(s.aavegotchis[_tokenId].experience);
       //1 skill point per 3 levels. To do: Check if this underflows
        return (level / 3) - s.aavegotchis[_tokenId].usedSkillPoints;
    }

    function abs(int8 x) private pure returns (int8) {
        return x >= 0 ? x : -x;
    }



    function calculateAavegotchiLevel(uint32 _experience) public pure returns (uint32 level) {
      
        //To do: Confirm these values, maybe simplify the calculation?
        if (_experience <= 100) return 1;

            //Levels 1-10 require 100 XP each
        else if (_experience > 100 && _experience <= 1001)
            level = _experience / 100;

            //Levels 11 - 20 require 150 XP each
        else if (_experience > 1001 && _experience <= 3001)
            level = _experience / 150;

            //Levels 21 - 40 require 200 XP each
        else if (_experience > 3001 && _experience <= 8001)
            level = _experience / 200;

            //Levels 41 - 60 require 300 XP each
        else if (_experience > 8001 && _experience <= 18001)
            level = _experience / 300;

            //Levels 61 - 80 require 500 XP each
        else if (_experience > 18001 && _experience <= 40001)
            level = _experience / 500;

            //Levels 81 - 90 require 750 XP each
        else if (_experience > 40001 && _experience <= 67501)
            level = _experience / 750;

            //Levels 91 - 99 require 1000 XP each
        else if (_experience > 67501 && _experience <= 98001) level = _experience / 1000;
        else level = 98;
        
            //Add on 1 for the initial level
            level += 1;

        // return level;
    }

    function calculateRarityMultiplier(int256 _numericTraits, address _collateralType) public view returns (uint256 rarityMultiplier) {
        int256 rarityScore = calculateBaseRarityScore(_numericTraits, _collateralType);
        if (rarityScore < 300) return 10;
        else if (rarityScore >= 300 && rarityScore < 450) return 10;
        else if (rarityScore >= 450 && rarityScore <= 525) return 25;
        else if (rarityScore >= 526 && rarityScore <= 580) return 100;
        else if (rarityScore >= 581) return 1000;
    }

    //Calculates the base rarity score, including collateral modifier
    function calculateBaseRarityScore(int256 _numericTraits, address collateralType) public view returns (int256 _rarityScore) {
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

    //Only valid for claimed Aavegotchis
    function calculateModifiedRarityScore(uint256 _tokenId) external view returns (int256 rarityScore) {
        //To do: Should return final rarity score inlcuding wearables (but not sets)
        //To do: Can also return the final numericTraits including wearable modifiers 

        require(s.aavegotchis[_tokenId].status == LibAppStorage.STATUS_AAVEGOTCHI, "AavegotchiFacet: Must be claimed");
        address collateral = s.aavegotchis[_tokenId].collateralType;

        int256 baseRarity = calculateBaseRarityScore(s.aavegotchis[_tokenId].numericTraits, collateral);
        rarityScore = baseRarity + int256(s.aavegotchis[_tokenId].wearableBonus);
    }

    function calculateKinship(uint256 _tokenId) external view returns (uint256 kinship) {
        //The initial value of Kinship is always 50
        //Players can boost their kinship by interacting with their Aavegotchi.

        Aavegotchi storage aavegotchi = s.aavegotchis[_tokenId];
        uint256 lastInteracted = aavegotchi.lastInteracted;
        int16 interactionCount = int16(aavegotchi.interactionCount);
        uint256 interval = block.timestamp - lastInteracted;

        int16 daysSinceInteraction = int16(interval / 86400);
        int16 baseKinship = 50;

        if (daysSinceInteraction > baseKinship + interactionCount) {
            kinship = 0;
        } else {
            kinship = uint256(baseKinship + interactionCount - daysSinceInteraction);
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

      function spendSkillPoints(uint256 _tokenId, int8[4] calldata _values) external onlyUnlocked(_tokenId) onlyAavegotchiOwner(_tokenId)  {
        uint32 available = availableSkillPoints(_tokenId);

        uint16 totalUsed = 0;
        for (uint8 index = 0; index < _values.length; index++) {
            uint16 usedSkillPoints = uint16(abs(_values[index]));
       
            //To do: Prevent underflow (is this ok?)
            int32 remaining = int32(available);
            require(remaining - usedSkillPoints >= 0, "AavegotchiFacet: Not enough skill points!");
           
            available -= usedSkillPoints;
            totalUsed += usedSkillPoints;

            //To do: Modify Aavegotchi numericTraits
            //s.aavegotchis[_tokenId].numericTraits[index] += _values[index];
        }

        //Increment used skill points
        s.aavegotchis[_tokenId].usedSkillPoints += totalUsed;
    }


   

    function buyPortals(
        address _to,
        uint256 _ghst,
        bool _setBatchId
    ) external {
        uint256 currentHauntId = s.currentHauntId;
        Haunt memory haunt = s.haunts[currentHauntId];
        require(_ghst >= haunt.portalPrice, "AavegotchiFacet: Not enough GHST to buy portal");
        uint256 ghstBalance = IERC20(s.ghstContract).balanceOf(msg.sender);
        require(ghstBalance >= _ghst, "AavegotchiFacet: Not enough GHST!");
        uint16 hauntId = s.currentHauntId;
        uint256 numAavegotchisToPurchase = _ghst / haunt.portalPrice;
        uint256 hauntCount = haunt.totalCount + numAavegotchisToPurchase;
        require(hauntCount <= haunt.hauntMaxSize, "AavegotchiFacet: Exceeded max number of aavegotchis for this haunt");
        s.haunts[currentHauntId].totalCount = uint24(hauntCount);
        uint32 nextBatchId;
        LibVrf.Storage storage vrf_ds = LibVrf.diamondStorage();
        if (_setBatchId) {
            nextBatchId = vrf_ds.nextBatchId;
        }
        uint256 tokenId = s.totalSupply;
        for (uint256 i; i < numAavegotchisToPurchase; i++) {
            s.aavegotchis[tokenId].owner = _to;
            s.aavegotchis[tokenId].batchId = nextBatchId;
            s.aavegotchis[tokenId].hauntId = hauntId;
            emit Transfer(address(0), _to, tokenId);
            tokenId++;
        }
        if (_setBatchId) {
            vrf_ds.batchCount += uint32(numAavegotchisToPurchase);
        }
        s.aavegotchiBalance[_to] += numAavegotchisToPurchase;
        s.totalSupply = uint32(tokenId);
        uint256 amount = _ghst - (_ghst % haunt.portalPrice);
        uint256 burnAmount = amount / 10;
        LibERC20.transferFrom(s.ghstContract, msg.sender, address(0), burnAmount);
        LibERC20.transferFrom(s.ghstContract, msg.sender, address(this), amount - burnAmount);

         //To do: Decide on GHST allocation for burning, DAO, rarity farming, governance, Pixelcraft

        //Transfer ratios:
        //33% to burn address
        //17% to Pixelcraft wallet
        //40% to rarity farming rewards
        //10% to DAO address
    }

  

   

    function claimAavegotchiFromPortal(
        uint256 _tokenId,
        uint256 _option,
        uint256 _stakeAmount
    ) external onlyAavegotchiOwner(_tokenId) {
        Aavegotchi storage aavegotchi = s.aavegotchis[_tokenId];
        require(aavegotchi.status == LibAppStorage.STATUS_OPEN_PORTAL, "AavegotchiFacet: Portal not open");
       // require(msg.sender == aavegotchi.owner, "AavegotchiFacet: Only aavegotchi owner can claim aavegotchi from a portal");

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

  


    // function nextInteractTime((uint256 _tokenId) external view returns (uint256 ) {

    // }

    function interact(uint256 _tokenId) public {
        address owner = s.aavegotchis[_tokenId].owner;
        require(owner != address(0), "AavegotchiFacet: Invalid tokenId, is not owned or doesn't exist");
        require(
            msg.sender == owner || s.operators[owner][msg.sender] || s.approved[_tokenId] == msg.sender,
            "AavegotchiFacet: Not owner of token or approved"
        );

        //To do: only update once per day
        //To do: Only allow 2 interactions per day 
        uint256 lastInteracted = s.aavegotchis[_tokenId].lastInteracted;
        int16 interactionCount = s.aavegotchis[_tokenId].interactionCount;
        uint256 interval = block.timestamp - lastInteracted;
        int16 daysSinceInteraction = int16(interval / 86400);
        if (daysSinceInteraction > 3000) {
            daysSinceInteraction = 3000;
        }
        int16 baseKinship = 50;

        //Interaction count can't go below -50 otherwise the kinship will be negative
        if (interactionCount < -50) interactionCount = -50;

        //If your Aavegotchi hates you and you finally pet it, you get a bonus
        uint256 kinship = uint256(baseKinship + interactionCount - daysSinceInteraction);
        int16 hateBonus = 0;

        if (kinship < 40) {
            hateBonus = 2;
        }

        //Update the interactionCount
        if (daysSinceInteraction > 0) {
            s.aavegotchis[_tokenId].interactionCount = interactionCount - int16(daysSinceInteraction) + hateBonus + 1;
        } else {
            s.aavegotchis[_tokenId].interactionCount = int16(interactionCount + 1 + hateBonus);
        }

        s.aavegotchis[_tokenId].lastInteracted = uint40(block.timestamp);
    }

    //Prevnts assets and wearables from being moved from Aavegotchi during lock period, except by gameManager. 
    function lockAavegotchi(uint256 _tokenId, uint256 _lockDuration) external  {
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
