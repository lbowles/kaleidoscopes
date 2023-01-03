import { SolarSystems, SolarSystems__factory } from "../../../backend/types";
import style from "./LandingPage.module.css";
import deployments from "../../src/deployments.json";
import loading from ".././img/loading.svg";
import opensea from ".././img/opensea.svg";
import github from ".././img/github.svg";
import twitter from ".././img/twitter.svg";
import etherscan from ".././img/etherscan.svg";
import noReflections from ".././img/noReflections.svg";
import kaleidoscopePlaceholder from ".././img/placeholder.png";
import maxSaturation from ".././img/maxSaturation.svg";
import inputShapes from ".././img/inputShapes.svg";
import { ConnectButton, useAddRecentTransaction } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import { prepareWriteContract, writeContract } from "@wagmi/core";
import {
  useAccount,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useSigner,
  useWaitForTransaction,
} from "wagmi";
import { BigNumber } from "ethers";
import { formatEther } from "ethers/lib/utils.js";
import useSound from "use-sound";
import successSound from ".././sounds/success.mp3";
import smallClickSound from ".././sounds/smallClick.mp3";
import mintClickSound from ".././sounds/mintClickSound.mp3";
import generalClickSound from ".././sounds/generalClickSound.mp3";

const solarSystemsConfig = {
  address: deployments.contracts.SolarSystems.address,
  abi: deployments.contracts.SolarSystems.abi,
};

const rendererConfig = {
  address: deployments.contracts.Renderer.address,
  abi: deployments.contracts.Renderer.abi,
};

function getEtherscanBaseURL(chainId: string) {
  return `https://${chainId !== "1" ? "goerli." : ""}etherscan.io`;
}

function getOpenSeaLink(tokenId: string | number) {
  const development = process.env.NODE_ENV === "development";
  return `https://${development ? "testnets." : ""}opensea.io/assets/${
    development ? "goerli/" : ""
  }${deployments.contracts.SolarSystems.address}/${tokenId}`;
}

const etherscanBaseURL = getEtherscanBaseURL(deployments.chainId);

