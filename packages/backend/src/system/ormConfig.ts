import { envConfig } from '@hopafiles/common';
import { DataSource } from "typeorm";

export const dataSource = new DataSource(envConfig.database);
export default dataSource;