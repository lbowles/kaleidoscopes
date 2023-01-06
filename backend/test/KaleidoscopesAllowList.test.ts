import { deployments, ethers } from "hardhat"
import { expect } from "chai"
import { Kaleidoscopes, Kaleidoscopes__factory } from "../types"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { BigNumber } from "ethers"
import MerkleTree from "merkletreejs"
import { getMerkleProof, getMerkleRoot } from "../common/merkle"

const setupTest = deployments.createFixture(async ({ deployments, getNamedAccounts, ethers, tasks }, options) => {
  await deployments.fixture() // ensure you start from a fresh deployments
  const { deployer } = await getNamedAccounts()

  const utilities = await deployments.get("utils")
  const trigonometry = await deployments.get("Trigonometry")
  const renderer = await deployments.get("Renderer")

  const { tree } = options as { tree: MerkleTree }
  const root = getMerkleRoot(tree)

  const deployResult = await deployments.deploy("Kaleidoscopes", {
    from: deployer,
    libraries: {
      utils: utilities.address,
      Trigonometry: trigonometry.address,
    },
    args: ["Test", "TEST", ethers.utils.parseEther("0.01"), 1000, `0x${root}`, renderer.address],
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  })

  const kaleidoscopes = Kaleidoscopes__factory.connect(deployResult.address, ethers.provider)

  return kaleidoscopes
})

describe("KaleidoscopesAllowList", function () {
  let signers: SignerWithAddress[]
  let kaleidoscopes: Kaleidoscopes
  let mintPrice: BigNumber
  let allowListSigners: SignerWithAddress[]
  let tree: MerkleTree

  beforeEach(async function () {
    // await deployments.fixture(["Kaleidoscopes"])
    signers = await ethers.getSigners()
    allowListSigners = signers.slice(10, 20)
    const allowListAddresses = allowListSigners.map((signer) => signer.address)
    tree = new MerkleTree(allowListAddresses.map(ethers.utils.keccak256), ethers.utils.keccak256, {
      sortPairs: true,
    })
    kaleidoscopes = (await setupTest({ tree })).connect(signers[0])
    mintPrice = await kaleidoscopes.price()
  })

  it("Should have merkleRoot set in the constructor", async function () {
    expect(await kaleidoscopes.merkleRoot()).to.equal(`0x${getMerkleRoot(tree)}`)
  })

  it("Should allow minting for addresses in the allowlist", async function () {
    for (const signer of allowListSigners) {
      const merkleProof = getMerkleProof(tree, signer.address)
      await expect(kaleidoscopes.connect(signer).mintAllowList(1, merkleProof, { value: mintPrice })).to.emit(
        kaleidoscopes,
        "Transfer",
      )
    }
  })

  it("Should not allow minting for addresses with invalid proof", async function () {
    const merkleProof = getMerkleProof(tree, signers[0].address)
    await expect(
      kaleidoscopes.connect(signers[0]).mintAllowList(1, merkleProof, { value: mintPrice }),
    ).to.be.revertedWith("You are not on the allowlist")
  })

  it("Should not allow public minting before public sale has started", async function () {
    await expect(kaleidoscopes.connect(signers[0]).mintPublic(1, { value: mintPrice })).to.be.revertedWith(
      "Public sale has not started yet",
    )
  })

  it("Should allow minting for addresses not in the allowlist after publis sale has started", async function () {
    await kaleidoscopes.openPublicSale()
    await expect(kaleidoscopes.connect(signers[0]).mintPublic(1, { value: mintPrice })).to.emit(
      kaleidoscopes,
      "Transfer",
    )
  })
})
