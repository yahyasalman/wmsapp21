import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { DragDropModule } from 'primeng/dragdrop';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import svFile from 'primelocale/sv.json';
const { sv } = svFile;
import { definePreset } from '@primeng/themes';
import Material from '@primeng/themes/material';
import { LoggingInterceptor } from 'app/interceptor/logging.interceptor';
import { TokenInterceptor } from 'app/interceptor/token.interceptor';
export const MaterialPreset = definePreset(Material, {});
export const appConfig: ApplicationConfig = {
  providers: [
    // Zone Change Detection
    provideZoneChangeDetection({ eventCoalescing: true }),
    
    // Routing
    provideRouter(routes),
    
    // Animations - Use only provideAnimationsAsync (modern approach)
    provideAnimationsAsync(),
    
    // PrimeNG Configuration
    providePrimeNG({ 
      translation: sv,
      theme: {
        preset: MaterialPreset,
      }
    }),
    
    // HTTP Client
    provideHttpClient(withInterceptorsFromDi()),
    
    // HTTP Interceptors
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoggingInterceptor,
      multi: true
    },
    
    // Standalone Module Imports (if needed for specific features)
    importProvidersFrom(DragDropModule)
  ]
};