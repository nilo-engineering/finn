export interface CsvRecord {
	fields: string[]; // the parsed columns of one line
	raw: string; // the exact original line text (stored as Transaction.sourceRow)
}

// Split one CSV line into fields, honoring double-quoted values that may contain
// the delimiter and escaped quotes (""). Bank exports don't embed newlines inside
// fields, so a line-based parse keeps `raw` faithful to the original row.
function parseLine(line: string, delimiter: string): string[] {
	const fields: string[] = [];
	let field = '';
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const c = line[i];
		if (inQuotes) {
			if (c === '"') {
				if (line[i + 1] === '"') {
					field += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				field += c;
			}
		} else if (c === '"') {
			inQuotes = true;
		} else if (c === delimiter) {
			fields.push(field.trim());
			field = '';
		} else {
			field += c;
		}
	}
	fields.push(field.trim());
	return fields;
}

// Tokenize CSV text into records, skipping blank lines. Returns each record's
// fields alongside its original line so the importer can preserve provenance.
export function parseCsv(text: string, delimiter: string): CsvRecord[] {
	return text
		.split(/\r?\n/)
		.filter((line) => line.trim() !== '')
		.map((line) => ({ fields: parseLine(line, delimiter), raw: line }));
}
