import { gql } from 'apollo-server';

const typeDef = gql`
    type PoolBalance {
        id: String
        pool_id: String
        outcome_id: Int
        account_id: String
        balance: String
        block_height: String
        price: Float
        weight: String
        odds: String
    }
`;

export default typeDef;
