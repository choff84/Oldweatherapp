import { Component, OnInit, ViewChild } from '@angular/core';
import { ForecastService } from './forecast.service';
import { DateTime } from "luxon";
import { HourlyForecastModel } from './hourly-forecast-api-response';
import { DetailForecastApiResponse } from './detail-forecast-api-response';
import { ForecastPeriodDTO } from './forecast-api-response';
import { AlertController } from '@ionic/angular';
import { forkJoin, timer } from 'rxjs';
import { AlertApiResponse, AlertHeadlineApiResponse } from './alert-api-response';
import { IonModal } from '@ionic/angular';
import { OverlayEventDetail } from '@ionic/core/components';
import{ Duration,Interval} from 'luxon'
import { Geolocation } from "@capacitor/geolocation";
import { Network } from '@capacitor/network';



@Component({
  selector: 'app-forecast',
  templateUrl: './forecast.component.html',
  styleUrls: ['./forecast.component.scss'],
})
export class ForecastComponent implements OnInit {
  
  minTemp!:number;
  maxTemp!: number;
  errorMessage = null;

  currentForecast!: HourlyForecastModel;
  currentDetailedForecast!: HourlyForecastModel;
  presentingElement = null;
  hourlyForecast!: HourlyForecastModel[];
  detailForecast!: HourlyForecastModel[];
  dailyForecastsDay!: HourlyForecastModel[];
  alertProperties!: AlertApiResponse;
  alertHeadline!: AlertHeadlineApiResponse[];
  chanceOfPrecipitationOver20!: DetailForecastApiResponse[];
  maxTemps: any;
  showMore: boolean = false;
  lengthDetailForecast!: string;
  lengthOfDetailForecast!: number;
  newLength!: boolean;
  latitude!: number;
  cityName!: string;
  isOnline = true;
  lastUpdatedTime!: Date;


  private hourlyForecastUrl = 'https://api.weather.gov/gridpoints/FGF/60,58/forecast/hourly' 
  private dailyForecastUrl = 'https://api.weather.gov/gridpoints/FGF/60,58/forecast'
  private detailForecastUrl = 'https://api.weather.gov/gridpoints/FGF/60,58'
  private alertUrl = "https://api.weather.gov/alerts/active/zone/NDZ038"
  

constructor(private forecastService: ForecastService, private alertController: AlertController) { }

  ngOnInit() {
   this.initializeNetworkStatus();
    this.test1()
    
    this.getLocation();
   // var time = Interval.fromISO("2022-07-20T15:00:00+00:00/PT6H");
    //this.presentingElement = document.querySelector('.ion-page');

  }
  
