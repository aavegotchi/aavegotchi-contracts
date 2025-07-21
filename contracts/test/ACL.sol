/**
 *Submitted for verification at Etherscan.io on 2020-02-06
 */

// File: contracts/common/UnstructuredStorage.sol

/*
 * SPDX-License-Identitifer:    MIT
 */

pragma solidity ^0.4.24;

library UnstructuredStorage {
    function getStorageBool(bytes32 position) internal view returns (bool data) {
        assembly {
            data := sload(position)
        }
    }

    function getStorageAddress(bytes32 position) internal view returns (address data) {
        assembly {
            data := sload(position)
        }
    }

    function getStorageBytes32(bytes32 position) internal view returns (bytes32 data) {
        assembly {
            data := sload(position)
        }
    }

    function getStorageUint256(bytes32 position) internal view returns (uint256 data) {
        assembly {
            data := sload(position)
        }
    }

    function setStorageBool(bytes32 position, bool data) internal {
        assembly {
            sstore(position, data)
        }
    }

    function setStorageAddress(bytes32 position, address data) internal {
        assembly {
            sstore(position, data)
        }
    }

    function setStorageBytes32(bytes32 position, bytes32 data) internal {
        assembly {
            sstore(position, data)
        }
    }

    function setStorageUint256(bytes32 position, uint256 data) internal {
        assembly {
            sstore(position, data)
        }
    }
}

// File: contracts/acl/IACL.sol

/*
 * SPDX-License-Identitifer:    MIT
 */

pragma solidity ^0.4.24;

interface IACL {
    function initialize(address permissionsCreator) external;

    // TODO: this should be external
    // See https://github.com/ethereum/solidity/issues/4832
    function hasPermission(
        address who,
        address where,
        bytes32 what,
        bytes how
    ) public view returns (bool);
}

// File: contracts/common/IVaultRecoverable.sol

/*
 * SPDX-License-Identitifer:    MIT
 */

pragma solidity ^0.4.24;

interface IVaultRecoverable {
    function transferToVault(address token) external;

    function allowRecoverability(address token) external view returns (bool);

    function getRecoveryVault() external view returns (address);
}

// File: contracts/kernel/IKernel.sol

/*
 * SPDX-License-Identitifer:    MIT
 */

pragma solidity ^0.4.24;

// This should be an interface, but interfaces can't inherit yet :(
contract IKernel is IVaultRecoverable {
    event SetApp(bytes32 indexed namespace, bytes32 indexed appId, address app);

    function acl() public view returns (IACL);

    function hasPermission(
        address who,
        address where,
        bytes32 what,
        bytes how
    ) public view returns (bool);

    function setApp(
        bytes32 namespace,
        bytes32 appId,
        address app
    ) public;

    function getApp(bytes32 namespace, bytes32 appId) public view returns (address);
}

// File: contracts/apps/AppStorage.sol

/*
 * SPDX-License-Identitifer:    MIT
 */

pragma solidity ^0.4.24;

contract AppStorage {
    using UnstructuredStorage for bytes32;

    /* Hardcoded constants to save gas
    bytes32 internal constant KERNEL_POSITION = keccak256("aragonOS.appStorage.kernel");
    bytes32 internal constant APP_ID_POSITION = keccak256("aragonOS.appStorage.appId");
    */
    bytes32 internal constant KERNEL_POSITION = 0x4172f0f7d2289153072b0a6ca36959e0cbe2efc3afe50fc81636caa96338137b;
    bytes32 internal constant APP_ID_POSITION = 0xd625496217aa6a3453eecb9c3489dc5a53e6c67b444329ea2b2cbc9ff547639b;

    function kernel() public view returns (IKernel) {
        return IKernel(KERNEL_POSITION.getStorageAddress());
    }

    function appId() public view returns (bytes32) {
        return APP_ID_POSITION.getStorageBytes32();
    }

    function setKernel(IKernel _kernel) internal {
        KERNEL_POSITION.setStorageAddress(address(_kernel));
    }

    function setAppId(bytes32 _appId) internal {
        APP_ID_POSITION.setStorageBytes32(_appId);
    }
}

// File: contracts/common/Uint256Helpers.sol

pragma solidity ^0.4.24;

library Uint256Helpers {
    uint256 private constant MAX_UINT64 = uint64(-1);

    string private constant ERROR_NUMBER_TOO_BIG = "UINT64_NUMBER_TOO_BIG";

    function toUint64(uint256 a) internal pure returns (uint64) {
        require(a <= MAX_UINT64, ERROR_NUMBER_TOO_BIG);
        return uint64(a);
    }
}

// File: contracts/common/TimeHelpers.sol

/*
 * SPDX-License-Identitifer:    MIT
 */

pragma solidity ^0.4.24;

contract TimeHelpers {
    using Uint256Helpers for uint256;

    /**
     * @dev Returns the current block number.
     *      Using a function rather than `block.number` allows us to easily mock the block number in
     *      tests.
     */
    function getBlockNumber() internal view returns (uint256) {
        return block.number;
    }

    /**
     * @dev Returns the current block number, converted to uint64.
     *      Using a function rather than `block.number` allows us to easily mock the block number in
     *      tests.
     */
    function getBlockNumber64() internal view returns (uint64) {
        return getBlockNumber().toUint64();
    }

    /**
     * @dev Returns the current timestamp.
     *      Using a function rather than `block.timestamp` allows us to easily mock it in
     *      tests.
     */
    function getTimestamp() internal view returns (uint256) {
        return block.timestamp; // solium-disable-line security/no-block-members
    }

    /**
     * @dev Returns the current timestamp, converted to uint64.
     *      Using a function rather than `block.timestamp` allows us to easily mock it in
     *      tests.
     */
    function getTimestamp64() internal view returns (uint64) {
        return getTimestamp().toUint64();
    }
}

