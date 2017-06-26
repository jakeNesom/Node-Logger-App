//Client-Server communication using Websockets and Node.JS[express,socket.io]

//server.js

var express = require('express');

// For encoded URL - receiving a stringifyd JSON sent via POST URL
var bodyParser = require('body-parser');

var http = require('http');
var io = require('socket.io')(http);
var cors = require('cors');


var path = require("path");

var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');


// Connection URL, use the project name

var url = 'mongodb://localhost:27017/clientserverExpSockIO';


var app = express();

// npm bodyParser/Express setup https://www.npmjs.com/package/body-parser
app.use(bodyParser.json({ type: 'application/json' }));
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(require('connect').bodyParser());
//var jsonParser = bodyParser.json();

app.use(function (req, res, next) {

    // Didn't work:
    // http://stackoverflow.com/questions/24446797/how-to-resolve-cors-ie-same-origin-policy-in-angularjs
    //res.header('Access-Control-Allow-Origin', '*');
    //res.header('Access-Control-Allow-Headers', "Content-Type");


    // Bodyparser to help un-encode a JSON sent via URL POST


    //Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // following line was made in trying to debug /read/getall output - its outputting HTML should be jSON
    //res.setHeader('Content-Type', 'application/json');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

//app.use(cors());
//app.options('*', cors()); // pre-flight CORS enabled for all routes
app.set('view engine', 'ejs')



app.get('/write/log', function (req, res) {
    res.sendFile(__dirname + '/socket.html');
});


app.get('/', function (req, res) {
    res.send("Welcome to Logger");
});


app.get('/write/logbatch', function (req, res) {
    res.sendFile(__dirname + '/socket_batch.html');
});

app.get('/read/getall/', function (req, res) {
    //res.send("All the logged entries");

    MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        //console.log("Connected successfully to server");

        // Get the documents collection, using the collection json
        var collection = db.collection('json');
        //insert Json object
        //collection.insertOne(data,
        //function (err, result) {
        //   assert.equal(err, null);
        //   console.log("Inserted a document into the collection.");

        // Find some documents
        collection.find({}).toArray(function (err, docs) {
            assert.equal(err, null);

            // old code - this renders collection as HTML page - doesn't work with get Method 
            //res.render('index.ejs', { logs: JSON.stringify(docs) })

            // updated - this outputs colletion as JSON - able to be read by GET method
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(docs) /*, null, '\t'*/);

            // console.log("Found the following records");
            // console.log(docs)
            db.close();
        });
        //db.close();  
        // error where after collection has over 100 entries, it can't be read from - trying solution here:
        // http://stackoverflow.com/questions/39535287/why-mongodb-not-giving-me-more-than-100-documents
    })

});

// Using these instructions
// https://scotch.io/tutorials/use-expressjs-to-get-url-and-post-parameters

// POST is setup to receive strict JSON that's not URLENCODED 
app.post('/read/filterget', function (req, res) {

    console.log(req.headers);
    console.dir(req.body);

    //req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    // req.body.Property_Name is the syntax for the JSON properties sent by POST
    if (!req.body) return res.sendStatus(400);


    var params;

    if (req.body.data) {

        params = req.body.data;
        console.log('the data ' + JSON.stringify(params));

    } else { console.log("params not set"); }


    MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        console.log('mongodb connection opened');
        //console.log("Connected successfully to server");

        // Get the documents collection, using the collection json
        var collection = db.collection('json');
        //insert Json object
        //collection.insertOne(data,
        //function (err, result) {
        //   assert.equal(err, null);
        //   console.log("Inserted a document into the collection.");
       
        // Find some documents
        if (params.startTime && params.stopTime) {
            console.log("start & stop time set");
            collection.find({ time: { $gt: params.startTime, $lt: params.stopTime } }).toArray(function (err, docs) {
                assert.equal(err, null);

                // old code - this renders collection as HTML page - doesn't work with get Method 
                //res.render('index.ejs', { logs: JSON.stringify(docs) })

                // updated - this outputs colletion as JSON - able to be read by GET method
                res.setHeader('Content-Type', 'application/json');
                console.dir(docs);
               
                res.send( JSON.stringify(docs) );

                // console.log("Found the following records");
                // console.log(docs)
                db.close();
            });
        } else {
            console.log('Start & End time not available');
            collection.find({}).toArray(function (err, docs) {
                assert.equal(err, null);



                // updated - this outputs colletion as JSON - able to be read by GET method
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(docs) /*, null, '\t'*/);

                // console.log("Found the following records");
                // console.log(docs)
                db.close();
            });

        }
    });

});

