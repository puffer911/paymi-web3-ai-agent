// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PaymiInvoiceProxy {
    // Storage position of the address of the current implementation
    bytes32 private constant IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
    bytes32 private constant ADMIN_SLOT = 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6534;

    // Storage position of the admin
    constructor(address _logic) {
        _setAdmin(msg.sender);
        _setImplementation(_logic);
    }

    // Internal delegate call function
    function _delegate(address implementation) internal virtual {
        assembly {
            // Copy msg.data. We take full control of memory in this inline assembly
            // block because it will not return to Solidity code. We overwrite the
            // Solidity scratch pad at memory position 0.
            calldatacopy(0, 0, calldatasize())

            // Call the implementation.
            // out and outsize are 0 because we don't know the size yet.
            let result := delegatecall(gas(), implementation, 0, calldatasize(), 0, 0)

            // Copy the returned data.
            returndatacopy(0, 0, returndatasize())

            switch result
            // delegatecall returns 0 on error.
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }

    // Fallback function to delegate calls to implementation
    fallback() external payable {
        _delegate(_getImplementation());
    }

    receive() external payable {
        _delegate(_getImplementation());
    }

    // Admin can upgrade the implementation
    function upgradeTo(address newImplementation) external {
        require(msg.sender == _getAdmin(), "Only admin can upgrade");
        _setImplementation(newImplementation);
    }

    // Internal functions to manage implementation and admin
    function _setImplementation(address newImplementation) private {
        assembly {
            sstore(IMPLEMENTATION_SLOT, newImplementation)
        }
    }

    function _getImplementation() private view returns (address implementation) {
        assembly {
            implementation := sload(IMPLEMENTATION_SLOT)
        }
    }

    function _setAdmin(address newAdmin) private {
        assembly {
            sstore(ADMIN_SLOT, newAdmin)
        }
    }

    function _getAdmin() private view returns (address admin) {
        assembly {
            admin := sload(ADMIN_SLOT)
        }
    }
}