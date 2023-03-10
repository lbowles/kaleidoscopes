// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import "erc721a/contracts/ERC721A.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./Utilities.sol";
import "./Renderer.sol";
import "svgnft/contracts/Base64.sol";

contract Kaleidoscopes is ERC721A, Ownable {
  uint256 public price;
  uint256 public maxSupply;
  uint256 public constant maxMintPerWallet = 20;

  Renderer public renderer;

  bytes32 public merkleRoot;

  uint256 public allowListMintStartBlock;
  uint256 public publicMintOffsetBlocks; // 3 hours

  /**
   * @dev Constructs a new instance of the contract.
   * @param _name Name of the ERC721 token.
   * @param _symbol Symbol of the ERC721 token.
   * @param _price Price of each token in wei.
   * @param _maxSupply Maximum supply of tokens.
   */
  constructor(
    string memory _name,
    string memory _symbol,
    uint256 _price,
    uint256 _maxSupply,
    bytes32 _merkleRoot,
    uint256 _allowListMintStartBlock,
    uint256 _publicMintOffsetBlocks,
    address _renderer
  ) ERC721A(_name, _symbol) {
    price = _price;
    maxSupply = _maxSupply;
    merkleRoot = _merkleRoot;
    allowListMintStartBlock = _allowListMintStartBlock;
    publicMintOffsetBlocks = _publicMintOffsetBlocks;
    renderer = Renderer(_renderer);
  }

  /**
   * @notice Checks if public sale has started.
   */
  function hasPublicSaleStarted() public view returns (bool) {
    return block.number >= allowListMintStartBlock + publicMintOffsetBlocks;
  }

  /**
   * @notice Checks if allow list sale has started.
   */
  function hasAllowlistSaleStarted() public view returns (bool) {
    return block.number >= allowListMintStartBlock;
  }

  /**
   * @notice Sets the block at which the allowlist mint starts.
   * @param _allowListMintStartBlock Block at which the allowlist mint starts.
   */
  function setAllowListMintStartBlock(uint256 _allowListMintStartBlock) external onlyOwner {
    allowListMintStartBlock = _allowListMintStartBlock;
  }

  /**
   * @notice Sets the number of blocks after which the public sale starts.
   * @param _publicMintOffsetBlocks Number of blocks.
   */
  function setPublicMintOffsetBlocks(uint256 _publicMintOffsetBlocks) external onlyOwner {
    publicMintOffsetBlocks = _publicMintOffsetBlocks;
  }

  /**
   * @notice Sets the price of each token in wei.
   * @param _price Price of each token in wei.
   */
  function setPrice(uint256 _price) external onlyOwner {
    price = _price;
  }

  /**
   * @notice Returns the token URI for a given token ID.
   * @param _tokenId ID of the token to get the URI for.
   * @return Token URI.
   */
  function tokenURI(uint256 _tokenId) public view virtual override returns (string memory) {
    if (!_exists(_tokenId)) revert URIQueryForNonexistentToken();

    string memory name = string(abi.encodePacked("Kaleidoscope #", utils.uint2str(_tokenId)));
    string memory description = "Fully on-chain, procedurally generated, animated kaleidoscopes.";
    Renderer.Kaleidoscope memory kaleidoscope = renderer.kaleidoscopeForTokenId(_tokenId);
    kaleidoscope.hasHalo = _tokenId <= 50;

    Renderer.ColorPalette memory palette = renderer.colorPaletteForKaleidescope(kaleidoscope);
    string memory svg = renderer.getKaleidoscopeSVG(kaleidoscope, palette);

    string memory attributes = string.concat(
      '"attributes": [',
      '{"trait_type": "Mirrors", "value": ',
      utils.uint2str(kaleidoscope.repetitions),
      "},",
      '{"trait_type": "Outside Artifacts", "value": ',
      utils.uint2str(kaleidoscope.numOutsideArtifacts),
      "},",
      '{"trait_type": "Inside Artifacts", "value": ',
      utils.uint2str(kaleidoscope.numInsideArtifacts),
      "},",
      '{"trait_type": "Gradient", "value": "',
      kaleidoscope.hasGradient ? "Yes" : "No",
      '"},',
      '{"trait_type": "Primary Color", "value": "',
      utils.getHueName(palette.primaryHue),
      '"}'
    );

    if (kaleidoscope.hasSecondaryColor) {
      attributes = string.concat(
        attributes,
        ',{"trait_type": "Secondary Color", "value": "',
        utils.getHueName(palette.secondaryHue),
        '"}'
      );
    }

    if (kaleidoscope.hasHalo) {
      attributes = string.concat(attributes, ',{"trait_type": "Halo", "value": "Yes"}');
    }

    attributes = string.concat(attributes, "]");

    string memory json = string(
      abi.encodePacked(
        '{"name":"',
        name,
        '","description":"',
        description,
        '",',
        attributes,
        ', "image": "data:image/svg+xml;base64,',
        Base64.encode(bytes(svg)),
        '"}'
      )
    );
    return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
  }

  /**
   * @notice Mints new tokens for the caller.
   * @param _quantity Quantity of tokens to mint.
   */
  function mint(uint256 _quantity) internal {
    require(msg.value >= price * _quantity, "Insufficient fee");
    require(totalSupply() + _quantity <= maxSupply, "Exceeds max supply");
    require(_numberMinted(msg.sender) + _quantity <= 20, "Exceeds max quantity");
    _mint(msg.sender, _quantity);

    // Refund any extra ETH sent
    if (msg.value > price * _quantity) {
      (bool status, ) = payable(msg.sender).call{value: msg.value - price * _quantity}("");
      require(status, "Refund failed");
    }
  }

  /**
   * @notice  Airdrops tokens to a list of recipients. Only callable by the contract owner.
   * @param _recipients List of recipients to receive the airdrop.
   * @param _quantity Quantity of tokens to airdrop to each recipient.
   */
  function airdrop(address[] memory _recipients, uint256 _quantity) external payable onlyOwner {
    require(totalSupply() + _quantity * _recipients.length <= maxSupply, "Exceeds max supply");
    for (uint256 i = 0; i < _recipients.length; i++) {
      _mint(_recipients[i], _quantity);
    }
  }

  /**
   * @notice Withdraws the contract's balance. Only callable by the contract owner.
   */
  function withdraw() external onlyOwner {
    require(payable(msg.sender).send(address(this).balance));
  }

  /**
   * @notice Checks if a wallet is on the allowlist given a Merkle proof.
   * @param _wallet Wallet to check.
   * @param _proof Merkle proof.
   */
  function allowListed(address _wallet, bytes32[] calldata _proof) public view returns (bool) {
    return MerkleProof.verify(_proof, merkleRoot, keccak256(abi.encodePacked(_wallet)));
  }

  /**
   * @notice Mints tokens for the caller if they are on the allowlist.
   * @param _quantity Quantity of tokens to mint.
   * @param _proof Merkle proof.
   */
  function mintAllowList(uint256 _quantity, bytes32[] calldata _proof) external payable {
    require(allowListed(msg.sender, _proof), "You are not on the allowlist");
    require(hasAllowlistSaleStarted(), "Allowlist sale has not started yet");
    mint(_quantity);
  }

  /**
   * @notice Mints tokens for the caller if public sale has started.
   * @param _quantity Quantity of tokens to mint.
   */
  function mintPublic(uint256 _quantity) external payable {
    require(hasPublicSaleStarted(), "Public sale has not started yet");
    mint(_quantity);
  }

  function mintQuotaRemaining(address _wallet) external view returns (uint256) {
    return maxMintPerWallet - _numberMinted(_wallet);
  }

  function _startTokenId() internal view virtual override returns (uint256) {
    return 1;
  }
}
