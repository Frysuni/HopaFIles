import envConfig from "~/monorepo/envConfig";
import { DataSource } from "typeorm";

export const dataSource = new DataSource(envConfig.database);
export default dataSource;