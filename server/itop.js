const graphlib = require("@dagrejs/graphlib")
const Graph = graphlib.Graph
const signale = require('signale');

function assert(condition, message) {
    if (!condition) {
        console.trace();
        throw message || "Assertion failed";
    }
}
/* Pure function that check the router hierarchy */
function less(x, y){ //Pure function
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
function max(x, y){//Pure function
    if(less(x, y)){
        return y;
    }else{
        return x;
    }
}
function resultMerge(start1, end1, start2, end2){ //Pure function
    if(less(start1, start2) !== null && less(end1, end2) !== null){
		return [max(start1, start2), max(end1, end2)];
    }
    return null;
}
function mergeLabels(l1, l2){ //Pure function
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
function isSameEdge(edge, anotherEdge){ // Pure function
    if( (edge.v === anotherEdge.v && edge.w === anotherEdge.w) ||
        (edge.w === anotherEdge.v && edge.v === anotherEdge.w) ) return true;
    return false;
}

module.exports = class iTop {
    constructor(tracerouteData, networkData, networkDiameter){
        this.tracerouteData = tracerouteData;
        this.networkDiameter = networkDiameter;
        this.networkData = networkData;
        this.g = new Graph({
            directed: false
        });
        this.anonRouter = (() =>{
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
        })();
        this.getName = (address) => {
            for (var key in this.networkData) {
                if(this.networkData[key].alias.includes(address)){
                    return key;
                }
            }
            return address;
        }
        this.getTrace = (from, to) => {
            for(let i = 0; i<this.tracerouteData.length; i++){
                let t = this.tracerouteData[i];
                if(t.from === from && t.to === to ){
                    return t;
                }
            }
            return null;
        }
        this.getPath = (from, to) => {
            let i = 0;
            while(i<this.tracerouteData.length){
                let trace = this.tracerouteData[i];
                if(this.getName(trace.from) === from && this.getName(trace.to) === to){
                    return trace;
                }
                i++;
            }
        }
        this.addHop = (currentName, previousName, newNodeLabel, pathName) => {
            if(!this.g.hasNode(currentName)){
                this.g.setNode(currentName, newNodeLabel);
            }
            let attachment = this.g.edge(previousName, currentName);
            if(attachment === undefined){
                attachment = {path: [pathName], mergeOption: []}
            }else{
                attachment.path.push(pathName);
            }
            this.g.setEdge(previousName, currentName, attachment) 
        }

        this.nodeContraction = (graph, node1, node2, resultingType) => {
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
        this.merge = (graph, ei, ej) => {
            let resType = resultMerge( // Tabellone del paper
                graph.node(ei.v).type,
                graph.node(ei.w).type,
                graph.node(ej.v).type,
                graph.node(ej.w).type
            )
        
            if(ei.v !== ej.v){
                this.nodeContraction(graph, ei.v, ej.v, resType[0]);
            }
            if(ei.w !== ej.w){
                this.nodeContraction(graph, ei.w, ej.w, resType[1]);
            }
        
            // Sistemiamo tutte, tutte, tutte le etichette
            // If contengono entrambe le opzioni, sono tenute e rinominate. Altrimenti l'opzione viene rimossa

            let edges = graph.edges();
            for(let i = 0; i<edges.length; i++){
                let currentEdge = edges[i];
                let currentLabel = graph.edge(currentEdge);
                let hasEi = false;
                let index = 0;
                let jndex = 0;
                let hasEj = false;
                for(let j = 0; j<currentLabel.mergeOption.length; j++){
                    if(isSameEdge(ei, currentLabel.mergeOption[j])){
                        hasEi = true;
                        index = j;
                    }
                    if(isSameEdge(ej, currentLabel.mergeOption[j])){
                        hasEj = true;
                        jndex = j;
                    }
                }
                if(hasEi && hasEj){
                    currentLabel.mergeOption.splice(jndex, 1); 
                }else{
                    if(hasEi){
                        currentLabel.mergeOption.splice(index, 1);
                    }
                    if(hasEj){
                        currentLabel.mergeOption.splice(jndex, 1);
                    }
                }

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
                currentLabel.mergeOption = mergeOptionResult
                                        .filter((edge, index, self) => index === self.findIndex(
                                                        (t) => ( t.v === edge.v && t.w === edge.w)))
                                        .filter(edge => (!isSameEdge(currentEdge, edge) ));

                graph.setEdge(currentEdge, currentLabel);
            }
        }
        this.setGraph = (jsongraph)=>{
            this.g = graphlib.json.read(jsongraph);
        }

        this.compatible = (edgeA, edgeB) => {
            if((this.networkData[edgeA.v] && this.networkData[edgeA.v].isMonitor)
            || (this.networkData[edgeA.w] && this.networkData[edgeA.w].isMonitor)
            || (this.networkData[edgeB.v] && this.networkData[edgeB.v].isMonitor)
            || (this.networkData[edgeB.w] && this.networkData[edgeB.w].isMonitor)) return false;
            let typeStartA = this.g.node(edgeA.v).type;
            let typeEndA = this.g.node(edgeA.w).type;
            let typeStartB = this.g.node(edgeB.v).type;
            let typeEndB = this.g.node(edgeB.w).type;
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

        this.findEdgeWithLessMergeOptions = (inRange) => {
            let filtered = inRange
                    .filter(e => {
                        return this.g.edge(e) && this.g.edge(e).mergeOption.length > 0
                    })
            return filtered.reduce((min, current) => 
                                    this.g.edge(current).mergeOption.length < 
                                    this.g.edge(min).mergeOption.length ? current : min, filtered[0])
        }
        this.existMergeOption = () => {
            return this.g.edges().filter(e =>{
                return this.g.edge(e).mergeOption && this.g.edge(e).mergeOption.length > 0
            }).length > 0;
        }
        
        this.phase1 = this.phase1.bind(this);
        this.phase2 = this.phase2.bind(this);
        this.phase3core = this.phase3core.bind(this);
        this.phase3 = this.phase3.bind(this);
        this.run = this.run.bind(this);
        this.runStep = this.runStep.bind(this);

        this.graphs = [];
    }
    
    phase1() {
        var fs = require('fs');
            fs.writeFile("./traceroutesComputed.json", JSON.stringify(this.tracerouteData), function(err) {
                if(err) {
                    return console.log(err);
                }

                console.log("The file was saved!");
            }); 
        var fs = require('fs');
            fs.writeFile("./netDataComputed.json", JSON.stringify(this.networkData), function(err) {
                if(err) {
                    return console.log(err);
                }

                console.log("The file was saved!");
            }); 
        console.log("Running Phase1");
        this.g.setDefaultNodeLabel({type: "R"})
        this.tracerouteData.forEach(trace => {
            let originRouter = this.getName(trace.from);
            let destinationName = this.getName(trace.to);
            let pathName = this.getName(trace.from)+this.getName(trace.to);
           
            let hops = trace.hops;
            if(hops[hops.length-1].success){ /* If origin can communicate with destination */
                for(let i = 0; i<hops.length; i++){
                    let currentHop = hops[i];
                    let previouName;
                    if(i == 0){
                        previouName = originRouter;
                    }else{
                        if(hops[i-1].success){
                            previouName = this.getName(hops[i-1].address);
                        }else{
                            previouName = this.anonRouter.getLastAnonRouter();
                        }
                    }
                    let label = currentHop.success ? {type: "R"} : {type: "A"}
                    let currentName = currentHop.success ? this.getName(currentHop.address) : this.anonRouter.getNewAnonRouter();
                    this.addHop(currentName, previouName, label,  pathName)
                }
            }else{ /* If origin cannot communicate with destination */
                if(trace.alreadyUsed){ // Avoid to consider a path already used as opposite path
                    return;
                }
                console.log(this.networkData);
                let distance = this.networkDiameter || this.networkData[originRouter].distance[destinationName]; // OR COMPUTE DISTANCE WITH SOME OTHER METRICS
                assert(distance != undefined, `Not defined distance between ${originRouter} and ${destinationName}`);
                let oppositePath = this.getPath(destinationName, originRouter);
                signale.log(`Not found opposite path ${destinationName} => ${originRouter} ...`);
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
                            previouName = this.getName(hops[i-1].address);
                        }else{
                            previouName = this.anonRouter.getLastAnonRouter();
                        }
                    }
                    let label = currentHop.success ? {type: "R"} : {type: "A"};
                    let currentName = currentHop.success ? this.getName(currentHop.address) : this.anonRouter.getNewAnonRouter();
                    this.addHop(currentName, previouName, label,  pathName)
                }
                let unknownRouters = distance - successNumberAB - successNumberBA;
    
                if(unknownRouters === 1){
                    let label = {type: "B"};
                    this.addHop(this.anonRouter.getNewAnonRouter(), 
                                this.getName(hops[successNumberAB-1].address), 
                                label, pathName);
                    this.addHop(this.getName(oppositePath.hops[successNumberBA-1].address), 
                                this.anonRouter.getLastAnonRouter(), {type: "R"}, pathName);
                }else{
                    this.addHop(this.anonRouter.getNewAnonRouter(), 
                                this.getName(hops[successNumberAB-1].address), 
                                {type: "N"}, pathName);
                    let i = 1;
                    while(i < unknownRouters-1){ // adding hidden routers
                        let previousNode = this.anonRouter.getLastAnonRouter();
                        this.addHop(this.anonRouter.getNewAnonRouter(), previousNode, {type: "H"}, pathName)      
                        i++;
                    }
                    let previousName = this.anonRouter.getLastAnonRouter();
                    this.addHop(this.anonRouter.getNewAnonRouter(), previousName, {type: "N"}, pathName);
                    this.addHop(this.getName(oppositePath.hops[successNumberBA-1].address), 
                                this.anonRouter.getLastAnonRouter(), 
                                {type: "R"}, pathName);
                }
                
                for(let i = successNumberBA-1; i>=0; i--){
                    let currentHop = oppositePath.hops[i];
                    let previouName;
                    if(i < successNumberBA-1 && oppositePath.hops[i+1].success){
                        previouName = this.getName(oppositePath.hops[i+1].address);
                    }else{
                        previouName = this.anonRouter.getLastAnonRouter();
                    }
                    let label = currentHop.success ? {type: "R"} : {type: "A"}
                    let currentName = currentHop.success ? 
                                        this.getName(currentHop.address) : 
                                        this.anonRouter.getNewAnonRouter();
                    this.addHop(currentName, previouName, label,  pathName)
                }
                this.addHop(this.getName(oppositePath.hops[0].address), 
                            destinationName, 
                            {type: "R"}, pathName);
            }
            signale.complete(`New trace added from ${originRouter} to ${destinationName}`);
        });
        this.graphs.push(graphlib.json.write(this.g));
    }

    phase2(){
        console.log("Running Phase2");
        let edges = this.g.edges();
        let paths = {};
        edges.forEach(e => { // Here I will create a map [path => edges[]] that is used in Trace Preservation analysis
            let label = this.g.edge(e);
            let edgePaths = label ? label.path : [] ;
            for(let i = 0; i<edgePaths.length; i++){
                if(paths[edgePaths[i]] === undefined)
                    paths[edgePaths[i]] = [e];
                else
                    paths[edgePaths[i]].push(e);
            }
        })
        let distance = graphlib.alg.floydWarshall(this.g, () => 1, (node) => this.g.nodeEdges(node)); //distance is a var used to compare actual distance with new one after merge
    
        for(let i = 0; i<edges.length; i++){
            let edgeAttachment = this.g.edge(edges[i]) || {};
            edgeAttachment.mergeOption=[];
            this.g.setEdge(edges[i], edgeAttachment) // adding mergeOption to the existing label
            for(let j = 0; j<edges.length; j++){
                if(i !== j){
                    let valid = true;
                    // Trace Preservation
                    for(let path in paths){
                        if(paths[path].includes(edges[i]) && paths[path].includes(edges[j])){
                            valid = false;
                            break;
                        }
                    } 
                    if(valid === false){
                        continue;
                    }
    
                    //Distance and link endpoint compatibility
                    if( !this.compatible(edges[i], edges[j]) ){
                        valid = false;
                    }else{
                        let serial = JSON.stringify(graphlib.json.write(this.g));
                        let copiedGraph = graphlib.json.read(JSON.parse(serial));
                        this.merge(copiedGraph, edges[i], edges[j]);
                        let newDistance = graphlib.alg.floydWarshall(copiedGraph, () => 1, (node) => copiedGraph.nodeEdges(node)) // O(|V|^3)
                        for(let i1 = 0; i1<this.tracerouteData.length; i1++){
                            let trace = this.tracerouteData[i1];
                            let from = this.getName(trace.from); // resolving alias === get node name associated to ip
                            let to = this.getName(trace.to);
                            
                            try{
                                if(newDistance[from][to].distance != undefined &&
                                    newDistance[from][to].distance !== distance[from][to].distance){
                                    valid = false;
                                    break;
                                }
                            }catch(x){
                                valid=false;
                            }
                        }
    
                    }
                    if(valid && !edgeAttachment.mergeOption.includes(edges[j])){
                        edgeAttachment.mergeOption.push(edges[j]);
                        this.g.setEdge(edges[i], edgeAttachment); // There is a control before that check that on edge E1 is not added E1 itself
                    }
                }
            }
        }
        this.graphs.push(graphlib.json.write(this.g));
    }

    phase3core(){
        console.log("Running Phase3core");
        this.graphs.push(graphlib.json.write(this.g));
        let ei = this.findEdgeWithLessMergeOptions(this.g.edges());
        let ej = this.findEdgeWithLessMergeOptions(this.g.edge(ei).mergeOption);
        assert(ei != undefined, "EI is undefined");
        console.log("ei", ei);
        if(ej == undefined){
            let label = this.g.edge(ei);
            console.log("\n\n EJ is undefined error");
            console.log("\t\tei", ei);
            console.log("\t\tei_label", label)
            console.log("Inner labels");
                label.mergeOption.forEach(edge => {
                    console.log("EdgeLAbel of", edge, " is ", this.g.edge(edge))
                })
            label.mergeOption = [];
            this.g.setEdge(ei, label);
        }else{
            console.log("ej", ej);
            this.g.edge(ej).mergeOption.forEach(e => {
                if(ei.v == e.w && ei.w == e.v){
                    console.log("\n\n\n\t\t*********INVERSO!!\n\n\n")
                }
            })
            
            
            if (this.compatible(ei, ej)) {
                assert(ej != undefined, "EJ is undefined");
                this.merge(this.g, ei, ej);
            } else {
                let mi = this.g.edge(ei).mergeOption
                let mj = this.g.edge(ej).mergeOption
        
                mi.splice(mi.indexOf(ej), 1) // Mi = Mi \ {ej}
                mj.splice(mj.indexOf(ei), 1) // Mj = Mj \ {ei}
            }
        }
        console.log("\n\n\n")
    }

    phase3() {
        console.log("Running Phase3");
        let i = 0; // used only for debug prints
        while (this.existMergeOption()) { //Pseudocode from the paper
            this.phase3core();
        }
    }

    run(){
        this.phase1();
        this.phase2();
        this.phase3();
        console.log("Graph computation ended")
    }

    runStep(){
        if(this.existMergeOption()) 
            this.phase3core();
    }
}
