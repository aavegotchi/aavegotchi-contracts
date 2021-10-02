// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;
import {NUMERIC_TRAITS_NUM, AppStorage, LibAppStorage} from "../libraries/LibAppStorage.sol";
import {LibSvg} from "../libraries/LibSvg.sol";
import {LibStrings} from "../../shared/libraries/LibStrings.sol";
import {LibAavegotchi} from "../libraries/LibAavegotchi.sol";
import {SvgFacet} from "./SvgFacet.sol";
import {Base64} from "../libraries/LibBase64.sol";
import {AavegotchiFacet} from "./AavegotchiFacet.sol";
import "hardhat/console.sol";

contract MetaDataFacet {
    AppStorage internal s;

    struct TraitData {
        bytes[NUMERIC_TRAITS_NUM] numericTraits;
    }

    struct GeneralData {
        string prefix;
        uint256 _haunt;
        uint256 _brs;
        uint256 _mrs;
        //uint256 _srs, With sets Rairity score
        int16[NUMERIC_TRAITS_NUM] _bts;
        int16[NUMERIC_TRAITS_NUM] _mts;
        uint256 _kinship;
        uint256 _xp;
        uint256 _level;
        // uint256 _toNext;
    }

    function getPrefix(uint256 _tokenId) public view returns (string memory prefix_) {
        string memory name = s.aavegotchis[_tokenId].name;
        string memory description = "Your very own aavegotchi";
        string memory svg = SvgFacet(address(this)).getAavegotchiSvg(_tokenId);
        string memory extUrl = AavegotchiFacet(address(this)).tokenURI(_tokenId);
        bytes memory n = (abi.encodePacked("{name:", name));
        bytes memory d = (abi.encodePacked(",description:", description));
        bytes memory _svg = (abi.encodePacked(",image_data:", svg));
        bytes memory url = (abi.encodePacked(",external_url:", extUrl));
        prefix_ = string(abi.encodePacked(n, d, _svg, url));
    }

    function convertTraits1(int16[3] memory _traits) internal view returns (bytes memory t_) {
        bytes[] memory props = new bytes[](3);
        //string memory line = "\n";
        props[0] = abi.encodePacked(strWithUint("NRG ", abs(_traits[0])));
        props[1] = abi.encodePacked(strWithUint("AGG ", abs(_traits[1])));
        props[2] = abi.encodePacked(strWithUint("SPK ", abs(_traits[2])));
        t_ = (abi.encodePacked(props[0], props[1], props[2]));
        console.logBytes(t_);
    }

    function convertTraits2(int16[3] memory _traits) internal view returns (bytes memory t_) {
        bytes[] memory props = new bytes[](3);
        string memory line = "\n";
        props[0] = abi.encodePacked(strWithUint("BRN ", abs(_traits[0])));
        props[1] = abi.encodePacked(strWithUint("EYS ", abs(_traits[1])));
        props[2] = abi.encodePacked(strWithUint("EYC ", abs(_traits[2])));
        t_ = (abi.encodePacked(props[0], props[1], props[2]));
        console.logBytes(t_);
    }

    function convertFinalTraits(int16[NUMERIC_TRAITS_NUM] memory _traits) internal view returns (string memory t_) {
        (int16[3] memory a, ) = splitNumerics(_traits);
        (, int16[3] memory b) = splitNumerics(_traits);
        bytes memory first = convertTraits1(a);
        bytes memory second = convertTraits1(b);
        t_ = string(abi.encodePacked(first, second));
        console.log(t_);
    }

    function generateAttributes(GeneralData memory _gData) internal view returns (bytes memory atts_) {
        string memory key = "trait_type:";
        string memory val = ",value:";
        string memory close = "}";
        bytes memory finalAtts;
        bytes[] memory attributes = new bytes[](10);
        {
            attributes[0] = abi.encodePacked("[{", key, "Haunt", val, _gData._haunt, close);
            attributes[1] = abi.encodePacked(",{", key, "Base Rarity Score", val, _gData._brs, close);
            attributes[2] = abi.encodePacked(",{", key, "Modified Rarity Score", val, _gData._mrs, close);
            attributes[3] = abi.encodePacked(",{", key, "With Sets Rarity Score", close);
            attributes[4] = abi.encodePacked(",{", key, "Base Traits", val, convertFinalTraits(_gData._bts), close);
            attributes[5] = abi.encodePacked(",{", key, "Modified Traits", val, convertFinalTraits(_gData._mts), close);
            attributes[6] = abi.encodePacked(",{", key, "Kinship", _gData._kinship, close);
            attributes[7] = abi.encodePacked(",{", key, "Experience", _gData._xp, close);
            attributes[8] = abi.encodePacked(",{", key, "level", _gData._level, close);
            //  attributes[9] = abi.encodePacked(",{", key, "XP to Next Level", _gData._toNext, close);
        }
        finalAtts = abi.encodePacked(
            attributes[0],
            attributes[1],
            attributes[2],
            attributes[3],
            attributes[4],
            attributes[5],
            attributes[6],
            attributes[7],
            attributes[8]
            //attributes[9]
        );

        atts_ = abi.encodePacked(_gData.prefix, "attributes:", finalAtts);
        //console.log(string(atts_));
        console.log(_gData._level);
    }

    function splitNumerics(int16[NUMERIC_TRAITS_NUM] memory _arr) private pure returns (int16[3] memory trait1_, int16[3] memory trait2_) {
        for (uint256 i = 0; i < (_arr.length / 2); i++) {
            trait1_[i] = _arr[i];
        }
        for (uint256 i = 3; i < _arr.length; i++) {
            trait2_[i - 3] = _arr[i];
        }
    }

    function getData(uint256 _tokenId) private view returns (GeneralData memory _gData) {
        _gData.prefix = getPrefix(_tokenId);
        _gData._haunt = s.aavegotchis[_tokenId].hauntId;
        int16[NUMERIC_TRAITS_NUM] memory traits = s.aavegotchis[_tokenId].numericTraits;
        _gData._brs = LibAavegotchi.baseRarityScore(traits);
        (, _gData._mrs) = LibAavegotchi.modifiedTraitsAndRarityScore(_tokenId);
        _gData._bts = traits;
        (_gData._mts, ) = LibAavegotchi.modifiedTraitsAndRarityScore(_tokenId);
        _gData._kinship = LibAavegotchi.kinship(_tokenId);
        _gData._xp = s.aavegotchis[_tokenId].experience;
        _gData._level = LibAavegotchi.aavegotchiLevel(_gData._xp);
        //  _gData._toNext = LibAavegotchi.xpUntilNextLevel(_gData._xp);
    }

    function _tokenURI(uint256 _tokenId) external view returns (string memory _data) {
        _data = string(abi.encodePacked("data:application/json;base64", Base64.encode(generateAttributes(getData(_tokenId)))));
    }

    function strWithUint(string memory _str, uint256 value) internal pure returns (string memory) {
        // Inspired by OraclizeAPI's implementation - MIT licence
        // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol
        bytes memory buffer;
        unchecked {
            if (value == 0) {
                return string(abi.encodePacked(_str, "0"));
            }
            uint256 temp = value;
            uint256 digits;
            while (temp != 0) {
                digits++;
                temp /= 10;
            }
            buffer = new bytes(digits);
            uint256 index = digits - 1;
            temp = value;
            while (temp != 0) {
                buffer[index--] = bytes1(uint8(48 + (temp % 10)));
                temp /= 10;
            }
        }
        return string(abi.encodePacked(_str, buffer));
    }

    function abs(int16 x) internal pure returns (uint16) {
        return uint16(x >= 0 ? x : -x);
    }
}
