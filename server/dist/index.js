'use strict';

var Graph = require("./graph").Graph;
var fs = require('fs');
var signale = require('signale');

var networkData = JSON.parse(fs.readFileSync('./netdata.json', 'utf8'));
var tracerouteData = JSON.parse(fs.readFileSync('./traceroute.json', 'utf8'));

console.log(Graph);
var g = new Graph();

anonRouter = function () {
    var routerName = 0;
    var lastAnonRouter = 0;
    return {
        getNewAnonRouter: function getNewAnonRouter() {
            routerName++;
            lastAnonRouter++;
            return "A" + routerName;
        },
        getLastAnonRouter: function getLastAnonRouter() {
            return "A" + lastAnonRouter;
        }
    };
}();

function getName(address) {
    for (var key in networkData) {
        if (networkData[key].alias.includes(address)) {
            return key;
        }
    }
    return address;
}

function getPath(from, to) {
    var i = 0;
    while (i < tracerouteData.length) {
        var trace = tracerouteData[i];
        if (getName(trace.from) === from && getName(trace.to) === to) {
            return trace;
        }
        i++;
    }
}

function addHop(currentHop, previousName, newNodeLabel, pathName) {
    if (pathName === undefined) console.trace();
    if (currentHop.success) {
        /* has replied */
        var currentName = getName(currentHop.address);
        if (!g.hasNode(currentName)) {
            g.setNode(currentName, newNodeLabel);
        }
        g.addEdge(previousName, currentName, pathName); // Add pathName as label of the graph to remember which trace trigger its insertion
    } else {
        /* Anonymous one */
        var _currentName = anonRouter.getNewAnonRouter();
        if (!g.hasNode(_currentName)) {
            g.addNode(_currentName, "A");
        }
        g.addEdge(previousName, _currentName, pathName);
    }
}

function phase1(routerID /*array*/) {

    g.setDefaultNodeLabel("R");
    routerID.forEach(function (element) {
        g.addNode(element);
    });
    tracerouteData.forEach(function (trace) {
        signale.await("Running trace");
        var originRouter = getName(trace.from);
        var destinationName = getName(trace.to);
        var pathName = trace.from + trace.to;

        var hops = trace.hops;
        if (hops[hops.length - 1].success) {
            /* If origin can communicate with destination */
            console.log("Traceroute can reach the destination");
            for (var _i = 0; _i < hops.length; _i++) {
                var currentHop = hops[_i];
                var previouName = void 0;
                if (_i == 0) {
                    previouName = originRouter;
                } else {
                    if (hops[_i - 1].success) {
                        previouName = getName(hops[_i - 1].address);
                    } else {
                        previouName = anonRouter.getLastAnonRouter();
                    }
                }
                addHop(currentHop, previouName, null, pathName);
            }
        } else {
            /* If origin cannot communicate with destination */
            console.log("Traceroute cannot reach the destination");
            if (trace.alreadyUsed || networkData[originRouter] === undefined) {
                // Avoid to consider a path already used as opposite path
                return;
            }
            signale.success("Found path that cannot communicate");

            var distance = networkData[originRouter].distance[destinationName];

            var oppositePath = getPath(destinationName, originRouter);

            oppositePath.alreadyUsed = true;
            var successAB = hops.length;
            var successBA = hops.length;
            var index = hops.length - 1;
            // Get how many success hops from A to B
            while (!hops[index].success) {
                successAB--;
                index--;
            }
            index = oppositePath.hops.length - 1;
            // Get how many success hops from B to A
            while (!oppositePath.hops[index].success) {
                successBA--;
                index--;
            }

            var middleStarRouter = distance - successAB - successBA;
            for (var _i2 = 0; _i2 < successAB; _i2++) {
                var _currentHop = hops[_i2];
                var _previouName = void 0;
                if (_i2 == 0) {
                    _previouName = originRouter;
                } else {
                    if (hops[_i2 - 1].success) {
                        _previouName = getName(hops[_i2 - 1].address);
                    } else {
                        _previouName = anonRouter.getLastAnonRouter();
                    }
                }
                addHop(_currentHop, _previouName, undefined, pathName);
            }
            addHop(hops[successAB - 1], anonRouter.getNewAnonRouter(), "NO-COOP", pathName);
            if (middleStarRouter > 1) {
                var _i3 = 1;
                while (_i3 < middleStarRouter - 1) {
                    var _previousNode = anonRouter.getLastAnonRouter();
                    g.addNode(anonRouter.getNewAnonRouter(), "HIDDEN");
                    g.addEdge(_previousNode, anonRouter.getLastAnonRouter(), pathName);
                    _i3++;
                }
                g.addNode(anonRouter.getNewAnonRouter(), "NO-COOP");
                g.addEdge(previousNode, anonRouter.getLastAnonRouter(), pathName);
            }
            for (var _i4 = successBA - 1; _i4 >= 0; _i4--) {
                var _currentHop2 = oppositePath.hops[_i4];
                var _previouName2 = void 0;
                if (_i4 < successBA - 1 && oppositePath.hops[_i4 + 1].success) {
                    _previouName2 = getName(oppositePath.hops[_i4 + 1].address);
                } else {
                    _previouName2 = anonRouter.getLastAnonRouter();
                }
                addHop(_currentHop2, _previouName2, null, pathName);
            }
            addHop(oppositePath.hops[0], destinationName, null, pathName);
        }
        signale.complete("New trace added");
    });
}

function phase2() {
    var validMerge = [];
    // Trace Preservation
    var edges = g.edges();
    for (var _i5 = 0; _i5 < edges.length; _i5++) {
        var pathi_id = g.edge({ v: edges[_i5].v, w: edges[_i5].w });
        validMerge.push(edges[_i5]);
        for (var j = 0; j < edges.length; j++) {
            if (_i5 === j) continue;
            var pathj_id = g.edge({ v: edges[j].v, w: edges[j].w });
            if (pathi_id === pathj_id) {}
        }
    }
    console.log(g.edges());
}

function iTop() {
    var routerID = [];
    for (key in networkData) {
        routerID.push(key);
    }
    phase1(routerID);
    //phase2();
};
iTop();

// TCP Server to receive Traceroute
net = require('net');
net.createServer(function (socket) {
    socket.on('data', function (data) {
        var trace = JSON.parse(data);
        tracerouteData.push(trace);
        // Resetting parameter in each trace
        tracerouteData.forEach(function (trace) {
            return trace.alreadyUsed = false;
        });
        g = new Graph();
        iTop();
    });
    socket.on('end', function () {
        process.stdout.write("communication close");
    });
    socket.on("error", function (err) {
        console.log(err);
    });
}).listen(5000);

// Webserver
var express = require('express');
var app = express();
app.set('view engine', 'pug');
app.use(express.static('views/assets'));
app.use('/assets', express.static('views/assets'));
app.get('/', function (req, res) {
    var nodes = g.nodes();
    var edges = g.edges();
    var nodes_res = [];
    for (var _i6 = 0; _i6 < nodes.length; _i6++) {
        var id = nodes[_i6];
        var label = g.node(id) || "";
        nodes_res.push({ id: id, label: id + "\n" + label });
    }
    var edges_res = [];
    for (i = 0; i < edges.length; i++) {
        var edge = edges[i];
        edges_res.push({ from: edge.start, to: edge.end });
    }
    res.render('network', { nodes: JSON.stringify(nodes_res), edges: JSON.stringify(edges_res) });
});
app.listen(3000, function () {
    return console.log('Example app listening on port 3000!');
});