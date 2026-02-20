import { Component, isDevMode } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { PrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'wmsapp19';
  //mySubscription;
  
  constructor(private router: Router, private activatedRoute: ActivatedRoute){
    // this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    // this.mySubscription = this.router.events.subscribe((event) => {
    //   if (event instanceof NavigationEnd) {
    //      this.router.navigated = false;
    //   }
    // }); 
 }
 ngOnInit(){
  if (isDevMode()) {
    console.log('Development!');
  } else {
    console.log('Production!');
  } 
}
//  ngOnDestroy(){
//   if (this.mySubscription) {
//     this.mySubscription.unsubscribe();
//   }
// }

}
