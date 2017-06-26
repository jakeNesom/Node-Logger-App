import { Input, Component, OnInit, PipeTransform, Pipe, AfterContentInit, DoCheck, ViewChild, OnDestroy} from '@angular/core';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import {  trigger, state, animate, transition, style, keyframes} from '@angular/animations';

import { Subscription } from 'rxjs/Subscription';

import { Dataset } from './definitions/dataset';


import { LiveCount } from './liveCount.component';

import { LoggerService } from './services/loggerdata.service';
import { DataManip } from './services/dataManip.service';



@Component({
  selector: 'displayComponent',
  templateUrl: 'views/display.html',
  styleUrls: ['css/display.css'],
  animations: [
     trigger('hideFilters', [
       state('0' , style({ transform: 'translate3d(0,0,0)' })),
       state('1', style({  transform: 'translate3d(0, -200%, 0)', display: 'none' })),
      // state('0' , style({ opacity: 1, /*transform: 'scale(1.0)'*/ })),
      // state('1', style({ display:'none', height: 0, opacity: 0, /*transform: 'scale(0.0)'*/  })),
      transition('1 => 0',
      //style({height: 10, opacity: 0}),
      animate( '1000ms 500ms ease-in', keyframes([
        style({  transform: 'translate3d(0, -200%, 0)', offset: 0 }),
        style({ transform: 'translate3d(0, 3%, 0)', offset: 0.6 }),
        style({ transform: 'translate3d(0, 0, 0)', offset: 1.0 })

      ]))
      ), 
      transition('0 => 1', animate('1000ms 500ms ease-out' , keyframes([
        style({  transform: 'translate3d(0, 0, 0)', offset: 0 }),
        style({ transform: 'translate3d(0, 3%, 0)', offset: 0.3 }),
        style({ transform: 'translate3d(0, -200%, 0)', offset: 1.0 })
      ]))
     )]),
    trigger('flyOutIn', [
    state('1', style({ transform: 'translate3d(0,0,0)' })),
    state('0', style({ transform: 'translate3d(-103%, 0,0)' })),
    transition('1 => 0', 
      animate('0.4s 100ms ease-out', keyframes([
        style({ transform: 'translate3d(0,0,0)', offset: 0 }),
        style({ transform: 'translateX(20px)', offset: 0.3 }),
        style({ transform: 'translate3d(-103%,0,0)', offset: 1.0 })
      ])) 
    ),
    transition( '0 => 1', 
      animate( '0.4s 1000ms ease-in',  keyframes([
        style({ transform: 'translate3d(-103%,0,0)', offset: 0 }),
        style({ transform: 'translate3d(15px, 0, 0)', offset: 0.3 }),
        style({ transform: 'translate3d(0,0,0)', offset: 1.0 })
      ]))  
    ),
    // transition('0 => 1', [
    //   animate('0.2s 10 ease-out', style({
    //     opacity: 0,
    //     transform: 'translateX(100%)'
    //   }))
    //])
  ])

  ]
  
  
})



export class DisplayComponent implements OnDestroy  { 
    message: any;
    subscription: Subscription;

    @ViewChild(LiveCount) childcomp: LiveCount;

 
  /**** Animations ****/

  public flyOutIn:boolean = true;
  public hideShow:boolean = true;




  public dataset:Dataset[] = [];
  public clientTotals:any = {};
  public clientList:string[] = [];

  public currentClient = "ALL";
  public currentNode = "ALL";
  public timeFilter = "ALL";
  public currentColor: string;
  
  public activelyLookForData: boolean = false;
  public myInterval: any;
  public intervalStarted: boolean = false;
  
  public allData = {
    clientTotals:<any>[{client: "", total: ""}],
    clientList: <any> [],
    currentClient: "ALL",
    nodeList:<any> ["Node TA", "Node TB", "Node TC"],
    currentNode: "ALL",
    timeList: <any> ["ALL", "Last 30", "Last 5"],
    timeFilter: "ALL",

  }

  public filterArray: string[] = [this.allData.currentClient, this.allData.currentNode, this.allData.timeFilter];

  constructor(public loggerService: LoggerService,
      public dataManip: DataManip) {

      // subscribe to LiveCount component messages
      this.subscription = this.dataManip.getMessage()
          .subscribe(message => { this.messageReceived(message); });
  }

  ngOnDestroy() {
      // unsubscribe to ensure no memory leaks
      this.subscription.unsubscribe();
  }


   ngOnInit(): void {


    //this.loggerService.getLoggerData()
    //  .then(dataset => this.setData(dataset) );
  }


