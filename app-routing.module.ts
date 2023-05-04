import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { ForecastComponent } from './forecast/forecast.component';


@NgModule({
  imports: [
    RouterModule.forRoot([
      { path: '', component: ForecastComponent },
    ])
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
