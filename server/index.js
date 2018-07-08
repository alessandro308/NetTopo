const graphlib = require("@dagrejs/graphlib")
const Graph = graphlib.Graph
var fs = require('fs');
const signale = require('signale');

const networkData = JSON.parse(fs.readFileSync('./netdata.json', 'utf8'));
const tracerouteData = JSON.parse(fs.readFileSync('./traceroute.json', 'utf8'));

function assert(condition, message) {
    if (!condition) {
        console.trace();
        throw message || "Assertion failed";
    }
}

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
    }
    return null;
}

function compatible(edgeA, edgeB) {
	typeStartA = g.node(edgeA.v).type;
	typeEndA = g.node(edgeA.w).type;
	typeStartB = g.node(edgeB.v).type;
	typeEndB = g.node(edgeB.w).type;
    if(typeStartA.toUpperCase() === "R" && typeStartB === "R" ){
        if(edgeA.v !== edgeB.v) {
            return false;
        }
    }
    if(typeEndA.toUpperCase() === "R" && typeEndB === "R"){
        if(edgeA.w !== edgeB.w){
            return false;
        }
    }
	return resultMerge(typeStartA, typeEndA, typeStartB, typeEndB) != null;
}

let g = new Graph({
    directed: false
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

function addHop(currentName, previousName, newNodeLabel, pathName){
    if(!g.hasNode(currentName)){
        g.setNode(currentName, newNodeLabel);
    }
    let attachment = g.edge(previousName, currentName);
    if(attachment === undefined){
        attachment = {path: [pathName]}
    }else{
        attachment.path.push(pathName);
    }
    g.setEdge(previousName, currentName, attachment) 
}

let merge = (graph, ei, ej) => {
    let inEdges = graph.nodeEdges(ej.v).filter(e => ej.w != e.v && ej.w != e.w).map(e => e.w === ej.v ? e : {v: e.w, w: e.v}); 
    let outEdges = graph.nodeEdges(ej.w).filter(e => ej.v != e.v && ej.v != e.w).map(e => e.v === ej.w ? e : {v: e.w, w: e.v});
    /*
        startLabel.id = ei.v.charAt(0) == "R" ? ei.v : ej.v;
        endLabel.id = ei.w.charAt(0) == "R" ? ei.w : ej.w;
    */
    for (let i = 0; i<inEdges.length; i++) {
        let label = graph.edge(inEdges[i])
        // TODO MERGING DELLE LABEL
        graph.removeEdge(inEdges[i].v, ej.v);
        graph.setEdge(inEdges[i].v, ei.v, label) 
    }

    for (i = 0; i<outEdges.length; i++) {
        // TODO MERGING DELLA LABEL
        graph.removeEdge(ej.v, outEdges[i].w)
        graph.setEdge(ei.w, outEdges[i].w, graph.edge(outEdges[i]))   
    }

    let mergeType = resultMerge(
        graph.node(ei.v).type,
        graph.node(ei.w).type,
        graph.node(ej.v).type,
        graph.node(ej.w).type
    )
    assert(mergeType != null, "MERGING TWO EDGE NOT VALID");
    // Reassign the nodes type
    let startLabel = graph.node(ei.v)
    startLabel.type = mergeType[0]
    graph.setNode(ei.v, startLabel)

    let endLabel = graph.node(ei.w)
    endLabel.type = mergeType[1]
    
    graph.setNode(ei.w, endLabel)

    if(ei.v !== ej.v && ei.w !==ej.v)
        graph.removeNode(ej.v);
    if(ei.v !== ej.w && ei.w !==ej.w)
        graph.removeNode(ej.w);
}

function phase1() {
    
    g.setDefaultNodeLabel({type: "R"})
    tracerouteData.forEach(trace => {
        let originRouter = getName(trace.from);
        let destinationName = getName(trace.to);
        let pathName = getName(trace.from)+getName(trace.to);
       
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
                let label = currentHop.success ? {type: "R"} : {type: "A"}
                let currentName = currentHop.success ? getName(currentHop.address) : anonRouter.getNewAnonRouter();
                addHop(currentName, previouName, label,  pathName)
            }
        }else{ /* If origin cannot communicate with destination */
            if(trace.alreadyUsed){ // Avoid to consider a path already used as opposite path
                return;
            }
            let distance = networkData[originRouter].distance[destinationName];
            assert(distance != undefined, `Not defined distance between ${originRouter} and ${destinationName}`);
            let oppositePath = getPath(destinationName, originRouter);
            assert(oppositePath != undefined, `Not found opposite path ${destinationName} => ${originRouter} ...`);

            oppositePath.alreadyUsed = true;
            let successNumberAB = hops.length; // Traceroute max hops
            let successNumberBA = hops.length;
            let index = hops.length-1;
            // discard all hops that are blocked from A to B
            while(!hops[index].success){
                successNumberAB--;
                index--;
            }

            index = oppositePath.hops.length-1;
            //  discard all hops that are blocked from B to A
            while(!oppositePath.hops[index].success){
                successNumberBA--;
                index--;
            }
            
            for(let i = 0; i<successNumberAB; i++){
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
                let label = currentHop.success ? {type: "R"} : {type: "A"};
                let currentName = currentHop.success ? getName(currentHop.address) : anonRouter.getNewAnonRouter();
                addHop(currentName, previouName, label,  pathName)
            }
            let unknownRouters = distance - successNumberAB - successNumberBA;

            if(unknownRouters === 1){
                let label = {type: "B"};
                addHop(anonRouter.getNewAnonRouter(), getName(hops[successNumberAB-1].address), label, pathName);
                addHop(getName(oppositePath.hops[successNumberBA-1].address), anonRouter.getLastAnonRouter(), {type: "R"}, pathName);
            }else{
                addHop(anonRouter.getNewAnonRouter(), getName(hops[successNumberAB-1].address), {type: "N"}, pathName);
                let i = 1;
                while(i < unknownRouters-1){ // adding hidden routers
                    let previousNode = anonRouter.getLastAnonRouter();
                    addHop(anonRouter.getNewAnonRouter(), previousNode, {type: "H"}, pathName)      
                    i++;
                }
                let previousName = anonRouter.getLastAnonRouter();
                addHop(anonRouter.getNewAnonRouter(), previousName, {type: "N"}, pathName);
                addHop(getName(oppositePath.hops[successNumberBA-1].address), anonRouter.getLastAnonRouter(), {type: "R"}, pathName);
            }
            
            for(let i = successNumberBA-1; i>=0; i--){
                let currentHop = oppositePath.hops[i];
                let previouName;
                if(i < successNumberBA-1 && oppositePath.hops[i+1].success){
                    previouName = getName(oppositePath.hops[i+1].address);
                }else{
                    previouName = anonRouter.getLastAnonRouter();
                }
                let label = currentHop.success ? {type: "R"} : {type: "A"}
                let currentName = currentHop.success ? getName(currentHop.address) : anonRouter.getNewAnonRouter();
                addHop(currentName, previouName, label,  pathName)
            }
            addHop(getName(oppositePath.hops[0].address), destinationName, {type: "R"}, pathName);
        }
        signale.complete(`New trace added from ${originRouter} to ${destinationName}`);
    });
}

