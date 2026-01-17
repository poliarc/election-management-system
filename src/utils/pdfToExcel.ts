import * as XLSX from "xlsx";

interface ConversionResult {
    success: boolean;
    message: string;
    rowsExtracted?: number;
    columnsDetected?: number;
    pages?: number;
}

export async function convertPdfToExcel(
    pdfFile: File
): Promise<{ workbook: XLSX.WorkBook; result: ConversionResult }> {
    try {
        const { PDFParse } = await import("pdf-parse");

        // Set the worker source for pdf.js using CDN
        PDFParse.setWorker("https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs");

        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdfParse = new PDFParse({ data: arrayBuffer });
        const pdfData = await pdfParse.getText();
        const text = pdfData.text;

        if (!text || text.trim().length === 0) {
            throw new Error("No text content found in PDF. The PDF might be image-based or encrypted.");
        }

        const lines = text.split("\n").filter((line: string) => line.trim().length > 0);
        const parsedRows = lines.map(parseTableLine).filter((row: string[] | null): row is string[] => row !== null);

        if (parsedRows.length === 0) {
            throw new Error("No table data could be extracted from the PDF.");
        }

        const alignedRows = alignColumns(parsedRows);
        const maxColumns = Math.max(8, ...alignedRows.map((row) => row.length));
        const normalizedRows = alignedRows.map((row) => {
            const normalized = [...row];
            while (normalized.length < maxColumns) {
                normalized.push("");
            }
            return normalized.slice(0, maxColumns);
        });

        const worksheet = XLSX.utils.aoa_to_sheet(normalizedRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        return {
            workbook,
            result: {
                success: true,
                message: "Successfully converted PDF to Excel!",
                pages: pdfData.total,
                rowsExtracted: normalizedRows.length,
                columnsDetected: maxColumns,
            },
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        throw new Error(`Error converting PDF to Excel: ${errorMessage}`);
    }
}

function splitConcatenatedCells(text: string): string[] {
    if (!text || text.trim().length === 0) return [""];

    const cells: string[] = [];
    const splitPoints = new Set<number>([0]);
    const fieldEndings = ["chat_id", "sender_id", "receiver_id", "message", "message_type", "file_url", "file_name", "file_size", "read_at", "isDelete", "created_at", "Id", "Name", "IsDelete", "created_by", "created_on", "GroupId", "UserId", "Added_by", "Added_on"];
    const tableNames = ["UserCommunication", "CommunicationGroup", "UserGroupMapping", "GroupCommunication"];

    for (const tableName of tableNames) {
        if (text === tableName) return [text];
        if (text.startsWith(tableName) && text.length > tableName.length) {
            return [tableName, text.substring(tableName.length).trim()];
        }
    }

    const knownValues = ["UserMaster.Id", "enum", "From", "To", "User", "Group", "1-1", "1-N", "current_timestamp", "int", "varchar(100)", "bit", "default", "select", "from", "join", "on", "and"];

    fieldEndings.forEach((ending) => {
        const pattern = new RegExp(`(${ending.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})([A-Z])`, "gi");
        let match;
        while ((match = pattern.exec(text)) !== null) {
            splitPoints.add(match.index + match[1].length);
        }
    });

    knownValues.forEach((value) => {
        const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const pattern = new RegExp(`([^A-Za-z])(${escaped})([^A-Za-z]|$)`, "gi");
        let match;
        while ((match = pattern.exec(text)) !== null) {
            if (match[1]) splitPoints.add(match.index + match[1].length);
            else splitPoints.add(match.index);
            splitPoints.add(match.index + match[1].length + match[2].length);
        }
    });

    const patterns = [
        { regex: /(From|To|User|Group)(From|To|User|Group)/gi, offset: 1 },
        { regex: /(int|bit|varchar\([0-9]+\))([A-Z])/gi, offset: 1 },
        { regex: /(select|from|join|on|and)\s+([A-Z])/gi, offset: 0 },
        { regex: /([a-z_]+)([A-Z][a-z]+)/g, offset: 1, condition: (m: RegExpExecArray) => m[1].includes("_") || fieldEndings.some(e => m[1].endsWith(e)) },
        { regex: /([0-9]-[0-9A-Z])/g, offset: 0 },
        { regex: /(Id)(int|bit|varchar)/gi, offset: 1 }
    ];

    patterns.forEach(({ regex, offset, condition }) => {
        let match;
        while ((match = regex.exec(text)) !== null) {
            if (!condition || condition(match)) {
                if (offset === 0 && match.index > 0) splitPoints.add(match.index);
                splitPoints.add(match.index + match[1].length);
            }
        }
    });

    const sortedPoints = Array.from(splitPoints).filter(p => p >= 0 && p <= text.length).sort((a, b) => a - b);
    if (sortedPoints.length === 0) return [text.trim()];

    const uniquePoints = [0];
    for (let i = 1; i < sortedPoints.length; i++) {
        if (sortedPoints[i] > uniquePoints[uniquePoints.length - 1]) {
            uniquePoints.push(sortedPoints[i]);
        }
    }

    for (let i = 0; i < uniquePoints.length; i++) {
        const start = uniquePoints[i];
        const end = i < uniquePoints.length - 1 ? uniquePoints[i + 1] : text.length;
        const cell = text.substring(start, end).trim();
        if (cell.length > 0 || i === 0) cells.push(cell);
    }

    if (cells.length === 1 && text.length > 5) {
        const aggressivePattern = /([a-z_]+)([A-Z])/g;
        const aggressiveCells: string[] = [];
        let lastIndex = 0;
        let matchAggressive;
        while ((matchAggressive = aggressivePattern.exec(text)) !== null) {
            if (matchAggressive.index > lastIndex) {
                aggressiveCells.push(text.substring(lastIndex, matchAggressive.index + matchAggressive[1].length).trim());
                lastIndex = matchAggressive.index + matchAggressive[1].length;
            }
        }
        if (lastIndex < text.length) aggressiveCells.push(text.substring(lastIndex).trim());
        if (aggressiveCells.length > 1) return aggressiveCells.filter(c => c.length > 0);
    }

    return cells.length > 0 ? cells : [text.trim()];
}

function parseTableLine(line: string): string[] | null {
    if (line.includes("|")) {
        const cells = line.split("|").map(cell => cell.trim()).filter(cell => cell.length > 0);
        if (cells.every(cell => /^[-]+$/.test(cell))) return null;
        if (cells.length > 1) return cells;
    }

    if (line.includes("\t")) {
        return line.split("\t").map(cell => cell.trim()).filter(cell => cell.length > 0);
    }

    const spaceCells: string[] = [];
    let currentCell = "";
    let spaceCount = 0;
    const minSpacesForColumn = 2;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === " ") {
            spaceCount++;
        } else {
            if (spaceCount >= minSpacesForColumn && currentCell.trim().length > 0) {
                spaceCells.push(currentCell.trim());
                currentCell = char;
                spaceCount = 0;
            } else {
                currentCell += " ".repeat(spaceCount) + char;
                spaceCount = 0;
            }
        }
    }

    if (currentCell.trim().length > 0) spaceCells.push(currentCell.trim());

    if (spaceCells.length > 1) {
        const finalCells: string[] = [];
        spaceCells.forEach(cell => {
            const split = splitConcatenatedCells(cell);
            finalCells.push(...split);
        });
        return finalCells;
    }

    const smartSplit = splitConcatenatedCells(line.trim());
    if (smartSplit.length > 1) return smartSplit;

    const spaceSplit = line.split(/\s{3,}/).map(cell => cell.trim()).filter(cell => cell.length > 0);
    if (spaceSplit.length > 1) return spaceSplit;

    return [line.trim()];
}

