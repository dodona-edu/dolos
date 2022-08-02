import { Environment } from "./environment";

export const DevEnvironment: Environment = {
  port: 3000,
  baseURI: process.env.DOLOS_BASE_URL || "/test",
  host: 'localhost'
};
