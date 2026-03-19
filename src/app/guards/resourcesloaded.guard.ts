// import { Injectable } from '@angular/core';
// import { CanActivateFn, Router } from '@angular/router';
// import { inject } from '@angular/core';
// import { SharedService } from 'app/services/shared.service';
// import { map, filter, take } from 'rxjs/operators';

// export const ResourcesLoadedGuard: CanActivateFn = () => {
//   const sharedService = inject(SharedService);
//   const router = inject(Router);

//   if (sharedService.areResourcesLoaded()) {
//     return true;
//   }
//   sharedService.loadResources();
//   return sharedService.resourcesLoaded$.pipe(
//     filter(loaded => loaded), 
//     take(1),
//     map(() => true)
//   );

// };

import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SharedService } from 'app/services/shared.service';
import { map, filter, take, timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const ResourcesLoadedGuard: CanActivateFn = () => {
  const sharedService = inject(SharedService);

  // Check if already loaded
  if (sharedService.areResourcesLoaded()) {
    return true;
  }

  // Load and wait for completion with modern timeout()
  return sharedService.loadResources().pipe(
    timeout(10000), // Modern RxJS 7.4+ approach - throws TimeoutError after 10s
    map(() => sharedService.areResourcesLoaded()),
    catchError((error) => {
      console.error('Resource loading timeout or error:', error);
      return of(false);
    }),
    take(1)
  );
};
