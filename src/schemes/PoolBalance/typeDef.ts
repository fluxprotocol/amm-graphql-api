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
    }
`;

export default typeDef;
