import { Context } from "../../main";
import { Balance } from "../../models/Balance";
import { getMarketById } from "../../service/MarketService";

const resolvers = {
    Balance: {
        market: async (parent: Balance, args: any, context: Context) => {
            return getMarketById(context.db, parent.pool_id.toString());
        },
    },
};

export default resolvers;
