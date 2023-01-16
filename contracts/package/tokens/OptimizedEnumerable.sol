// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract OptimizedEnumerable is IERC721Enumerable, ERC721 {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    // count burnt token number to calc totalSupply()
    uint256 private _burnt;

    constructor(
        string memory name_,
        string memory symbol_
    ) ERC721(name_, symbol_) {}

    function _beforeTokenTransfer(
        address,
        address to,
        uint256,
        uint256
    ) internal virtual override {
        if (to == address(0)) {
            _burnt++;
        }
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721, IERC165) returns (bool) {
        return
            interfaceId == type(IERC721Enumerable).interfaceId ||
            interfaceId == type(IERC165).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * Foreach all minted tokens until reached appropriate index
     */
    function tokenOfOwnerByIndex(
        address owner,
        uint256 index
    ) public view virtual override returns (uint256) {
        require(index < balanceOf(owner), "Owner index out of bounds");

        uint256 numMinted = _tokenIdCounter.current();
        uint256 tokenIdsIdx;

        // Counter overflow is impossible as the loop breaks when uint256 i is equal to another uint256 numMintedSoFar.
        unchecked {
            for (uint256 i = 0; i < numMinted; i++) {
                if (_exists(i) && (ownerOf(i) == owner)) {
                    if (tokenIdsIdx == index) {
                        return i;
                    }
                    tokenIdsIdx = tokenIdsIdx + 1;
                }
            }
        }

        // Execution should never reach this point.
        assert(false);
        // added to stop compiler warnings
        return 0;
    }

    function totalSupply() public view virtual override returns (uint256) {
        return _tokenIdCounter.current() - _burnt;
    }

    /**
     * @dev See {IERC721Enumerable-tokenByIndex}.
     */
    function tokenByIndex(
        uint256 index
    ) public view virtual override returns (uint256) {
        uint256 numMintedSoFar = _tokenIdCounter.current();

        require(index < totalSupply(), "Index out of bounds");

        uint256 tokenIdsIdx;

        // Counter overflow is impossible as the loop breaks when uint256 i is equal to another uint256 numMintedSoFar.
        unchecked {
            for (uint256 i = 0; i < numMintedSoFar; i++) {
                if (_exists(i)) {
                    if (tokenIdsIdx == index) {
                        return i;
                    }
                    tokenIdsIdx++;
                }
            }
        }

        // Execution should never reach this point.
        assert(false);
        return 0;
    }

    function _mint(address to) internal {
        uint newTokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        ERC721._mint(to, newTokenId);
    }
}