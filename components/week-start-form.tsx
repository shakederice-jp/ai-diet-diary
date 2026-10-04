import { setWeekStart } from "@/app/calendar/actions";
import type { WeekStart } from "@/lib/calendar";

const idle =
  "inline-flex min-h-[52px] items-center justify-center rounded-full border border-[#F5821F] bg-[#FBF6EE] px-5 text-base font-medium text-[#F5821F] hover:bg-[#E7DCC8]";
const selected =
  "inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#F5821F] px-5 text-base font-medium text-white";

export function WeekStartForm({ weekStartsOn }: { weekStartsOn: WeekStart }) {
  return (
    <section className="mt-8 border-t border-[#E4D7C6] pt-4">
      <h2 className="text-xs font-medium text-zinc-500">週の始まり</h2>
      <form action={setWeekStart} className="mt-3 flex flex-wrap gap-3">
        {(["sunday", "monday"] as const).map((value) => {
          const pressed = weekStartsOn === value;
          return (
            <button
              key={value}
              type="submit"
              name="weekStart"
              value={value}
              aria-pressed={pressed}
              className={pressed ? selected : idle}
            >
              {value === "sunday" ? "日曜" : "月曜"}
            </button>
          );
        })}
      </form>
    </section>
  );
}
