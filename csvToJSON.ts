export function csvToJSON(input: string[], delimiter: string): object[] {
    if (!input || input.length === 0) {
        throw new Error('Input array is empty');
    }

    const headers = input[0].split(delimiter);
    
    if (headers.length === 0 || (headers.length === 1 && headers[0] === '')) {
        throw new Error('No headers found');
    }

    const result: object[] = [];

    for (let i = 1; i < input.length; i++) {
        if (input[i].trim() === '') {
            continue;
        }
        
        const values = input[i].split(delimiter);
        
        if (values.length !== headers.length) {
            throw new Error(`Row ${i + 1} has ${values.length} values, expected ${headers.length}`);
        }

        const row: { [key: string]: string | number } = {};
        
        for (let j = 0; j < headers.length; j++) {
            const value = values[j];
            const numValue = Number(value);
            row[headers[j]] = isNaN(numValue) ? value : numValue;
        }
        
        result.push(row);
    }

    return result;
}