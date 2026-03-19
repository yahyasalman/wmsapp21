export const LOG_LEVEL = {
  info: 1,
  error: 2,
  warn: 3,
  debug: 4,
  all: 5,
} as const;

export const environment = {
    production: true,
      CDN_URL:'https://resources-aqafbng2e5acccgu.z01.azurefd.net',
      BASE_URL:'https://wmsapi-dhexdwcheaejf0gr.swedencentral-01.azurewebsites.net',
      logLevel: LOG_LEVEL.debug,
      Version:'2.13P'
  };