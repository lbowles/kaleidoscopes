import { deployments, ethers } from "hardhat"
import { expect } from "chai"
import { Kaleidoscopes, Kaleidoscopes__factory } from "../types"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { BigNumber } from "ethers"
import MerkleTree from "merkletreejs"
import { getMerkleRoot } from "../common/merkle"

describe("Kaleidoscopes", function () {
  let signers: SignerWithAddress[]
  let kaleidoscopes: Kaleidoscopes
  let mintPrice: BigNumber

  beforeEach(async function () {
    await deployments.fixture(["Kaleidoscopes"])
    signers = await ethers.getSigners()
    const Kaleidoscopes = await deployments.get("Kaleidoscopes")
    kaleidoscopes = Kaleidoscopes__factory.connect(Kaleidoscopes.address, signers[0]) as Kaleidoscopes
    mintPrice = await kaleidoscopes.price()
    await kaleidoscopes.openPublicSale()
  })

  it("Should have the correct price set in the constructor", async function () {
    expect(await kaleidoscopes.price()).to.equal(ethers.utils.parseEther("0.01"))
  })

  it("Should mint a new NFT and assign it to the caller", async function () {
    const initialSupply = await kaleidoscopes.totalSupply()
    await kaleidoscopes.connect(signers[0]).mintPublic(1, { value: mintPrice })
    const finalSupply = await kaleidoscopes.totalSupply()
    expect(finalSupply).to.equal(initialSupply.add(1))
    expect(await kaleidoscopes.ownerOf(finalSupply)).to.equal(signers[0].address)
  })

  it("Should not allow minting more NFTs than the max supply", async function () {
    await expect(kaleidoscopes.mintPublic(100001, { value: mintPrice.mul("100001") })).to.be.revertedWith(
      "Exceeds max supply",
    )
  })

  it("Should return the correct token URI for a given token ID", async function () {
    // Mint a new token
    await kaleidoscopes.mintPublic(1, { value: mintPrice })

    const tokenId = 1
    const name = "Kaleidoscope #" + tokenId
    const description = "Fully on-chain, procedurally generated, animated kaleidoscopes."
    const svg = await kaleidoscopes.tokenURI(tokenId)

    // Decode base64 encoded json
    const decoded = Buffer.from(svg.split(",")[1], "base64").toString()
    console.log(decoded)
    const json = JSON.parse(decoded)

    expect(json.name).to.equal(name)
    expect(json.description).to.equal(description)
    expect(json.image).to.contain("data:image/svg+xml;base64")

    expect(json.attributes.length).to.be.greaterThanOrEqual(5)

    const attributes = ["Mirrors", "Outside Artifacts", "Inside Artifacts", "Primary Color", "Gradient"]

    attributes.forEach((targetAttribute) => {
      const trait = json.attributes.find((trait: any) => trait.trait_type === targetAttribute)
      expect(trait).to.not.be.undefined
    })
  })

  it("Should allow the owner to withdraw their balance", async function () {
    const [owner, minter] = signers
    const initialBalance = await owner.getBalance()
    await kaleidoscopes.connect(minter).mintPublic(1, { value: mintPrice })
    await kaleidoscopes.connect(owner).withdraw()
    const finalBalance = await owner.getBalance()
    expect(finalBalance).to.be.gt(initialBalance)
  })

  it("Should not allow a non-owner to withdraw the contract's balance", async function () {
    await expect(kaleidoscopes.connect(signers[1]).withdraw()).to.be.revertedWith("Ownable: caller is not the owner")
  })

  it("Should allow the owner to airdrop to an array of recipients", async function () {
    const [owner, recipient1, recipient2] = signers
    const initialSupply = await kaleidoscopes.totalSupply()
    const recipients = [recipient1.address, recipient2.address]
    const quantity = 10
    await kaleidoscopes.connect(owner).airdrop(recipients, quantity)
    const finalSupply = await kaleidoscopes.totalSupply()
    expect(finalSupply).to.equal(initialSupply.add(recipients.length * quantity))

    // Check if recipient's balance has increased
    expect(await kaleidoscopes.balanceOf(recipient1.address)).to.equal(quantity)
    expect(await kaleidoscopes.balanceOf(recipient2.address)).to.equal(quantity)
  })

  it("Should not allow a non-owner to airdrop to an array of recipients", async function () {
    const recipients = [signers[1].address]
    const quantity = 10
    await expect(kaleidoscopes.connect(signers[1]).airdrop(recipients, quantity)).to.be.revertedWith(
      "Ownable: caller is not the owner",
    )
  })

  it("Should set the price correctly", async function () {
    // Get current price
    const currentPrice = await kaleidoscopes.price()

    // Set new price
    const newPrice = currentPrice.mul(2)
    await kaleidoscopes.setPrice(newPrice)

    // Check if price has been updated
    expect(await kaleidoscopes.price()).to.equal(newPrice)

    // Try to mint with old price
    await expect(kaleidoscopes.mintPublic(1, { value: currentPrice })).to.be.revertedWith("Insufficient fee")

    // Mint with new price
    await kaleidoscopes.mintPublic(1, { value: newPrice })

    // Check if supply has increased
    expect(await kaleidoscopes.totalSupply()).to.equal(1)
  })
})
