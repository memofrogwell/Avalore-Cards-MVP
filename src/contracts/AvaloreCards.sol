// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract AvaloreCards is ERC1155, Ownable {
    // Token IDs
    uint256 public constant COMMON_WINK = 0;
    uint256 public constant COMMON_SKULLY = 1;
    uint256 public constant RARE_GREG = 2;
    uint256 public constant RARE_GREEN_RABBIT = 3;

    constructor() ERC1155("https://api.avalorecards.com/metadata/{id}.json") Ownable(msg.sender) {}

    /**
     * @dev Mint a pack of 4 cards.
     * Logic: 3 cards are randomized (90% Common, 10% Rare).
     *        1 card is Guaranteed Rare.
     */
    function mintPack() external {
        uint256[] memory ids = new uint256[](4);
        uint256[] memory amounts = new uint256[](4);

        // First 3 cards: Pseudo-random (Common vs Rare)
        for (uint256 i = 0; i < 3; i++) {
            // Pseudo-randomness using block.timestamp and msg.sender
            // NOTE: Not secure for mainnet, but acceptable for testnet MVP as requested.
            uint256 rand = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, i))) % 100;

            if (rand < 10) {
                // 10% Chance: Rare
                ids[i] = _getRandomRare(i);
            } else {
                // 90% Chance: Common
                ids[i] = _getRandomCommon(i);
            }
            amounts[i] = 1;
        }

        // 4th Card: Guaranteed Rare
        ids[3] = _getRandomRare(3);
        amounts[3] = 1;

        _mintBatch(msg.sender, ids, amounts, "");
    }

    function _getRandomCommon(uint256 salt) internal view returns (uint256) {
        uint256 rand = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, salt, "COMMON"))) % 2;
        return rand == 0 ? COMMON_WINK : COMMON_SKULLY;
    }

    function _getRandomRare(uint256 salt) internal view returns (uint256) {
        uint256 rand = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, salt, "RARE"))) % 2;
        return rand == 0 ? RARE_GREG : RARE_GREEN_RABBIT;
    }

    // Admin function to set URI
    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }
}
