import { readFile, writeFile } from 'node:fs/promises';
import { csvToJSON } from './csvToJSON';

export async function formatCSVFileToJSONFile(
    input: string, 
    output: string, 
    delimiter: string
): Promise<void> {
    try {
        const data = await readFile(input, 'utf-8');
        const lines = data.split('\n').filter(line => line.trim() !== '');
        const jsonData = csvToJSON(lines, delimiter);
        await writeFile(output, JSON.stringify(jsonData, null, 2), 'utf-8');
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to process CSV file: ${error.message}`);
        }
        throw error;
    }
}