import { Context } from "../../main";
import { getEscrowStatusForAccountByMarket } from "../../service/EscrowStatusServices";

const resolvers = {
    Query: {
        getEscrowStatus: async (parent: any, args: { marketId: string, accountId: string }, context: Context) => {
            return getEscrowStatusForAccountByMarket(context.db, args.accountId, args.marketId);
        },
    },
};

export default resolvers;
