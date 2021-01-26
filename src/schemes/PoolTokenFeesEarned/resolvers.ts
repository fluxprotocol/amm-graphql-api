import { Context } from "../../main";
import { Market } from "../../models/Market";
import { PoolTokensFeesEarnedViewModel } from "../../models/PoolTokenFeesEarnedViewModel";
import { getMarketById, getMarkets, getVolumeForMarket, MarketFilters } from "../../service/MarketService";
import { getPoolById } from "../../service/PoolService";

const resolvers = {
    PoolTokenFeesEarned: {
        market: async (parent: PoolTokensFeesEarnedViewModel, args: any, context: Context) => {
            return getMarketById(context.db, parent.poolId);
        },
    },
};

export default resolvers;
