import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { catchError} from "rxjs/operators";


@Injectable({providedIn: "root"})


export class ForecastService{
latitude!: number;
longitude!: number;

cityName!: string;
newUrl!: string;

constructor(private http: HttpClient) {}

getForecastOffice(latitude: number, longitude: number): Observable<any>{

    const newUrl = "https://api.weather.gov/points/" + latitude + ","+ longitude
    return this.http.get<any>(newUrl).pipe(
        catchError(this.handleError)
    )
}
getHourlyForecast(hourlyForecastUrl: string): Observable<any>{
    return this.http.get<any>(hourlyForecastUrl).pipe(
        catchError(this.handleError)
    );
}

getDailyForecast(dailyForecastUrl: string): Observable<any>{
    return this.http.get<any>(dailyForecastUrl).pipe(
        catchError(this.handleError)
    );
}

getDetailForecast(detailForecastUrl: string): Observable<any>{
    return this.http.get<any>(detailForecastUrl).pipe(
        catchError(this.handleError)
    );
}

getAlerts(alertUrl: string): Observable<any>{
    return this.http.get<any>(alertUrl).pipe(
        catchError(this.handleError)
    );
}

private handleError(err: HttpErrorResponse){
    let errorMessage = "";
    if (err.error instanceof ErrorEvent) {
        errorMessage = `An error occurred: ${err.error.message}`;

    } else {
        errorMessage = `Server returned code: ${err.status}, error message is ${err.message}`;

    }
    console.error(errorMessage);
    return throwError(errorMessage);
}
}