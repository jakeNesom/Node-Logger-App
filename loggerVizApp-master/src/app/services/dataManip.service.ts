import { Injectable } from '@angular/core';


import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

import { Dataset } from '../definitions/dataset';

@Injectable()
export class DataManip {

    public data: any;
    public clientArr: any[] = [];
    public nodeArr: any[] = [];
    seriesName: string;


    public showSetChartList: boolean; 
    /* because setting a function in the angularhighcharts chart options doesnt' recognize the correct 'this' from the 
    component from which it's initialized but does recognize functions called from services, will use this service to
    call functions that will change the setChart.html view */


    setListArr(data:any, type: "Client" | "Node" | "LogType" ) {
        
        let arr: any[] = [];

        for (let entry in data)
        {
            let hasProp = false;
            for (let item in arr)
            {
                if (arr[item] == data[entry][type])
                {
                    hasProp = true;
                    break;
                }
            }
            if (hasProp === false) {
                arr.push(data[entry][type]);
            }
            
        }
        return arr;
    }

    getUniqueKeys (data: any, type: "Client" | "Node" | "LogType" | "_id") {
        // get an array of keys to use as chart.series.name strings
        let arr: any[] = [];

        for (let entry in data) {
            if( data[entry][type] )
            {
                arr.push(data[entry][type]);
            }
            
        }
        return arr.sort();
    }


    filterDataset(data:any, itemName: any, type: "Node" | "Client" | "LogType") {
        
        let i = 0;
        while (i < data.length)
        {
            if (data[i][type] != itemName)
            {
                data.splice(i, 1);
            } else i++
        }

        return data;
    }

    filterDataByClient() {

    }

    genChartTitle(filter: any, datType:string ) {
        let title: string = '';
        let timeRange = ["Last 5 min", "Last 30 min", "Last Hour",
            "Last 24 Hours", 'Last Week', "Last Month", "2 years"] 
        //if (!filter.Client && !filter.Node && !filter.LogType)
        //{
        //    title += "All ";
        //}

       

            for (let key in filter) {
                if (key === 'Client' || key === 'Node' || key === 'LogType')
                {
                    if (filter[key]) {
                        title += filter[key].toString() + " ";
                    }
                    else title += "All " + key.toString() + "s, ";
                }
             }
        
        if (datType) { title += 'By ' + datType }
        title += " Over ";

        title += this.rangeToKey(filter.range);

        return title
    }

    rangeToKey(input: string) {

        switch (input) {
            case "lastFive":
                return "Last 5 min";
            case "last30":
                return "Last 30 min";
            case "lastHour":
                return "Last Hour";

            case "last24":
                return "Last Day";

            case "last7Days":
                return "Last Week";

            case "last30Days":
                return "Last 30 Days";

            case "ALL":
                return "All Time"

        };
    }
    // On Subjects / Observables 
    // http://jasonwatmore.com/post/2016/12/01/angular-2-communicating-between-components-with-observable-subject
    private subject = new Subject<any>();

    sendMessage(message: string, message2?: any) {
        this.subject.next({ text: message, text2: message2 });
    }

    clearMessage() {
        this.subject.next();
    }

    getMessage(): Observable<any> {
        return this.subject.asObservable();
    }



    

    selected(type: string) {
        console.log("selected() works")
    }

    graphClicked(name: string) {
        this.seriesName = name;
        console.log("series name " + this.seriesName);
    }
}