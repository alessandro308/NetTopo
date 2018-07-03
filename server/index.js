const Graph = require("@dagrejs/graphlib").Graph
var fs = require('fs');
const signale = require('signale');

const networkData = JSON.parse(fs.readFileSync('./netdata.json', 'utf8'));
const tracerouteData = JSON.parse(fs.readFileSync('./traceroute.json', 'utf8'));

let g = new Graph({ directed: true, compound: false, multigraph: true });

anonRouter = function(){
    let routerName = 0;
    let lastAnonRouter = 0;
    return {
        getNewAnonRouter: function(){
            routerName++;
            lastAnonRouter++;
            return "A"+routerName;
        },
        getLastAnonRouter: function(){
            return "A"+lastAnonRouter;
        }
    }
}();

function getName(address){
    for (var key in networkData) {
        if(networkData[key].alias.includes(address)){
            return key;
        }
    }
    return address;
}

function getPath(from, to){
    let i = 0;
    while(i<tracerouteData.length){
        let trace = tracerouteData[i];
        if(getName(trace.from) === from && getName(trace.to) === to){
            return trace;
        }
        i++;
    }
}

function addHop(currentHop, previousName, newNodeLabel){
    if(currentHop.success){ /* has replied */
        let currentName = getName(currentHop.address);
        if(!g.hasNode(currentName)){
            g.setNode(currentName, newNodeLabel);
        }
        g.setEdge(previousName, currentName)
    }else{ /* Anonymous one */
        let currentName = anonRouter.getNewAnonRouter();
        if(!g.hasNode(currentName)){
            g.setNode(currentName, "A");
        }
        g.setEdge(previousName, currentName)
    }
}

function phase1(routerID /*array*/) {
    
    g.setDefaultNodeLabel("R")
    routerID.forEach(element => {
        g.setNode(element)
    });
    tracerouteData.forEach(trace => {
        let originRouter = getName(trace.from);
        let destinationName = getName(trace.to);
        let hops = trace.hops;
        if(hops[hops.length-1].success){ /* If origin can communicate with destination */
            for(let i = 0; i<hops.length; i++){
                let currentHop = hops[i];
                let previouName;
                if(i == 0){
                    previouName = originRouter;
                }else{
                    if(hops[i-1].success){
                        previouName = getName(hops[i-1].address);
                    }else{
                        previouName = anonRouter.getLastAnonRouter();
                    }
                }
                addHop(currentHop, previouName)
            }
        }else{ /* If origin cannot communicate with destination */
            if(trace.alreadyUsed){ // Avoid to consider a path already used as opposite path
                return;
            }
            signale.success("Found path that cannot communicate");
            
            let distance = networkData[originRouter].distance[destinationName];
            
            let oppositePath = getPath(destinationName, originRouter);

            oppositePath.alreadyUsed = true;
            let successAB = hops.length;
            let successBA = hops.length;
            let index = hops.length-1;
            // Get how many success hops from A to B
            while(!hops[index].success){
                successAB--;
                index--;
            }
            index = oppositePath.hops.length-1;
            // Get how many success hops from B to A
            while(!oppositePath.hops[index].success){
                successBA--;
                index--;
            }
            
            let middleStarRouter = distance - successAB - successBA;
            for(let i = 0; i<successAB; i++){
                let currentHop = hops[i];
                let previouName;
                if(i == 0){
                    previouName = originRouter;
                }else{
                    if(hops[i-1].success){
                        previouName = getName(hops[i-1].address);
                    }else{
                        previouName = anonRouter.getLastAnonRouter();
                    }
                }
                addHop(currentHop, previouName);
            }
            addHop(hops[successAB-1], anonRouter.getNewAnonRouter(), "NO-COOP");
            if(middleStarRouter > 1){
                let i = 1;
                while(i < middleStarRouter-1){
                    let previousNode = anonRouter.getLastAnonRouter();
                    g.setNode(anonRouter.getNewAnonRouter(), "HIDDEN");
                    g.setEdge(previousNode, anonRouter.getLastAnonRouter());
                    
                    i++;
                }
                g.setNode(anonRouter.getNewAnonRouter(), "NO-COOP");
                g.setEdge(previousNode, anonRouter.getLastAnonRouter());
            }
            for(let i = successBA-1; i>=0; i--){
                let currentHop = oppositePath.hops[i];
                let previouName;
                if(i < successBA-1 && oppositePath.hops[i+1].success){
                    previouName = getName(oppositePath.hops[i+1].address);
                }else{
                    previouName = anonRouter.getLastAnonRouter();
                }
                signale.await("adding "+getName(currentHop.address)+" "+previouName);
                addHop(currentHop, previouName);
            }
            addHop(oppositePath.hops[0], destinationName);
        }
        signale.complete("New trace added");
    });

}

function iTop() {
    let routerID = [];
    for(key in networkData){
        routerID.push(key);
    }
    phase1(routerID)
};
iTop();



// TCP Server to receive Traceroute
net = require('net');
net.createServer(function (socket) {
    socket.on('data', function (data) {
        let trace = JSON.parse(data);
        tracerouteData.append(trace);
        // Resetting parameter in each trace
        tracerouteData.forEach(trace => trace.alreadyUsed = false)
        g = new Graph({ directed: true, compound: false, multigraph: true });
        iTop();
    });
    socket.on('end', function () {
        process.stdout.write("communication close");
    });
    socket.on("error", (err) => {
        console.log(err);
    });
}).listen(5000);


// Webserver
const express = require('express')
const app = express()
app.set('view engine', 'pug')
app.use(express.static('views/assets'));
app.use('/assets', express.static('views/assets'));
app.get('/', (req, res) => {
    let nodes = g.nodes();
    let edges = g.edges()
    let nodes_res = [];
    for(let i = 0; i<nodes.length; i++){
        let id = nodes[i];
        let label = g.node(id) || "";
        nodes_res.push({id: id, label: id+"\n"+label});
    }
    let edges_res = [];
    for(i = 0; i<edges.length; i++){
        let edge = edges[i];
        edges_res.push({from: edge.v, to: edge.w});
    }
    res.render('network', {nodes: JSON.stringify(nodes_res), edges: JSON.stringify(edges_res)})
})
app.listen(3000, () => console.log('Example app listening on port 3000!'))

