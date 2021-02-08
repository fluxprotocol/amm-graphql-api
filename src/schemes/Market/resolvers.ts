import { Context } from "../../main";
import { Market } from "../../models/Market";
import { getClaimedEarningsForMarket } from "../../service/ClaimService";
import { getMarketById, getMarkets, getVolumeForMarket, MarketFilters } from "../../service/MarketService";
import { getPoolById } from "../../service/PoolService";
import { toTokenDenom } from "../../service/TokenService";

const resolvers = {
    Market: {
        pool: async (parent: Market, args: any, context: Context) => {
            if (parent.pool) {
                return parent.pool;
            }

            return getPoolById(context.db, parent.id.toString());
        },

        volume: async (parent: Market, args: any, context: Context) => {
            if (typeof parent.volume !== 'undefined') {
                return toTokenDenom(parent.volume.toString());
            }

            return getVolumeForMarket(context.db, parent.id);
        },

        claimed_earnings: async (parent: Market, args: { accountId?: string }, context: Context) => {
            if (!args.accountId) {
                return null;
            }

            return getClaimedEarningsForMarket(context.db, args.accountId, parent.id);
        },
    },
    Query: {
        getMarket: async (parent: any, args: { marketId: string }, context: Context) => {
            return getMarketById(context.db, args.marketId);
        },

        getMarkets: async (parent: any, args: { filters: MarketFilters }, context: Context) => {
            return getMarkets(context.db, {
                ...args.filters,
                sortByVolume: true,
            });
        },
    },
};

export default resolvers;
