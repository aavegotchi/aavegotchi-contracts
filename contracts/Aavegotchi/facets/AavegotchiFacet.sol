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
    event DaoTransferred(address indexed previousDao, address indexed newDao);

    modifier onlyDao {
        require(msg.sender == s.dao, "Only DAO can call this function");
        _;
    }

    function setDao(address _newDao) external {
        //Maybe we should make a DAO Facet?
        require(msg.sender == s.dao || msg.sender == LibDiamond.contractOwner(), "AavegotchiFacet: Do not have access");
        emit DaoTransferred(s.dao, _newDao);
        s.dao = _newDao;
    }

    /// @dev This emits when the approved address for an NFT is changed or
    ///  reaffirmed. The zero address indicates there is no approved address.
    ///  When a Transfer event emits, this also indicates that the approved
    ///  address for that NFT (if any) is reset to none.
    event Approval(address indexed _owner, address indexed _approved, uint256 indexed _tokenId);

    /// @dev This emits when an operator is enabled or disabled for an owner.
    ///  The operator can manage all NFTs of the owner.
    event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved);

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
            s.aavegotchiOwnerEnumeration[msg.sender].push(uint32(tokenId));
            s.aavegotchis[tokenId].owner = msg.sender;
            s.aavegotchis[tokenId].ownerEnumerationIndex = ownerIndex;
            emit Transfer(address(0), msg.sender, tokenId);
        }
        uint256 amount = _ghst - (_ghst % 100e18);
        uint256 burnAmount = amount / 10;
        IERC20(s.ghstContract).transferFrom(msg.sender, address(0), burnAmount);
        IERC20(s.ghstContract).transferFrom(msg.sender, address(this), amount - burnAmount);
    }

    function openPortal(uint256 _tokenId) external {
        require(s.aavegotchis[_tokenId].status == 0, "AavegotchiFacet: Portal is not closed");
        require(msg.sender == s.aavegotchis[_tokenId].owner, "AavegotchiFacet: Only aavegotchi owner can open a portal");
        //s.aavegotchis[_tokenId].randomNumber = uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), _tokenId)));

        //Why is the random number the _tokenId?
        s.aavegotchis[_tokenId].randomNumber = uint256(keccak256(abi.encodePacked(_tokenId)));
        // status is open portal
        s.aavegotchis[_tokenId].status = LibAppStorage.STATUS_OPEN_PORTAL;
    }

    struct PortalAavegotchiTraitsIO {
        uint256 randomNumber;
        int256[NUMERIC_TRAITS_NUM] numericTraits;
        address collateralType;
        uint256 minimumStake;
    }

    function toNumericTraits(uint256 _randomNumber) internal pure returns (int256[NUMERIC_TRAITS_NUM] memory numericTraits_) {
        for (uint256 i; i < numericTraits_.length; i++) {
            uint256 value = uint8(_randomNumber >> (i * 8));
            if (value > 99) {
                value = uint256(keccak256(abi.encodePacked(_randomNumber, i))) % 100;
            }
            numericTraits_[i] = int256(value);
        }
    }

    function getNumericTraits(uint256 _tokenId) public view returns (int256[NUMERIC_TRAITS_NUM] memory numericTraits_, int256 wearableBonus_) {
        uint256 randomNumber = s.aavegotchis[_tokenId].randomNumber;
        require(randomNumber != 0, "AavegotchiFacet: Aavegotchi not claimed yet");
        for (uint256 i; i < numericTraits_.length; i++) {
            uint256 value = uint8(randomNumber >> (i * 8));
            if (value > 99) {
                value = uint256(keccak256(abi.encodePacked(randomNumber, i))) % 100;
            }
            numericTraits_[i] = int256(value);
        }
        //First get equipped wearables
        uint256 equippedWearables = s.aavegotchis[_tokenId].equippedWearables;
        for (uint256 i; i < EQUIPPED_WEARABLE_SLOTS; i++) {
            uint256 wearableId = uint16(equippedWearables >> (i * 16));
            //wearable is equipped
            if (wearableId != 0) {
                WearableType storage wearable = s.wearableTypes[wearableId];

                //Add on rarity score bonus
                wearableBonus_ += wearable.rarityScoreModifier;

                //Add on trait modifiers
                int8[NUMERIC_TRAITS_NUM] memory modifiers = wearable.traitModifiers;

                for (uint256 j; j < NUMERIC_TRAITS_NUM; j++) {
                    numericTraits_[j] += modifiers[j];
                }
            }
        }
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
            int256[NUMERIC_TRAITS_NUM] memory numericTraits = l_portalAavegotchiTraits[i].numericTraits;
            svg_[i] = string(
                abi.encodePacked(
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
                    getAavegotchiSvgLayers(collateralType, numericTraits),
                    "</svg>"
                )
            );
        }
    }

    function claimAavegotchiFromPortal(
        uint256 _tokenId,
        uint256 _option,
        uint256 _stakeAmount
    ) external {
        require(s.aavegotchis[_tokenId].status == LibAppStorage.STATUS_OPEN_PORTAL, "AavegotchiFacet: Portal not open");
        require(msg.sender == s.aavegotchis[_tokenId].owner, "AavegotchiFacet: Only aavegotchi owner can claim aavegotchi from a portal");

        PortalAavegotchiTraitsIO memory option = singlePortalAavegotchiTraits(s.aavegotchis[_tokenId].randomNumber, _option);
        s.aavegotchis[_tokenId].randomNumber = option.randomNumber;
        s.aavegotchis[_tokenId].collateralType = option.collateralType;
        s.aavegotchis[_tokenId].minimumStake = uint88(option.minimumStake);

        //New traits
        s.aavegotchis[_tokenId].experience = 0;
        s.aavegotchis[_tokenId].level = 1;

        //Kinship
        s.aavegotchis[_tokenId].claimTime = uint40(block.timestamp);
        s.aavegotchis[_tokenId].lastInteracted = uint40(block.timestamp);
        s.aavegotchis[_tokenId].interactionCount = 0; //First interaction is claiming

        //Empty equipped wearables array
        //  s.aavegotchis[_tokenId].wearableKeys = new uint256[];
        // s.aavegotchis[_tokenId].equippedWearables = new uint16[](LibAppStorage.WEARABLE_SLOTS_TOTAL);

        require(_stakeAmount >= option.minimumStake, "AavegotchiFacet: _stakeAmount less than minimum stake");

        s.aavegotchis[_tokenId].status = LibAppStorage.STATUS_AAVEGOTCHI;

        address escrow = address(new CollateralEscrow(option.collateralType));
        s.aavegotchis[_tokenId].escrow = escrow;
        LibERC20.transferFrom(option.collateralType, msg.sender, escrow, _stakeAmount);
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

    function getAavegotchiSvgLayers(address _collateralType, int256[NUMERIC_TRAITS_NUM] memory _numericTraits)
        internal
        view
        returns (bytes memory svg_)
    {
        SvgLayerDetails memory details;
        details.primaryColor = bytes3ToColorString(s.collateralTypeInfo[_collateralType].primaryColor);
        details.secondaryColor = bytes3ToColorString(s.collateralTypeInfo[_collateralType].secondaryColor);
        details.cheekColor = bytes3ToColorString(s.collateralTypeInfo[_collateralType].cheekColor);

        // aavagotchi body
        svg_ = LibSvg.getSvg("aavegotchi", 2);
        details.background = LibSvg.getSvg("aavegotchi", 3);
        details.collateral = LibSvg.getSvg("collaterals", s.collateralTypeInfo[_collateralType].svgId);

        details.trait = _numericTraits[4];
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

        details.trait = _numericTraits[5];
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
        (int256[NUMERIC_TRAITS_NUM] memory numericTraits, ) = getNumericTraits(_tokenId);
        svg_ = getAavegotchiSvgLayers(s.aavegotchis[_tokenId].collateralType, numericTraits);

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
        int256[NUMERIC_TRAITS_NUM] numericTraits;
        address collateral;
        address escrow;
        uint256 stakedAmount;
        uint256 minimumStake;
        //New
        int256 interactionCount; //The kinship value of this Aavegotchi. Default is 50.
        uint256 experience; //How much XP this Aavegotchi has accrued. Begins at 0.
        uint256 level; //The level of this Aavegotchi begins at 1.
    }

    function getAavegotchi(uint256 _tokenId) public view returns (AavegotchiInfo memory aavegotchiInfo_) {
        aavegotchiInfo_.tokenId = _tokenId;
        aavegotchiInfo_.name = s.aavegotchis[_tokenId].name;
        aavegotchiInfo_.owner = s.aavegotchis[_tokenId].owner;
        aavegotchiInfo_.randomNumber = s.aavegotchis[_tokenId].randomNumber;
        aavegotchiInfo_.status = s.aavegotchis[_tokenId].status;
        if (aavegotchiInfo_.randomNumber > 0) {
            (aavegotchiInfo_.numericTraits, ) = getNumericTraits(_tokenId);
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
        aavegotchiInfo_.level = s.aavegotchis[_tokenId].level;
        return aavegotchiInfo_;
    }

    function calculateRarityMultiplier(int256[NUMERIC_TRAITS_NUM] memory _numericTraits, address _collateralType)
        public
        view
        returns (uint256 rarityMultiplier)
    {
        int256 rarityScore = calculateBaseRarityScore(_numericTraits, _collateralType);
        if (rarityScore < 300) return 10;
        else if (rarityScore >= 300 && rarityScore < 450) return 10;
        else if (rarityScore >= 450 && rarityScore <= 525) return 25;
        else if (rarityScore >= 526 && rarityScore <= 580) return 100;
        else if (rarityScore >= 581) return 1000;
    }

    //Calculates the base rarity score, including collateral modifier
    function calculateBaseRarityScore(int256[NUMERIC_TRAITS_NUM] memory _numericTraits, address collateralType)
        public
        view
        returns (int256 _rarityScore)
    {
        AavegotchiCollateralTypeInfo memory collateralInfo = s.collateralTypeInfo[collateralType];

        int8[6] memory modifiers = collateralInfo.modifiers;

        for (uint8 index = 0; index < _numericTraits.length; index++) {
            int256 number = _numericTraits[index];

            int8 mod = modifiers[index];

            if (number >= 50) {
                _rarityScore = _rarityScore + number + mod;
            } else {
                _rarityScore = _rarityScore + (100 - number) + mod;
            }
        }

        return _rarityScore;
    }

    //Only valid for claimed Aavegotchis
    function calculateModifiedRarityScore(uint256 _tokenId) external view returns (int256 rarityScore) {
        require(s.aavegotchis[_tokenId].status == LibAppStorage.STATUS_AAVEGOTCHI, "AavegotchiFacet: Must be claimed");
        address collateral = s.aavegotchis[_tokenId].collateralType;

        (int256[NUMERIC_TRAITS_NUM] memory numericTraits, int256 wearableBonus) = getNumericTraits(_tokenId);

        int256 baseRarity = calculateBaseRarityScore(numericTraits, collateral);
        rarityScore = baseRarity + wearableBonus;
    }

    function calculateKinship(uint256 _tokenId) external view returns (int256 kinship) {
        //The initial value of Kinship is always 50
        //Players can boost their kinship by interacting with their Aavegotchi.

        Aavegotchi storage aavegotchi = s.aavegotchis[_tokenId];
        uint256 lastInteracted = aavegotchi.lastInteracted;
        int256 interactionCount = aavegotchi.interactionCount;
        uint256 interval = block.timestamp - lastInteracted;

        //This may not work with decimals
        int256 daysSinceInteraction = int256(interval) / 86400;
        int256 baseKinship = 50;

        uint256 streak = aavegotchi.streak;
        int256 streakBonus = 0;

        if (streak >= 5) streakBonus = 1;
        if (streak >= 10) streakBonus = 2;
        if (streak >= 30) streakBonus = 5;
        if (streak >= 60) streakBonus = 10;
        if (streak >= 90) streakBonus = 20;

        // console.log("steak bonus:");
        //  console.logInt(streakBonus);

        //Calculate Kinship: Uses onnchain data (lastTimeInteracted) and (interactionModifier) to calculate.

        //Kinship starts at 50
        //Every time a user interacts within a 24hr period, their interactionModifier goes up by one.
        //If a day elapses before they interact, their interactionModifier is increased by one (because of the interaction) but also reduced by the number of days it's been since they interacted.

        //This has the problem that kinship would not be reduced if they never interact and make the interactionModifier negative.

        int256 kinshipScore = baseKinship + interactionCount - daysSinceInteraction + streakBonus;

        // if (kinshipScore > 100) return 100;
        return kinshipScore;
    }

    function interact(uint256 _tokenId) public {
        //To do: Only owner can interact
        //To do: only update once per day

        //Was the last interaction within 24 hours? If so, add to interaction count. If not, reset it.
        uint256 lastInteracted = s.aavegotchis[_tokenId].lastInteracted;
        int16 interactionCount = s.aavegotchis[_tokenId].interactionCount;
        uint256 interval = block.timestamp - lastInteracted;
        // console.log("Interact: block timestamp:", block.timestamp);
        int256 daysSinceInteraction = int256(interval) / 86400;
        if (daysSinceInteraction > 3000) {
            daysSinceInteraction = 3000;
        }
        int256 baseKinship = 50;

        int256 kinshipScore = baseKinship + interactionCount - daysSinceInteraction;

        // console.log("kinship score");
        // console.logInt(kinshipScore);

        //If your Aavegotchi hates you and you finally pet it, you get a bonus
        int16 hateBonus = 0;

        if (kinshipScore < 40) {
            hateBonus = 2;
        }

        //If it's been a day or more since last interaction
        if (daysSinceInteraction > 0) {
            // console.log("interaction count before");
            // console.logInt(s.aavegotchis[_tokenId].interactionCount);

            //console.log("days since interaction");
            // console.logInt(daysSinceInteraction);

            s.aavegotchis[_tokenId].interactionCount = interactionCount - int16(daysSinceInteraction) + hateBonus;
            // console.log("interaction count after");
            // console.logInt(s.aavegotchis[_tokenId].interactionCount);

            s.aavegotchis[_tokenId].streak = 0;

            //Increase interaction
        } else {
            s.aavegotchis[_tokenId].interactionCount = interactionCount + 1 + hateBonus;
            s.aavegotchis[_tokenId].streak++;
        }

        s.aavegotchis[_tokenId].lastInteracted = uint40(block.timestamp);
    }

    function allAavegotchiIdsOfOwner(address _owner) external view returns (uint32[] memory tokenIds_) {
        tokenIds_ = s.aavegotchiOwnerEnumeration[_owner];
    }

    function allAavegotchisOfOwner(address _owner) external view returns (AavegotchiInfo[] memory aavegotchiInfos_) {
        //Haven't tested but should work -- yes sir
        uint32[] memory tokenIds = s.aavegotchiOwnerEnumeration[_owner];
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
        uint256 index = s.aavegotchis[_tokenId].ownerEnumerationIndex;
        require(owner != address(0), "ERC721: Invalid tokenId or can't be transferred");
        require(
            msg.sender == owner || s.operators[owner][msg.sender] || s.approved[_tokenId] == msg.sender,
            "ERC721: Not owner or approved to transfer"
        );
        require(_from == owner, "ERC721: _from is not owner, transfer failed");
        s.aavegotchis[_tokenId].owner = _to;
        s.aavegotchis[_tokenId].ownerEnumerationIndex = uint32(s.aavegotchiOwnerEnumeration[_to].length);
        s.aavegotchiOwnerEnumeration[_to].push(uint32(_tokenId));
        uint256 lastIndex = s.aavegotchiOwnerEnumeration[_from].length - 1;
        if (index != lastIndex) {
            uint256 lastTokenId = s.aavegotchiOwnerEnumeration[_from][lastIndex];
            s.aavegotchiOwnerEnumeration[_from][index] = uint32(lastTokenId);
            s.aavegotchis[lastTokenId].ownerEnumerationIndex = uint32(index);
        }
        s.aavegotchiOwnerEnumeration[_from].pop();
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
