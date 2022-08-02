import { Environment } from "./environment";
import { DevEnvironment } from "./environment.dev";
import { StgEnvironment } from "./environment.stg";


const environments: {[k: string]: Environment } = {
  "development": DevEnvironment,
  "dev": DevEnvironment,
  "stg": StgEnvironment,
  "staging":StgEnvironment
};


export function getConfig(): Environment {
  const env = process.env.NODE_ENV || "dev";

  if(!(env in environments)) 
    throw Error(`Environment not found! Env: ${env}` );

  return environments[env];
}