function phase2(){
    let edges = g.edges();
    let paths = {};
    edges.forEach(e => { // Here I will create a map [path => edges[]] that is used in Trace Preservation analysis
        let label = g.edge(e);
        let edgePaths = label ? label.path : [] ;
        for(let i = 0; i<edgePaths.length; i++){
            if(paths[edgePaths[i]] === undefined)
                paths[edgePaths[i]] = [e];
            else
                paths[edgePaths[i]].push(e);
        }
    })
    let distance = graphlib.alg.floydWarshall(g, () => 1, (node) => g.nodeEdges(node)); //distance is a var used to compare actual distance with new one after merge

    for(let i = 0; i<edges.length; i++){
        signale.await(`********Phase2 on ${edges[i].v} => ${edges[i].w}**********`);
        let edgeAttachment = g.edge(edges[i]) || {};
        edgeAttachment.mergeOption=[];
        g.setEdge(edges[i], edgeAttachment) // adding mergeOption to the existing label
        for(let j = 0; j<2 /*edges.length*/; j++){
            if(i === j) continue;
            let valid = true;
            signale.watch("***** Edge1: ", edges[i], " Edge2: ", edges[j]);
            // Trace Preservation
            for(path in paths){
                if(paths[path].includes(edges[i]) && paths[path].includes(edges[j])){
                    valid = false;
                    signale.error("Unpassed trace preservation", path);
                    break;
                }
            } 
            if(valid === false){
                continue;
            }
            signale.success("Passed trace preservation")

            //Distance and link endpoint compatibility
            if( !compatible(edges[i], edges[j]) ){
                valid = false;
                signale.error("Not passed compatbility");
            }else{
                signale.success("Passed compatibility")
                let serial = JSON.stringify(graphlib.json.write(g));
                let copiedGraph = graphlib.json.read(JSON.parse(serial));
                merge(copiedGraph, edges[i], edges[j]);
                let newDistance = graphlib.alg.floydWarshall(copiedGraph, () => 1, (node) => g.nodeEdges(node)) // O(|V|^3)
                /*/Producing data to graph
                let _nodes = copiedGraph.nodes();
                let _edges = copiedGraph.edges()
                let _nodes_res = [];
                for(let _i = 0; _i<_nodes.length; _i++){
                    let _node = _nodes[_i];
                    _nodes_res.push({id: _node, label: `${_node}\n${copiedGraph.node(_node).type || ""}`, group: `${copiedGraph.node(_node).type || ""}`});
                }
                let _edges_res = [];
                for(_i = 0; _i<_edges.length; _i++){
                    let _edge = _edges[_i];
                    _edges_res.push({from: _edge.v, to: _edge.w});
                }
                console.log(JSON.stringify(_nodes_res));
                console.log(JSON.stringify(_edges_res));
                console.log(newDistance);*/

                for(let i = 0; i<tracerouteData.length; i++){
                    let trace = tracerouteData[i];
                    let from = getName(trace.from); // resolving alias === get node name associated to ip
                    let to = getName(trace.to);
                    if(newDistance[from][to].distance != undefined && newDistance[from][to].distance !== distance[from][to].distance){
                        valid = false;
                        signale.error("Unpassed distance on path", from, to, " Mi aspettavo ", distance[from][to].distance, "trovata", newDistance[from][to].distance);
                        
                        
                        break;
                    }
                }
                signale.success("Passed distance")
            }
            if(valid){
                signale.success(`VALID TRUE - adding mergeOption`);
                edgeAttachment.mergeOption.push(edges[j]);
                g.setEdge(edges[i], edgeAttachment); // There is a control before that check that on edge E1 is not added E1 itself
            }
        }
    }
}