// File: contracts/common/Initializable.sol

/*
 * SPDX-License-Identitifer:    MIT
 */

pragma solidity ^0.4.24;

contract Initializable is TimeHelpers {
    using UnstructuredStorage for bytes32;

    // keccak256("aragonOS.initializable.initializationBlock")
    bytes32 internal constant INITIALIZATION_BLOCK_POSITION = 0xebb05b386a8d34882b8711d156f463690983dc47815980fb82aeeff1aa43579e;

    string private constant ERROR_ALREADY_INITIALIZED = "INIT_ALREADY_INITIALIZED";
    string private constant ERROR_NOT_INITIALIZED = "INIT_NOT_INITIALIZED";

    modifier onlyInit() {
        require(getInitializationBlock() == 0, ERROR_ALREADY_INITIALIZED);
        _;
    }

    modifier isInitialized() {
        require(hasInitialized(), ERROR_NOT_INITIALIZED);
        _;
    }

    /**
     * @return Block number in which the contract was initialized
     */
    function getInitializationBlock() public view returns (uint256) {
        return INITIALIZATION_BLOCK_POSITION.getStorageUint256();
    }

    /**
     * @return Whether the contract has been initialized by the time of the current block
     */
    function hasInitialized() public view returns (bool) {
        uint256 initializationBlock = getInitializationBlock();
        return initializationBlock != 0 && getBlockNumber() >= initializationBlock;
    }

    /**
     * @dev Function to be called by top level contract after initialization has finished.
     */
    function initialized() internal onlyInit {
        INITIALIZATION_BLOCK_POSITION.setStorageUint256(getBlockNumber());
    }

    /**
     * @dev Function to be called by top level contract after initialization to enable the contract
     *      at a future block number rather than immediately.
     */
    function initializedAt(uint256 _blockNumber) internal onlyInit {
        INITIALIZATION_BLOCK_POSITION.setStorageUint256(_blockNumber);
    }
}

// File: contracts/common/Petrifiable.sol

/*
 * SPDX-License-Identitifer:    MIT
 */

pragma solidity ^0.4.24;

contract Petrifiable is Initializable {
    // Use block UINT256_MAX (which should be never) as the initializable date
    uint256 internal constant PETRIFIED_BLOCK = uint256(-1);

    function isPetrified() public view returns (bool) {
        return getInitializationBlock() == PETRIFIED_BLOCK;
    }

    /**
     * @dev Function to be called by top level contract to prevent being initialized.
     *      Useful for freezing base contracts when they're used behind proxies.
     */
    function petrify() internal onlyInit {
        initializedAt(PETRIFIED_BLOCK);
    }
}

// File: contracts/common/Autopetrified.sol

/*
 * SPDX-License-Identitifer:    MIT
 */

pragma solidity ^0.4.24;

contract Autopetrified is Petrifiable {
    constructor() public {
        // Immediately petrify base (non-proxy) instances of inherited contracts on deploy.
        // This renders them uninitializable (and unusable without a proxy).
        petrify();
    }
}

// File: contracts/lib/token/ERC20.sol

// See https://github.com/OpenZeppelin/openzeppelin-solidity/blob/a9f910d34f0ab33a1ae5e714f69f9596a02b4d91/contracts/token/ERC20/ERC20.sol

pragma solidity ^0.4.24;

/**
 * @title ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
contract ERC20 {
    function totalSupply() public view returns (uint256);

    function balanceOf(address _who) public view returns (uint256);

    function allowance(address _owner, address _spender) public view returns (uint256);

    function transfer(address _to, uint256 _value) public returns (bool);

    function approve(address _spender, uint256 _value) public returns (bool);

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(address indexed owner, address indexed spender, uint256 value);
}

// File: contracts/common/EtherTokenConstant.sol

/*
 * SPDX-License-Identitifer:    MIT
 */

pragma solidity ^0.4.24;

// aragonOS and aragon-apps rely on address(0) to denote native ETH, in
// contracts where both tokens and ETH are accepted
contract EtherTokenConstant {
    address internal constant ETH = address(0);
}

// File: contracts/common/IsContract.sol

/*
 * SPDX-License-Identitifer:    MIT
 */

pragma solidity ^0.4.24;

contract IsContract {
    /*
     * NOTE: this should NEVER be used for authentication
     * (see pitfalls: https://github.com/fergarrui/ethereum-security/tree/master/contracts/extcodesize).
     *
     * This is only intended to be used as a sanity check that an address is actually a contract,
     * RATHER THAN an address not being a contract.
     */
    function isContract(address _target) internal view returns (bool) {
        if (_target == address(0)) {
            return false;
        }

        uint256 size;
        assembly {
            size := extcodesize(_target)
        }
        return size > 0;
    }
}

// File: contracts/common/VaultRecoverable.sol

/*
 * SPDX-License-Identitifer:    MIT
 */

pragma solidity ^0.4.24;

