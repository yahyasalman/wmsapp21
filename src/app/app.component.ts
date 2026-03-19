import { Component, isDevMode } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'Digital Workshop';
  
  constructor(private router: Router, private activatedRoute: ActivatedRoute){
 }
 ngOnInit(){
  if (isDevMode()) {
    console.log('Development!');
  } else {
    console.log('Production!');
  } 
}
}
