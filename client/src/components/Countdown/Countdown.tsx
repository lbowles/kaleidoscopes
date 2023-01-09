import style from "./Countdown.module.css"
import { useEffect, useState } from "react"
import { useCountdown } from "../../hooks/countdown"
import countdownLine from "../../img/countdownLine.svg"

type ICoundown = {
  targetDateA: number
  targetDateP: number
  playGeneralClick: () => void
  hasPublicSaleStarted: boolean | undefined
  hasAllowListStarted: boolean | undefined
}
export const Countdown = ({
  targetDateA,
  targetDateP,
  playGeneralClick,
  hasPublicSaleStarted,
  hasAllowListStarted,
}: ICoundown) => {
  const [aDays, aHours, aMinutes, aSeconds] = useCountdown(targetDateA)
  const [pDays, pHours, pMinutes, pSeconds] = useCountdown(targetDateP)

  return (
    // <div className="flex justify-center  w-screen max-w-screen absolute z-100 top-0 text-center">
    //   <div className={" bg-zinc-800 px-3 py-2 rounded-b-lg  text-sm " + style.notificationCard}>
    //     {!hasAllowListStarted && (
    //       <div className="flex">
    //         <p className="w-[140px]">
    //           {`${aDays.toString().padStart(2, "0")}d : ${aHours.toString().padStart(2, "0")}h : ${aMinutes
    //             .toString()
    //             .padStart(2, "0")}m : ${aSeconds.toString().padStart(2, "0")}s `}
    //         </p>
    //         <p>
    //           - Solar Systems{" "}
    //           <a
    //             onClick={() => {
    //               playGeneralClick()
    //             }}
    //             href="https://github.com/lbowles/kaleidoscopes/blob/main/client/src/img/export_tokenholders_for_nft_contract_0xB6CacF825b007dB54a6ADe42.csv?raw=true"
    //             target="_blank"
    //             className="underline h:text-gray-500"
    //           >
    //             allow list{" "}
    //           </a>
    //         </p>
    //       </div>
    //     )}
    //     <div className="flex">
    //       <p className="w-[140px]">
    //         {`${pDays.toString().padStart(2, "0")}d : ${pHours.toString().padStart(2, "0")}h : ${pMinutes
    //           .toString()
    //           .padStart(2, "0")}m : ${pSeconds.toString().padStart(2, "0")}s `}
    //       </p>
    //       <p>- Public</p>
    //     </div>
    //   </div>
    // </div>
    <div className="flex justify-center text-center mt-[90px] z-1 pl-10 pr-10 z-10  ">
      <div className="w-[500px]">
        {/* TODO: remove ! */}
        {!hasAllowListStarted ? (
          <>
            <p className="font-medium text-gray-100 text-center text-sm">
              {`${aDays.toString().padStart(2, "0")} days, ${aHours.toString().padStart(2, "0")} hours, ${aMinutes
                .toString()
                .padStart(2, "0")} minutes, ${aSeconds.toString().padStart(2, "0")} seconds left`}
            </p>
            <div className="flex justify-center">
              <div className="w-[290px]">
                <div className="flex">
                  <img src={countdownLine} alt="countdownLine" className="py-2"></img>
                </div>
                <div className="flex justify-end">
                  <div className="w-[226px] bg-none mr-[33px] -mt-[18px]">
                    <div className="bg-white h-[10px] w-[10px] rounded-lg ml-[96%]"></div>
                  </div>
                </div>
                <div className="font-medium text-gray-100  text-sm flex justify-between">
                  <span>Allowlist mint</span> <span>Public mint</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="font-medium text-gray-100 text-center text-sm">
              {`Starts in ${pHours.toString().padStart(2, "0")} hours, ${pMinutes
                .toString()
                .padStart(2, "0")} minutes, ${pSeconds.toString().padStart(2, "0")} seconds left`}
            </p>
            <div className="flex justify-center">
              <div className="w-[290px]">
                <div className="flex">
                  <img src={countdownLine} alt="countdownLine" className="py-2"></img>
                </div>
                <div className="font-medium text-gray-100  text-sm flex justify-between">
                  <span>Allowlist mint</span> <span>Public mint</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
