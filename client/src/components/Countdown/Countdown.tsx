import style from "./Countdown.module.css"
import { useEffect, useState } from "react"
import { useCountdown } from "../../hooks/countdown"

type ICoundown = {
  targetDateA: number
  targetDateP: number
}
export const Countdown = ({ targetDateA, targetDateP }: ICoundown) => {
  const [aDays, aHours, aMinutes, aSeconds] = useCountdown(targetDateA)
  const [pDays, pHours, pMinutes, pSeconds] = useCountdown(targetDateP)

  return (
    <div className="flex justify-center  w-screen max-w-screen absolute z-100 top-0 text-center">
      <div className={" bg-zinc-800 px-3 py-2 rounded-b-lg  text-sm " + style.notificationCard}>
        <div className="flex">
          <p className="w-[140px]">
            {`${aDays.toString().padStart(2, "0")}d | ${aHours.toString().padStart(2, "0")}h | ${aMinutes
              .toString()
              .padStart(2, "0")}m | ${aSeconds.toString().padStart(2, "0")}s `}
          </p>
          <p>- Solar Systems allow list </p>
        </div>
        <div className="flex">
          <p className="w-[140px]">
            {`${pDays.toString().padStart(2, "0")}d | ${pHours.toString().padStart(2, "0")}h | ${pMinutes
              .toString()
              .padStart(2, "0")}m | ${pSeconds.toString().padStart(2, "0")}s `}
          </p>
          <p>- Public</p>
        </div>
      </div>
    </div>
    // <div className="flex justify-center  mt-10 z-1 pl-5 pr-5 relative">
    //   <div className=" bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-gray-100 ">
    //     <div className="p-5">
    //       <p className="font-medium text-xl pb-4 text-gray-100">Launching</p>
    //       <div className="bg-zinc-800 px-3 py-2 rounded-lg w-100 text-sm mb-4 w-[294px] flex">
    //         <p className="min-w-[101px]">
    //           {`${time.hours.toString().padStart(2, "0")}h | ${time.minutes
    //             .toString()
    //             .padStart(2, "0")}m | ${time.seconds.toString().padStart(2, "0")}s `}
    //         </p>
    //         <p className="pl-2">Solar Systems allow list</p>
    //       </div>
    //       <div className="bg-zinc-800 px-3 py-2 rounded-lg w-100 flex">
    //         <p className="min-w-[101px]">
    //           {`${time.hours.toString().padStart(2, "0")}h | ${time.minutes
    //             .toString()
    //             .padStart(2, "0")}m | ${time.seconds.toString().padStart(2, "0")}s `}
    //         </p>
    //         <p className="pl-2">Public</p>
    //       </div>
    //     </div>
    //   </div>
    // </div>
  )
}
