import {CanActivateFn, Router} from '@angular/router';
import {inject} from "@angular/core";

export const authGuard: CanActivateFn = (route, state) => {
    if (sessionStorage.getItem('accessToken')) {
      return true;
      } else {
        console.log('authguard failed. guard is moving to home page');
        inject(Router).navigate(['']);
        return false;
    }
};
