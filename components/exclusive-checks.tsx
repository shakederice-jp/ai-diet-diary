"use client";

export function ExclusiveChecks<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  disabled = false,
  idPrefix = "",
}: {
  name: string;
  legend: string;
  options: readonly T[];
  value: T | null;
  onChange: (value: T) => void;
  disabled?: boolean;
  idPrefix?: string;
}) {
  return (
    <fieldset disabled={disabled} className={disabled ? "opacity-50" : undefined}>
      <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const id = `${idPrefix}${name}-${option}`;
          const selected = value === option;
          return (
            <label
              key={option}
              htmlFor={id}
              className={`flex min-h-11 min-w-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm text-zinc-800 dark:text-zinc-200 ${
                selected ? "border-[#F5821F] bg-white" : "border-[#E4D7C6] bg-[#FBF6EE]"
              } ${disabled ? "cursor-not-allowed" : ""}`}
            >
              <input
                id={id}
                type="radio"
                name={name}
                value={option}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange(option)}
                className="size-5 shrink-0 appearance-none rounded-[4px] border-2 border-[#C4B39A] bg-white checked:border-[#F5821F] checked:bg-[#F5821F]"
              />
              {option}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
