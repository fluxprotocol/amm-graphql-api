import { Db } from "mongodb";

export interface Migration {
    id: string;

    execute(db: Db): Promise<void>;
}