var milliepoch = require('milli-epoch');
//process GET request from client side
//get all information from the filtered url parameters
app.get('/read/getfiltered', function (req, res) {
    
    console.dir(req.query);
    var errDatabase = "Must provide database info";
    if (req.query.database) {

        if (req.query.database == 'clientserverExpSockIO') {
            var url = 'mongodb://localhost:27017/clientserverExpSockIO';
            console.log('connected');
        }
        else
            var url = 'mongodb://localhost:27017/NodeDB';
        
    }
    else
        res.send(JSON.stringify(errDatabase));


    MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        console.log('connected');
        var collection = db.collection('json');
        var start;
        var end;
        if (req.query.startTime && req.query.stopTime) {
            start = parseInt(req.query.startTime);
            end = parseInt(req.query.stopTime);
        }
        else
            if (req.query.startTime) {
                start = parseInt(req.query.startTime);
                end = milliepoch.now();
            }
            else
                if (req.query.stopTime) {
                    start = 0;
                    end = parseInt(req.query.stopTime);
                }
        else {
            start = 0;
            end = milliepoch.now();
            }
        console.dir(start);
        console.dir(end);
        if (req.query.client && req.query.node && req.query.logType) {
            collection.find({ Client: req.query.client, Node: req.query.node, Time: { $gt: start, $lt: end }, LogType: req.query.logType }).toArray(function (err, docs) {
                assert.equal(err, null);
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(docs));
                db.close();
            });
        }
        else
            if (req.query.client && req.query.node) {
                collection.find({ Client: req.query.client, Node: req.query.node, Time: { $gt: start, $lt: end } }).toArray(function (err, docs) {
                    assert.equal(err, null);
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify(docs));
                    db.close();
                });
            }
            else
                if (req.query.client && req.query.logType) {
                    collection.find({ Client: req.query.client, Time: { $gt: start, $lt: end }, LogType: req.query.logType }).toArray(function (err, docs) {
                        assert.equal(err, null);
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify(docs));
                        db.close();
                    });
                }
                else
                    if (req.query.node && req.query.logType) {
                        collection.find({ Node: req.query.node, Time: { $gt: start, $lt: end }, LogType: req.query.logType }).toArray(function (err, docs) {
                            assert.equal(err, null);
                            res.setHeader('Content-Type', 'application/json');
                            res.send(JSON.stringify(docs));
                            db.close();
                        });
                    }
                    else
                        if (req.query.logType) {
                            collection.find({ Time: { $gt: start, $lt: end }, LogType: req.query.logType }).toArray(function (err, docs) {
                                assert.equal(err, null);
                                res.setHeader('Content-Type', 'application/json');
                                res.send(JSON.stringify(docs));
                                db.close();
                            });
                        }
                        else
                            if (req.query.client) {
                                collection.find({ Client: req.query.client, Time: { $gt: start, $lt: end } }).toArray(function (err, docs) {
                                    assert.equal(err, null);
                                    res.setHeader('Content-Type', 'application/json');
                                    res.send(JSON.stringify(docs));
                                    db.close();
                                });
                            }
                            else
                                if (req.query.node) {
                                    collection.find({ Node: req.query.node, Time: { $gt: start, $lt: end } }).toArray(function (err, docs) {
                                        assert.equal(err, null);
                                        res.setHeader('Content-Type', 'application/json');
                                        res.send(JSON.stringify(docs));
                                        db.close();
                                    });
                                }
                                else {
                                    collection.find({  Time: { $gt: start, $lt: end }}).toArray(function (err, docs) {
                                        assert.equal(err, null);
                                        res.setHeader('Content-Type', 'application/json');
                                        res.send(JSON.stringify(docs));
                                        db.close();
                                    });
                                }
    })

});

