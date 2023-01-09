const fs = require("fs")
const path = require("path")
const serve = require("./serve")
const boot = require("./boot")
const call = require("./call")
const compile = require("./compile")
const { deploy } = require("./deploy")

const SOURCE = path.join(__dirname, "..", "contracts", "Renderer.sol")

async function main() {
  const { vm, pk } = await boot()

  async function handler() {
    const { result: compileResult, targetContract } = compile(SOURCE)
    const { abi, bytecode } = targetContract
    const address = await deploy(vm, pk, bytecode, compileResult)
    // const tokenId = Math.floor(Math.random() * 10_000)
    const tokenId = 3125

    // struct Kaleidoscope {
    //   uint256 tokenId;
    //   uint256 repetitions; // n
    //   uint256 numInsideArtifacts; // numCircles
    //   uint256 numOutsideArtifacts;
    //   uint256 centerX;
    //   uint256 centerY;
    //   bool hasGradient;
    //   bool hasSecondaryColor;
    // }
    const kaleidoscopeNames = [
      "tokenId",
      "repetitions",
      "numInsideArtifacts",
      "numOutsideArtifacts",
      "centerX",
      "centerY",
      "hasGradient",
      "hasSecondaryColor",
    ]
    const kaleidoscopeTypes = ["uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "bool", "bool"]
    const kaleidoscope = await call(vm, address, abi, "metadata", [tokenId], kaleidoscopeTypes)
    console.log(kaleidoscope.map((x, i) => `${kaleidoscopeNames[i]}: ${x.toString()}`))

    const [result] = await call(vm, address, abi, "render", [tokenId])

    return result
  }

  const { notify } = await serve(handler)

  fs.watch(path.dirname(SOURCE), notify)
  console.log("Watching", path.dirname(SOURCE))
  console.log("Serving  http://localhost:9901/")
}

main()
