import { Context } from "../../main";
import { Account } from "../../models/Account";
import { getBalancesByAccountId, getWithdrawableFees } from "../../service/UserBalanceService";

const resolvers = {
    Account: {
        balances: async (parent: Account, args: { poolId?: string }, context: Context) => {
            return getBalancesByAccountId(context.db, parent.account_id, args.poolId);
        },

        earned_fees: async (parent: Account, args: { poolId?: string }, context: Context) => {
            return getWithdrawableFees(context.db, parent.account_id, args.poolId);
        },
    },
    Query: {
        getAccount: async (parent: any, args: { accountId: string }, context: Context) => {
            return {
                account_id: args.accountId,
            }
        },
    },
};

export default resolvers;
