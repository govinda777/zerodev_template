// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol"; // Changed from ERC721Burnable as Pausable was intended
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFTRewards is ERC721, ERC721URIStorage, ERC721Pausable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    // Mapping from token ID to rarity (example: 0 = Common, 1 = Rare, 2 = Epic)
    // Making this public to allow easy querying of rarity.
    mapping(uint256 => uint8) public tokenRarity;

    // Base URI for off-chain metadata, if not set per token
    string private _baseTokenURIInternal;

    // Allowed minter contracts/addresses (e.g., shop or staking pool)
    mapping(address => bool) public allowedMinters;

    event NFTMinted(address indexed recipient, uint256 indexed tokenId, string tokenURI, uint8 rarity);
    event BaseURIUpdated(string newBaseURI);
    event RaritySet(uint256 indexed tokenId, uint8 rarity);
    event MinterStatusChanged(address indexed minter, bool isAllowed);

    modifier onlyAllowedMinter() {
        require(allowedMinters[msg.sender] || msg.sender == owner(), "Caller is not an allowed minter or owner");
        _;
    }

    constructor(
        string memory name,     // e.g., "ZeroDev Reward NFT"
        string memory symbol    // e.g., "ZDRN"
    ) ERC721(name, symbol) Ownable(msg.sender) {
        // Initialize counter if starting from 1 (Counters default to 0)
        // _tokenIdCounter.increment(); // If you want token IDs to start from 1 and use current()
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURIInternal;
    }

    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURIInternal = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    function setMinterStatus(address minterAddress, bool isAllowed) external onlyOwner {
        require(minterAddress != address(0), "Minter address cannot be zero");
        allowedMinters[minterAddress] = isAllowed;
        emit MinterStatusChanged(minterAddress, isAllowed);
    }

    // Mints an NFT to a recipient with a specific token URI and rarity
    // Can be called by owner or an allowed minter contract
    function safeMint(
        address to,
        string memory uri,
        uint8 rarity // Example: 0 for Common, 1 for Rare, etc.
    ) external onlyAllowedMinter {
        _tokenIdCounter.increment(); // Increments first, so first token ID is 1
        uint256 newTokenId = _tokenIdCounter.current();
        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, uri); // Set specific URI for this token
        tokenRarity[newTokenId] = rarity;
        emit NFTMinted(to, newTokenId, uri, rarity);
    }

    // Allows owner or allowed minter to set/update rarity if needed after minting
    function setTokenRarity(uint256 tokenId, uint8 rarity) external onlyAllowedMinter {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        tokenRarity[tokenId] = rarity;
        emit RaritySet(tokenId, rarity);
    }

    // Override _update, _increaseBalance for Pausable compatibility
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Pausable) // Specify both contracts being overridden
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 amount)
        internal
        override(ERC721, ERC721Pausable) // Specify both contracts being overridden
    {
        super._increaseBalance(account, amount);
    }

    // Override tokenURI to use ERC721URIStorage's version
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage) // Specify both
        returns (string memory)
    {
        require(_exists(tokenId), "ERC721URIStorage: URI query for nonexistent token");
        return super.tokenURI(tokenId);
    }

    // Override supportsInterface for ERC721URIStorage
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage) // Specify both
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Override _burn to ensure compatibility with ERC721URIStorage
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    // Function for users to burn their own tokens
    function burn(uint256 tokenId) external {
        // require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721Burnable: caller is not owner nor approved");
        // _isApprovedOrOwner is internal, so we check ownership directly or via approval
        require(ownerOf(tokenId) == msg.sender || getApproved(tokenId) == msg.sender || isApprovedForAll(ownerOf(tokenId), msg.sender), "Caller is not owner nor approved");
        _burn(tokenId);
    }
}
