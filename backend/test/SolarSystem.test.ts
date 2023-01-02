import { deployments, ethers } from "hardhat"
import { expect } from "chai"
import { SolarSystems, SolarSystems__factory } from "../types"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { BigNumber } from "ethers"

describe("SolarSystems", function () {
  let signers: SignerWithAddress[]
  let solarSystems: SolarSystems
  let mintPrice: BigNumber

  beforeEach(async function () {
    await deployments.fixture(["SolarSystems"])
    signers = await ethers.getSigners()
    const SolarSystems = await deployments.get("SolarSystems")
    solarSystems = SolarSystems__factory.connect(SolarSystems.address, signers[0]) as SolarSystems
    mintPrice = await solarSystems.price()
  })

  it("Should have the correct price set in the constructor", async function () {
    expect(await solarSystems.price()).to.equal(ethers.utils.parseEther("0.01"))
  })

  it("Should mint a new NFT and assign it to the caller", async function () {
    const initialSupply = await solarSystems.totalSupply()
    await solarSystems.connect(signers[0]).mint(1, { value: mintPrice })
    const finalSupply = await solarSystems.totalSupply()
    expect(finalSupply).to.equal(initialSupply.add(1))
    expect(await solarSystems.ownerOf(finalSupply)).to.equal(signers[0].address)
  })

  it("Should not allow minting more NFTs than the max supply", async function () {
    await expect(solarSystems.mint(100001, { value: mintPrice.mul("100001") })).to.be.revertedWith("Exceeds max supply")
  })

  it("Should return the correct token URI for a given token ID", async function () {
    // Mint a new token
    await solarSystems.mint(1, { value: mintPrice })

    const tokenId = 1
    const name = "Solar System #" + tokenId
    const description = "Fully on-chain, procedurally generated, animated solar systems."
    const svg = await solarSystems.tokenURI(tokenId)

    // Decode base64 encoded json
    const decoded = Buffer.from(svg.split(",")[1], "base64").toString()
    const json = JSON.parse(decoded)

    expect(json.name).to.equal(name)
    expect(json.description).to.equal(description)
    expect(json.image).to.contain("data:image/svg+xml;base64")

    expect(json.attributes).to.have.lengthOf(3)

    expect(json.attributes[0]["trait_type"]).to.equal("Planets")
    expect(parseInt(json.attributes[0]["value"])).to.be.greaterThan(0)
    expect(json.attributes[1]["trait_type"]).to.equal("Ringed Planets")
    expect(parseInt(json.attributes[1]["value"])).to.be.greaterThanOrEqual(0)
    expect(json.attributes[2]["trait_type"]).to.equal("Star Type")
    expect(json.attributes[2]["value"]).to.be.a.string
  })

  it("Should allow the owner to withdraw their balance", async function () {
    const [owner, minter] = signers
    const initialBalance = await owner.getBalance()
    await solarSystems.connect(minter).mint(1, { value: mintPrice })
    await solarSystems.connect(owner).withdraw()
    const finalBalance = await owner.getBalance()
    expect(finalBalance).to.be.gt(initialBalance)
  })

  it("Should not allow a non-owner to withdraw the contract's balance", async function () {
    await expect(solarSystems.connect(signers[1]).withdraw()).to.be.revertedWith("Ownable: caller is not the owner")
  })

  it("Should allow the owner to airdrop to an array of recipients", async function () {
    const [owner, recipient1, recipient2] = signers
    const initialSupply = await solarSystems.totalSupply()
    const recipients = [recipient1.address, recipient2.address]
    const quantity = 10
    await solarSystems.connect(owner).airdrop(recipients, quantity)
    const finalSupply = await solarSystems.totalSupply()
    expect(finalSupply).to.equal(initialSupply.add(recipients.length * quantity))

    // Check if recipient's balance has increased
    expect(await solarSystems.balanceOf(recipient1.address)).to.equal(quantity)
    expect(await solarSystems.balanceOf(recipient2.address)).to.equal(quantity)
  })

  it("Should not allow a non-owner to airdrop to an array of recipients", async function () {
    const recipients = [signers[1].address]
    const quantity = 10
    await expect(solarSystems.connect(signers[1]).airdrop(recipients, quantity)).to.be.revertedWith(
      "Ownable: caller is not the owner",
    )
  })

  it("Should set the price correctly", async function () {
    // Get current price
    const currentPrice = await solarSystems.price()

    // Set new price
    const newPrice = currentPrice.mul(2)
    await solarSystems.setPrice(newPrice)

    // Check if price has been updated
    expect(await solarSystems.price()).to.equal(newPrice)

    // Try to mint with old price
    await expect(solarSystems.mint(1, { value: currentPrice })).to.be.revertedWith("Insufficient fee")

    // Mint with new price
    await solarSystems.mint(1, { value: newPrice })

    // Check if supply has increased
    expect(await solarSystems.totalSupply()).to.equal(1)
  })
})
