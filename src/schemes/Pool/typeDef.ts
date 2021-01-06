import { gql } from 'apollo-server';

const typeDef = gql`
    type Pool {
        id: String
        seed_nonce: String
        owner: String
        num_of_outcomes: Int
        collateral: String
        swap_fee: String
        total_withdrawn_fees: String
        fee_pool_weight: String
        finalized: Boolean
        block_height: String

        token_statuses: [TokenStatus]
        pool_balances: [PoolBalance]
    }

    extend type Query {
        getPool(poolId: String!): Pool
    }
`;

export default typeDef;
