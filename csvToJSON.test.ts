import { describe, it, expect } from 'vitest';
import { csvToJSON } from './csvToJSON';

describe('csvToJSON', () => {
    describe('корректные данные', () => {
        it('должен преобразовать CSV с числами и строками', () => {
            const input = [
                'p1;p2;p3;p4',
                '1;A;b;c',
                '2;B;v;d'
            ];
            
            const result = csvToJSON(input, ';');
            
            expect(result).toEqual([
                { p1: 1, p2: 'A', p3: 'b', p4: 'c' },
                { p1: 2, p2: 'B', p3: 'v', p4: 'd' }
            ]);
        });

        it('должен работать с другим разделителем', () => {
            const input = [
                'col1,col2,col3',
                '10,hello,world',
                '20,test,data'
            ];
            
            const result = csvToJSON(input, ',');
            
            expect(result).toEqual([
                { col1: 10, col2: 'hello', col3: 'world' },
                { col1: 20, col2: 'test', col3: 'data' }
            ]);
        });

        it('должен работать с одной строкой данных', () => {
            const input = [
                'name,age',
                'John,25'
            ];
            
            const result = csvToJSON(input, ',');
            
            expect(result).toEqual([
                { name: 'John', age: 25 }
            ]);
        });

        it('должен преобразовывать числа в number, строки в string', () => {
            const input = [
                'id,value,text',
                '1,123,hello',
                '2,45.6,world'
            ];
            
            const result = csvToJSON(input, ',');
            
            expect(result).toEqual([
                { id: 1, value: 123, text: 'hello' },
                { id: 2, value: 45.6, text: 'world' }
            ]);
            
            expect((result[0] as any).id).toBe(1);
            expect((result[0] as any).value).toBe(123);
            expect((result[0] as any).text).toBe('hello');
            
            expect(typeof (result[0] as any).id).toBe('number');
            expect(typeof (result[0] as any).value).toBe('number');
            expect(typeof (result[0] as any).text).toBe('string');
        });
    });

    describe('некорректные данные', () => {
        it('должен выбрасывать ошибку при пустом массиве', () => {
            expect(() => csvToJSON([], ';')).toThrow('Input array is empty');
        });

        it('должен выбрасывать ошибку при отсутствии заголовков', () => {
            expect(() => csvToJSON([''], ';')).toThrow('No headers found');
        });

        it('должен выбрасывать ошибку при несоответствии количества колонок', () => {
            const input = [
                'col1,col2,col3',
                '1,2',
                '3,4,5,6'
            ];
            
            expect(() => csvToJSON(input, ',')).toThrow('Row 2 has 2 values, expected 3');
        });

        it('должен выбрасывать ошибку при заголовке из пустой строки', () => {
            expect(() => csvToJSON([''], ';')).toThrow('No headers found');
        });

        it('должен пропускать пустые строки в данных', () => {
            const input = [
                'col1,col2',
                '1,2',
                '',
                '3,4'
            ];
            
            const result = csvToJSON(input, ',');
            
            expect(result).toEqual([
                { col1: 1, col2: 2 },
                { col1: 3, col2: 4 }
            ]);
        });
    });
});