//get count of filtered elements
app.get('/read/getfiltered/count', function (req, res) {
   
    
    var errDatabase = "Must provide database info";
    if (req.query.database) {

        if (req.query.database == 'clientserverExpSockIO') {
            var url = 'mongodb://localhost:27017/clientserverExpSockIO';
            console.log('connected');
        }
        else
            var url = 'mongodb://localhost:27017/NodeDB';

    }
    else
        res.send(JSON.stringify(errDatabase));

    MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        console.log('connected');
        var collection = db.collection('json');

        var start;
        var end;
        if (req.query.startTime && req.query.stopTime) {
            start = parseInt(req.query.startTime);
            end = parseInt(req.query.stopTime);
        }
        else
            if (req.query.startTime) {
                start = parseInt(req.query.startTime);
                end = milliepoch.now();
            }
            else
                if (req.query.stopTime) {
                    start = 0;
                    end = parseInt(req.query.stopTime);
                }
                else {
                    start = 0;
                    end = milliepoch.now();
                }
        console.dir(start);
        console.dir(end);
        if (req.query.client && req.query.node && req.query.logType) {
            collection.count({ Client: req.query.client, Node: req.query.node, LogType: req.query.logType, Time: { $gt: start, $lt: end }},function (err, docs) {
                assert.equal(err, null);
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(docs));
                db.close();
            });
        }
        else
            if (req.query.client && req.query.node) {
                collection.count({ Client: req.query.client, Node: req.query.node, Time: { $gt: start, $lt: end }}, function (err, docs) {
                    assert.equal(err, null);
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify(docs));
                    db.close();
                });
            }
            else
                if (req.query.client && req.query.logType) {
                    collection.count({ Client: req.query.client, LogType: req.query.logType, Time: { $gt: start, $lt: end }}, function (err, docs) {
                        assert.equal(err, null);
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify(docs));
                        db.close();
                    });
                }
                else
                    if (req.query.node && req.query.logType) {
                        collection.find({ Node: req.query.node, LogType: req.query.logType, Time: { $gt: start, $lt: end }} ,function (err, docs) {
                            assert.equal(err, null);
                            res.setHeader('Content-Type', 'application/json');
                            res.send(JSON.stringify(docs));
                            db.close();
                        });
                    }
                    else
                        if (req.query.logType) {
                            collection.count({ LogType: req.query.logType, Time: { $gt: start, $lt: end }} ,function (err, docs) {
                                assert.equal(err, null);
                                res.setHeader('Content-Type', 'application/json');
                                res.send(JSON.stringify(docs));
                                db.close();
                            });
                        }
                        else
                            if (req.query.client) {
                                collection.count({ Client: req.query.client, Time: { $gt: start, $lt: end }} ,function (err, docs) {
                                    assert.equal(err, null);
                                    res.setHeader('Content-Type', 'application/json');
                                    res.send(JSON.stringify(docs));
                                    db.close();
                                });
                            }
                            else
                                if (req.query.node) {
                                    collection.count({ Node: req.query.node, Time: { $gt: start, $lt: end } }, function (err, docs) {
                                        assert.equal(err, null);
                                        res.setHeader('Content-Type', 'application/json');
                                        res.send(JSON.stringify(docs));
                                        db.close();
                                    });
                                }
                                else {
                                    collection.count({ Time: { $gt: start, $lt: end }},function (err, docs) {
                                        assert.equal(err, null);
                                        res.setHeader('Content-Type', 'application/json');
                                        res.send(JSON.stringify(docs));
                                        db.close();
                                    });
                                }
    })

});

