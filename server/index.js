const graphlib = require("@dagrejs/graphlib")
const Graph = graphlib.Graph
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
    }
    return null;
}

function compatible(edgeA, edgeB) {
	typeStartA = g.node(edgeA.v).type;
	typeEndA = g.node(edgeA.w).type;
	typeStartB = g.node(edgeB.v).type;
	typeEndB = g.node(edgeB.w).type;

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

function addHop(currentHop, previousName, newNodeLabel, pathName){
    let currentName;
    if(currentHop.success){ /* has replied */
        currentName = getName(currentHop.address);
        if(!g.hasNode(currentName)){
            g.setNode(currentName, {type: newNodeLabel});
        }
        
    }else{ /* Anonymous one */
        currentName = anonRouter.getNewAnonRouter();
        if(!g.hasNode(currentName)){
            g.setNode(currentName, {type: "A"});
        }
    }
    let attachment = g.edge(previousName, currentName);
    if(attachment === undefined){
        attachment = {path: [pathName]}
    }else{
        attachment.path.push(pathName);
    }
    g.setEdge(previousName, currentName, attachment) 
}

function phase1(routerID /*array*/) {
    
    g.setDefaultNodeLabel({type: "R"})
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
            addHop(hops[successAB-1], anonRouter.getNewAnonRouter(), {type: "NO-COOP"}, pathName);
            if(middleStarRouter > 1){
                let i = 1;
                while(i < middleStarRouter-1){
                    let previousNode = anonRouter.getLastAnonRouter();
                    g.setNode(anonRouter.getNewAnonRouter(), {type: "HIDDEN"});
                    g.setEdge(previousNode, anonRouter.getLastAnonRouter(), {path: pathName});           
                    i++;
                }
                g.setNode(anonRouter.getNewAnonRouter(), {type: "NO-COOP"});
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
        let edgePaths = label ? label.path : [] ;
        for(let i = 0; i<edgePaths.length; i++){
            if(paths[edgePaths[i]] === undefined)
                paths[edgePaths[i]] = [e];
            else
                paths[edgePaths[i]].push(e);
        }
    })

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
            let serial = graphlib.json.write(g);
            let copiedGraph = graphlib.json.read(serial);
            copiedGraph.setEdge(edges[i].v, edges[j].w);
            copiedGraph.removeEdge(edges[i].v, edges[i].w);
            copiedGraph.removeEdge(edges[j].v, edges[j].w);
            let newDistance = graphlib.alg.floydWarshall(g) // O(|V|^3)
            for(let i = 0; i<tracerouteData.length; i++){
                let trace = tracerouteData[i];
                let from = getName(trace.from); // resolving alias === get node name associated to ip
                let to = getName(trace.to);
                if(newDistance[from][to] !== distance[from][to]){
                    valid = false;
                    break;
                }
            }

            //Link Endpoint Compatibility 
			valid = compatible(edges[i], edges[j]);
            
            if(valid){ 
                edgeAttachment.mergeOption.push(edges[j]);
                console.log(edgeAttachment.mergeOption);
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

	let merge = (ei, ej, mergeType) {
		// Merging of the edges
		let inEdges = g.inEdges(ej.v)
		let outEdges = g.outEdges(ej.w)
    
		for (let i = 0; i<inEdges.length; i++) {
			let label = g.edge(inEdges[i])
			g.setEdge(inEdges[i].v, ei.v, label)
			g.removeEdge(inEdges[i].v, inEdges[i].w)
		}
    
		for (i = 0; i<outEdges.length; i++) {
			g.setEdge(ei.w, outEdges[i].w, g.edge(outEdges[i]))
			g.removeEdge(outEdges[i].v, outEdges[i].w)
		}
    
		// Reassign the nodes type
		let startLabel = g.node(ei.v)
		startLabel.type = mergeType[0]
		g.setNode(ei.v, startLabel)
    
		let endLabel = g.node(ei.w)
		endLabel.type = mergeType[1]
		g.setNode(ei.w, endLabel)
	}

	while (existMergeOption()) { //Pseudocode from the paper
  		let ei = findEdgeWithLessMergeOptions(g.edges())
  		let ej = findEdgeWithLessMergeOptions(g.edges(ei).mergeOption)
		let mergeType = compatible(ei, ej);
    
		if (mergeType) {
			merge(ei, ej, mergeType)
		} else {
			let mi = g.edge(ei).mergeOption
			let mj = g.edge(ej).mergeOption
      
			mi.splice(mi.indexOf(ej), 1) // Mi = Mi \ {ej}
			mj.splice(mj.indexOf(ei), 1) // Mj = Mj \ {ei}
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