contract VaultRecoverable is IVaultRecoverable, EtherTokenConstant, IsContract {
    string private constant ERROR_DISALLOWED = "RECOVER_DISALLOWED";
    string private constant ERROR_VAULT_NOT_CONTRACT = "RECOVER_VAULT_NOT_CONTRACT";

    /**
     * @notice Send funds to recovery Vault. This contract should never receive funds,
     *         but in case it does, this function allows one to recover them.
     * @param _token Token balance to be sent to recovery vault.
     */
    function transferToVault(address _token) external {
        require(allowRecoverability(_token), ERROR_DISALLOWED);
        address vault = getRecoveryVault();
        require(isContract(vault), ERROR_VAULT_NOT_CONTRACT);

        if (_token == ETH) {
            vault.transfer(address(this).balance);
        } else {
            uint256 amount = ERC20(_token).balanceOf(this);
            ERC20(_token).transfer(vault, amount);
        }
    }

    /**
     * @dev By default deriving from AragonApp makes it recoverable
     * @param token Token address that would be recovered
     * @return bool whether the app allows the recovery
     */
    function allowRecoverability(address token) public view returns (bool) {
        return true;
    }

    // Cast non-implemented interface to be public so we can use it internally
    function getRecoveryVault() public view returns (address);
}

// File: contracts/evmscript/IEVMScriptExecutor.sol

/*
 * SPDX-License-Identitifer:    MIT
 */

pragma solidity ^0.4.24;

interface IEVMScriptExecutor {
    function execScript(
        bytes script,
        bytes input,
        address[] blacklist
    ) external returns (bytes);

    function executorType() external pure returns (bytes32);
}

// File: contracts/evmscript/IEVMScriptRegistry.sol

/*
 * SPDX-License-Identitifer:    MIT
 */

pragma solidity ^0.4.24;

contract EVMScriptRegistryConstants {
    /* Hardcoded constants to save gas
    bytes32 internal constant EVMSCRIPT_REGISTRY_APP_ID = apmNamehash("evmreg");
    */
    bytes32 internal constant EVMSCRIPT_REGISTRY_APP_ID = 0xddbcfd564f642ab5627cf68b9b7d374fb4f8a36e941a75d89c87998cef03bd61;
}

interface IEVMScriptRegistry {
    function addScriptExecutor(IEVMScriptExecutor executor) external returns (uint256 id);

    function disableScriptExecutor(uint256 executorId) external;

    // TODO: this should be external
    // See https://github.com/ethereum/solidity/issues/4832
    function getScriptExecutor(bytes script) public view returns (IEVMScriptExecutor);
}

// File: contracts/kernel/KernelConstants.sol

/*
 * SPDX-License-Identitifer:    MIT
 */

pragma solidity ^0.4.24;

contract KernelAppIds {
    /* Hardcoded constants to save gas
    bytes32 internal constant KERNEL_CORE_APP_ID = apmNamehash("kernel");
    bytes32 internal constant KERNEL_DEFAULT_ACL_APP_ID = apmNamehash("acl");
    bytes32 internal constant KERNEL_DEFAULT_VAULT_APP_ID = apmNamehash("vault");
    */
    bytes32 internal constant KERNEL_CORE_APP_ID = 0x3b4bf6bf3ad5000ecf0f989d5befde585c6860fea3e574a4fab4c49d1c177d9c;
    bytes32 internal constant KERNEL_DEFAULT_ACL_APP_ID = 0xe3262375f45a6e2026b7e7b18c2b807434f2508fe1a2a3dfb493c7df8f4aad6a;
    bytes32 internal constant KERNEL_DEFAULT_VAULT_APP_ID = 0x7e852e0fcfce6551c13800f1e7476f982525c2b5277ba14b24339c68416336d1;
}

contract KernelNamespaceConstants {
    /* Hardcoded constants to save gas
    bytes32 internal constant KERNEL_CORE_NAMESPACE = keccak256("core");
    bytes32 internal constant KERNEL_APP_BASES_NAMESPACE = keccak256("base");
    bytes32 internal constant KERNEL_APP_ADDR_NAMESPACE = keccak256("app");
    */
    bytes32 internal constant KERNEL_CORE_NAMESPACE = 0xc681a85306374a5ab27f0bbc385296a54bcd314a1948b6cf61c4ea1bc44bb9f8;
    bytes32 internal constant KERNEL_APP_BASES_NAMESPACE = 0xf1f3eb40f5bc1ad1344716ced8b8a0431d840b5783aea1fd01786bc26f35ac0f;
    bytes32 internal constant KERNEL_APP_ADDR_NAMESPACE = 0xd6f028ca0e8edb4a8c9757ca4fdccab25fa1e0317da1188108f7d2dee14902fb;
}

// File: contracts/evmscript/EVMScriptRunner.sol

/*
 * SPDX-License-Identitifer:    MIT
 */

pragma solidity ^0.4.24;

