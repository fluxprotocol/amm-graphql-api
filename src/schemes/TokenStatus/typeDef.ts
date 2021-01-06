import { gql } from 'apollo-server';

const typeDef = gql`
    type TokenStatus {
        pool_id: String
        outcome_id: String
        total_supply: String
        block_height: String
    }
`;

export default typeDef;
