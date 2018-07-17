const graphlib = require("@dagrejs/graphlib")
const Graph = graphlib.Graph
var fs = require('fs');
const signale = require('signale');

const NETWORK_DIAMETER = undefined;

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
    if((networkData[edgeA.v] && networkData[edgeA.v].isMonitor)
    || (networkData[edgeA.w] && networkData[edgeA.w].isMonitor)
    || (networkData[edgeB.v] && networkData[edgeB.v].isMonitor)
    || (networkData[edgeB.w] && networkData[edgeB.w].isMonitor)) return false;
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
        attachment = {path: [pathName], mergeOption: []}
    }else{
        attachment.path.push(pathName);
    }
    g.setEdge(previousName, currentName, attachment) 
}

let mergeLabels = (l1, l2) => {
    /*
    assert label { path:  [] , mergeOption: []}
    */

    let result = {};
    result.path = [...l1.path, ...l2.path].filter((path, index, self) =>
                                                        index === self.findIndex((t) => (t == path)));
    result.mergeOption = [...l1.mergeOption, ...l2.mergeOption].filter((edge, index, self) =>
                                                                            index === self.findIndex((t) => (
                                                                            t.v === edge.v && t.w === edge.w
                                                                            )
                                                                        ));
    return result;
}

let isSameEdge = (edge, anotherEdge) => {
    if( (edge.v === anotherEdge.v && edge.w === anotherEdge.w) ||
        (edge.w === anotherEdge.v && edge.v === anotherEdge.w) ) return true;
    return false;
}

let nodeContraction = (graph, node1, node2, resultingType) => {

    graph.removeEdge(node1, node2);
    // Vogliamo conservare node1
    let n2Edges = graph.nodeEdges(node2);
    // Dobbiamo riattaccarli su nodo 1
    for(let i = 0; i<n2Edges.length; i++){
        let currentEdge = n2Edges[i];
        let currentLabel = graph.edge(currentEdge);
        //Se già c'è un arco, mergia le etichette
        let altrocaporispettoadnode2 = currentEdge.v === node2 ? currentEdge.w : currentEdge.v;
        let resLabel = currentLabel;
        if(graph.hasEdge(altrocaporispettoadnode2, node1)){
            resLabel = mergeLabels(graph.edge(altrocaporispettoadnode2, node1), currentLabel)
            resLabel.mergeOption = resLabel.mergeOption.filter(edge => (
                            !isSameEdge(currentEdge, edge) && 
                            !isSameEdge(edge, {v: altrocaporispettoadnode2, w: node1})
                        ));
        }
        graph.setEdge(altrocaporispettoadnode2, node1, resLabel);
    }
    let label = graph.node(node1)
    label.type = resultingType
    graph.setNode(node1, label)
    graph.removeNode(node2);
}


let merge2 = (graph, ei, ej) => {
    let resType = resultMerge( // Tabellone del paper
        graph.node(ei.v).type,
        graph.node(ei.w).type,
        graph.node(ej.v).type,
        graph.node(ej.w).type
    )

    if(ei.v !== ej.v){
        nodeContraction(graph, ei.v, ej.v, resType[0]);
    }
    if(ei.w !== ej.w){
        nodeContraction(graph, ei.w, ej.w, resType[1]);
    }

    // Sistemiamo tutte, tutte, tutte le etichette
    let edges = graph.edges();
    for(let i = 0; i<edges.length; i++){
        let currentEdge = edges[i];
        let currentLabel = graph.edge(currentEdge);
        let mergeOptionResult = [];
        for(let j = 0; j<currentLabel.mergeOption.length; j++){
            let currentMO = currentLabel.mergeOption[j];
            let res = {};
            if(currentMO.v === ej.v){ // IL PROBLEMA è tutto QUI DENTRO!!!
                res.v = ei.v
            }else{
                if(currentMO.v === ej.w){
                    res.v = ei.w
                }else{
                    res.v = currentMO.v;
                }
            }
            if(currentMO.w === ej.w){
                res.w = ei.w
            }else{
                if(currentMO.w === ej.v){
                    res.w = ei.v
                }else{
                    res.w = currentMO.w
                }
            }


            mergeOptionResult.push(res);
        }
        currentLabel.mergeOption = mergeOptionResult.filter((edge, index, self) =>
                                                                index === self.findIndex((t) => (
                                                                t.v === edge.v && t.w === edge.w
                                                                )
                                                            )).filter(edge => (
                                                                !isSameEdge(currentEdge, edge)
                                                            ));
        graph.setEdge(currentEdge, currentLabel);
    }
}

