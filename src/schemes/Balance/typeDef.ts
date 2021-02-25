import { gql } from 'apollo-server';

const typeDef = gql`
    type Balance {
        id: String
        pool_id: String
        outcome_id: Int
        account_id: String
        balance: String
        spent: String
        block_height: String
        market: Market
    }
`;

export default typeDef;