//GET data logged by clients
app.get('/read/getfiltered/data', function (req, res) {

    
    var errDatabase = "Must provide database info";
    if (req.query.database) {

        if (req.query.database == 'clientserverExpSockIO') {
            var url = 'mongodb://localhost:27017/clientserverExpSockIO';
            console.log('connected');
        }
        else
            var url = 'mongodb://localhost:27017/NodeDB';

    }
    else
        res.send(JSON.stringify(errDatabase));

    MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        console.log('connected');
        var collection = db.collection('json');

        var start;
        var end;
        if (req.query.startTime && req.query.stopTime) {
            start = parseInt(req.query.startTime);
            end = parseInt(req.query.stopTime);
        }
        else
            if (req.query.startTime) {
                start = parseInt(req.query.startTime);
                end = milliepoch.now();
            }
            else
                if (req.query.stopTime) {
                    start = 0;
                    end = parseInt(req.query.stopTime);
                }
                else {
                    start = 0;
                    end = milliepoch.now();
                }
        console.dir(start);
        console.dir(end);
        if (req.query.client && req.query.node && req.query.logType) {
            collection.find({ Client: req.query.client, Node: req.query.node, Time: { $gt: start, $lt: end }, LogType: req.query.logType }, {Message: 1, LogType: 1, _id: 0}).toArray(function (err, docs) {
                assert.equal(err, null);
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(docs));
                db.close();
            });
        }
        else
            if (req.query.client && req.query.node) {
                collection.find({ Client: req.query.client, Node: req.query.node, Time: { $gt: start, $lt: end } }, { Message: 1, LogType: 1, _id: 0 }).toArray(function (err, docs) {
                    assert.equal(err, null);
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify(docs));
                    db.close();
                });
            }
            else
                if (req.query.client && req.query.logType) {
                    collection.find({ Client: req.query.client, Time: { $gt: start, $lt: end }, LogType: req.query.logType }, { Message: 1, LogType: 1, _id: 0 }).toArray(function (err, docs) {
                        assert.equal(err, null);
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify(docs));
                        db.close();
                    });
                }
                else
                    if (req.query.node && req.query.logType) {
                        collection.find({ Node: req.query.node, Time: { $gt: start, $lt: end }, LogType: req.query.logType }, { Message: 1, LogType: 1, _id: 0 }).toArray(function (err, docs) {
                            assert.equal(err, null);
                            res.setHeader('Content-Type', 'application/json');
                            res.send(JSON.stringify(docs));
                            db.close();
                        });
                    }
                    else
                        if (req.query.logType) {
                            collection.find({ Time: { $gt: start, $lt: end }, LogType: req.query.logType }, { Message: 1, LogType: 1, _id: 0 }).toArray(function (err, docs) {
                                assert.equal(err, null);
                                res.setHeader('Content-Type', 'application/json');
                                res.send(JSON.stringify(docs));
                                db.close();
                            });
                        }
                        else
                            if (req.query.client) {
                                collection.find({ Client: req.query.client, Time: { $gt: start, $lt: end } }, { Message: 1, LogType: 1, _id: 0 }).toArray(function (err, docs) {
                                    assert.equal(err, null);
                                    res.setHeader('Content-Type', 'application/json');
                                    res.send(JSON.stringify(docs));
                                    db.close();
                                });
                            }
                            else
                                if (req.query.node) {
                                    collection.find({ Node: req.query.node, Time: { $gt: start, $lt: end } }, { Message: 1, LogType: 1, _id: 0 }).toArray(function (err, docs) {
                                        assert.equal(err, null);
                                        res.setHeader('Content-Type', 'application/json');
                                        res.send(JSON.stringify(docs));
                                        db.close();
                                    });
                                }
                                else {
                                    collection.find({  Time: { $gt: start, $lt: end } }, { Message: 1, LogType: 1, _id: 0 }).toArray(function (err, docs) {
                                        assert.equal(err, null);
                                        res.setHeader('Content-Type', 'application/json');
                                        res.send(JSON.stringify(docs));
                                        db.close();
                                    });
                                }
    })

});
//GET distinct entries
app.get('/read/getfiltered/distinctClient', function (req, res) {
    var errDatabase = "Must provide database info";
    if (req.query.database) {

        if (req.query.database == 'clientserverExpSockIO') {
            var url = 'mongodb://localhost:27017/clientserverExpSockIO';
            console.log('connected');
        }
        else
            var url = 'mongodb://localhost:27017/NodeDB';

    }
    else
        res.send(JSON.stringify(errDatabase));

    MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        console.log('connected');
        var collection = db.collection('json');

        var start;
        var end;
        if (req.query.startTime && req.query.stopTime) {
            start = parseInt(req.query.startTime);
            end = parseInt(req.query.stopTime);
        }
        else
            if (req.query.startTime) {
                start = parseInt(req.query.startTime);
                end = milliepoch.now();
            }
            else
                if (req.query.stopTime) {
                    start = 0;
                    end = parseInt(req.query.stopTime);
                }
                else {
                    start = 0;
                    end = milliepoch.now();
                }
        console.dir(start);
        console.dir(end);
        if (req.query.node && req.query.logType) {
            collection.distinct('Client', { Node: req.query.node, LogType: req.query.logType, Time: { $gt: start, $lt: end } },function (err, docs) {
                assert.equal(err, null);
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(docs));
                db.close();
            });
        }
        else
            if ( req.query.node) {
                collection.distinct('Client', { Node: req.query.node, Time: { $gt: start, $lt: end }}, function (err, docs) {
                    assert.equal(err, null);
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify(docs));
                    db.close();
                });
            }
            else
                if (req.query.logType) {
                    collection.distinct('Client', { LogType: req.query.logType, Time: { $gt: start, $lt: end }}, function (err, docs) {
                        assert.equal(err, null);
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify(docs));
                        db.close();
                    });
                }
               
                else {
                    collection.distinct('Client', { Time: { $gt: start, $lt: end }} , function (err, docs) {
                        assert.equal(err, null);
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify(docs));
                        db.close();
                    });
                }
    })
});

