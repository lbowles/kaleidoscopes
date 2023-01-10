import { useEffect, useState } from "react"
import { useCountdown } from "../../hooks/countdown"
import allowlistHelpBtn from "../../img/allowlistHelpBtn.svg"
import countdownLine from "../../img/countdownLine.svg"

type ICoundown = {
  allowlistTime: number
  publicTime: number
  playGeneralClick: () => void
}

function formatTimeString(days: number, hours: number, minutes: number, seconds: number) {
  const textDays = `${days.toString().padStart(2, "0")} day${days != 1 ? "s" : ""},`
  const textHours = ` ${hours.toString().padStart(2, "0")} hour${hours != 1 ? "s" : ""},`
  const textMinutes = ` ${minutes.toString().padStart(2, "0")} minute${minutes != 1 ? "s" : ""},`
  const textSeconds = ` ${seconds.toString().padStart(2, "0")} second${seconds != 1 ? "s" : ""}`
  let value = ""
  if (days > 0) {
    value = textDays
  }
  if (hours > 0) {
    value = value + textHours
  }
  if (minutes > 0) {
    value = value + textMinutes
  }
  return value + textSeconds
}

export const Countdown = ({ allowlistTime, publicTime, playGeneralClick }: ICoundown) => {
  const [targetTime, setTargetTime] = useState(new Date().getTime())

  const [days, hours, minutes, seconds] = useCountdown(targetTime)

  const [percentBar, setPercentBar] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date().getTime())

  const [hasAllowListStarted, setHasAllowListStarted] = useState(false)
  const [hasPublicSaleStarted, setHasPublicSaleStarted] = useState(false)

  useEffect(() => {
    let current = new Date().getTime()
    setCurrentTime(current)
    setHasAllowListStarted(currentTime > allowlistTime)
    setHasPublicSaleStarted(currentTime > publicTime)

    let betweenAllowPublic = Math.abs(publicTime - allowlistTime)
    let betweenAllowCurrent = Math.abs(current - allowlistTime)

    let percentBar = (betweenAllowCurrent / betweenAllowPublic) * 100
    if (percentBar >= 100) {
      percentBar = 100
    }
    setPercentBar(Math.round(percentBar))
  }, [seconds])

  useEffect(() => {
    if (hasAllowListStarted) {
      setTargetTime(publicTime)
    } else {
      setTargetTime(allowlistTime)
    }
  }, [publicTime, allowlistTime, hasAllowListStarted, hasPublicSaleStarted])

  return (
    <div className="flex justify-center text-center mt-[90px]  z-1 pl-10 pr-10 z-10  ">
      <div className="w-[500px]">
        {hasAllowListStarted ? (
          <>
            <p className="text-gray-100 text-center text-sm">{`${formatTimeString(
              days,
              hours,
              minutes,
              seconds,
            )} left`}</p>
            <div className="flex justify-center">
              <div className="w-[290px]">
                <div className="flex">
                  <img src={countdownLine} alt="countdownLine" className="py-2"></img>
                </div>
                <div className="flex ml-[43px] absolute top-[819px]">
                  <div className="w-[204px]">
                    <div className="bg-white h-[2px]" style={{ width: percentBar + "%" }}></div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="w-[226px] bg-none mr-[33px] -mt-[18px] pr-[10px]">
                    <div
                      className={`bg-white h-[10px] w-[10px] rounded-lg`}
                      style={{ marginLeft: percentBar + "%" }}
                    ></div>
                  </div>
                </div>
                <div className="text-gray-100  text-sm flex justify-between">
                  <div className="flex justify-center">
                    <span>Allowlist mint</span>
                    <a
                      className="pt-1 pl-2"
                      onClick={() => {
                        playGeneralClick()
                      }}
                    >
                      <img src={allowlistHelpBtn} className="w-[13px]"></img>
                    </a>
                  </div>{" "}
                  <span>Public mint</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          !hasPublicSaleStarted && (
            <>
              <p className="text-gray-100 text-center text-sm">
                {`Starts in ${formatTimeString(days, hours, minutes, seconds)}`}
              </p>
              <div className="flex justify-center">
                <div className="w-[290px]">
                  <div className="flex">
                    <img src={countdownLine} alt="countdownLine" className="py-2"></img>
                  </div>
                  <div className="text-gray-100  text-sm flex justify-between">
                    <span>Allowlist mint </span> <span>Public mint</span>
                  </div>
                </div>
              </div>
            </>
          )
        )}
      </div>
    </div>
  )
}
