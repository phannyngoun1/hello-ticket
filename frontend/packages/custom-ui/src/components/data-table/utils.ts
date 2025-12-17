/**
 * Export data table data to CSV format
 */
export function exportToCSV<TData>(
    data: TData[],
    filename: string = "enterprise-data.csv"
): void {
    const csvData = data
        .map((row) => Object.values(row as Record<string, unknown>).join(","))
        .join("\n");
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
}
