import etherscan from "../.././img/etherscan.svg"
import github from "../.././img/github.svg"
import opensea from "../.././img/opensea.svg"
import twitter from "../.././img/twitter.svg"

type ILinks = {
  etherscanBaseURL: string
  deployAddress: string
  playGeneralClick: () => void
}
export function Links({ etherscanBaseURL, deployAddress, playGeneralClick }: ILinks) {
  return (
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
            href={`${etherscanBaseURL}/address/${deployAddress}`}
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
  )
}
