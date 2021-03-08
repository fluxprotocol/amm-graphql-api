import { gql } from 'apollo-server';

const typeDef = gql`
    type Pool {
        id: String
        outcomes: Int
        collateral_token_id: String
        collateral_denomination: String
        owner: String
        swap_fee: String
        total_withdrawn_fees: String
        fee_pool_weight: String
        block_height: String

        tokens_info: [TokenInfo]
        pool_balances: [PoolBalance]
    }

    extend type Query {
        getPool(poolId: String!): Pool
    }
`;

export default typeDef;
