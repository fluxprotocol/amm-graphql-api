import { Db } from "mongodb";
import { addDays, format } from "date-fns";
import { DateMetric, getDateMetricFormat } from "./DateService";
import { queryBalances } from "./UserBalanceService";
import { PROTOCOL_ACCOUNT } from "../constants";
import { calcPrice } from "./PriceService";

interface DataPoint {
    outcome: number;
    balance: string;
    cap_creation_date: Date;
}

export interface PriceDataPoint {
    outcome: number;
    price: string;
}

function getAveragePricePerDataPoint(dataPoints: Map<string, DataPoint[]>, outcomesInMarket: number[]) {
    const result = new Map<string, PriceDataPoint[]>();

    // Calculate the average price per date for a outcome
    dataPoints.forEach((pointsAtTime, dataPointKey) => {
        const latestBalances: DataPoint[] = [];

        // Here we are searching the latest balance for each outcome
        // The other items are discarded
        outcomesInMarket.forEach((outcomeId) => {
            let latestPointAtTime: DataPoint | undefined = undefined;

            pointsAtTime.forEach((point) => {
                const latestPointTimeStamp = latestPointAtTime?.cap_creation_date.getTime() || 0;

                if (point.outcome === outcomeId && point.cap_creation_date.getTime() > latestPointTimeStamp) {
                    latestPointAtTime = point;
                }
            })

            if (latestPointAtTime) {
                latestBalances.push(latestPointAtTime);
            }
        });

        // Mapping the prices to the data points
        const prices = calcPrice(latestBalances.map(b => b.balance))
        const averagePriceDataPoint: PriceDataPoint[] = latestBalances.map((balance, index) => ({
            outcome: balance.outcome,
            price: prices[index].toString(),
        }));

        result.set(dataPointKey, averagePriceDataPoint);
    });

    return result;
}

export async function getPriceHistory(db: Db, poolId: string, beginTimestamp: number, endTimestamp: number, dateMetric: DateMetric = DateMetric.hour): Promise<Map<string, PriceDataPoint[]>> {
    try {
        const balances = await queryBalances(db, {
            account_id: PROTOCOL_ACCOUNT,
            pool_id: poolId,
            creation_date: {
                $gte: new Date(beginTimestamp).getTime().toString(),
                $lte: new Date(endTimestamp).getTime().toString(),
            }
        }, {
            filterDuplicates: false,
        });

        const dataPoints = new Map<string, DataPoint[]>();
        const outcomesInMarket: number[] = [];
        const dateFormatKey = getDateMetricFormat(dateMetric);

        balances.forEach((balance) => {
            const dataPointKey = format(new Date(Number(balance.creation_date)), dateFormatKey);
            const dataPoint: DataPoint = {
                outcome: balance.outcome_id,
                balance: balance.balance,
                cap_creation_date: new Date(Number(balance.creation_date)),
            };

            if (!outcomesInMarket.includes(balance.outcome_id)) {
                outcomesInMarket.push(balance.outcome_id);
            }

            const currentDataPointsAtDate = dataPoints.get(dataPointKey);

            if (!currentDataPointsAtDate) {
                dataPoints.set(dataPointKey, [dataPoint]);
            } else {
                currentDataPointsAtDate.push(dataPoint);
            }
        });

        return getAveragePricePerDataPoint(dataPoints, outcomesInMarket);
    } catch (error) {
        console.error('[getPriceHistory]', error);
        return new Map();
    }
}

export const DATA_POINT_KEY_24_HOUR = '24-hour';

export async function getPriceForDay(db: Db, poolId: string, beginTimestamp: number) {
    const endDate = addDays(beginTimestamp, 1);
    const balances = await queryBalances(db, {
        account_id: PROTOCOL_ACCOUNT,
        pool_id: poolId,
        creation_date: {
            $gte: new Date(beginTimestamp).getTime().toString(),
            $lte: endDate.getTime().toString(),
        }
    });

    const dataPoints = new Map<string, DataPoint[]>();
    const outcomesInMarket: number[] = [];

    balances.forEach((balance) => {
        const dataPoint: DataPoint = {
            outcome: balance.outcome_id,
            balance: balance.balance,
            cap_creation_date: new Date(Number(balance.creation_date)),
        };

        if (!outcomesInMarket.includes(balance.outcome_id)) {
            outcomesInMarket.push(balance.outcome_id);
        }

        const currentDataPointsAtDate = dataPoints.get(DATA_POINT_KEY_24_HOUR);

        if (!currentDataPointsAtDate) {
            dataPoints.set(DATA_POINT_KEY_24_HOUR, [dataPoint]);
        } else {
            currentDataPointsAtDate.push(dataPoint);
        }
    });

    return getAveragePricePerDataPoint(dataPoints, outcomesInMarket);
}
