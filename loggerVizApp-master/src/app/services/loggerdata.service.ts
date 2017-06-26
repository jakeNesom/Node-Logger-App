import { Injectable } from '@angular/core';
import { Headers, Http, Response, RequestOptions, URLSearchParams } from '@angular/http';


// Observable class extensions
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';

// Observalbe operators
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/mergeMap';

import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

import { Dataset } from '../definitions/dataset';

interface FilterType {
    'db': 'db1' | 'db2' | 'db3'
    'startTime': number,
    'stopTime': number,
    'client': string,
    'node': string,
    'logType': 'info' | 'error' | 'exception' | 'trace' | 'debug' | '',
    '_id'?: string,
    'returnType': 'count' | 'obj' | 'objPart',
    'range':string
    
}

@Injectable ()
export class LoggerService {

    //private loggerUrl = 'api/loggerData';
    private loggerURL = 'http://localhost:3039/read/getall/';
    private filterURL = 'http://localhost:3039/read/filterget'; // POST URL - depricated
    private objURL = 'http://localhost:3039/read/getfiltered'; // returns entire log objects
    private objPartURL = 'http://localhost:3039/read/getfiltered' // returns Message, LogType, _id?
    private generalCountURL = 'http://localhost:3039/read/getfiltered/aggregate'; //returns count
    private uniqueCountURL = 'http://localhost:3039/read/getfiltered/count'; // returns count by Node, Client, LogType, filter by time

    private subject = new Subject<any>();
    private headers: Headers;
    private options: RequestOptions;

    // time in milliseconds - used in filtering dataset by time
    public timeIntObj = {
        'lastFive': 300000,
        'last30': 1800000,
        'lastHour': 3600000,
        'last24': 86400000,
        'last7Days': 604800000,
        'last30Days': 2592000000,
        'ALL': 2592000000 * 24

    };

    public filterObj:any = {
        'database': 'clientserverExpSockIO',
        'startTime': new Date().getTime() - 1800000,
        'stopTime': new Date().getTime(),
        'Client': '',
        'Node': '',
        'LogType': '',
        'returnType': 'count',
        'range': 'last30',
        'groupType': 'Node',
        'timeArr': []

    }

    public data: any;

    

    constructor(private http: Http)
    {
        this.headers = new Headers({
            'Content-Type': 'application/json'
            
        });
        this.options = new RequestOptions({ headers: this.headers });
    }


    // rxjs subject 
    //// http://jasonwatmore.com/post/2016/12/01/angular-2-communicating-between-components-with-observable-subject

    private vm = this;
    sendMessage(message: any) {
        this.subject.next({ data: message });
    }

    clearMessage() {
        this.subject.next();
    }

    getMessage(): Observable <any> {
        return this.subject.asObservable();
    }



    getClients(): Promise<any> {
        return 
    }

   

    // POST version
    

    setStartStopTime(timeRange: string) {
        let stopTime = new Date().getTime();
        let startTime;
        for (let key in this.timeIntObj) {
            if (timeRange === key)
            {
                startTime = stopTime - this.timeIntObj[key];
            }

        }
        if (!startTime) { console.log('error loggerService.setStartStopTime - startTime not set - check inputs'); }
        this.filterObj.startTime = startTime;
        this.filterObj.stopTime = stopTime;
    }

    getRange2(time?:string): Observable<any>
    {
        this.setStartStopTime(time);
        let data = {
            "data": {
                "startTime": this.filterObj.startTime,
                "stopTime": this.filterObj.stopTime
            }
        };
        let headers = new Headers({ 'Content-Type': 'application/json' });
        let options = new RequestOptions({ headers: headers });
        const url = this.objURL;

        return this.http.post(url, JSON.stringify(data), options)
            .map(this.extractData)
            .catch(this.handleError);
    }

    

    // https://hassantariqblog.wordpress.com/2016/12/03/angular2-http-get-with-complex-object-as-query-string-term-using-observable-in-angular-2-application/
    getRangeFilter(filter: any, returnType: string, startTime?, stopTime?): Observable<any> {
        let URL: string;

        if (startTime && stopTime) {
            filter.startTime = startTime;
            filter.stopTime = stopTime;
        }
        if (!returnType) returnType = this.filterObj.returnType;
        if ( returnType === 'genCount') URL = this.generalCountURL;
        else if ( returnType === 'obj') URL = this.objURL;
        else if ( returnType === 'objPart') URL = this.objPartURL;

        let params: URLSearchParams = new URLSearchParams();

        if (filter) {
            for (let key in filter) {
                // modkey is to deal with key capitalization differences between Node.js express route && mongodb property key names
                let modKey = key.charAt(0).toLowerCase() + key.slice(1);
                if (filter.hasOwnProperty(key)) {
                    let val = filter[key];
                    params.set(modKey, val);
                }
            }
        }
        this.options = new RequestOptions({ headers: this.headers, search: params });
        console.log(URL + ' ' + params.toString() + " " + JSON.stringify(this.headers) ); // Log for testing
        return this.http
            .get(URL, this.options)
            .map(this.extractData)
            .catch(this.handleError);
      

    }

    getFullAndIncrement(filter: any, returnType: string, timeArr:any[]): Observable<any> {
        let URL: string = "http://localhost:3039/read/getfiltered/ag2";
        let localOpts: any;
        let data: any = {
            'filters': [],
            'series': []
        };
        
        filter.timeArr = timeArr;

        let params: URLSearchParams = new URLSearchParams();

        params = this.setParams(filter);
        console.dir(params);
        localOpts = new RequestOptions({ headers: this.headers, search: params });

        console.log('getFullAndIncrement() :' + URL + ' ' + params.toString() + " " + JSON.stringify(this.headers)); // Log for testing

        return this.http
            .get(URL, localOpts)
            .map(this.extractData)
            .catch(this.handleError);


    }

