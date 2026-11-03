export function GuideTable({
  caption,
  headers,
  rows,
}: {
  caption: string;
  headers: readonly string[];
  rows: readonly (readonly string[])[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[52rem] border-collapse text-left text-sm leading-7 text-zinc-800">
        <caption className="caption-top mb-2 text-left text-base font-medium text-[#3A2A22]">{caption}</caption>
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="border-b border-[#E7DCC8] bg-[#FBF6EE] px-3 py-2 font-medium text-[#6B4A32]"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, index) =>
                index === 0 ? (
                  <th
                    key={cell}
                    scope="row"
                    className="border-b border-[#E7DCC8] px-3 py-2 align-top font-medium text-zinc-950"
                  >
                    {cell}
                  </th>
                ) : (
                  <td key={`${row[0]}-${index}`} className="border-b border-[#E7DCC8] px-3 py-2 align-top">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
