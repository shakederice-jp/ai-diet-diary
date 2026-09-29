"use client";

export function ChoiceField<T extends string>({
  name,
  legend,
  value,
  options,
  onChange,
}: {
  name: string;
  legend: string;
  value: T | "";
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-zinc-950">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              className={
                selected
                  ? "cursor-pointer rounded-full bg-[#F5821F] px-3 py-2 text-sm font-medium text-white focus-within:ring-2 focus-within:ring-[#F5821F]"
                  : "cursor-pointer rounded-full border border-[#F5821F] bg-[#FBF6EE] px-3 py-2 text-sm font-medium text-[#F5821F] focus-within:ring-2 focus-within:ring-[#F5821F]"
              }
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                required
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
