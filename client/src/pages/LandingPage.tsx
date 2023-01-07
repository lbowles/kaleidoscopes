import { ConnectButton, useAddRecentTransaction } from "@rainbow-me/rainbowkit"
import { BigNumber } from "ethers"
import { formatEther } from "ethers/lib/utils.js"
import { useEffect, useState } from "react"
import useSound from "use-sound"
import {
  useAccount,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useSigner,
  useWaitForTransaction,
} from "wagmi"
import { Kaleidoscopes__factory } from "../../../backend/types"
import deployments from "../../src/deployments.json"
import etherscan from ".././img/etherscan.svg"
import github from ".././img/github.svg"
import inputShapes from ".././img/inputShapes.svg"
import loading from ".././img/loading.svg"
import maxSaturation from ".././img/maxSaturation.svg"
import noReflections from ".././img/noReflections.svg"
import opensea from ".././img/opensea.svg"
import kaleidoscopePlaceholder from ".././img/testKaleidoscope.svg"
import generalClickSound from ".././sounds/generalClickSound.mp3"
import mintClickSound from ".././sounds/mintClickSound.mp3"
import smallClickSound from ".././sounds/smallClick.mp3"
import successSound from ".././sounds/success.mp3"
import style from "./LandingPage.module.css"
import { getMerkleProof, getTree } from "../../../backend/common/merkle"
import allowlistAddresses from "../../../backend/common/snapshot.json"
import MerkleTree from "merkletreejs"
import { Countdown } from "../components/Countdown/Countdown"

const kaleidoscopesConfig = {
  address: deployments.contracts.Kaleidoscopes.address,
  abi: deployments.contracts.Kaleidoscopes.abi,
}

const rendererConfig = {
  address: deployments.contracts.Renderer.address,
  abi: deployments.contracts.Renderer.abi,
}

function getEtherscanBaseURL(chainId: string) {
  return `https://${chainId !== "1" ? "goerli." : ""}etherscan.io`
}

function getOpenSeaLink(tokenId: string | number) {
  const development = process.env.NODE_ENV === "development"
  return `https://${development ? "testnets." : ""}opensea.io/assets/${development ? "goerli/" : ""}${
    deployments.contracts.Kaleidoscopes.address
  }/${tokenId}`
}

const etherscanBaseURL = getEtherscanBaseURL(deployments.chainId)