contract EVMScriptRunner is AppStorage, Initializable, EVMScriptRegistryConstants, KernelNamespaceConstants {
    string private constant ERROR_EXECUTOR_UNAVAILABLE = "EVMRUN_EXECUTOR_UNAVAILABLE";
    string private constant ERROR_EXECUTION_REVERTED = "EVMRUN_EXECUTION_REVERTED";
    string private constant ERROR_PROTECTED_STATE_MODIFIED = "EVMRUN_PROTECTED_STATE_MODIFIED";

    event ScriptResult(address indexed executor, bytes script, bytes input, bytes returnData);

    function getEVMScriptExecutor(bytes _script) public view returns (IEVMScriptExecutor) {
        return IEVMScriptExecutor(getEVMScriptRegistry().getScriptExecutor(_script));
    }

    function getEVMScriptRegistry() public view returns (IEVMScriptRegistry) {
        address registryAddr = kernel().getApp(KERNEL_APP_ADDR_NAMESPACE, EVMSCRIPT_REGISTRY_APP_ID);
        return IEVMScriptRegistry(registryAddr);
    }

    function runScript(
        bytes _script,
        bytes _input,
        address[] _blacklist
    ) internal isInitialized protectState returns (bytes) {
        // TODO: Too much data flying around, maybe extracting spec id here is cheaper
        IEVMScriptExecutor executor = getEVMScriptExecutor(_script);
        require(address(executor) != address(0), ERROR_EXECUTOR_UNAVAILABLE);

        bytes4 sig = executor.execScript.selector;
        bytes memory data = abi.encodeWithSelector(sig, _script, _input, _blacklist);
        require(address(executor).delegatecall(data), ERROR_EXECUTION_REVERTED);

        bytes memory output = returnedDataDecoded();

        emit ScriptResult(address(executor), _script, _input, output);

        return output;
    }

    /**
     * @dev copies and returns last's call data. Needs to ABI decode first
     */
    function returnedDataDecoded() internal pure returns (bytes ret) {
        assembly {
            let size := returndatasize
            switch size
            case 0 {

            }
            default {
                ret := mload(0x40) // free mem ptr get
                mstore(0x40, add(ret, add(size, 0x20))) // free mem ptr set
                returndatacopy(ret, 0x20, sub(size, 0x20)) // copy return data
            }
        }
        return ret;
    }

    modifier protectState() {
        address preKernel = address(kernel());
        bytes32 preAppId = appId();
        _; // exec
        require(address(kernel()) == preKernel, ERROR_PROTECTED_STATE_MODIFIED);
        require(appId() == preAppId, ERROR_PROTECTED_STATE_MODIFIED);
    }
}

// File: contracts/acl/ACLSyntaxSugar.sol

/*
 * SPDX-License-Identitifer:    MIT
 */

pragma solidity ^0.4.24;

contract ACLSyntaxSugar {
    function arr() internal pure returns (uint256[]) {}

    function arr(bytes32 _a) internal pure returns (uint256[] r) {
        return arr(uint256(_a));
    }

    function arr(bytes32 _a, bytes32 _b) internal pure returns (uint256[] r) {
        return arr(uint256(_a), uint256(_b));
    }

    function arr(address _a) internal pure returns (uint256[] r) {
        return arr(uint256(_a));
    }

    function arr(address _a, address _b) internal pure returns (uint256[] r) {
        return arr(uint256(_a), uint256(_b));
    }

    function arr(
        address _a,
        uint256 _b,
        uint256 _c
    ) internal pure returns (uint256[] r) {
        return arr(uint256(_a), _b, _c);
    }

    function arr(
        address _a,
        uint256 _b,
        uint256 _c,
        uint256 _d
    ) internal pure returns (uint256[] r) {
        return arr(uint256(_a), _b, _c, _d);
    }

    function arr(address _a, uint256 _b) internal pure returns (uint256[] r) {
        return arr(uint256(_a), uint256(_b));
    }

    function arr(
        address _a,
        address _b,
        uint256 _c,
        uint256 _d,
        uint256 _e
    ) internal pure returns (uint256[] r) {
        return arr(uint256(_a), uint256(_b), _c, _d, _e);
    }

    function arr(
        address _a,
        address _b,
        address _c
    ) internal pure returns (uint256[] r) {
        return arr(uint256(_a), uint256(_b), uint256(_c));
    }

    function arr(
        address _a,
        address _b,
        uint256 _c
    ) internal pure returns (uint256[] r) {
        return arr(uint256(_a), uint256(_b), uint256(_c));
    }

    function arr(uint256 _a) internal pure returns (uint256[] r) {
        r = new uint256[](1);
        r[0] = _a;
    }

    function arr(uint256 _a, uint256 _b) internal pure returns (uint256[] r) {
        r = new uint256[](2);
        r[0] = _a;
        r[1] = _b;
    }

    function arr(
        uint256 _a,
        uint256 _b,
        uint256 _c
    ) internal pure returns (uint256[] r) {
        r = new uint256[](3);
        r[0] = _a;
        r[1] = _b;
        r[2] = _c;
    }

    function arr(
        uint256 _a,
        uint256 _b,
        uint256 _c,
        uint256 _d
    ) internal pure returns (uint256[] r) {
        r = new uint256[](4);
        r[0] = _a;
        r[1] = _b;
        r[2] = _c;
        r[3] = _d;
    }

    function arr(
        uint256 _a,
        uint256 _b,
        uint256 _c,
        uint256 _d,
        uint256 _e
    ) internal pure returns (uint256[] r) {
        r = new uint256[](5);
        r[0] = _a;
        r[1] = _b;
        r[2] = _c;
        r[3] = _d;
        r[4] = _e;
    }
}

