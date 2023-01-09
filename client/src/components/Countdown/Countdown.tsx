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
  const [percentBar, setPercentBar] = useState(0)

  useEffect(() => {
    let current = new Date().getTime()

    let betweenAllowPublic = Math.abs(targetDateP - targetDateA)

    let betweenAllowCurrent = Math.abs(current - targetDateA)

    console.log(betweenAllowCurrent, betweenAllowPublic)

    let percentBar = (betweenAllowCurrent / betweenAllowPublic) * 100
    setPercentBar(Math.round(percentBar))
    console.log(percentBar)
  }, [pSeconds])

  return (
    <div className="flex justify-center text-center mt-[90px] z-1 pl-10 pr-10 z-10  ">
      <div className="w-[500px]">
        {/* TODO: remove ! */}
        {!hasAllowListStarted ? (
          <>
            <p className="font-medium text-gray-100 text-center text-sm">
              {`${pHours.toString().padStart(2, "0")} hours, ${pMinutes.toString().padStart(2, "0")} minutes, ${pSeconds
                .toString()
                .padStart(2, "0")} seconds left`}
            </p>
            <div className="flex justify-center">
              <div className="w-[290px]">
                <div className="flex">
                  <img src={countdownLine} alt="countdownLine" className="py-2"></img>
                </div>
                <div className="flex justify-end">
                  <div className="w-[226px] bg-none mr-[33px] -mt-[18px]">
                    <div
                      className={`bg-white h-[10px] w-[10px] rounded-lg`}
                      // TODO: if bigger than like 97% just leave it at 97%
                      style={{ marginLeft: percentBar + "%" }}
                    ></div>
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
              {`Starts in ${aDays.toString().padStart(2, "0")} days, ${aHours
                .toString()
                .padStart(2, "0")} hours, ${aMinutes.toString().padStart(2, "0")} minutes, ${aSeconds
                .toString()
                .padStart(2, "0")} seconds left`}
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