   messageReceived(message: any) {
       this.message = message;
       // make sure message is related to this function, if not, do nothing
       // message.text2 in this case should be a color hex code so verifying if the '#' symbol is in the string
       if (message.text.toLowerCase().indexOf('node') !== -1 && message.text2.indexOf('#') !== -1)
       {
           this.nodeChange(message.text.toLowerCase(), message.text2);
       }
       
       
   }
 
  setData(dataset:any) 
  {
    this.dataset = dataset;
    this.dataset = this.dataset.slice();
    
    this.setClientList();
    this.setNodeList();

  }
    //access a service component to populate client options list

    //watch options menu for changes, execute functions based on which option selected

 
  
  setClientList() 
  {
    
     let items:any = [];
     items.push("ALL");
    //create labels array which fills 'pieChartLables[]'
    // create clientTotals object keys dynamically from current clients
     for(let x = 0; x < this.dataset.length; x++)
     {
       
      
        if (items.indexOf(this.dataset[x].client) === -1 )
        {
          items.push(this.dataset[x].client);
          
        }
      }
      items.sort();
      this.allData.clientList = items;
  }
  
  setNodeList() 
  {
    
     let items:any = [];
     items.push("ALL");
    //create labels array which fills 'pieChartLables[]'
    // create clientTotals object keys dynamically from current clients
     for(let x = 0; x < this.dataset.length; x++)
     {
      
        if (items.indexOf(this.dataset[x].node) === -1 )
        {
          items.push(this.dataset[x].node);
          
        }
      }

      items.sort();
      this.allData.nodeList = items;
  }

  clientChange(value:string)
  {
    this.allData.currentClient = value;
    this.currentClient = value;
    //console.log(this.allData.currentClient);
  }

  nodeChange(value:string, color?:string)
  {
    this.allData.currentNode = value;
    this.currentNode = value;
    this.currentColor = color;
    //console.log(this.allData.currentNode);
  }

  timeChange(value:string)
  {
    this.allData.timeFilter = value;
    this.timeFilter = value;
    //console.log(this.allData.timeFilter);
  }

  toggleCheck ()
  {
    if( this.activelyLookForData == true ) this.activelyLookForData = false;
    else 
    {
    
    //this.loggerService.getLoggerData()
    //.then(dataset => this.setData(dataset) );
    
    this.activelyLookForData = true;
    
     setTimeout( () => {
      
        this.activelyLookForData = false;
     }, 3000) 
      
    }
  }

  intervalCheckNewData () {

    // because setInterval acts on the window, any functions inside
    // lose their association with DisplayComponent so we create 
    // _this which points to "DisplayComponent"
    let vm = this;
    this.myInterval = setInterval(function () 
    { 
      // if statement toggle triggers setChart Component OnChange()
      // to force it to get new data
      if(vm.activelyLookForData == false)
      {
        vm.activelyLookForData = true;
      } else { vm.activelyLookForData = false; }
      
     // console.log("Interval Iteration");
      vm.getDataFromService();
      
    
    }, 5000);
  }

  getDataFromService () {
     //this.loggerService.getLoggerData()
     //   .then(dataset => this.setData(dataset) );
       
  }

  stopIntervalCheckNewData () {
    clearInterval(this.myInterval);
    //console.log("Interval cleared");
    this.activelyLookForData = false;
  }

  toggleInterval () {

    if(this.intervalStarted == false )
    {
      this.intervalStarted = true;
      this.intervalCheckNewData();
    }
    else {
      this.intervalStarted = false;
      this.stopIntervalCheckNewData();
    }

  }
  resetSelect ()
  {
    this.currentClient = "ALL";
    this.currentNode = "ALL";
    this.timeFilter = "ALL";
    this.allData.timeFilter = "ALL";
    this.allData.currentClient = "ALL";
    this.allData.currentNode = "ALL";
  }

 /** Animations  **/

 toggleFilters () {

   if(this.hideShow == true && this.flyOutIn == true ) 
   { 
     this.flyOutIn = false;
     let variable = this.flyOutIn;
     this.hideShow = false;
    // console.log("FlyOutIn == " + variable)
   }
   else { 
     this.hideShow = true; 
     this.flyOutIn = true;
  }
   //console.log("toggle activated");
 }


 sendGet() {
     this.loggerService.getRangeFilter({ 'client': 'client 6', 'node': 'node 1', 'database': 'clientserverExpSockIO' }, 'obj' )
         .subscribe(data => console.dir(data) );
     //console.log('display.controller.sendGet() fired ');

    // this.loggerService.getRangeFilter();

     //this.loggerService.getRangeFilterC();
    // this.loggerService.simpleGet();
 }

 }
