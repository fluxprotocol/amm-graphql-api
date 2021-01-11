import { Context } from "../../main";
import { DateMetric } from "../../service/DateService";
import { getPoolById } from "../../service/PoolService";
import { AveragePriceDataPoint, getPriceHistory } from "../../service/PriceHistoryService";

interface PriceHistoryPoint {
    pointKey: string;
    dataPoints: AveragePriceDataPoint[];
}

const resolvers = {
    Query: {
        getAveragePriceHistory: async (parent: any, args: { poolId: string, beginTimestamp: string, endTimestamp?: string, dateMetric: DateMetric }, context: Context) => {
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
    },
};

export default resolvers;
