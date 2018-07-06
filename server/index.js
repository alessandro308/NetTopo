const Graph = require("@dagrejs/graphlib").Graph
var fs = require('fs');
const signale = require('signale');

const networkData = JSON.parse(fs.readFileSync('./netdata.json', 'utf8'));
const tracerouteData = JSON.parse(fs.readFileSync('./traceroute.json', 'utf8'));
let distance = {};
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

let g = new Graph({
    multigraph: true,
    compound: true,
    directed: true
});

anonRouter = function(){
    let routerName = 0;
    return {
        getNewAnonRouter: function(){
            routerName++;
            return "A"+routerName;
        },
        getLastAnonRouter: function(){
            return "A"+routerName;
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
    if(currentHop.success){ /* has replied */
        let currentName = getName(currentHop.address);
        console.log(currentName);
        if(!g.hasNode(currentName)){
            g.setNode(currentName, newNodeLabel);
        }
        g.setEdge(previousName, currentName, {path: pathName}, pathName) 
    }else{ /* Anonymous one */
        let currentName = anonRouter.getNewAnonRouter();
        if(!g.hasNode(currentName)){
            g.setNode(currentName, "A");
        }
        g.setEdge(previousName, currentName, {path: pathName}, pathName)
    }
}

function phase1(routerID /*array*/) {
    
    g.setDefaultNodeLabel("R")
    routerID.forEach(element => {
        g.setNode(element)
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
                    g.setNode(anonRouter.getNewAnonRouter(), "HIDDEN");
                    g.setEdge(previousNode, anonRouter.getLastAnonRouter(), {path: pathName});           
                    i++;
                }
                g.setNode(anonRouter.getNewAnonRouter(), "NO-COOP");
                g.setEdge(previousNode, anonRouter.getLastAnonRouter(), {path: pathName});
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
        distance = graphlib.alg.floydWarshall(g); //distance is global var used to compare actual distance with new one after merge
    });

}

function phase2(){
    let edges = g.edges();
    let paths = {};
    edges.forEach(e => { // Here I will create a map [path => edges[]] that is used in Trace Preservation analysis
        let label = g.edge(e);
        let path = label ? label.path : "" ;
        if(paths[path] === undefined)
            paths[path] = [e];
        else
            paths[path].push(e);
    })
    let nodes = g.nodes();
    for(let i = 0; i<edges.length; i++){
        let valid = true;
        let edgeAttachment = g.edge(edges[i]) || {};
        edgeAttachment.mergeOption=[];
        g.setEdge(edges[i], edgeAttachment)
        for(let j = 0; j<edges.length; j++){
            if(i === j) continue;
            // Trace Preservation
            for(path in paths){
                if(paths[path].includes(edges[i]) && paths[path].includes(edges[j])){
                    valid = false;
                    break;
                }
            }
            if(valid === false){
                continue;
            }
            
            // Distance preservation
            let copiedGraph = JSON.parse(JSON.stringify(g));
            copiedGraph.setEdge(node[i].v, node[j].w);
            copiedGraph.removeEdge(node[i].v, node[i].w);
            copiedGraph.removeEdge(node[j].v, node[j].w);
            let newDistance = graphlib.alg.floydWarshall(g) // O(|V|^3)
            for(let i = 0; i<tracerouteData.length; i++){ù
                let trace = tracerouteData[i];
                let from = getName(trace.from); // resolving alias === get node name associated to ip
                let to = getName(trace.to);
                if(newDistance[from][to] !== distance[from][to]){
                    valid = false;
                    break;
                }
            }

            //Link Endpoint Compatibility 
                 // TO BE IMPLEMENTED

            if(valid){ 
                edgeAttachment.mergeOption.push(edges[j]);
                g.setEdge(edges[i], edgeAttachment); // There is a control before that check that on edge E1 is not added E1 itself
            }
        }
    }
}

function phase3(){
    let interestingEdges = g.edges.filter(edge => edge.options.mergeOption.length > 0)
    while(interestingEdges.length > 0){
        let edges = interestingEdges;
        let index_of_ei = 0;
        for(let i = 1; i<edges.length; i++){
            if(edges[i].options.mergeOption.length < 
                edges[index_of_ei].options.mergeOption.length )
                index_of_ei = i;
        }
        let ei = edges[index_of_ei];
        let minLength = g.edges().length+1; //Min length iniziatlized at the max value possible (+1 to trigger the condition the first time)
        let ej;
        let index_of_ej;
        for(let j = 0; j<g.edge(ei).mergeOption.length; j++){
            if(g.edge(g.edge(ei).mergeOption[j]).mergeOption.length < minLength ){
                minLength = g.edge(g.edge(ei).mergeOption[j]).mergeOption.length;
                ej = g.edge(ei).mergeOption[j];
                index_of_ej = j;
            }
        }
        if(compatible(ei, ej)){ // TODO: write this compatible function, with reference to the TABLE (riga 4 pseudocodice)
            g.removeEdge(ei.v, ei.w);
            g.removeEdge(ej.v, ej.w);
            g.setEdge(ei.v, ej.w, {});
        }else{ 
            // TODO Capire cosa vuol dire lo pseudocodice di questo ultime else
            let ei_attach = g.edge(ei);
            ei_attach.mergeOption.slice(index_of_ei);
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
                    isMonitor: true,
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
        nodes_res.push({id: node, label: `${node}\n${g.node(node) || ""}`});
    }
    let edges_res = [];
    for(i = 0; i<edges.length; i++){
        let edge = edges[i];
        edges_res.push({from: edge.v, to: edge.w});
    }
    res.render('network', {nodes: JSON.stringify(nodes_res), edges: JSON.stringify(edges_res)})
})
app.listen(3000, () => console.log('Example app listening on port 3000!'))

