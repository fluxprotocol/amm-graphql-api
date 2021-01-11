import { Context } from "../../main";
import { Pool } from "../../models/Pool";
import { getPoolById } from "../../service/PoolService";
import { getTokensInfoByPool } from "../../service/TokenStatusesService";
import { getBalancesForPoolId } from "../../service/UserBalanceService";

const resolvers = {
    Pool: {
        tokens_info: async (parent: Pool, args: any, context: Context) => {
            return getTokensInfoByPool(context.db, parent.id);
        },

        pool_balances: async (parent: Pool, args: any, context: Context) => {
            return getBalancesForPoolId(context.db, parent.id);
        },
    },
    Query: {
        getPool: async (parent: any, args: { poolId: string }, context: Context) => {
            return getPoolById(context.db, args.poolId);
        },
    },
};

export default resolvers;
