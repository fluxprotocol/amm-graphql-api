import { Context } from "../../main";
import { DateMetric } from "../../service/DateService";
import { PriceDataPoint, DATA_POINT_KEY_24_HOUR, getPriceForDay, getPriceHistory } from "../../service/PriceHistoryService";

interface PriceHistoryPoint {
    pointKey: string;
    dataPoints: PriceDataPoint[];
}

const resolvers = {
    Query: {
        getPriceHistory: async (parent: any, args: { poolId: string, beginTimestamp: string, endTimestamp?: string, dateMetric: DateMetric }, context: Context) => {
            const historyDataPoints = await getPriceHistory(
                context.db,
                args.poolId,
                parseInt(args.beginTimestamp, 10),
                args.endTimestamp ? parseInt(args.endTimestamp, 10) : new Date().getTime(),
                args.dateMetric,
            );

            const result: PriceHistoryPoint[] = [];

            historyDataPoints.forEach((dataPoints, key) => {
                result.push({
                    pointKey: key,
                    dataPoints,
                });
            });

            return result.reverse();
        },

        getPriceForDay: async (parent: any, args: { poolId: string, beginTimestamp: string }, context: Context): Promise<PriceHistoryPoint | null> => {
            const beginTimestamp = parseInt(args.beginTimestamp, 10)
            const dayAveragePrice = await getPriceForDay(context.db, args.poolId, beginTimestamp);
            const dataPoints = dayAveragePrice.get(DATA_POINT_KEY_24_HOUR);

            if (!dataPoints?.length) {
                return null;
            }

            return {
                dataPoints,
                pointKey: DATA_POINT_KEY_24_HOUR,
            };
        }
    },
};

export default resolvers;
