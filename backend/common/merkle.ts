import { MerkleTree } from "merkletreejs"
import { utils } from "ethers"

export function getMerkleRoot(tree: MerkleTree) {
  return tree.getRoot().toString("hex")
}

export function getMerkleProof(tree: MerkleTree, address: string) {
  const hashedAddress = utils.keccak256(address)
  return tree.getHexProof(hashedAddress)
}
