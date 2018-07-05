const Graph = require("./graph").Graph
var fs = require('fs');
const signale = require('signale');

const networkData = JSON.parse(fs.readFileSync('./netdata.json', 'utf8'));
const tracerouteData = JSON.parse(fs.readFileSync('./traceroute.json', 'utf8'));

function less(x, y){
    if(x.toUpperCase() === "H"){
        return true;
    }
    if(x.toUpperCase() === "N"){
        if(y.toUpperCase() === "H"){
            return false;
        }
        if(y.toUpperCase() === "A" || y.toUpperCase() === "B" || y.toUpperCase() === "N"){
            return true;
        }
    }
    if(x.toUpperCase() === "R"){
        if(y.toUpperCase() === "H"){
            return false;
        }
        if(y.toUpperCase() === "R"){
            return true;
        }
    }
    if(x.toUpperCase() === "A"){
        if(y.toUpperCase() === "N" || y.toUpperCase() === "H"){
            return false;
        }
        if(y.toUpperCase() === "A"){
            return true;
        }
    }
    if(x.toUpperCase() === "B"){
        if(y.toUpperCase() === "N" || y.toUpperCase() === "H"){
            return false;
        }
        if(y.toUpperCase() === "B"){
            return true;
        }
    }
    return null;
}

function max(x, y){
    if(less(x, y)){
        return y;
    }else{
        return x;
    }
}
function resultMerge(start1, end1, start2, end2){
    if(less(start1, start2) !== null && less(end1, end2) !== null){
        return [max(start1, start2), max(end1, end2)];
    }else if(less(start1, end2) !== null && less(start2, end1) !== null) {
        return [max(start1, end2), max(start2, end1)]
    }
    return;
}

let g = new Graph();

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

function addHop(currentHop, previousName, newNodeLabel, pathName){
    if(pathName === undefined) console.trace();
    if(currentHop.success){ /* has replied */
        let currentName = getName(currentHop.address);
        if(!g.hasNode(currentName)){
            g.addNode(currentName, newNodeLabel);
        }
        g.addEdge(previousName, currentName, {path: pathName}, previousName+currentName+pathName) // Add pathName as label of the graph to remember which trace trigger its insertion
    }else{ /* Anonymous one */
        let currentName = anonRouter.getNewAnonRouter();
        if(!g.hasNode(currentName)){
            g.addNode(currentName, "A");
        }
        g.addEdge(previousName, currentName, {path: pathName})
    }
}

function phase1(routerID /*array*/) {
    
    g.setDefaultNodeLabel("R")
    routerID.forEach(element => {
        g.addNode(element)
    });
    tracerouteData.forEach(trace => {
        signale.await("Running trace");
        let originRouter = getName(trace.from);
        let destinationName = getName(trace.to);
        let pathName = getName(trace.from)+getName(trace.to);
       
        let hops = trace.hops;
        if(hops[hops.length-1].success){ /* If origin can communicate with destination */
            console.log("Traceroute can reach the destination");
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
                addHop(currentHop, previouName, null, pathName)
            }
        }else{ /* If origin cannot communicate with destination */
            console.log("Traceroute cannot reach the destination");
            if(trace.alreadyUsed || networkData[originRouter]===undefined){ // Avoid to consider a path already used as opposite path
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
                addHop(currentHop, previouName, undefined, pathName);
            }
            addHop(hops[successAB-1], anonRouter.getNewAnonRouter(), "NO-COOP", pathName);
            if(middleStarRouter > 1){
                let i = 1;
                while(i < middleStarRouter-1){
                    let previousNode = anonRouter.getLastAnonRouter();
                    g.addNode(anonRouter.getNewAnonRouter(), "HIDDEN");
                    g.addEdge(previousNode, anonRouter.getLastAnonRouter(), {path: pathName});           
                    i++;
                }
                g.addNode(anonRouter.getNewAnonRouter(), "NO-COOP");
                g.addEdge(previousNode, anonRouter.getLastAnonRouter(), {path: pathName});
            }
            for(let i = successBA-1; i>=0; i--){
                let currentHop = oppositePath.hops[i];
                let previouName;
                if(i < successBA-1 && oppositePath.hops[i+1].success){
                    previouName = getName(oppositePath.hops[i+1].address);
                }else{
                    previouName = anonRouter.getLastAnonRouter();
                }
                addHop(currentHop, previouName, null, pathName);
            }
            addHop(oppositePath.hops[0], destinationName, null, pathName);
        }
        signale.complete("New trace added");
    });

}

function phase2(){
    let edges = g.edges();
    let nodes = g.nodes();
    console.log(nodes)
    for(let i = 0; i<edges.length; i++){
        let valid = true;
        if(edges[i].options === undefined)
            edges[i].options = {mergeOption: []};
        else{
            edges[i].options.mergeOption=[];
        }
        for(let j = 0; j<edges.length; j++){
            if(i === j) continue;
            // Trace Preservation
            let paths = g.paths;
            for(let z = 0; z<paths; z++){
                let edgesPath = g.getEdgeByPath(paths[z]);
                if(edgesPath.includes(edges[i]) && edgesPath.includes(edges[j]) ){
                    valid = false;
                    break;
                }
            }
            if(valid === false){
                continue;
            }
            // Distance preservation
            


            //Link Endpoint Compatibility
            

            if(valid){
                edges[i].options.mergeOption.push(edges[j]);
            }
        }
    }
}

function phase3(){
    let interestingEdges = g.edges.filter(edge => edge.options.mergeOption.length > 0)
    while(interestingEdges.length > 0){
        let edges = interestingEdges;
        let ei = 0;
        let ej = 0;
        for(let i = 1; i<edges.length; i++){
            if(edges[i].options.mergeOption.length < 
                edges[ei].options.mergeOption.length )
                ei = i;
        }
        for(let j = 1; j<edges.length; j++){
            if(i == j) continue;
            if(edges[j].options.mergeOption.length < 
                edges[ej].options.mergeOption.length )
                ej = i;
        }
        if(compatible(edges[i], edges[j])){
            merge(i, j);
        }else{
            edges[i].options.mergeOption.slice(ei);
            edges[j].options.mergeOption.slice(ej);
        }
    }
}

function iTop() {
    let routerID = [];
    for(key in networkData){
        routerID.push(key);
    }
    phase1(routerID)
    phase2();
};
iTop();



// TCP Server to receive Traceroute
net = require('net');
net.createServer(function (socket) {
    socket.on('data', function (data) {
        let trace = JSON.parse(data);
        if(data.type === "trace"){
            tracerouteData.push(trace);
            // Resetting parameter in each trace
            tracerouteData.forEach(trace => trace.alreadyUsed = false)
            g = new Graph();
            iTop();
        }
        if(data.type === "notify"){
            let name = data.name;
            let ip = data.ip;
            if(!(name in networkData)){
                networkData[name] = {
                    alias: [
                        ip
                    ]
                }
            }else{
                if(!networkData[name].alias.includes(ip))
                    networkData[name].alias.push(ip);
            }
        }
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
        let node = nodes[i];
        nodes_res.push({id: node.id, label: `${node.id}\n${node.type || ""}`});
    }
    console.log(nodes_res);
    let edges_res = [];
    for(i = 0; i<edges.length; i++){
        let edge = edges[i];
        edges_res.push({from: edge.start, to: edge.end});
    }
    res.render('network', {nodes: JSON.stringify(nodes_res), edges: JSON.stringify(edges_res)})
})
app.listen(3000, () => console.log('Example app listening on port 3000!'))