function alignColumns(rows: string[][]): string[][] {
    const alignedRows: string[][] = [];
    const targetColumns = 8;

    rows.forEach((row) => {
        const aligned = new Array(targetColumns).fill("");
        if (row.length === 0) {
            alignedRows.push(aligned);
            return;
        }

        if (row[0]) aligned[0] = row[0];

        const relationshipValues = ["From", "To", "User", "Group"];
        const numberPatterns = ["1-1", "1-N"];
        const typeValues = ["enum", "current_timestamp", "int", "bit", "varchar(100)", "default"];

        let col2Index = 1;
        let relationshipIndex = 5;
        let numberIndex = 7;

        for (let i = 1; i < row.length; i++) {
            const cell = row[i].trim();
            if (!cell) continue;

            if (typeValues.some(t => cell.includes(t)) || cell.includes("UserMaster.Id") || (cell.includes("Id") && !cell.includes("GroupId") && !cell.includes("UserId"))) {
                if (!aligned[1]) {
                    aligned[1] = cell;
                    col2Index = 2;
                }
            } else if (relationshipValues.includes(cell)) {
                if (relationshipIndex < 7) {
                    aligned[relationshipIndex] = cell;
                    relationshipIndex++;
                }
            } else if (numberPatterns.includes(cell) || /^\d+$/.test(cell)) {
                aligned[numberIndex] = cell;
            } else {
                if (!aligned[1] && col2Index === 1) {
                    aligned[1] = cell;
                    col2Index = 2;
                } else if (relationshipIndex < 7) {
                    aligned[relationshipIndex] = cell;
                    relationshipIndex++;
                } else if (!aligned[numberIndex]) {
                    aligned[numberIndex] = cell;
                }
            }
        }

        alignedRows.push(aligned);
    });

    return alignedRows;
}
