import { Context } from "../../main";
import { Account } from "../../models/Account";
import { getBalancesByAccountId, getWithdrawableFees } from "../../service/UserBalanceService";

const resolvers = {
    Account: {
        balances: async (parent: Account, args: { poolId?: string, removeClaimedBalances?: boolean, removeZeroBalances?: boolean }, context: Context) => {
            return getBalancesByAccountId(context.db, parent.account_id, args.poolId, {
                removeClaimedBalances: args.removeClaimedBalances,
                removeZeroBalances: args.removeZeroBalances,
            });
        },

        earned_fees: async (parent: Account, args: { poolId?: string, removeClaimedBalances?: boolean, removeZeroBalances?: boolean }, context: Context) => {
            return getWithdrawableFees(context.db, parent.account_id, args.poolId, {
                removeClaimedBalances: args.removeClaimedBalances,
                removeZeroBalances: args.removeZeroBalances,
            });
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