    getMultiple(filter: any, returnType: string, timeArr?: any[]): Observable<any> {
        let URL: string;
        let localOpts: any;
        let data: any = {
            'filters': [],
            'series': []
        };
        let observableArr = [];

        if (!returnType) returnType = this.filterObj.returnType;
        if (returnType === 'genCount') URL = this.generalCountURL;
        else if (returnType === 'obj') URL = this.objURL;
        else if (returnType === 'objPart') URL = this.objPartURL;

        let params: URLSearchParams;
        

        // first get unique items for complete time-span
        if (filter) {
            params = this.setParams(filter);
            localOpts = new RequestOptions({ headers: this.headers, search: params });
            observableArr[0] = this.http
                .get(URL, localOpts)
                .map(this.extractData)
                .catch(this.handleError)

            
        }
        for (let i = 0; i < timeArr.length - 1; i++)
        {
            filter.startTime = timeArr[i];
            filter.stopTime = timeArr[i + 1];
            params = this.setParams(filter);
            localOpts = new RequestOptions({ headers: this.headers, search: params });

            observableArr[i + 1] = this.http
                .get(URL, localOpts)
                .map(this.extractData)
                .catch(this.handleError)
            
        }

        return Observable.forkJoin(observableArr);
     
        
    }

    getMultipleFM(filter: any, returnType: string, timeArr?: any[]): Observable<any> {
        // Flatmap version of getMultiple()

        let URL: string;
        let localOpts: any;
        let data: any = {
            'filters': [],
            'series': []
        };
        let observableArr = [];

        if (!returnType) returnType = this.filterObj.returnType;
        if (returnType === 'genCount') URL = this.generalCountURL;
        else if (returnType === 'obj') URL = this.objURL;
        else if (returnType === 'objPart') URL = this.objPartURL;

        let params: URLSearchParams;


        // first get unique items for complete time-span
        if (filter) {
            params = this.setParams(filter);
            localOpts = new RequestOptions({ headers: this.headers, search: params });
            
            observableArr[0] = function () {
               return this.http
                    .get(URL, localOpts)
                    .map(this.extractData)
                    .catch(this.handleError);
            }

        } else {
            return;
        }
        for (let i = 0; i < timeArr.length - 1; i++) {
            filter.startTime = timeArr[i];
            filter.stopTime = timeArr[i + 1];
            params = this.setParams(filter);
            localOpts = new RequestOptions({ headers: this.headers, search: params });

            observableArr[i + 1] = function (docs) {
              
            let results2 = this.http
                    .get(URL, localOpts)
                    .map(this.extractData)
                    .catch(this.handleError)

             return docs.push(results2);
            }
        }
        let results = [];
        return observableArr[0]()
            .switchMap(res => observableArr[1](res) )
            .switchMap(res => observableArr[2](res))
            .switchMap(res => observableArr[3](res))
            .switchMap(res => observableArr[4](res))
            .switchMap(res => observableArr[5](res));
        



    }

    private setParams(filter)
    {
        let params: URLSearchParams = new URLSearchParams();
        for (let key in filter) {
            // modkey is to deal with key capitalization differences between Node.js express route && mongodb property key names
            //let modKey = key.charAt(0).toLowerCase() + key.slice(1);
            if (filter.hasOwnProperty(key)) {
                let val = filter[key];
                params.set(/*modkey*/ key, val);
            }
        }

        return params; 
    }

    private extractData(res: Response) {
        let body = res.json();  
        return body || { };
    }
    private handleError(error: any) {
        let errMsg = (error.message) ? error.message :
            error.status ? `${error.status} - ${error.statusText}` : 'Server error';
        console.error(errMsg);
        return Observable.throw(errMsg);
    }



    addFilter(filterVal: any, filterKey?: string) {
        if (typeof filterVal === 'string' && filterVal.indexOf('node') !== -1) filterKey = 'node';
        else if (typeof filterVal === 'string' && filterVal.indexOf('client') !== -1) filterKey = 'client';

        for (let filter in this.filterObj)
        {
            if (filterKey === filter)
            {
                this.filterObj[filter] = filterVal;
            }
        }
    }

    removeFilterVal(filterKey: string): void {
        switch (filterKey) {
            case 'db':
                this.filterObj[filterKey] = 'db1';
                break;
            case 'startTime':
                this.filterObj[filterKey] = 0;
                break;
            case 'endTime':
                this.filterObj[filterKey] = 0;
                break;
            case 'Node':
                this.filterObj[filterKey] = '';
                break;
            case 'Client':
                this.filterObj[filterKey] = '';
                break;
            default:
                console.log('removeFilterVal parameter not correct value');
                break;
        }
        
        
    }

    resetAllFilters(): void {
        for (let filterKey in this.filterObj) {


            switch (filterKey) {
                
                case 'startTime':
                    this.filterObj[filterKey] = 0;
                    break;
                case 'endTime':
                    this.filterObj[filterKey] = 0;
                    break;
                case 'Node':
                    this.filterObj[filterKey] = '';
                    break;
                case 'Client':
                    this.filterObj[filterKey] = '';
                    break;
                default:
                    console.log('removeFilterVal parameter not correct value');
                    break;
            }
        }
    }
}