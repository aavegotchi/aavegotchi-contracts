// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;
import {NUMERIC_TRAITS_NUM, AppStorage, LibAppStorage} from "../libraries/LibAppStorage.sol";
import {LibSvg} from "../libraries/LibSvg.sol";
import {LibStrings} from "../../shared/libraries/LibStrings.sol";
import {LibAavegotchi} from "../libraries/LibAavegotchi.sol";
import {SvgFacet} from "./SvgFacet.sol";
import {Base64} from "../libraries/LibBase64.sol";
import {AavegotchiFacet} from "./AavegotchiFacet.sol";

contract MetaDatafacet {
    AppStorage internal s;

    struct TraitData {
        int16[NUMERIC_TRAITS_NUM] numericTraits;
    }

    struct GeneralData {
        uint256 _haunt;
        uint256 _brs;
        uint256 _mrs;
        //uint256 _srs, With sets Rairity score
        int16[NUMERIC_TRAITS_NUM] _bts;
        int16[NUMERIC_TRAITS_NUM] _mts;
        uint256 _kinship;
        uint256 _xp;
        uint256 _level;
        uint256 _toNext;
    }

    function convertTraits(int16[NUMERIC_TRAITS_NUM] memory _traits) internal pure returns (string memory t_) {
        bytes[] memory props = new bytes[](NUMERIC_TRAITS_NUM);

        props[0] = abi.encodePacked(strWithInt("NRG \n", abs(_traits[0])));
        props[1] = abi.encodePacked(strWithInt("AGG \n", abs(_traits[1])));
        props[2] = abi.encodePacked(strWithInt("SPK \n", abs(_traits[2])));
        props[3] = abi.encodePacked(strWithInt("BRN \n", abs(_traits[3])));
        props[4] = abi.encodePacked(strWithInt("EYS \n", abs(_traits[4])));
        props[5] = abi.encodePacked(strWithInt("EYC \n", abs(_traits[5])));
        t_ = string(abi.encodePacked(props[0], "\n", props[1], "\n", props[2], "\n", props[3], "\n", props[4], "\n", props[5], "\n"));
    }

    function generateAttributes(GeneralData memory _gData) internal view returns (bytes memory atts_) {
        string memory key = "trait_type:";
        string memory val = ",value:";
        string memory close = "}";
        bytes[] memory attributes = new bytes[](10);
        attributes[0] = abi.encodePacked("[{", key, "Haunt", val, _gData._haunt, close);
        attributes[1] = abi.encodePacked(",{", key, "Base Rarity Score", val, _gData._brs, close);
        attributes[2] = abi.encodePacked(",{", key, "Modified Rarity Score", val, _gData._mrs, close);
        attributes[3] = abi.encodePacked(",{", key, "With Sets Rarity Score", close);
        attributes[4] = abi.encodePacked(",{", key, "Base Traits", val, convertTraits(_gData._bts), close);
        attributes[5] = abi.encodePacked(",{", key, "Modified Traits", val, convertTraits(_gData._mts), close);
        attributes[6] = abi.encodePacked(",{", key, "Kinship", _gData._kinship, close);
        attributes[7] = abi.encodePacked(",{", key, "Experience", _gData._xp, close);
        attributes[8] = abi.encodePacked(",{", key, "level", _gData._level, close);
        attributes[9] = abi.encodePacked(",{", key, "XP to Next Level", _gData._toNext, close, "]}");
        for (uint256 i; i < attributes.length; i++) {
            atts_ = abi.encodePacked(attributes[i]);
        }
        atts_ = abi.encodePacked("data:text/plain;base64,", atts_);
    }

    function getData(uint256 _tokenId) private view returns (GeneralData memory _gData) {
        _gData._haunt = s.aavegotchis[_tokenId].hauntId;
        int16[NUMERIC_TRAITS_NUM] memory traits = s.aavegotchis[_tokenId].numericTraits;
        _gData._brs = LibAavegotchi.baseRarityScore(traits);
        (, _gData._mrs) = LibAavegotchi.modifiedTraitsAndRarityScore(_tokenId);
    }

    // function tokeURI(uint256 _tokenId) external view returns (string memory) {
    //     bytes memory _fullData1 = LibSvg.generateURI(
    //         s.aavegotchis[_tokenId].name,
    //         "Your very own aavegotchi ",
    //         SvgFacet(address(this)).getAavegotchiSvg(_tokenId),
    //         AavegotchiFacet.externalUri(_tokenId)
    //     );
    // }

    function strWithInt(string memory _str, int16 value) internal pure returns (string memory) {
        // Inspired by OraclizeAPI's implementation - MIT licence
        //converted to use int16
        // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol
        bytes memory buffer;
        unchecked {
            if (value == 0) {
                return string(abi.encodePacked(_str, "0"));
            }
            int16 temp = value;
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

    function abs(int16 x) internal pure returns (int16) {
        return int16(x >= 0 ? x : -x);
    }
}