let merge = merge2; 
let oldMerge = (graph, ei, ej) => {

    /*
        label = {path: [], mergeOption: []}
    */
    let ejLabel = graph.edge(ej);
    let eilabel = graph.edge(ei);
  				
    let inEdges = graph.nodeEdges(ej.v).map(e => e.w === ej.v ? e : {v: e.w, w: e.v}); 
    let outEdges = graph.nodeEdges(ej.w).map(e => e.v === ej.w ? e : {v: e.w, w: e.v});
    /*
        startLabel.id = ei.v.charAt(0) == "R" ? ei.v : ej.v;
        endLabel.id = ei.w.charAt(0) == "R" ? ei.w : ej.w;
    */

    let is_ei = (edge) => {
        return (edge.v == ei.v && edge.w == ei.w) || (edge.w == ei.v && edge.v == ei.w)
    }
    let is_ej = (edge) => {
        return (edge.v == ej.v && edge.w == ej.w) || (edge.w == ej.v && edge.v == ej.w)
    }

    for (let i = 0; i<inEdges.length; i++) {
        let label = graph.edge(inEdges[i]);
        graph.removeEdge(inEdges[i].v, ej.v);
        if(inEdges[i].v !== ei.v){ 
            let resultLabel = label;
            if(graph.hasEdge(inEdges[i].v, ei.v)){
                let existingLabel = graph.edge(inEdges[i].v, ei.v);
                resultLabel = {
                    path: [...label.path, ...existingLabel.path],
                    mergeOption: ([...label.mergeOption, ...existingLabel.mergeOption]).filter(
                        (edge, index, self) =>
                            index === self.findIndex((t) => (
                            t.v === edge.v && t.w === edge.w
                            )
                        )
                    )
                }
            }
            graph.setEdge(inEdges[i].v, ei.v, resultLabel); 
        } 
        /* else ignore since the edge to add is ei.v -> ei.v */
    }

    for (i = 0; i<outEdges.length; i++) {
        let label = graph.edge(outEdges[i]);
        graph.removeEdge(ej.w, outEdges[i].w)
        if(outEdges[i].w !== ei.w){
            let resultLabel = label;
            if(graph.hasEdge(ei.w, outEdges[i].w)){
                let existingLabel_out = graph.edge(ei.w, outEdges[i].w);
                resultLabel = {
                    path: [...label.path, ...existingLabel_out.path],
                    mergeOption: ([...label.mergeOption, ...existingLabel_out.mergeOption]).filter(
                        (edge, index, self) =>
                            index === self.findIndex((t) => (
                            t.v === edge.v && t.w === edge.w
                            )
                        )
                    )
                }
            }

            graph.setEdge(ei.w, outEdges[i].w, resultLabel); 
        }
    }

    let mergeType = resultMerge( // Tabellone del paper
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
    
    if(ei.v !== ej.v && ei.w !==ej.v){ // if with double condition due the *undirected* graph
        //assert(graph.nodeEdges(ej.v).length == 1, `ci sono ancora archi su v ${JSON.stringify(graph.nodeEdges(ej.v))} `);
        graph.removeNode(ej.v);
    }
    if(ei.v !== ej.w && ei.w !== ej.w){
        //assert(graph.nodeEdges(ej.w).length == 1, `ci sono ancora archi su w ${graph.nodeEdges(ej.v)}`);
        graph.removeNode(ej.w);
    }

    let edges = graph.edges();
    edges.forEach(edge => {
        let label = graph.edge(edge);
        label.mergeOption = (label.mergeOption.map( opt => { //Replace ej with ei
            let result = {};
            result.v = (opt.v == ej.v || opt.v == ej.w) ? ei.v : opt.v;
            result.w = (opt.w == ej.v || opt.w == ej.w) ? ei.w : opt.w;
            return result;
        })).filter(
            (edge, index, self) =>
                index === self.findIndex((t) => (
                t.v === edge.v && t.w === edge.w
                )
            )
        ).filter((labeledge, index) => {
            return edge.v != labeledge.v && edge.w != labeledge.w // Remove from the label, the edge itself
        })
        graph.setEdge(edge, label);
    });

    eilabel.mergeOption = ([...eilabel.mergeOption, ...(ejLabel ? ejLabel.mergeOption : [])].filter(e => !is_ei(e) && !is_ej(e)))

    graph.setEdge(ei, eilabel);
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
           
            let distance = NETWORK_DIAMETER || networkData[originRouter].distance[destinationName]; // OR COMPUTE DISTANCE WITH SOME OTHER METRICS
            assert(distance != undefined, `Not defined distance between ${originRouter} and ${destinationName}`);
            let oppositePath = getPath(destinationName, originRouter);
            signale.error(`Not found opposite path ${destinationName} => ${originRouter} ...`);
            if(oppositePath == undefined){
                return; // break the algorithm since there is no opposite path
            }

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
        let edgeAttachment = g.edge(edges[i]) || {};
        edgeAttachment.mergeOption=[];
        g.setEdge(edges[i], edgeAttachment) // adding mergeOption to the existing label
        for(let j = 0; j<edges.length; j++){
            if(i !== j){
                let valid = true;
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


                //Distance and link endpoint compatibility
                if( !compatible(edges[i], edges[j]) ){
                    valid = false;
                }else{
                    let serial = JSON.stringify(graphlib.json.write(g));
                    let copiedGraph = graphlib.json.read(JSON.parse(serial));
                    merge(copiedGraph, edges[i], edges[j]);
                    let newDistance = graphlib.alg.floydWarshall(copiedGraph, () => 1, (node) => copiedGraph.nodeEdges(node)) // O(|V|^3)
                    for(let i1 = 0; i1<tracerouteData.length; i1++){
                        let trace = tracerouteData[i1];
                        let from = getName(trace.from); // resolving alias === get node name associated to ip
                        let to = getName(trace.to);
                        
                        try{
                            if(newDistance[from][to].distance != undefined && newDistance[from][to].distance !== distance[from][to].distance){
                                valid = false;
                                break;
                            }
                        }catch(x){
                            console.log("i j", i, j);
                            console.log(edges[i], edges[j])
                            console.log("from", from, "to", to);
                            console.log("newdistance\n\n", newDistance, "\n\n\n\n")
                            console.log(newDistance[from])
                            console.log(newDistance[from][to])
                            console.log(newDistance[from][to].distance)
                            console.log(distance[from][to]);
                            console.log(distance[from][to].distance);
                            valid=false;
                        }
                    }

                }
                if(valid && !edgeAttachment.mergeOption.includes(edges[j])){
                    edgeAttachment.mergeOption.push(edges[j]);
                    g.setEdge(edges[i], edgeAttachment); // There is a control before that check that on edge E1 is not added E1 itself
                }
            }
        }
    }
}

