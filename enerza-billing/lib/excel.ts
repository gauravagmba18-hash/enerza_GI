import * as XLSX from "xlsx";

/**
 * Convert an array of objects to an XLSX ArrayBuffer for download.
 */
export function toExcelBuffer(rows: Record<string, unknown>[]): ArrayBuffer {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const base64: string = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/**
 * Parse an uploaded XLSX/CSV file buffer into an array of row objects.
 */
export function parseExcelBuffer(
  buffer: ArrayBuffer
): Record<string, unknown>[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: "" });
}

/**
 * Return an XLSX download response from a rows array.
 */
export function excelDownloadResponse(
  rows: Record<string, unknown>[],
  filename: string
): Response {
  const buf = toExcelBuffer(rows);
  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
    },
  });
}
