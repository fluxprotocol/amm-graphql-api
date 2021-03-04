import { Context } from "../../main";
import { EscrowStatus } from "../../models/EscrowStatus";
import { getEscrowStatusForAccountByMarket } from "../../service/EscrowStatusServices";
import { getMarketById } from "../../service/MarketService";

const resolvers = { 
    EscrowStatus: {
        market: async (parent: EscrowStatus, args: {}, context: Context) => {
            return getMarketById(context.db, parent.market_id);
        }
    },
    Query: {
        getEscrowStatus: async (parent: any, args: { marketId?: string, accountId: string }, context: Context) => {
            return getEscrowStatusForAccountByMarket(context.db, args.accountId, args.marketId);
        },
    },
};

export default resolvers;
