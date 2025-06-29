// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFTRewards is ERC721, ERC721URIStorage, Ownable, Pausable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    // Mapping from token ID to rarity score or type
    mapping(uint256 => string) public tokenRarity;
    // Example: "Common", "Rare", "Epic"

    // Event for when a new NFT is minted with rarity
    event NFTMintedWithRarity(
        address indexed recipient,
        uint256 indexed tokenId,
        string tokenURI,
        string rarity
    );

    // Event for when rarity of an NFT is updated
    event NFTRarityUpdated(uint256 indexed tokenId, string newRarity);

    constructor(
        string memory name, // e.g., "ZeroDev Achievement NFT"
        string memory symbol // e.g., "ZAN"
    ) ERC721(name, symbol) Ownable(msg.sender) {}

    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://"; // Placeholder, should be configured or updatable by owner
        // Or return an empty string if token URIs are absolute.
    }

    function safeMint(address to, string memory uri, string memory rarity)
        public
        onlyOwner // Or some other authorized role, e.g., a game contract
        whenNotPaused
    {
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        tokenRarity[tokenId] = rarity;
        emit NFTMintedWithRarity(to, tokenId, uri, rarity);
    }

    // Function to update the rarity of an existing NFT (e.g., if it evolves)
    function setTokenRarity(uint256 tokenId, string memory newRarity) public onlyOwner whenNotPaused {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        tokenRarity[tokenId] = newRarity;
        emit NFTRarityUpdated(tokenId, newRarity);
    }

    // Function to update the token URI of an existing NFT
    function setTokenURI(uint256 tokenId, string memory newURI) public onlyOwner whenNotPaused {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        _setTokenURI(tokenId, newURI);
        // Note: ERC721URIStorage emits _URIUpdate event automatically
    }

    // Required overrides for ERC721URIStorage
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) whenNotPaused {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function pauseContract() external onlyOwner {
        _pause();
    }

    function unpauseContract() external onlyOwner {
        _unpause();
    }

    // Utility to get current token ID (e.g., for UI or scripts to know next ID)
    function getCurrentTokenId() external view returns (uint256) {
        return _tokenIdCounter.current();
    }
}
