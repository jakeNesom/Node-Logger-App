import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';

import { ChartModule } from 'angular2-highcharts';
import { HighchartsStatic } from 'angular2-highcharts/dist/HighchartsService';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { SetChart } from "./setChart.component";
import { DisplayComponent } from "./display.component";
import { LiveCount } from './liveCount.component';
import { LoggerService } from "./services/loggerdata.service";
import { DataManip } from "./services/dataManip.service"


// https://github.com/gevgeny/angular2-highcharts/issues/176
// issue with angular-cli apps using webpack and angular2-highcharts
export declare let require: any;
export function highchartsFactory() {
    const hc = require('highcharts/highstock');
    const dd = require('highcharts/modules/exporting');
    dd(hc);

    return hc;
}

@NgModule({
  declarations: [
    AppComponent,
    SetChart,
    DisplayComponent,
    LiveCount
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    BrowserAnimationsModule,
    ChartModule,
    NgbModule.forRoot(),
  ],
  providers: [
    LoggerService, 
    DataManip,
    {
    provide:HighchartsStatic,
    useFactory: highchartsFactory
    }
    ],
  bootstrap: [AppComponent]
})
export class AppModule { }