  getLocation():any{
    
    Geolocation.getCurrentPosition().then(position=>{
      this.updateForecastLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      })
    }).catch((error) => {
      console.log('Error getting location', error);
      this.updateForecastLocation(
        {
         latitude: 37.5531,
         longitude: -83.3835
       });
    });
}
  updateForecastLocation(location: any){
    this.forecastService.getForecastOffice(location.latitude, location.longitude).subscribe( serverData => {
    let cityName = serverData.properties.relativeLocation.properties.city;
    this.cityName=cityName
    this.hourlyForecastUrl = serverData.properties.forecastHourly;
    this.dailyForecastUrl = serverData.properties.forecast;
    this.detailForecastUrl = serverData.properties.forecastGridData;
    
    let str = serverData.properties.forecastZone;
    const n = 6;
    this.alertUrl = "https://api.weather.gov/alerts/active/zone/"+str.substring(str.length - n);
    

    this.callApi(()=> {
    
    })
})
  }
  
  showMoreClick(){
    this.showMore = !this.showMore;
  };
  
  
  handleHourlyForecast( serverData) {   
    let mappedForecasts = serverData.properties.periods.map(this.mapForecast);
    
    
    let forecastWithinTimeRange = mappedForecasts.filter((forecast: HourlyForecastModel) =>{
      const currentDateTime = DateTime.now(); 
      const cutOffDate = currentDateTime.plus({ hours: 12 });
      const forecastDateTime =  DateTime.fromJSDate(forecast.startTime);
      if (forecastDateTime < cutOffDate && forecastDateTime > currentDateTime){
        return true
      }
      else {
        return false
      }
    });

    
    this.hourlyForecast = forecastWithinTimeRange;
    
     this.currentForecast = serverData.properties.periods [0];
   
     
  }

  handleDailyForecast( serverData ){
    let dailyForecasts = serverData.properties.periods;
    this.lengthDetailForecast = serverData.properties.periods[0].detailedForecast
    //this.lengthDetailForecast = "a;lsjdfl;asdf";
    this.lengthOfDetailForecast = this.lengthDetailForecast.length

     //this.lengthOfDetailForecast = 20

    if (this.lengthOfDetailForecast <= 90) {
     this.newLength = true
     
   }
   else{
     
     
     this.test2()
   }
    
    
    let dailyForecastsDay = dailyForecasts.filter((forecast: HourlyForecastModel) =>{

      
      
      return forecast.isDaytime
     
 
    
     });
    
    this.dailyForecastsDay = dailyForecastsDay
    this.detailForecast = dailyForecastsDay
    this.currentDetailedForecast = this.detailForecast [0];
   
  }
  
  handleDetailForecast(serverData){
    let maxTemp = serverData.properties.maxTemperature.values [0].value;
    this.maxTemp = this.convertToF(maxTemp);
    let minTemp = serverData.properties.minTemperature.values [0].value;
    this.minTemp = minTemp
    this.minTemp = this.convertToF(minTemp);    
    let chanceOfPrecipitation = serverData.properties.probabilityOfPrecipitation.values
    let chanceOfPrecipitationOver20 = chanceOfPrecipitation.filter((forecast: DetailForecastApiResponse) =>{
      if (forecast.value >= 25 ){
        return true
      }
      else {
        return false
      }
    });
    this.chanceOfPrecipitationOver20 = chanceOfPrecipitationOver20
   // console.log(chanceOfPrecipitationOver20)
    
    
   
  }
  
  handleAlerts(serverData){
    if (serverData.features.length){
      let alertProperties = serverData.features[0].properties;
    
  
      this.alertProperties = alertProperties

    }
  }
  private callApi(callBack: Function){
   
    const observable = forkJoin([
      this.forecastService.getHourlyForecast(this.hourlyForecastUrl),
      this.forecastService.getDailyForecast(this.dailyForecastUrl),
      this.forecastService.getDetailForecast(this.detailForecastUrl),
      this.forecastService.getAlerts(this.alertUrl),
      
      timer(1000),
    ]);

    observable.subscribe({
     next:([hourlyForecast,dailyForecast,detailForecast,alert]) => {
      this.handleHourlyForecast(hourlyForecast);
      this.handleDailyForecast(dailyForecast);
      this.handleDetailForecast(detailForecast);
      this.handleAlerts(alert);
      this.getLastUpdated();
    },
    error: err =>{
      this.errorMessage = err;
      this.presentAlert();
   } ,
     
    complete: () => callBack(),
    });
  }