app.get('/read/getfiltered/aggregate', function (req, res) {
    var errDatabase = "Must provide database info";
    console.dir(req.query);
    if (req.query.database) {

        if (req.query.database == 'clientserverExpSockIO') {
            var url = 'mongodb://localhost:27017/clientserverExpSockIO';
            console.log('connected');
        }
        else
            var url = 'mongodb://localhost:27017/NodeDB';

    }
    else
        res.send(JSON.stringify(errDatabase));

    MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        console.log('connected');
        var collection = db.collection('json');
        var start;
        var end;
        if (req.query.startTime && req.query.stopTime) {
            start = parseInt(req.query.startTime);
            end = parseInt(req.query.stopTime);
        }
        else
            if (req.query.startTime) {
                start = parseInt(req.query.startTime);
                end = milliepoch.now();
            }
            else
                if (req.query.stopTime) {
                    start = 0;
                    end = parseInt(req.query.stopTime);
                }
                else {
                    start = 0;
                    end = milliepoch.now();
                }
        console.dir(start);
        console.dir(end);
        if (req.query.client && req.query.node) {
            collection.aggregate([
                {
                    $match: { Time: { $gt: start, $lt: end }, Client: req.query.client, Node: req.query.node }
                },
                {
                    $group:
                    { _id: "$LogType", total: { $sum: 1 } }
                }
            ], function (err, docs) {
                assert.equal(err, null);
                console.log(docs);
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(docs));
                db.close();

            });
        }
        else
        if (req.query.node) {
            collection.aggregate([
                {
                    $match: { Time: { $gt: start, $lt: end }, Node: req.query.node }
                },
                {
                    $group:
                    { _id: "$Client", total: { $sum: 1 } }
                }
            ], function (err, docs) {
                assert.equal(err, null);
                console.log(docs);
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(docs));
                db.close();

            });
        }
        if (req.query.client) {
            collection.aggregate([
                {
                    $match: { Time: { $gt: start, $lt: end }, Client: req.query.client }
                },
                {
                    $group:
                    { _id: "$Node", total: { $sum: 1 } }
                }
            ], function (err, docs) {
                assert.equal(err, null);
                console.log(docs);
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(docs));
                db.close();

            });
        }
        else
            {
                collection.aggregate([
                    {
                        $match: { Time: { $gt: start, $lt: end } }
                    },
                    {
                        $group:
                        { _id: "$" + req.query.groupType, total: { $sum: 1 } }
                    }
                ], function (err, docs) {
                    assert.equal(err, null);
                    console.log(docs);
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify(docs));
                    db.close();

                });
            }
        })

 });