contract ACLHelpers {
    function decodeParamOp(uint256 _x) internal pure returns (uint8 b) {
        return uint8(_x >> (8 * 30));
    }

    function decodeParamId(uint256 _x) internal pure returns (uint8 b) {
        return uint8(_x >> (8 * 31));
    }

    function decodeParamsList(uint256 _x)
        internal
        pure
        returns (
            uint32 a,
            uint32 b,
            uint32 c
        )
    {
        a = uint32(_x);
        b = uint32(_x >> (8 * 4));
        c = uint32(_x >> (8 * 8));
    }
}

// File: contracts/apps/AragonApp.sol

/*
 * SPDX-License-Identitifer:    MIT
 */

pragma solidity ^0.4.24;

// Contracts inheriting from AragonApp are, by default, immediately petrified upon deployment so
// that they can never be initialized.
// Unless overriden, this behaviour enforces those contracts to be usable only behind an AppProxy.
// ACLSyntaxSugar and EVMScriptRunner are not directly used by this contract, but are included so
// that they are automatically usable by subclassing contracts
contract AragonApp is AppStorage, Autopetrified, VaultRecoverable, EVMScriptRunner, ACLSyntaxSugar {
    string private constant ERROR_AUTH_FAILED = "APP_AUTH_FAILED";

    modifier auth(bytes32 _role) {
        require(canPerform(msg.sender, _role, new uint256[](0)), ERROR_AUTH_FAILED);
        _;
    }

    modifier authP(bytes32 _role, uint256[] _params) {
        require(canPerform(msg.sender, _role, _params), ERROR_AUTH_FAILED);
        _;
    }

    /**
     * @dev Check whether an action can be performed by a sender for a particular role on this app
     * @param _sender Sender of the call
     * @param _role Role on this app
     * @param _params Permission params for the role
     * @return Boolean indicating whether the sender has the permissions to perform the action.
     *         Always returns false if the app hasn't been initialized yet.
     */
    function canPerform(
        address _sender,
        bytes32 _role,
        uint256[] _params
    ) public view returns (bool) {
        if (!hasInitialized()) {
            return false;
        }

        IKernel linkedKernel = kernel();
        if (address(linkedKernel) == address(0)) {
            return false;
        }

        // Force cast the uint256[] into a bytes array, by overwriting its length
        // Note that the bytes array doesn't need to be initialized as we immediately overwrite it
        // with _params and a new length, and _params becomes invalid from this point forward
        bytes memory how;
        uint256 byteLength = _params.length * 32;
        assembly {
            how := _params
            mstore(how, byteLength)
        }
        return linkedKernel.hasPermission(_sender, address(this), _role, how);
    }

    /**
     * @dev Get the recovery vault for the app
     * @return Recovery vault address for the app
     */
    function getRecoveryVault() public view returns (address) {
        // Funds recovery via a vault is only available when used with a kernel
        return kernel().getRecoveryVault(); // if kernel is not set, it will revert
    }
}

// File: contracts/acl/IACLOracle.sol

/*
 * SPDX-License-Identitifer:    MIT
 */

pragma solidity ^0.4.24;

interface IACLOracle {
    function canPerform(
        address who,
        address where,
        bytes32 what,
        uint256[] how
    ) external view returns (bool);
}

// File: contracts/acl/ACL.sol

pragma solidity 0.4.24;

