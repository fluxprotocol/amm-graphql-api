import { gql } from 'apollo-server';

const typeDef = gql`
    type Claim {
        market_id: String
        claimer: String
        payout: String
    }
`;

export default typeDef;
