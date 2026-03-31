import { Version } from "@angular/core";
export const LOG_LEVEL = {
  info: 1,
  error: 2,
  warn: 3,
  debug: 4,
  all: 5,
} as const;

export const environment = {
    production: false,
    //BASE_URL:'https://wmstestapi-addgaegmecamcyb4.westeurope-01.azurewebsites.net',
    BASE_URL:'https://localhost:7061',
    logLevel: LOG_LEVEL.debug,
    Version:'2.13T'
  };

  //CDN_URL:'https://resources-aqafbng2e5acccgu.z01.azurefd.net',