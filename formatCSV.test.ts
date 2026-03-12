import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatCSVFileToJSONFile } from './formatCSV';

vi.mock('node:fs/promises', () => ({
    readFile: vi.fn(),
    writeFile: vi.fn()
}));

import { readFile, writeFile } from 'node:fs/promises';

describe('formatCSVFileToJSONFile', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('должен успешно преобразовать CSV файл в JSON', async () => {
        const mockCSV = 'p1;p2;p3;p4\n1;A;b;c\n2;B;v;d';
        vi.mocked(readFile).mockResolvedValue(mockCSV);

        await formatCSVFileToJSONFile('input.csv', 'output.json', ';');

        expect(readFile).toHaveBeenCalledTimes(1);
        expect(readFile).toHaveBeenCalledWith('input.csv', 'utf-8');
        expect(writeFile).toHaveBeenCalledTimes(1);
        
        const writeFileArgs = vi.mocked(writeFile).mock.calls[0];
        expect(writeFileArgs[0]).toBe('output.json');
        
        const writtenData = JSON.parse(writeFileArgs[1] as string);
        expect(writtenData).toEqual([
            { p1: 1, p2: 'A', p3: 'b', p4: 'c' },
            { p1: 2, p2: 'B', p3: 'v', p4: 'd' }
        ]);
        
        expect(writeFileArgs[2]).toBe('utf-8');
    });

    it('должен обрабатывать пустые строки в CSV', async () => {
        const mockCSV = 'name,age\nJohn,25\n\nAlice,30\n';
        vi.mocked(readFile).mockResolvedValue(mockCSV);

        await formatCSVFileToJSONFile('input.csv', 'output.json', ',');

        const writeFileArgs = vi.mocked(writeFile).mock.calls[0];
        const writtenData = JSON.parse(writeFileArgs[1] as string);
        
        expect(writtenData).toEqual([
            { name: 'John', age: 25 },
            { name: 'Alice', age: 30 }
        ]);
    });

    it('должен выбрасывать ошибку если readFile не удался', async () => {
        const error = new Error('File not found');
        vi.mocked(readFile).mockRejectedValue(error);

        await expect(formatCSVFileToJSONFile('input.csv', 'output.json', ';'))
            .rejects
            .toThrow('Failed to process CSV file: File not found');

        expect(writeFile).not.toHaveBeenCalled();
    });

    it('должен выбрасывать ошибку если CSV имеет неправильный формат', async () => {
        const mockCSV = 'col1,col2\n1\n2,3,4';
        vi.mocked(readFile).mockResolvedValue(mockCSV);

        await expect(formatCSVFileToJSONFile('input.csv', 'output.json', ','))
            .rejects
            .toThrow('Failed to process CSV file: Row 2 has 1 values, expected 2');

        expect(writeFile).not.toHaveBeenCalled();
    });

    it('должен работать с разными разделителями', async () => {
        const mockCSV = 'col1|col2|col3\n1|A|X\n2|B|Y';
        vi.mocked(readFile).mockResolvedValue(mockCSV);

        await formatCSVFileToJSONFile('input.csv', 'output.json', '|');

        const writeFileArgs = vi.mocked(writeFile).mock.calls[0];
        const writtenData = JSON.parse(writeFileArgs[1] as string);
        
        expect(writtenData).toEqual([
            { col1: 1, col2: 'A', col3: 'X' },
            { col1: 2, col2: 'B', col3: 'Y' }
        ]);
    });

    it('должен обрабатывать пустой файл', async () => {
        vi.mocked(readFile).mockResolvedValue('');

        await expect(formatCSVFileToJSONFile('input.csv', 'output.json', ','))
            .rejects
            .toThrow('Failed to process CSV file: Input array is empty');

        expect(writeFile).not.toHaveBeenCalled();
    });
});