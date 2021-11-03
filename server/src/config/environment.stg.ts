import { Environment } from "./environment";

export const StgEnvironment: Environment = {
  port: 3000,
  baseURI: process.env.DOLOS_BASE_URL || "/server"
}; 