export function LandingPage() {
  const [mintCount, setMintCount] = useState<number>(1)
  const [mintedTokens, setMintedTokens] = useState<number[]>([])

  const { data: signer } = useSigner()
  const { address } = useAccount()
  const addRecentTransaction = useAddRecentTransaction()

  const [merkleTree, setMerkleTree] = useState<MerkleTree>()
  const [merkleProof, setMerkleProof] = useState<`0x${string}`[]>()

  // TODO: add time
  const awaitListDate = new Date("2023-01-15T00:00:00Z").getTime()
  const publicDate = new Date("2023-01-15T17:00:00Z").getTime()

  const [playbackRate, setPlaybackRate] = useState(0.75)
  const [playSuccess] = useSound(successSound)
  const [playGeneralClick] = useSound(generalClickSound)
  const [playMintClick] = useSound(mintClickSound)
  const [playSmallClick] = useSound(smallClickSound, {
    playbackRate,
    interrupt: true,
  })

  const handleAmountClickUp = () => {
    setPlaybackRate(playbackRate + 0.4)
    playSmallClick()
  }
  const handleAmountClickDown = () => {
    if (mintCount > 1) setPlaybackRate(playbackRate - 0.4)
    playSmallClick()
  }

  const [randomTokenId, setRandomTokenId] = useState<number>(Math.round(Math.random() * 10000) + 1001)

  const { data: sampleSvg, isLoading: sampleSvgLoading } = useContractRead({
    ...rendererConfig,
    functionName: "render",
    // Random number
    args: [BigNumber.from(`${randomTokenId}`)],
  })

  const { data: mintPrice } = useContractRead({
    ...kaleidoscopesConfig,
    functionName: "price",
  })

  const { data: maxSupply } = useContractRead({
    ...kaleidoscopesConfig,
    functionName: "maxSupply",
  })

  const { data: hasPublicSaleStarted } = useContractRead({
    ...kaleidoscopesConfig,
    functionName: "hasPublicSaleStarted",
  })

  const { data: totalSupply } = useContractRead({
    ...kaleidoscopesConfig,
    functionName: "totalSupply",
    watch: true,
  })

  const { config: mintAllowListConfig, error: mintError } = usePrepareContractWrite({
    ...kaleidoscopesConfig,
    functionName: "mintAllowList",
    args: [BigNumber.from(`${mintCount}`), merkleProof || []],
    overrides: {
      value: mintPrice?.mul(mintCount!),
    },
    enabled: !hasPublicSaleStarted && (merkleProof?.length || 0) > 0,
  })
  const {
    write: mintAllowList,
    data: mintAllowListSignResult,
    isLoading: isMintAllowListSignLoading,
    isSuccess: isMintAllowListSignSuccess,
  } = useContractWrite(mintAllowListConfig)

  const { config: mintPublicConfig, error: mintPublicError } = usePrepareContractWrite({
    ...kaleidoscopesConfig,
    functionName: "mintPublic",
    args: [BigNumber.from(`${mintCount}`)],
    overrides: {
      value: mintPrice?.mul(mintCount!),
    },
    enabled: hasPublicSaleStarted,
  })
  const {
    write: mintPublic,
    data: mintPublicSignResult,
    isLoading: isMintPublicSignLoading,
    isSuccess: isMintPublicSignSuccess,
  } = useContractWrite(mintPublicConfig)

  const mint = hasPublicSaleStarted ? mintPublic : mintAllowList
  const mintSignResult = hasPublicSaleStarted ? mintPublicSignResult : mintAllowListSignResult
  const isMintSignLoading = hasPublicSaleStarted ? isMintPublicSignLoading : isMintAllowListSignLoading
  const isMintSignSuccess = hasPublicSaleStarted ? isMintPublicSignSuccess : isMintAllowListSignSuccess

  const { data: mintTx, isLoading: isMintTxLoading } = useWaitForTransaction({
    hash: mintSignResult?.hash,
    confirmations: 1,
  })

  // Initialization
  useEffect(() => {
    const tree = getTree(allowlistAddresses)
    console.log("allowed addresses", allowlistAddresses)
    setMerkleTree(tree)
  }, [])

  useEffect(() => {
    if (address && merkleTree) {
      setMerkleProof(undefined)
      const proof = getMerkleProof(merkleTree, address)
      if (proof.length > 0) {
        setMerkleProof(proof as `0x${string}`[])
      }
    }
  }, [address, merkleTree])

  useEffect(() => {
    if (mintSignResult) {
      addRecentTransaction({
        hash: mintSignResult.hash,
        description: "Mint Kaleidoscope",
      })
    }
  }, [mintSignResult])

  useEffect(() => {
    if (isMintSignSuccess) {
      playMintClick()
    }
  }, [isMintSignSuccess])

  useEffect(() => {
    if (mintTx) {
      playSuccess()
      const tokenIds = mintTx.logs.map((log) => {
        const events = Kaleidoscopes__factory.createInterface().decodeEventLog("Transfer", log.data, log.topics)
        return events.tokenId.toString()
      })
      setMintedTokens(tokenIds)
    }
  }, [mintTx])

  return (
    <div>
      <div className="flex justify-center w-screen max-w-screen ">
        <img src={kaleidoscopePlaceholder} className="mt-[220px] w-[300px]"></img>
      </div>
      <div className="flex justify-between p-5  absolute w-full top-12  md:top-2 ">
        <h3 className="text-base font-bold text-gray-50">Kaleidoscopes</h3>
        <ConnectButton />
      </div>

      {/* TODO : Update with actual details  remove !*/}
      <div className="flex justify-center  mt-[65px] z-1 pl-10 pr-10 z-10 relative text-gray-200">
        <p className="text-size-sm">{`${totalSupply}/${maxSupply}`} minted</p>
      </div>
      <div className="flex justify-center z-1 pl-10 pr-10 z-10 relative text-gray-200">
        <p className="text-size-xs">{hasPublicSaleStarted ? "Public sale" : "Allow list sale"}</p>
      </div>
      {mintPrice && maxSupply && totalSupply && (
        <div className="flex justify-center  mt-6 z-1 pl-10 pr-10 z-10 relative">
          {isMintSignLoading ? (
            <button className={style.claimBtn}>
              <div className="flex flex-row">
                <img src={loading} className="animate-spin w-4"></img>‎ Confirm in wallet
              </div>
            </button>
          ) : isMintTxLoading ? (
            <a
              href={`${etherscanBaseURL}/tx/${mintSignResult?.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex justify-center"
              onClick={() => {
                playGeneralClick()
              }}
            >
              <button className={style.claimBtn}>
                <div className="flex flex-row">
                  <img src={loading} className="animate-spin w-4"></img>‎ Transaction pending
                </div>
              </button>
            </a>
          ) : (
            <div>
              <button
                className="text-xl font-bold  hover:scale-125 duration-100 ease-in-out text-[#c697b4]"
                onClick={() => {
                  setMintCount(Math.max(mintCount - 1, 1))
                  handleAmountClickDown()
                }}
              >
                –
              </button>
              <button
                className={style.claimBtn}
                disabled={
                  !signer ||
                  !maxSupply ||
                  !totalSupply ||
                  !maxSupply.gt(totalSupply) ||
                  !((!hasPublicSaleStarted && merkleProof) || hasPublicSaleStarted)
                    ? true
                    : false
                }
                onClick={() => {
                  mint?.()
                  playGeneralClick()
                }}
              >
                {maxSupply.gt(totalSupply)
                  ? `Mint ${mintCount} for ${formatEther(mintPrice.mul(mintCount))} Ξ`
                  : "Sold out"}
              </button>
              <button
                className="text-xl font-bold hover:scale-125 duration-100 ease-in-out text-[#c697b4]"
                onClick={() => {
                  setMintCount(mintCount + 1)
                  handleAmountClickUp()
                }}
              >
                +
              </button>
            </div>
          )}
        </div>
      )}
      {mintTx && mintTx.status && (
        <div className="-mb-[62px] h-[50px] text-gray-100">
          <div className="flex justify-center  mt-3 z-1 pl-10 pr-10 z-10 relative  h-4">
            <div>
              <a
                href={`${etherscanBaseURL}/tx/${mintTx.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-center text-xs"
                onClick={() => {
                  playGeneralClick()
                }}
              >
                View transaction
              </a>
            </div>
          </div>
          <div className="flex justify-center  mt-2 z-1 pl-10 pr-10 z-10 relative h-4">
            <div className="text-xs">
              Minted tokens: [{" "}
              {mintedTokens.map((tokenId) => {
                return (
                  <span key={tokenId}>
                    <a
                      href={getOpenSeaLink(tokenId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        playGeneralClick()
                      }}
                    >
                      {tokenId}
                    </a>
                    &nbsp;
                  </span>
                )
              })}
              ]
            </div>
          </div>
        </div>
      )}
      {/* ADD ! */}
      {hasPublicSaleStarted && (
        <Countdown targetDateA={awaitListDate} targetDateP={publicDate} />
        // TODO: Update with actual details
        // <div className="flex justify-center  w-screen max-w-screen absolute z-100 top-0 text-center">
        //   <div className={"block bg-zinc-800 px-3 py-2 rounded-b-lg w-100 text-sm " + style.notificationCard}>
        //     Minting is live for Solar Systems owners on <a>this list</a>. Public minting available 18:00 UTC on
        //     10/10/2021.
        //   </div>
        // </div>
      )}
      <div className="flex justify-center  mt-[90px] z-1 pl-10 pr-10 z-10 relative ">
        <p className="font-medium text-gray-100 text-center text-xl w-[360px] min-w-[360px]">
          Fully on-chain, procedurally generated, animated kaleidoscopes.
        </p>
      </div>
      <div className="flex justify-center  mt-20 z-1 pl-10 pr-10 z-10 relative ">
        <div className="block bg-zinc-900 border border-zinc-800 rounded-lg  p-4">
          <div className=" grid  grid-flow-col gap-3">
            {/* TODO: Update this */}
            <a
              href="https://opensea.io/collection/onchain-kaleidoscopes"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:scale-110 duration-100 ease-in-out"
              onClick={() => {
                playGeneralClick()
              }}
            >
              <img src={opensea} alt="opensea" />
            </a>
            <a
              className="hover:scale-110 duration-100 ease-in-out"
              href={`${etherscanBaseURL}/address/${deployments.contracts.Kaleidoscopes.address}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                playGeneralClick()
              }}
            >
              <img src={etherscan} alt="etherscan" />
            </a>
            <a
              href="https://github.com/lbowles/kaleidoscopes"
              className="hover:scale-110 duration-100 ease-in-out"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                playGeneralClick()
              }}
            >
              <img src={github} alt="github" />
            </a>
            {/* <a
              href="https://twitter.com/SolarSystemsNFT"
              className="hover:scale-110 duration-100 ease-in-out"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                playGeneralClick()
              }}
            >
              <img src={twitter} alt="twitter" />
            </a> */}
          </div>
        </div>
      </div>
      {/* FAQ */}
      <div className="flex justify-center  mt-10 z-1 pl-5 pr-5 relative">
        <div className="block  bg-zinc-900 border border-zinc-800 rounded-lg w-[800px]">
          <div className="p-5">
            <p className="font-medium text-xl pb-4 text-gray-100">FAQ</p>
            <div className=" ">
              <div className="block bg-zinc-800 px-3 py-2 rounded-lg w-100 text-sm text-gray-100 ">
                <span>What are Solar Systems?</span>
              </div>
              <p className="text-sm text-zinc-500 px-3 pt-3 pb-5">
                Solar Systems is a fully on-chain NFT collection which features procedurally generated planets orbiting
                around a star. Each Solar System is unique and can be minted for the price of 0.01 ETH. The collection
                is limited to 1,000 Solar Systems.
              </p>
            </div>

            <div className="block bg-zinc-800 px-3 py-2 rounded-lg w-100 text-sm text-gray-100 ">
              <span>Features</span>
            </div>
            <div className="grid grid-cols- md:grid-cols-2">
              <div className="text-sm text-zinc-500 px-3 pt-3 col-span-1">
                Each Solar System is
                <ul className="space-y-2 mt-2  list-disc list-inside ml-3">
                  <li>
                    <a
                      target="_blank"
                      href={`${etherscanBaseURL}/address/${deployments.contracts.Renderer.address}`}
                      onClick={() => {
                        playGeneralClick()
                      }}
                    >
                      <span className=" font-bold underline">Fully on-chain</span>
                    </a>
                    . This means that your NFT will exist for as long as the Ethereum blockchain is around.
                  </li>
                  <li>
                    <span className="font-bold">Animated.</span> Planets orbit around a star which adds to a dynamic and
                    lively viewing experience.
                  </li>
                </ul>
              </div>
              <div className="text-sm text-zinc-500 px-3 pt-3 ">
                <ul className="space-y-2  md:mt-7  list-disc list-inside ml-3">
                  <li>
                    <span className=" font-bold">Procedurally generated.</span> This means that the solar systems are
                    generated using a set of rules or procedures, rather than being created manually or pre-designed.
                    This makes each solar system fully unique.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Traits */}
      <div className="flex justify-center  mt-10 z-1 pl-5 pr-5 relative">
        <div className="block  bg-zinc-900 border border-zinc-800 rounded-lg w-[800px]">
          <div className="p-5">
            <p className="font- text-xl pb-4 text-gray-100">Traits</p>
            <div className="grid  gap-4 grid-cols-1 sm:grid-cols-3  ">
              <div>
                <div className=" bg-zinc-800 px-3 py-4 rounded-lg w-100 text-sm text-gray-100 flex  items-center ">
                  <img src={noReflections} alt="Number Of Reflections" className="h-5 mr-3"></img>
                  <span>Number Of Reflections</span>
                </div>
              </div>
              <div>
                <div className=" bg-zinc-800 px-3 py-4 rounded-lg w-100 text-sm text-gray-100 flex  items-center min-h-20">
                  <img src={maxSaturation} alt="Max Saturation" className="h-5 mr-3"></img>
                  <span>Colour/Gradients</span>
                </div>
              </div>
              <div>
                <div className=" bg-zinc-800 px-3 py-4 rounded-lg w-100 text-sm text-gray-100 flex  items-center">
                  <img src={inputShapes} alt="Number Of Reflections" className="h-5 mr-3"></img>
                  <span>Input Shape Complexity</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-center  mt-24 z-1 pl-10 pr-10 z-10 relative">
        <footer className="sticky w-full py-4  bottom-0 text-center text-gray-700 text-sm">
          Made by{" "}
          <a
            href="https://twitter.com/npm_luko"
            className="font-bold text-gray-500"
            target="_blank"
            onClick={() => {
              playGeneralClick()
            }}
          >
            @npm_luko
          </a>{" "}
          and{" "}
          <a
            href="https://twitter.com/stephancill"
            className="font-bold text-gray-500"
            target="_blank"
            onClick={() => {
              playGeneralClick()
            }}
          >
            @stephancill
          </a>
        </footer>
      </div>
    </div>
  )
}
