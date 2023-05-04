export interface HourlyForecastModel {
    
    number: number;
    name: string;
    startTime: Date;
    endTime: string;
    isDaytime: boolean;
    temperature: number;
    temperatureUnit: string;
    temperatureTrend: string;
    windSpeed: string;
    windDirection: string;
    icon: string;
    shortForecast: string;
    detailedForecast: string;
    chanceOfPrecipitation: number;

}