/* solium-disable function-order */
// Allow public initialize() to be first
contract ACL is IACL, TimeHelpers, AragonApp, ACLHelpers {
    /* Hardcoded constants to save gas
    bytes32 public constant CREATE_PERMISSIONS_ROLE = keccak256("CREATE_PERMISSIONS_ROLE");
    */
    bytes32 public constant CREATE_PERMISSIONS_ROLE = 0x0b719b33c83b8e5d300c521cb8b54ae9bd933996a14bef8c2f4e0285d2d2400a;

    enum Op {
        NONE,
        EQ,
        NEQ,
        GT,
        LT,
        GTE,
        LTE,
        RET,
        NOT,
        AND,
        OR,
        XOR,
        IF_ELSE
    } // op types

    struct Param {
        uint8 id;
        uint8 op;
        uint240 value; // even though value is an uint240 it can store addresses
        // in the case of 32 byte hashes losing 2 bytes precision isn't a huge deal
        // op and id take less than 1 byte each so it can be kept in 1 sstore
    }

    uint8 internal constant BLOCK_NUMBER_PARAM_ID = 200;
    uint8 internal constant TIMESTAMP_PARAM_ID = 201;
    // 202 is unused
    uint8 internal constant ORACLE_PARAM_ID = 203;
    uint8 internal constant LOGIC_OP_PARAM_ID = 204;
    uint8 internal constant PARAM_VALUE_PARAM_ID = 205;
    // TODO: Add execution times param type?

    /* Hardcoded constant to save gas
    bytes32 public constant EMPTY_PARAM_HASH = keccak256(uint256(0));
    */
    bytes32 public constant EMPTY_PARAM_HASH = 0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563;
    bytes32 public constant NO_PERMISSION = bytes32(0);
    address public constant ANY_ENTITY = address(-1);
    address public constant BURN_ENTITY = address(1); // address(0) is already used as "no permission manager"

    string private constant ERROR_AUTH_INIT_KERNEL = "ACL_AUTH_INIT_KERNEL";
    string private constant ERROR_AUTH_NO_MANAGER = "ACL_AUTH_NO_MANAGER";
    string private constant ERROR_EXISTENT_MANAGER = "ACL_EXISTENT_MANAGER";

    // Whether someone has a permission
    mapping(bytes32 => bytes32) internal permissions; // permissions hash => params hash
    mapping(bytes32 => Param[]) internal permissionParams; // params hash => params

    // Who is the manager of a permission
    mapping(bytes32 => address) internal permissionManager;

    event SetPermission(address indexed entity, address indexed app, bytes32 indexed role, bool allowed);
    event SetPermissionParams(address indexed entity, address indexed app, bytes32 indexed role, bytes32 paramsHash);
    event ChangePermissionManager(address indexed app, bytes32 indexed role, address indexed manager);

    modifier onlyPermissionManager(address _app, bytes32 _role) {
        require(msg.sender == getPermissionManager(_app, _role), ERROR_AUTH_NO_MANAGER);
        _;
    }

    modifier noPermissionManager(address _app, bytes32 _role) {
        // only allow permission creation (or re-creation) when there is no manager
        require(getPermissionManager(_app, _role) == address(0), ERROR_EXISTENT_MANAGER);
        _;
    }

    /**
     * @dev Initialize can only be called once. It saves the block number in which it was initialized.
     * @notice Initialize an ACL instance and set `_permissionsCreator` as the entity that can create other permissions
     * @param _permissionsCreator Entity that will be given permission over createPermission
     */
    function initialize(address _permissionsCreator) public onlyInit {
        initialized();
        require(msg.sender == address(kernel()), ERROR_AUTH_INIT_KERNEL);

        _createPermission(_permissionsCreator, this, CREATE_PERMISSIONS_ROLE, _permissionsCreator);
    }

    /**
     * @dev Creates a permission that wasn't previously set and managed.
     *      If a created permission is removed it is possible to reset it with createPermission.
     *      This is the **ONLY** way to create permissions and set managers to permissions that don't
     *      have a manager.
     *      In terms of the ACL being initialized, this function implicitly protects all the other
     *      state-changing external functions, as they all require the sender to be a manager.
     * @notice Create a new permission granting `_entity` the ability to perform actions requiring `_role` on `_app`, setting `_manager` as the permission's manager
     * @param _entity Address of the whitelisted entity that will be able to perform the role
     * @param _app Address of the app in which the role will be allowed (requires app to depend on kernel for ACL)
     * @param _role Identifier for the group of actions in app given access to perform
     * @param _manager Address of the entity that will be able to grant and revoke the permission further.
     */
    function createPermission(
        address _entity,
        address _app,
        bytes32 _role,
        address _manager
    ) external auth(CREATE_PERMISSIONS_ROLE) noPermissionManager(_app, _role) {
        _createPermission(_entity, _app, _role, _manager);
    }

    /**
     * @dev Grants permission if allowed. This requires `msg.sender` to be the permission manager
     * @notice Grant `_entity` the ability to perform actions requiring `_role` on `_app`
     * @param _entity Address of the whitelisted entity that will be able to perform the role
     * @param _app Address of the app in which the role will be allowed (requires app to depend on kernel for ACL)
     * @param _role Identifier for the group of actions in app given access to perform
     */
    function grantPermission(
        address _entity,
        address _app,
        bytes32 _role
    ) external {
        grantPermissionP(_entity, _app, _role, new uint256[](0));
    }

    /**
     * @dev Grants a permission with parameters if allowed. This requires `msg.sender` to be the permission manager
     * @notice Grant `_entity` the ability to perform actions requiring `_role` on `_app`
     * @param _entity Address of the whitelisted entity that will be able to perform the role
     * @param _app Address of the app in which the role will be allowed (requires app to depend on kernel for ACL)
     * @param _role Identifier for the group of actions in app given access to perform
     * @param _params Permission parameters
     */
    function grantPermissionP(
        address _entity,
        address _app,
        bytes32 _role,
        uint256[] _params
    ) public onlyPermissionManager(_app, _role) {
        bytes32 paramsHash = _params.length > 0 ? _saveParams(_params) : EMPTY_PARAM_HASH;
        _setPermission(_entity, _app, _role, paramsHash);
    }

    /**
     * @dev Revokes permission if allowed. This requires `msg.sender` to be the permission manager
     * @notice Revoke from `_entity` the ability to perform actions requiring `_role` on `_app`
     * @param _entity Address of the whitelisted entity to revoke access from
     * @param _app Address of the app in which the role will be revoked
     * @param _role Identifier for the group of actions in app being revoked
     */
    function revokePermission(
        address _entity,
        address _app,
        bytes32 _role
    ) external onlyPermissionManager(_app, _role) {
        _setPermission(_entity, _app, _role, NO_PERMISSION);
    }

    /**
     * @notice Set `_newManager` as the manager of `_role` in `_app`
     * @param _newManager Address for the new manager
     * @param _app Address of the app in which the permission management is being transferred
     * @param _role Identifier for the group of actions being transferred
     */
    function setPermissionManager(
        address _newManager,
        address _app,
        bytes32 _role
    ) external onlyPermissionManager(_app, _role) {
        _setPermissionManager(_newManager, _app, _role);
    }

    /**
     * @notice Remove the manager of `_role` in `_app`
     * @param _app Address of the app in which the permission is being unmanaged
     * @param _role Identifier for the group of actions being unmanaged
     */
    function removePermissionManager(address _app, bytes32 _role) external onlyPermissionManager(_app, _role) {
        _setPermissionManager(address(0), _app, _role);
    }

    /**
     * @notice Burn non-existent `_role` in `_app`, so no modification can be made to it (grant, revoke, permission manager)
     * @param _app Address of the app in which the permission is being burned
     * @param _role Identifier for the group of actions being burned
     */
    function createBurnedPermission(address _app, bytes32 _role) external auth(CREATE_PERMISSIONS_ROLE) noPermissionManager(_app, _role) {
        _setPermissionManager(BURN_ENTITY, _app, _role);
    }

    /**
     * @notice Burn `_role` in `_app`, so no modification can be made to it (grant, revoke, permission manager)
     * @param _app Address of the app in which the permission is being burned
     * @param _role Identifier for the group of actions being burned
     */
    function burnPermissionManager(address _app, bytes32 _role) external onlyPermissionManager(_app, _role) {
        _setPermissionManager(BURN_ENTITY, _app, _role);
    }

    /**
     * @notice Get parameters for permission array length
     * @param _entity Address of the whitelisted entity that will be able to perform the role
     * @param _app Address of the app
     * @param _role Identifier for a group of actions in app
     * @return Length of the array
     */
    function getPermissionParamsLength(
        address _entity,
        address _app,
        bytes32 _role
    ) external view returns (uint256) {
        return permissionParams[permissions[permissionHash(_entity, _app, _role)]].length;
    }

    /**
     * @notice Get parameter for permission
     * @param _entity Address of the whitelisted entity that will be able to perform the role
     * @param _app Address of the app
     * @param _role Identifier for a group of actions in app
     * @param _index Index of parameter in the array
     * @return Parameter (id, op, value)
     */
    function getPermissionParam(
        address _entity,
        address _app,
        bytes32 _role,
        uint256 _index
    )
        external
        view
        returns (
            uint8,
            uint8,
            uint240
        )
    {
        Param storage param = permissionParams[permissions[permissionHash(_entity, _app, _role)]][_index];
        return (param.id, param.op, param.value);
    }

    /**
     * @dev Get manager for permission
     * @param _app Address of the app
     * @param _role Identifier for a group of actions in app
     * @return address of the manager for the permission
     */
    function getPermissionManager(address _app, bytes32 _role) public view returns (address) {
        return permissionManager[roleHash(_app, _role)];
    }

    /**
     * @dev Function called by apps to check ACL on kernel or to check permission statu
     * @param _who Sender of the original call
     * @param _where Address of the app
     * @param _where Identifier for a group of actions in app
     * @param _how Permission parameters
     * @return boolean indicating whether the ACL allows the role or not
     */
    function hasPermission(
        address _who,
        address _where,
        bytes32 _what,
        bytes memory _how
    ) public view returns (bool) {
        // Force cast the bytes array into a uint256[], by overwriting its length
        // Note that the uint256[] doesn't need to be initialized as we immediately overwrite it
        // with _how and a new length, and _how becomes invalid from this point forward
        uint256[] memory how;
        uint256 intsLength = _how.length / 32;
        assembly {
            how := _how
            mstore(how, intsLength)
        }

        return hasPermission(_who, _where, _what, how);
    }

    function hasPermission(
        address _who,
        address _where,
        bytes32 _what,
        uint256[] memory _how
    ) public view returns (bool) {
        bytes32 whoParams = permissions[permissionHash(_who, _where, _what)];
        if (whoParams != NO_PERMISSION && evalParams(whoParams, _who, _where, _what, _how)) {
            return true;
        }

        bytes32 anyParams = permissions[permissionHash(ANY_ENTITY, _where, _what)];
        if (anyParams != NO_PERMISSION && evalParams(anyParams, ANY_ENTITY, _where, _what, _how)) {
            return true;
        }

        return false;
    }

    function hasPermission(
        address _who,
        address _where,
        bytes32 _what
    ) public view returns (bool) {
        uint256[] memory empty = new uint256[](0);
        return hasPermission(_who, _where, _what, empty);
    }

    function evalParams(
        bytes32 _paramsHash,
        address _who,
        address _where,
        bytes32 _what,
        uint256[] _how
    ) public view returns (bool) {
        if (_paramsHash == EMPTY_PARAM_HASH) {
            return true;
        }

        return _evalParam(_paramsHash, 0, _who, _where, _what, _how);
    }

    /**
     * @dev Internal createPermission for access inside the kernel (on instantiation)
     */
    function _createPermission(
        address _entity,
        address _app,
        bytes32 _role,
        address _manager
    ) internal {
        _setPermission(_entity, _app, _role, EMPTY_PARAM_HASH);
        _setPermissionManager(_manager, _app, _role);
    }

    /**
     * @dev Internal function called to actually save the permission
     */
    function _setPermission(
        address _entity,
        address _app,
        bytes32 _role,
        bytes32 _paramsHash
    ) internal {
        permissions[permissionHash(_entity, _app, _role)] = _paramsHash;
        bool entityHasPermission = _paramsHash != NO_PERMISSION;
        bool permissionHasParams = entityHasPermission && _paramsHash != EMPTY_PARAM_HASH;

        emit SetPermission(_entity, _app, _role, entityHasPermission);
        if (permissionHasParams) {
            emit SetPermissionParams(_entity, _app, _role, _paramsHash);
        }
    }

    function _saveParams(uint256[] _encodedParams) internal returns (bytes32) {
        bytes32 paramHash = keccak256(abi.encodePacked(_encodedParams));
        Param[] storage params = permissionParams[paramHash];

        if (params.length == 0) {
            // params not saved before
            for (uint256 i = 0; i < _encodedParams.length; i++) {
                uint256 encodedParam = _encodedParams[i];
                Param memory param = Param(decodeParamId(encodedParam), decodeParamOp(encodedParam), uint240(encodedParam));
                params.push(param);
            }
        }

        return paramHash;
    }

    function _evalParam(
        bytes32 _paramsHash,
        uint32 _paramId,
        address _who,
        address _where,
        bytes32 _what,
        uint256[] _how
    ) internal view returns (bool) {
        if (_paramId >= permissionParams[_paramsHash].length) {
            return false; // out of bounds
        }

        Param memory param = permissionParams[_paramsHash][_paramId];

        if (param.id == LOGIC_OP_PARAM_ID) {
            return _evalLogic(param, _paramsHash, _who, _where, _what, _how);
        }

        uint256 value;
        uint256 comparedTo = uint256(param.value);

        // get value
        if (param.id == ORACLE_PARAM_ID) {
            value = checkOracle(IACLOracle(param.value), _who, _where, _what, _how) ? 1 : 0;
            comparedTo = 1;
        } else if (param.id == BLOCK_NUMBER_PARAM_ID) {
            value = getBlockNumber();
        } else if (param.id == TIMESTAMP_PARAM_ID) {
            value = getTimestamp();
        } else if (param.id == PARAM_VALUE_PARAM_ID) {
            value = uint256(param.value);
        } else {
            if (param.id >= _how.length) {
                return false;
            }
            value = uint256(uint240(_how[param.id])); // force lost precision
        }

        if (Op(param.op) == Op.RET) {
            return uint256(value) > 0;
        }

        return compare(value, Op(param.op), comparedTo);
    }

    function _evalLogic(
        Param _param,
        bytes32 _paramsHash,
        address _who,
        address _where,
        bytes32 _what,
        uint256[] _how
    ) internal view returns (bool) {
        if (Op(_param.op) == Op.IF_ELSE) {
            uint32 conditionParam;
            uint32 successParam;
            uint32 failureParam;

            (conditionParam, successParam, failureParam) = decodeParamsList(uint256(_param.value));
            bool result = _evalParam(_paramsHash, conditionParam, _who, _where, _what, _how);

            return _evalParam(_paramsHash, result ? successParam : failureParam, _who, _where, _what, _how);
        }

        uint32 param1;
        uint32 param2;

        (param1, param2, ) = decodeParamsList(uint256(_param.value));
        bool r1 = _evalParam(_paramsHash, param1, _who, _where, _what, _how);

        if (Op(_param.op) == Op.NOT) {
            return !r1;
        }

        if (r1 && Op(_param.op) == Op.OR) {
            return true;
        }

        if (!r1 && Op(_param.op) == Op.AND) {
            return false;
        }

        bool r2 = _evalParam(_paramsHash, param2, _who, _where, _what, _how);

        if (Op(_param.op) == Op.XOR) {
            return r1 != r2;
        }

        return r2; // both or and depend on result of r2 after checks
    }

    function compare(
        uint256 _a,
        Op _op,
        uint256 _b
    ) internal pure returns (bool) {
        if (_op == Op.EQ) return _a == _b; // solium-disable-line lbrace
        if (_op == Op.NEQ) return _a != _b; // solium-disable-line lbrace
        if (_op == Op.GT) return _a > _b; // solium-disable-line lbrace
        if (_op == Op.LT) return _a < _b; // solium-disable-line lbrace
        if (_op == Op.GTE) return _a >= _b; // solium-disable-line lbrace
        if (_op == Op.LTE) return _a <= _b; // solium-disable-line lbrace
        return false;
    }

    function checkOracle(
        IACLOracle _oracleAddr,
        address _who,
        address _where,
        bytes32 _what,
        uint256[] _how
    ) internal view returns (bool) {
        bytes4 sig = _oracleAddr.canPerform.selector;

        // a raw call is required so we can return false if the call reverts, rather than reverting
        bytes memory checkCalldata = abi.encodeWithSelector(sig, _who, _where, _what, _how);

        bool ok;
        assembly {
            // send all available gas; if the oracle eats up all the gas, we will eventually revert
            // note that we are currently guaranteed to still have some gas after the call from
            // EIP-150's 63/64 gas forward rule
            ok := staticcall(gas, _oracleAddr, add(checkCalldata, 0x20), mload(checkCalldata), 0, 0)
        }

        if (!ok) {
            return false;
        }

        uint256 size;
        assembly {
            size := returndatasize
        }
        if (size != 32) {
            return false;
        }

        bool result;
        assembly {
            let ptr := mload(0x40) // get next free memory ptr
            returndatacopy(ptr, 0, size) // copy return from above `staticcall`
            result := mload(ptr) // read data at ptr and set it to result
            mstore(ptr, 0) // set pointer memory to 0 so it still is the next free ptr
        }

        return result;
    }

    /**
     * @dev Internal function that sets management
     */
    function _setPermissionManager(
        address _newManager,
        address _app,
        bytes32 _role
    ) internal {
        permissionManager[roleHash(_app, _role)] = _newManager;
        emit ChangePermissionManager(_app, _role, _newManager);
    }

    function roleHash(address _where, bytes32 _what) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("ROLE", _where, _what));
    }

    function permissionHash(
        address _who,
        address _where,
        bytes32 _what
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("PERMISSION", _who, _where, _what));
    }
}
