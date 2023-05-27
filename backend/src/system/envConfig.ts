import { config } from 'dotenv';
import { from } from 'env-var';
import { resolve } from 'node:path';
import { DataSourceOptions } from 'typeorm';

config({ path: resolve(process.cwd(), '../', '.env') });

const env = from(process.env);

const discord = {
    clientId: env.get('DISCORD_CLIENT_ID').required().asString(),
    guildId: env.get('DISCORD_GUILD_ID').required().asString(),
    clientSecret: env.get('DISCORD_CLIENT_SECRET').required().asString(),
};

const main = {
    filesAutoRouting: env.get('FILES_AUTO_ROUTING').required().asBoolStrict(),
    accessJwtLifetime: env.get('ACCESS_JWT_LIFETIME').default(5 * 60).asIntPositive(),
    refreshJwtLifetime: env.get('REFRESH_JWT_LIFETIME').default(30 * 24 * 60 * 60).asIntPositive(),
    saveDiscordUsers: env.get('SAVE_DISCORD_USERS').default('false').asBoolStrict(),
    apiUrl: env.get('API_URL').default(3000).asUrlObject(),
    port: env.get('API_PORT').default(3000).asPortNumber(),
    baseUrl: env.get('BASE_URL').default(4000).asUrlObject(),
    devMode: env.get('NODE_ENV').asString() === 'dev',
};

const database: DataSourceOptions = {
    type: 'mongodb',
    host: env.get('MONGOD_HOST').required().asString(),
    port: env.get('MONGOD_PORT').required().asPortNumber(),
    database: env.get('MONGOD_DATABASE').required().asString(),
    entities: [ resolve(__dirname, '../api/**/*.entity.ts') ],
};

export default { ...main, database, discord };