function phase3() {
	let existMergeOption = () => {
		return g.edges().findIndex(e => g.edge(e).mergeOption && g.edge(e).mergeOption.length > 0) != -1
	}

	let findEdgeWithLessMergeOptions = (inRange) => {
		return inRange.reduce((min, current) => g.edge(current).mergeOption.length < g.edge(min).mergeOption.length ? current : min, inRange[0])
	}


	while (existMergeOption()) { //Pseudocode from the paper
  		let ei = findEdgeWithLessMergeOptions(g.edges())
  		let ej = findEdgeWithLessMergeOptions(g.edge(ei).mergeOption)
    
		if (compatible(ei, ej)) {
			merge(g, ei, ej)
		} else {
			let mi = g.edge(ei).mergeOption
			let mj = g.edge(ej).mergeOption
      
			mi.splice(mi.indexOf(ej), 1) // Mi = Mi \ {ej}
			mj.splice(mj.indexOf(ei), 1) // Mj = Mj \ {ei}
		}
	}
}

function iTop() {
    phase1();
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
        nodes_res.push({id: node, label: `${node}\n${g.node(node).type || ""}`, group: `${g.node(node).type || ""}`});
    }
    let edges_res = [];
    for(i = 0; i<edges.length; i++){
        let edge = edges[i];
        edges_res.push({from: edge.v, to: edge.w, label: JSON.stringify(  g.edge(edges[i]).mergeOption  )});
    }
    res.render('network', {nodes: JSON.stringify(nodes_res), edges: JSON.stringify(edges_res)})
})
app.listen(3000, () => console.log('Example app listening on port 3000!'))

