import { Context } from "../../main";
import { Pool } from "../../models/Pool";
import { getEscrowStatusForAccountByMarket } from "../../service/EscrowStatusServices";
import { getPoolById } from "../../service/PoolService";
import { getTokensInfoByPool } from "../../service/TokenStatusesService";
import { getBalancesForPoolId } from "../../service/UserBalanceService";

const resolvers = {
    Query: {
        getEscrowStatus: async (parent: any, args: { marketId: string, accountId: string }, context: Context) => {
            return getEscrowStatusForAccountByMarket(context.db, args.accountId, args.marketId);
        },
    },
};

export default resolvers;
