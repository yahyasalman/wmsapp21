import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SharedService } from 'app/services/shared.service';
import { map, filter, take } from 'rxjs/operators';

export const EnumsLoadedGuard: CanActivateFn = () => {
  const sharedService = inject(SharedService);
  const router = inject(Router);

  if (sharedService.areEnumsLoaded()) {
    return true;
  }
  sharedService.loadEnums();
  // Wait for enums to be loaded
  return sharedService.enumsLoaded$.pipe(
    filter(loaded => loaded), // wait until it's true
    take(1),
    map(() => true)
  );
};