function phase3() {
    
	let existMergeOption = () => {
		return g.edges().filter(e =>{
            return g.edge(e).mergeOption && g.edge(e).mergeOption.length > 0
        }).length > 0;
	}

	let findEdgeWithLessMergeOptions = (inRange) => {
        let filtered = inRange
                .filter(e => {
                    return g.edge(e) && g.edge(e).mergeOption.length > 0
                })
        return filtered.reduce((min, current) => g.edge(current).mergeOption.length < g.edge(min).mergeOption.length ? current : min, filtered[0])
	}

    let i = 0; // used only for debug prints
    while (existMergeOption()) { //Pseudocode from the paper
        i++;
        let ei = findEdgeWithLessMergeOptions(g.edges())
        let ej = findEdgeWithLessMergeOptions(g.edge(ei).mergeOption)
        
        assert(ei != undefined, "EI is undefined");
        assert(ej != undefined, "EJ is undefined");
		if (compatible(ei, ej)) {
            merge(g, ei, ej);
            
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
    phase3();
};
iTop();


function getTrace(from, to){
    for(let i = 0; i<tracerouteData.length; i++){
        let t = tracerouteData[i];
        if(t.from === from && t.to === to ){
            return t;
        }
    }
    return null;
}

function sendResolveAliasRequests(from, to){
    let t1 = getTrace(from, to);
    let t2 = getTrace(to, from);
    let a = networkData[from].ipNetInt;
    let b = networkData[to].ipNetInt;
    let ab = t1.hops;
	let tmp = JSON.parse(JSON.stringify(t2.hops));
    let ba = tmp.reverse();
    // Assertion: same hops length
    for(let i = 0; i<ab.length-1; i++){
        if( ab[i].success && ba[i+1].success){
            let toSend = {
                type: "ally",
                ip1: ab[i].address,
                ip2: ba[i+1].address
            }
            let monitorA = new net.Socket();
            monitorA.connect(5000, a, function() {
                monitorA.write(JSON.stringify(toSend)+"\n");
                monitorA.destroy();
            });

            let monitorB = new net.Socket();
            monitorB.connect(5000, b, function() {
                monitorB.write(JSON.stringify(toSend)+"\n");
                monitorB.destroy();
            });
        } 
    }
    
}

// TCP Server to receive Traceroute
net = require('net');
net.createServer(function (socket) {
    socket.on('data', function (data) {
        let msg = JSON.parse(data);
        console.log("RECEIVED\n\n", msg, "\n\n\n\n");
        if(msg.type === "trace"){
            tracerouteData.push(msg);
            
            tracerouteData.forEach(trace => trace.alreadyUsed = false)
            let opptrace = getTrace(msg.to, msg.from);
            if(opptrace != null){
                sendResolveAliasRequests(msg.from, msg.to);
            }
        }
        if(msg.type === "notify"){

            let name = msg.name;
            let ip = msg.ipNetUnknown;

            // Sending all the monitor ip to permit to trace them
            let ipAddresses = [];
            for(key in networkData){
                if(networkData[key].isMonitor){
                    ipAddresses.push({ip: networkData[key].alias[0], name: key});
                }   
            }
            if(ipAddresses.length > 0){
                let toSend = {
                    type: "trace",
                    monitors: ipAddresses
                }
                let monitor = new net.Socket();
                monitor.connect(5000, msg.ipNetInt, function() {
                    monitor.write(JSON.stringify(toSend)+"\n");
                    monitor.destroy();
                });
            }
            // Notify all other routers
            toSend = {
                type: "trace",
                monitors: [{ip: ip, name: name}]
            }
            
            for(key in networkData){
                if(networkData[key].isMonitor){ // All other routers
                    let monitor1 = new net.Socket();
                    monitor1.connect(5000, networkData[key].ipNetInt, function() {
                        monitor1.write(JSON.stringify(toSend)+"\n");
                        monitor1.destroy();
                    });
                }
            }

            // Add the monitor to the network
            networkData[name] = {
                isMonitor: true,
                alias: [
                    ip
                ],
                ipNetInt: msg.ipNetInt
            }
                        
        }
        if(msg.type === "ally_reply"){
            if(msg.success === true){
                let routerName;
                for(router in networkData){
                    if(networkData[router].alias.includes(msg.ip1) || networkData[router].alias.includes(msg.ip2)){
                        routerName = router;
                        break;
                    }
                }
                if(routerName == undefined){
                    networkData[anonRouter.getNewAnonRouter()] = {isMonitor: false, distance: {}}; // setting empty distance
                    networkData[anonRouter.getLastAnonRouter()].alias = [msg.ip1, msg.ip2];
                }else{
                    if(!networkData[routerName].alias.includes(msg.ip1)){
                        networkData[routerName].alias.push(msg.ip1)
                    }
                    if(!networkData[routerName].alias.includes(msg.ip2)){
                        networkData[routerName].alias.push(msg.ip)
                    }
                }
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
    g = new Graph({directed: false});
    iTop();
    console.log(g);
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
        edges_res.push({from: edge.v, to: edge.w, label: g.edge(edges[i]) ? JSON.stringify(  g.edge(edges[i]).mergeOption)  : "NO LABEL" });
    }
    res.render('network', {nodes: JSON.stringify(nodes_res), edges: JSON.stringify(edges_res)})
})
app.get('/phase1', (req, res) => {
    g = new Graph({directed: false});
    phase1();
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
        edges_res.push({from: edge.v, to: edge.w, label: g.edge(edges[i]) ? JSON.stringify(  g.edge(edges[i]).mergeOption)  : "NO LABEL" });
    }
    res.render('network', {nodes: JSON.stringify(nodes_res), edges: JSON.stringify(edges_res)})
})
app.get('/phase2', (req, res) => {
    phase2();
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
        edges_res.push({from: edge.v, to: edge.w, label: g.edge(edges[i]) ? JSON.stringify(  g.edge(edges[i]).mergeOption)  : "NO LABEL" });
    }
    res.render('network', {nodes: JSON.stringify(nodes_res), edges: JSON.stringify(edges_res)})
})
app.get('/phase3step', (req, res) => {
    console.log("\n\n\n\n EXECUTING PHASE3STEP")
	let findEdgeWithLessMergeOptions = (inRange) => {
        let filtered = inRange
                .filter(e => {
                    return g.edge(e) && g.edge(e).mergeOption.length > 0
                })
        return filtered.reduce((min, current) => g.edge(current).mergeOption.length < g.edge(min).mergeOption.length ? current : min, filtered[0])
	}

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
        edges_res.push({from: edge.v, to: edge.w, label: g.edge(edges[i]) ? JSON.stringify(  g.edge(edges[i]).mergeOption)  : "NO LABEL" });
    }

    let ei = findEdgeWithLessMergeOptions(g.edges())

    
    let ej = findEdgeWithLessMergeOptions(g.edge(ei).mergeOption)


    
    assert(ei != undefined, "EI is undefined");
    assert(ej != undefined, "EJ is undefined");
    if (compatible(ei, ej)) {

        merge(g, ei, ej);

    } else {
        let mi = g.edge(ei).mergeOption
        let mj = g.edge(ej).mergeOption
  
        mi.splice(mi.indexOf(ej), 1) // Mi = Mi \ {ej}
        mj.splice(mj.indexOf(ei), 1) // Mj = Mj \ {ei}

    }

    nodes = g.nodes();
    edges = g.edges()
    let nodes_res_new = [];
    for(let i = 0; i<nodes.length; i++){
        let node = nodes[i];
        nodes_res_new.push({id: node, label: `${node}\n${g.node(node).type || ""}`, group: `${g.node(node).type || ""}`});
    }
    let edges_res_new = [];
    for(i = 0; i<edges.length; i++){
        let edge = edges[i];
        edges_res_new.push({from: edge.v, to: edge.w, label: g.edge(edges[i]) ? JSON.stringify(  g.edge(edges[i]).mergeOption)  : "NO LABEL" });
    }

    res.render('doubleNetwork', {nodes: JSON.stringify(nodes_res), edges: JSON.stringify(edges_res), nodes_new: JSON.stringify(nodes_res_new), edges_new: JSON.stringify(edges_res_new)})
})
app.listen(3000, () => console.log('Example app listening on port 3000!'))


