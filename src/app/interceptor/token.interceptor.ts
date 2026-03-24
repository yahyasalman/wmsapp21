// import { HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
// import { catchError } from 'rxjs';
// import { Injectable } from '@angular/core';
// import { LogService } from 'app/services/log.service';
// import { Router } from '@angular/router';

// @Injectable()
// export class TokenInterceptor implements HttpInterceptor {
//  constructor(private router: Router,private logger: LogService) {}
 
//  intercept(request: HttpRequest<any>, next: HttpHandler) {
//     const accessToken = sessionStorage.getItem('accessToken');
//     if (accessToken) {
//       request = request.clone({
//         setHeaders: {
//           Authorization: `Bearer ${accessToken}`
//         }
//       });
//     }
//     return next.handle(request).pipe(
//       catchError((error) => {
//         if (error.status === 401 && accessToken) {
//           sessionStorage.removeItem('accessToken');
//           this.router.navigate(['']);
//         }
//         throw(error);
//       })
//     );
//   }
// }
import { HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { catchError } from 'rxjs';
import { Injectable } from '@angular/core';
import { LogService } from 'app/services/log.service';
import { Router } from '@angular/router';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(private router: Router, private logger: LogService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler) {
    const accessToken = sessionStorage.getItem('accessToken');

    // Define the CDN URLs where the Authorization header should not be included
    const excludedUrls = [
      'https://resources-aqafbng2e5acccgu.z01.azurefd.net/resources/', // Replace with your CDN base URL
      `${window.location.origin}/assets/` // Example for local assets if needed
    ];

    // Check if the request URL matches any of the excluded URLs
    const isExcluded = excludedUrls.some((url) => request.url.startsWith(url));

    // Add Authorization header only if the URL is not excluded
    if (accessToken && !isExcluded) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error) => {
        // Handle 401 Unauthorized errors
        if (error.status === 401 && accessToken) {
          sessionStorage.removeItem('accessToken');
          this.router.navigate(['']);
        }
        throw error;
      })
    );
  }
}
