import { Context } from "../../main";
import { Market } from "../../models/Market";
import { getMarketById, getMarkets, getVolumeForMarket, MarketFilters } from "../../service/MarketService";
import { getPoolById } from "../../service/PoolService";

const resolvers = {
    Market: {
        pool: async (parent: Market, args: any, context: Context) => {
            if (parent.pool) {
                return parent.pool;
            }

            return getPoolById(context.db, parent.id.toString());
        },

        volume: async (parent: Market, args: any, context: Context) => {
            return getVolumeForMarket(context.db, parent.id);
        },
    },
    Query: {
        getMarket: async (parent: any, args: { marketId: string }, context: Context) => {
            return getMarketById(context.db, args.marketId);
        },

        getMarkets: async (parent: any, args: { filters: MarketFilters }, context: Context) => {
            return getMarkets(context.db, args.filters);
        },
    },
};

export default resolvers;
