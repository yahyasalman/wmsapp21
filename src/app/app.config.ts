
import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection,provideAppInitializer, inject, APP_INITIALIZER} from '@angular/core';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { DragDropModule } from 'primeng/dragdrop';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import svFile from 'primelocale/sv.json';
const { sv } = svFile;
import { MaterialPreset } from 'app/app.theme';
import { LoggingInterceptor } from 'app/interceptor/logging.interceptor';
import { TokenInterceptor } from 'app/interceptor/token.interceptor';
import { SharedService } from './services';
import { firstValueFrom } from 'rxjs';
export function loadResourcesFactory(sharedService: SharedService): () => Promise<void> {
  return () => firstValueFrom(sharedService.loadResources());
}
export const appConfig: ApplicationConfig = {
  providers: [
    SharedService,
    {
      provide: APP_INITIALIZER,
      useFactory: loadResourcesFactory,
      deps: [SharedService],
      multi: true
    },
    provideAnimationsAsync(),
        providePrimeNG({ 
          translation:sv,
            theme: {
                preset: MaterialPreset,
              //   options: {
              //     cssLayer: {
              //         name: 'primeng',
              //         order: 'tailwind-base,primeng,tailwind-utilities'
              //     }
              // }
            }
        }),
  provideZoneChangeDetection({ eventCoalescing: true }), 
  provideRouter(routes),
  importProvidersFrom(BrowserAnimationsModule),
  importProvidersFrom(DragDropModule),
  provideHttpClient(withInterceptorsFromDi()),  
  {
      provide:HTTP_INTERCEPTORS,
      useClass:TokenInterceptor,
      multi:true
  },
  { provide: HTTP_INTERCEPTORS, useClass: LoggingInterceptor, multi: true }
]
};

//  import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
// import { provideRouter } from '@angular/router';
// import { routes } from './app.routes';
// import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
// import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
// import { providePrimeNG } from 'primeng/config';
// import sv from 'primelocale/sv.json';
// import { MyPreset } from 'app/app.theme';
// import { LoggingInterceptor } from 'app/interceptor/logging.interceptor';
// import { TokenInterceptor } from 'app/interceptor/token.interceptor';
// import { SharedService } from './services';

// export const appConfig: ApplicationConfig = {
//   providers: [
//     provideZoneChangeDetection({ eventCoalescing: true }),
//     provideRouter(routes),
//     provideHttpClient(withInterceptorsFromDi()),
//     provideAnimationsAsync(),
//     providePrimeNG({ theme: { preset: MyPreset }, translation: sv }),

//     // Register DI-based interceptors so withInterceptorsFromDi picks them up
//     { provide: HTTP_INTERCEPTORS, useClass: LoggingInterceptor, multi: true },
//     { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },

//     // Optional app initializer (example)
//     {
//       provide: APP_INITIALIZER,
//       useFactory: (svc: SharedService) => () => svc.init(),
//       deps: [SharedService],
//       multi: true,
//     },
//   ],
// };
