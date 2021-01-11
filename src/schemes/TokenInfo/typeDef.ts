import { gql } from 'apollo-server';

const typeDef = gql`
    type TokenInfo {
        pool_id: String
        outcome_id: Int
        total_supply: String
        block_height: String
        is_pool_token: Boolean
    }
`;

export default typeDef;