export function LandingPage() {
  const [mintCount, setMintCount] = useState<number>(1);

  const [mintedTokens, setMintedTokens] = useState<number[]>([]);

  const { data: signer, isError, isLoading } = useSigner();

  const addRecentTransaction = useAddRecentTransaction();

  const [playbackRate, setPlaybackRate] = useState(0.75);

  const [playSuccess] = useSound(successSound);

  const [playGeneralClick] = useSound(generalClickSound);

  // const [playSmallClickUp] = useSound()

  const [playSmallClick] = useSound(smallClickSound, {
    playbackRate,
    interrupt: true,
  });

  const [playMintClick] = useSound(mintClickSound);

  const handleAmountClickUp = () => {
    setPlaybackRate(playbackRate + 0.4);
    playSmallClick();
  };
  const handleAmountClickDown = () => {
    if (mintCount > 1) setPlaybackRate(playbackRate - 0.4);
    playSmallClick();
  };

  const [randomTokenId, setRandomTokenId] = useState<number>(
    Math.round(Math.random() * 10000) + 1001
  );

  const { data: sampleSvg, isLoading: sampleSvgLoading } = useContractRead({
    ...rendererConfig,
    functionName: "render",
    // Random number
    args: [BigNumber.from(`${randomTokenId}`)],
  });

  const {
    data: mintPrice,
    isError: isMintPriceError,
    isLoading: isMintPriceLoading,
  } = useContractRead({
    ...solarSystemsConfig,
    functionName: "price",
  });

  const {
    data: maxSupply,
    isError: isMaxSupplyError,
    isLoading: isMaxSupplyLoading,
  } = useContractRead({
    ...solarSystemsConfig,
    functionName: "maxSupply",
  });

  const {
    data: totalSupply,
    isError: isTotalSupplyError,
    isLoading: isTotalSupplyLoading,
  } = useContractRead({
    ...solarSystemsConfig,
    functionName: "totalSupply",
    watch: true,
  });

  const { config: mintConfig, error: mintError } = usePrepareContractWrite({
    ...solarSystemsConfig,
    functionName: "mint",
    args: [BigNumber.from(`${mintCount}`)],
    overrides: {
      value: mintPrice?.mul(mintCount!),
    },
  });
  const {
    write: mint,
    data: mintSignResult,
    isLoading: isMintSignLoading,
    isSuccess: isMintSignSuccess,
  } = useContractWrite(mintConfig);

  const {
    data: mintTx,
    isError: isMintTxError,
    isLoading: isMintTxLoading,
  } = useWaitForTransaction({
    hash: mintSignResult?.hash,
    confirmations: 1,
  });

  useEffect(() => {
    if (mintSignResult) {
      // console.log("mintSign", mintSignResult.hash)
      addRecentTransaction({
        hash: mintSignResult.hash,
        description: "Mint Solar System",
      });
    }
  }, [mintSignResult]);

  useEffect(() => {
    // console.log("isMintSignSuccess", isMintSignSuccess)
    if (isMintSignSuccess) {
      playMintClick();
    }
  }, [isMintSignSuccess]);

  useEffect(() => {
    // console.log("mintTx", mintTx)
    if (mintTx) {
      playSuccess();
      const tokenIds = mintTx.logs.map((log) => {
        const events = SolarSystems__factory.createInterface().decodeEventLog(
          "Transfer",
          log.data,
          log.topics
        );
        return events.tokenId.toString();
      });
      setMintedTokens(tokenIds);
    }
  }, [mintTx]);

  return (
    <div>
      <div className="flex justify-center alignw-screen w-screen max-w-screen overflow-hidden">
        <img
          src={kaleidoscopePlaceholder}
          className="mt-[255px] w-[230px]"
        ></img>
      </div>
      <div className="flex justify-between p-10  absolute w-full top-0">
        <h3 className="text-base font-bold text-gray-50">Kaleidoscope</h3>
        <ConnectButton />
      </div>
      <div className="flex justify-center alignw-screen mt-24 z-1 pl-10 pr-10 z-10 relative text-gray-200">
        <p className="text-size-xs">{`${totalSupply}/${maxSupply}`} minted</p>
      </div>
      {mintPrice && maxSupply && totalSupply && (
        <div className="flex justify-center alignw-screen mt-6 z-1 pl-10 pr-10 z-10 relative">
          {isMintSignLoading ? (
            <button className={style.claimBtn}>
              <div className="flex flex-row">
                <img src={loading} className="animate-spin w-4"></img>‎ Confirm
                in wallet
              </div>
            </button>
          ) : isMintTxLoading ? (
            <a
              href={`${etherscanBaseURL}/tx/${mintSignResult?.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex justify-center"
              onClick={() => {
                playGeneralClick();
              }}
            >
              <button className={style.claimBtn}>
                <div className="flex flex-row">
                  <img src={loading} className="animate-spin w-4"></img>‎
                  Transaction pending
                </div>
              </button>
            </a>
          ) : (
            <div>
              <button
                className="text-xl font-bold  hover:scale-125 duration-100 ease-in-out text-[#c697b4]"
                onClick={() => {
                  setMintCount(Math.max(mintCount - 1, 1));
                  handleAmountClickDown();
                }}
              >
                –
              </button>
              <button
                className={style.claimBtn}
                disabled={
                  signer &&
                  maxSupply &&
                  totalSupply &&
                  maxSupply.gt(totalSupply)
                    ? false
                    : true
                }
                onClick={() => {
                  mint?.();
                  playGeneralClick();
                }}
              >
                {maxSupply.gt(totalSupply)
                  ? `Mint ${mintCount} for ${formatEther(
                      mintPrice.mul(mintCount)
                    )} Ξ`
                  : "Sold out"}
              </button>
              <button
                className="text-xl font-bold hover:scale-125 duration-100 ease-in-out text-[#c697b4]"
                onClick={() => {
                  setMintCount(mintCount + 1);
                  handleAmountClickUp();
                }}
              >
                +
              </button>
            </div>
          )}
        </div>
      )}
      {mintTx && mintTx.status && (
        <div className="-mb-[62px] h-[50px]">
          <div className="flex justify-center alignw-screen mt-3 z-1 pl-10 pr-10 z-10 relative  h-4">
            <div>
              <a
                href={`${etherscanBaseURL}/tx/${mintTx.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-center text-xs hover:text-blue-900"
                onClick={() => {
                  playGeneralClick();
                }}
              >
                View transaction
              </a>
            </div>
          </div>
          <div className="flex justify-center alignw-screen mt-2 z-1 pl-10 pr-10 z-10 relative h-4">
            <div className="text-xs">
              Minted tokens:[{" "}
              {mintedTokens.map((tokenId) => {
                return (
                  <span>
                    <a
                      href={getOpenSeaLink(tokenId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className=" hover:text-blue-900"
                      onClick={() => {
                        playGeneralClick();
                      }}
                    >
                      {tokenId}
                    </a>
                    &nbsp;
                  </span>
                );
              })}
              ]
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-center alignw-screen mt-20 z-1 pl-10 pr-10 z-10 relative ">
        <p className="font-bold text-gray-100 text-center max-w-[300px]">
          Fully on-chain, procedurally generated, animated kaleidoscopes.
        </p>
      </div>
      <div className="flex justify-center alignw-screen mt-20 z-1 pl-10 pr-10 z-10 relative ">
        <div className="block bg-zinc-900 border border-zinc-800 rounded-lg  p-4">
          <div className=" grid  grid-flow-col gap-3">
            <a
              href="https://opensea.io/collection/onchain-solarsystems"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:scale-110 duration-100 ease-in-out"
              onClick={() => {
                playGeneralClick();
              }}
            >
              <img src={opensea} alt="opensea" />
            </a>
            <a
              className="hover:scale-110 duration-100 ease-in-out"
              href={`${etherscanBaseURL}/address/${deployments.contracts.SolarSystems.address}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                playGeneralClick();
              }}
            >
              <img src={etherscan} alt="etherscan" />
            </a>
            <a
              href="https://github.com/lbowles/SolarNFT"
              className="hover:scale-110 duration-100 ease-in-out"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                playGeneralClick();
              }}
            >
              <img src={github} alt="github" />
            </a>
            <a
              href="https://twitter.com/SolarSystemsNFT"
              className="hover:scale-110 duration-100 ease-in-out"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                playGeneralClick();
              }}
            >
              <img src={twitter} alt="twitter" />
            </a>
          </div>
        </div>
      </div>
      {/* FAQ */}
      <div className="flex justify-center alignw-screen mt-10 z-1 pl-5 pr-5 relative">
        <div className="block  bg-zinc-900 border border-zinc-800 rounded-lg w-[800px]">
          <div className="p-5">
            <p className="font- text-xl pb-4 text-gray-100">FAQ</p>
            <div className=" ">
              <div className="block bg-zinc-800 px-3 py-2 rounded-lg w-100 text-sm text-gray-100 ">
                <span>What are Solar Systems?</span>
              </div>
              <p className="text-sm text-zinc-500 px-3 pt-3 pb-5">
                Solar Systems is a fully on-chain NFT collection which features
                procedurally generated planets orbiting around a star. Each
                Solar System is unique and can be minted for the price of 0.01
                ETH. The collection is limited to 1,000 Solar Systems.
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
                      href={`${etherscanBaseURL}/address/${deployments.contracts.Renderer.address}`}
                      onClick={() => {
                        playGeneralClick();
                      }}
                    >
                      <span className=" font-bold underline hover:text-blue-900">
                        Fully on-chain
                      </span>
                    </a>
                    . This means that your NFT will exist for as long as the
                    Ethereum blockchain is around.
                  </li>
                  <li>
                    <span className="font-bold">Animated.</span> Planets orbit
                    around a star which adds to a dynamic and lively viewing
                    experience.
                  </li>
                </ul>
              </div>
              <div className="text-sm text-zinc-500 px-3 pt-3 ">
                <ul className="space-y-2  md:mt-7  list-disc list-inside ml-3">
                  <li>
                    <span className=" font-bold">Procedurally generated.</span>{" "}
                    This means that the solar systems are generated using a set
                    of rules or procedures, rather than being created manually
                    or pre-designed. This makes each solar system fully unique.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Traits */}
      <div className="flex justify-center alignw-screen mt-10 z-1 pl-5 pr-5 relative">
        <div className="block  bg-zinc-900 border border-zinc-800 rounded-lg w-[800px]">
          <div className="p-5">
            <p className="font- text-xl pb-4 text-gray-100">Traits</p>
            <div className="grid  gap-4 grid-cols-1 sm:grid-cols-3  ">
              <div>
                <div className=" bg-zinc-800 px-3 py-4 rounded-lg w-100 text-sm text-gray-100 flex  items-center ">
                  <img
                    src={noReflections}
                    alt="Number Of Reflections"
                    className="h-5 mr-3"
                  ></img>
                  <span>Number Of Reflections</span>
                </div>
              </div>
              <div>
                <div className=" bg-zinc-800 px-3 py-4 rounded-lg w-100 text-sm text-gray-100 flex  items-center min-h-20">
                  <img
                    src={maxSaturation}
                    alt="Max Saturation"
                    className="h-5 mr-3"
                  ></img>
                  <span>Max Color Saturation</span>
                </div>
              </div>
              <div>
                <div className=" bg-zinc-800 px-3 py-4 rounded-lg w-100 text-sm text-gray-100 flex  items-center">
                  <img
                    src={inputShapes}
                    alt="Number Of Reflections"
                    className="h-5 mr-3"
                  ></img>
                  <span>Number Of Reflections</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center alignw-screen mt-24 z-1 pl-10 pr-10 z-10 relative">
        <footer className="sticky w-full py-4  bottom-0 text-center text-gray-700 text-sm">
          Made by{" "}
          <a
            href="https://twitter.com/npm_luko"
            className="font-bold text-blue-500 hover:text-blue-800"
            target="_blank"
            onClick={() => {
              playGeneralClick();
            }}
          >
            @npm_luko
          </a>{" "}
          and{" "}
          <a
            href="https://twitter.com/stephancill"
            className="font-bold text-blue-500 hover:text-blue-800"
            target="_blank"
            onClick={() => {
              playGeneralClick();
            }}
          >
            @stephancill
          </a>
        </footer>
      </div>
    </div>
  );
}
