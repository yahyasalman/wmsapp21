import { HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { catchError } from 'rxjs';
import { Injectable } from '@angular/core';
import { LogService } from 'app/services/log.service';
import { Router } from '@angular/router';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
 constructor(private router: Router,private logger: LogService) {}
 
 intercept(request: HttpRequest<any>, next: HttpHandler) {
    const accessToken = sessionStorage.getItem('accessToken');
    if (accessToken) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`
        }
      });
    }
    return next.handle(request).pipe(
      catchError((error) => {
        if (error.status === 401 && accessToken) {
          sessionStorage.removeItem('accessToken');
          this.router.navigate(['']);
        }
        throw(error);
      })
    );
  }
}