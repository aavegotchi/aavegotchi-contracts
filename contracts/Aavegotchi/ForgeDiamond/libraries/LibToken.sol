import {ForgeLibDiamond} from "./ForgeLibDiamond.sol";
import {LibAppStorage, AppStorage} from "./LibAppStorage.sol";

library LibToken {
    function addToOwner(
        address _to,
        uint256 _id,
        uint256 _value
    ) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        s._balances[_id][_to] += _value;
        s.ownerItemBalances[_to][_id] += _value;
        if (s.ownerItemIndexes[_to][_id] == 0) {
            s.ownerItems[_to].push(_id);
            s.ownerItemIndexes[_to][_id] = s.ownerItems[_to].length;
        }
    }

    function removeFromOwner(
        address _from,
        uint256 _id,
        uint256 _value
    ) internal {
        AppStorage storage s = LibAppStorage.diamondStorage();

        uint256 bal = s._balances[_id][_from];
        require(_value <= bal, "LibItems: insufficient balance for transfer");
        bal -= _value;

        s._balances[_id][_from] = bal;
        s.ownerItemBalances[_from][_id] = bal;
        if (bal == 0) {
            uint256 index = s.ownerItemIndexes[_from][_id] - 1;
            uint256 lastIndex = s.ownerItems[_from].length - 1;
            if (index != lastIndex) {
                uint256 lastId = s.ownerItems[_from][lastIndex];
                s.ownerItems[_from][index] = lastId;
                s.ownerItemIndexes[_from][lastId] = index + 1;
            }
            s.ownerItems[_from].pop();
            delete s.ownerItemIndexes[_from][_id];
        }
    }
}
