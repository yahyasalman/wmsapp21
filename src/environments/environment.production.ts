export const LOG_LEVEL = {
  info: 1,
  error: 2,
  warn: 3,
  debug: 4,
  all: 5,
} as const;

export const environment = {
      BASE_URL:'https://wmsapi-dhexdwcheaejf0gr.swedencentral-01.azurewebsites.net',
      logLevel: LOG_LEVEL.debug,
      Version:'2.13P'
  };