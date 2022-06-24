import { STORAGE_FILE_SUFFIX } from "../../../constants";
// import { BIField, Record } from "../../global";
import { FileLoader } from "../../../utils";
import { Sampling } from 'visual-insights';
import { FileReader } from '@kanaries/web-data-loader'
import intl from 'react-intl-universal';
import { useMemo } from "react";
import { IMuteFieldBase, IRow } from "../../../interfaces";
import { IRathStorage, RathStorageParse } from "../../../utils/storage";

/* eslint import/no-webpack-loader-syntax:0 */
// @ts-ignore
// eslint-disable-next-line
import FileDataTransformWorker from './transFileData.worker?worker';
import { workerService } from "../../../service";


export enum SampleKey {
  none = 'none',
  reservoir = 'reservoir',
}

export const useSampleOptions = function () {
    const noneText = intl.get(`dataSource.sampling.${SampleKey.none}`);
    const reservoirText = intl.get(`dataSource.sampling.${SampleKey.reservoir}`);
    const options = useMemo(() => {
        return [
            {
                key: SampleKey.none,
                text: noneText,
            },
            {
                key: SampleKey.reservoir,
                text: reservoirText,
            },
        ];
    }, [noneText, reservoirText])
    return options;
}

const onDataLoading = (value: number) => {
    console.log('data loading', Math.round(value * 100) + '%')
}

async function transformFileDataService (rawData: IRow[]): Promise<{
    fields: IMuteFieldBase[];
    dataSource: IRow[]
}> {
    try {
        const worker = new FileDataTransformWorker()
        const res = await workerService<{
                fields: IMuteFieldBase[];
                dataSource: IRow[]
            }, IRow[]>(worker, rawData);
        if (res.success) {
            return res.data;
        } else {
            throw new Error(res.message)
        }
    } catch (error) {
        throw error
    }
}

export async function loadDataFile(file: File, sampleMethod: SampleKey, sampleSize: number = 500, encoding: string = 'utf-8'): Promise<{
    fields: IMuteFieldBase[];
    dataSource: IRow[]
}> {

    /**
     * tmpFields is fields cat by specific rules, the results is not correct sometimes, waitting for human's input
     */
    let rawData: IRow[] = []

    if (file.type === 'text/csv' || file.type === 'application/vnd.ms-excel') {
        rawData = []
        if (sampleMethod === SampleKey.reservoir) {
            rawData = (await FileReader.csvReader({
              file,
              encoding,
              config: {
                type: 'reservoirSampling',
                size: sampleSize,
              },
              onLoading: onDataLoading
            })) as IRow[]
        } else {
            rawData = (await FileReader.csvReader({
              file,
              encoding,
              onLoading: onDataLoading
            })) as IRow[]
        }
    } else if (file.type === 'application/json') {
        rawData = await FileLoader.jsonLoader(file)
        if (sampleMethod === SampleKey.reservoir) {
            rawData = Sampling.reservoirSampling(rawData, sampleSize)
        }
    } else {
        throw new Error(`unsupported file type=${file.type} `)
    }
    const dataset = await transformFileDataService(rawData);
    return dataset
}

export async function loadRathStorageFile (file: File): Promise<IRathStorage> {
    // FIXME file type
    if (file.name.split('.').slice(-1)[0] === STORAGE_FILE_SUFFIX) {
        const rawContent = await FileLoader.textLoader(file);
        return RathStorageParse(rawContent);
    } else {
        throw new Error(`file type not supported: ${file.name.split('.').slice(-1)[0]}`)
    }
}

export function getQuantiles(values: number[], percents: number[]) {
    const sortedValues = [...values].sort((a, b) => a - b);
    const percentIndices = percents.map(p => p * values.length)
    const qts: number[] = [];
    for (let pi of percentIndices) {
        let floor_pi = Math.floor(pi);
        if (pi > Math.floor(pi)) {
            qts.push(sortedValues[floor_pi])
        } else {
            const mid = (sortedValues[floor_pi] + sortedValues[Math.min(floor_pi, sortedValues.length - 1)]) / 2;
            qts.push(mid)
        }
    }
    return qts;
}