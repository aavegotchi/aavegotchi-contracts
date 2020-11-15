pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import "../libraries/LibAppStorage.sol";
import "../../shared/libraries/LibDiamond.sol";
import "hardhat/console.sol";
import "../../shared/libraries/LibERC20.sol";

contract EscrowFacet {
    AppStorage internal s;

    struct AavegotchiCollateralTypeIO {
        address collateralType;
        AavegotchiCollateralTypeInfo collateralTypeInfo;
    }

    modifier onlyDao {
        require(msg.sender == s.dao, "Only DAO can call this function");
        _;
    }

    function addCollateralTypes(AavegotchiCollateralTypeIO[] calldata _collateralTypes) external {
        LibDiamond.enforceIsContractOwner();
        for (uint256 i; i < _collateralTypes.length; i++) {
            address collateralType = _collateralTypes[i].collateralType;
            s.collateralTypes.push(collateralType);
            s.collateralTypeIndexes[collateralType] = s.collateralTypes.length;
            s.collateralTypeInfo[collateralType] = _collateralTypes[i].collateralTypeInfo;
        }
    }

    function updateCollateralModifiers(address _collateralType, int8[6] memory _modifiers) external onlyDao {
        LibDiamond.enforceIsContractOwner();
        s.collateralTypeInfo[_collateralType].modifiers = _modifiers;
    }

    function removeCollateralType(address _collateralType) external {
        LibDiamond.enforceIsContractOwner();
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

    function getCollateralInfo() external view returns (AavegotchiCollateralTypeInfo[] memory collateralInfo) {
        address[] memory collateralTypes_ = s.collateralTypes;

        collateralInfo = new AavegotchiCollateralTypeInfo[](collateralTypes_.length);

        for (uint256 i; i < collateralTypes_.length; i++) {
            address collateral = collateralTypes_[i];
            collateralInfo[i] = s.collateralTypeInfo[collateral];
        }
    }

    function increaseStake(uint256 _tokenId, uint96 _stakeAmount) external {
        require(msg.sender == s.aavegotchis[_tokenId].owner, "AavegotchiFacet: Only aavegotchi owner can increase stake");
        uint96 currentStake = s.aavegotchis[_tokenId].stakedAmount;
        address collateralType = s.aavegotchis[_tokenId].collateralType;
        s.aavegotchis[_tokenId].stakedAmount = currentStake + _stakeAmount;

        //To do: change this from address(this) to the Aavegotchi's personal escrow contract address
        LibERC20.transferFrom(collateralType, msg.sender, address(this), _stakeAmount);
    }

    function decreaseStake(uint256 _tokenId, uint96 _reduceAmount) external {
        require(msg.sender == s.aavegotchis[_tokenId].owner, "AavegotchiFacet: Only aavegotchi owner can decrease stake");
        uint96 currentStake = s.aavegotchis[_tokenId].stakedAmount;
        uint256 minimumStake = s.aavegotchis[_tokenId].minimumStake;

        // ***CHECK for underflow here? ***
        require(currentStake - _reduceAmount >= minimumStake, "AavegotchiFacet: Cannot reduce below minimum stake");
        address collateralType = s.aavegotchis[_tokenId].collateralType;
        s.aavegotchis[_tokenId].stakedAmount = currentStake - _reduceAmount;

        //To do: change this from address(this) to the Aavegotchi's personal escrow contract address
        LibERC20.transferFrom(collateralType, address(this), msg.sender, _reduceAmount);
    }

    function decreaseAndDestroy(uint256 _tokenId) external {
        require(msg.sender == s.aavegotchis[_tokenId].owner, "AavegotchiFacet: Only aavegotchi owner can decrease stake");
        uint128 currentStake = s.aavegotchis[_tokenId].stakedAmount;
        address collateralType = s.aavegotchis[_tokenId].collateralType;

        //To do: check that all wearables have been removed from inventory before burning

        //To do: change this from address(this) to the Aavegotchi's personal escrow contract address

        LibERC20.transferFrom(collateralType, address(this), msg.sender, currentStake);

        //To do: Burn the Aavegotchi
    }
}