/*
    this.forecastService.getHourlyForecast().subscribe({
      next: serverData => {   
       let mappedForecasts = serverData.properties.periods.map(this.mapForecast);
       
       
       let forecastWithinTimeRange = mappedForecasts.filter((forecast: HourlyForecastApiResponse) =>{
         const currentDateTime = DateTime.now(); 
         const cutOffDate = currentDateTime.plus({ hours: 12 });
         const forecastDateTime =  DateTime.fromJSDate(forecast.startTime);
         if (forecastDateTime < cutOffDate && forecastDateTime > currentDateTime){
           return true
         }
         else {
           return false
         }
       });

       
       this.forecasts = forecastWithinTimeRange;
       
        this.currentForecast = serverData.properties.periods [0];
      
        
      },
      error: err =>{this.errorMessage = err
        this.presentAlert()
     } 
      
     });
     */
     /*this.forecastService.getDailyForecast().subscribe({
      next: serverData => {   
       let dailyForecasts = serverData.properties.periods;
       this.lengthDetailForecast = serverData.properties.periods[0].detailedForecast
       //this.lengthDetailForecast = "a;lsjdfl;asdf";
       this.lengthOfDetailForecast = this.lengthDetailForecast.length

        //this.lengthOfDetailForecast = 20

       if (this.lengthOfDetailForecast <= 90) {
        this.newLength = true
        
      }
      else{
        
        
        this.test2()
      }
       
       
       let dailyForecastsDay = dailyForecasts.filter((forecast: HourlyForecastApiResponse) =>{

         
         
         return forecast.isDaytime
        
    
       
        });
       
       this.dailyForecastsDay = dailyForecastsDay
       this.detailForecast = dailyForecastsDay
       this.currentDetailedForecast = this.detailForecast [0];
      },
      error: err => this.errorMessage = err
    });*/

   /* this.forecastService.getDetailForecast().subscribe({
      next: serverData => { 
         let maxTemp = serverData.properties.maxTemperature.values [0].value;
        this.maxTemp = this.convertToF(maxTemp);
        let minTemp = serverData.properties.minTemperature.values [0].value;
        this.minTemp = minTemp
        this.minTemp = this.convertToF(minTemp);    
        let chanceOfPrecipitation = serverData.properties.probabilityOfPrecipitation.values
        let chanceOfPrecipitationOver20 = chanceOfPrecipitation.filter((forecast: DetailForecastApiResponse) =>{
          if (forecast.value >= 25 ){
            return true
          }
          else {
            return false
          }
        });
        this.chanceOfPrecipitationOver20 = chanceOfPrecipitationOver20
        
        
       },
       error: err => this.errorMessage = err
   });  */  

  

  private  mapForecast(dto: ForecastPeriodDTO):HourlyForecastModel
  {
   return<HourlyForecastModel> {
     number: dto.number,
     shortForecast: dto.shortForecast,
     icon: dto.icon,
     temperature: dto.temperature,
     startTime: new Date(dto.startTime) ,
     chanceOfPrecipitation: -99
   }

  }

  private convertToF(degreesCelcius: number):number{
    let degreesF = degreesCelcius * 1.8 + 32;
    return degreesF; 
  } 

  async presentAlert() {
    const alert = await this.alertController.create({
      header: 'Alert!',
      message: this.errorMessage,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {}
        },
        {
          text: 'Retry',
          role: 'confirm',
          handler: () => {this.callApi(()=>{

          })}
        }
      ]
    });

    await alert.present();
  }

  doRefresh(event) {
    this.callApi(() => {
    
      event.target.complete();
    })
  }

test2(){
  this.newLength = false;
  
}


@ViewChild(IonModal) modal: IonModal;

message = 'This modal example uses triggers to automatically open a modal when the button is clicked.';
name: string;


confirm() {
  this.modal.dismiss();
}

onWillDismiss(event: Event) {
  const ev = event as CustomEvent<OverlayEventDetail<string>>;
  if (ev.detail.role === 'confirm') {
    this.message = `Hello, ${ev.detail.data}!`;
  }
}


getLastUpdated(){
  this.lastUpdatedTime = DateTime.now();

}
test1(){
  /*Network.getStatus().then( connectionStatus => {
  let netStatus = JSON.stringify(connectionStatus.connected)
  this.isOnline = (netStatus == "true")
  

  })*/
  Network.addListener('networkStatusChange', status => {
   
    let netStatus = JSON.stringify(status.connected)
    this.isOnline = (netStatus == "true")
    if (this.isOnline == true){
      this.callApi(()=> {
    
      })
    }
  
   
  });
}

initializeNetworkStatus(){
  Network.getStatus().then( connectionStatus => {
    let netStatus = JSON.stringify(connectionStatus.connected)
    this.isOnline = (netStatus == "true")
  })
}

}