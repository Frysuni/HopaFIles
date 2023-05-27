import envConfig from "@env";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { resolve } from "node:path";
import { DataSource } from "typeorm";

export const huy = new DataSource(envConfig.database);