app.get('/read/getfiltered/ag2', function (req, res) {
    var errDatabase = "Must provide database info";
    console.dir(req.query);
    if (req.query.database) {

        if (req.query.database == 'clientserverExpSockIO') {
            var url = 'mongodb://localhost:27017/clientserverExpSockIO';
            console.log('connected');
        }
        else
            var url = 'mongodb://localhost:27017/NodeDB';

    }
    else
        res.send(JSON.stringify(errDatabase));

    var queryArr = [
        {
            $match: {}
        }
    ];

    var timeRange = { Time: { $gt: 0, $lt: 0 } };
    var groupQuery = { $group: { _id: '', total: { $sum: 1 } } }
    var start = 0, stop = 0, dataType = '';
    var returnData = [];

    for (var key in req.query) {
        var val = req.query[key].toString();

        if (key === 'startTime') {
            if (val) start = parseInt(val);
            else start = 0;
        }

        if (key === 'stopTime') {
            if (val) stop = parseInt(val);
            else stop = milliepoch.now();
        }
        if (key === 'groupType') {
            if (val) {
                groupQuery.$group._id = '$' + val;
            }
            else groupQuery.$group._id = '$Node';
        }


        if (key === 'Client' || key === 'Node' || key === 'LogType') {
            if (val) {
                queryArr.$match[key] = val;
            }

        }
    }

    queryArr.push(groupQuery);

    timeRange.Time.$gt = start;
    timeRange.Time.$lt = stop;
    queryArr[0].$match["Time"] = timeRange.Time;
    console.dir(queryArr);
    console.dir(queryArr[0].$match.Time);
    console.dir(queryArr[1].$group.total);
    
    MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        console.log('connected');
        var collection = db.collection('json');


        
        collection.aggregate(queryArr, function (err, docs) {
            assert.equal(err, null);
            console.log('docs: ' + JSON.stringify(docs));
            if (err) console.error(err);

            if (!req.query.timeArr) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(docs));
                db.close();
                return 'done';
            }
            else {

                return returnData[0] = [docs];

            }


        }).then(function () {
            if (req.query.timeArr) {

                for (var i = 0; i < req.query.timeArr.length - 1; i++) {
                    queryArr[0].$match.Time.$gt = parseInt(req.query.timeArr[i]);
                    queryArr[0].$match.Time.$lt = parseInt(req.query.timeArr[i + 1]);

                    collection.aggregate(queryArr, function (err, docs) {
                        assert.equal(err, null);
                        console.log('TimeArr Query docs of ' + i + ' ' + docs);
                        returnData[i + 1] = [docs]
                    });
                }
            }
            

            })

        console.log(JSON.stringify(returnData));
        for (var i = 0; i < req.query.timeArr.length - 1; i++ )
        {
            queryArr[0].$match.Time.$gt = parseInt(req.query.timeArr[i]);
            queryArr[0].$match.Time.$lt = parseInt(req.query.timeArr[i + 1]);

            collection.aggregate(queryArr, function (err, docs) {
                assert.equal(err, null);
                console.log('TimeArr Query docs of ' + i + ' ' + docs);
                returnData[i + 1] = [docs]
            });
        }
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(returnData));
        db.close();
             
    });
});

// all of the routes will be prefixed with /api
//app.use('/api', router);

//app.use(express.static('./public'));
//Specifying the public folder of the server to make the html accesible using the static middleware

var server = http.createServer(app).listen(3039);
//Server listens on the port 8124
io = io.listen(server);
/*initializing the websockets communication , server instance has to be sent as the argument */

io.sockets.on("connection", function (socket) {
    /*Associating the callback function to be executed when client visits the page and 
      websocket connection is made */

    var message_to_client = {
        data: "Connection with the server established"
    }
    socket.send(JSON.stringify(message_to_client));
    /*sending data to the client , this triggers a message event at the client side */
    console.log('Socket.io Connection with the client established');
    socket.on("message", function (data) {
        /*This event is triggered at the server side when client sends the data using socket.send() method */
        data = JSON.parse(data);

        //connect to mongoDB
        MongoClient.connect(url, function (err, db) {
            assert.equal(null, err);
            console.log("Connected successfully to server");

            // Get the documents collection, using the collection json
            var collection = db.collection('json');
            //insert Json object
            collection.insertOne(data,
                function (err, result) {
                    assert.equal(err, null);
                    console.log("Inserted a document into the collection.");

                    // Find some documents
                    // collection.find({}).toArray(function (err, docs) {
                    // assert.equal(err, null);
                    // console.log("Found the following records");
                    // console.log(docs)
                    // })
                    db.close();
                })
        })

        console.log(data);
        /*Printing the data */
        var ack_to_client = {
            data: "Server Received the message"
        }
        socket.send(JSON.stringify(ack_to_client));
        /*Sending the Acknowledgement back to the client , this will trigger "message" event on the clients side*/
    });

});

io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
});
