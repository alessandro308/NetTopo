let iTop = require("./itop.js")
var fs = require('fs');
const graphlib = require("@dagrejs/graphlib")
const Graph = graphlib.Graph

const networkData = JSON.parse(fs.readFileSync('./netdata.json', 'utf8'));
const tracerouteData = JSON.parse(fs.readFileSync('./traceroute.json', 'utf8'));
let anonRouter = (() =>{
    let routerName = 0;
    return {
        getNewAnonRouter: function(){
            routerName++;
            return "C"+routerName;
        },
        getLastAnonRouter: function(){
            return "C"+routerName;
        }
    }
})();
let getTrace = (from, to) => {
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
            if(networkData[name] === undefined){
                networkData[name] = {
                    isMonitor: true,
                    alias: [
                        ip
                    ],
                    ipNetInt: msg.ipNetInt
                }
            }else{
                networkData[name].isMonitor = true;
                networkData[name].alias = [ip];
                networkData[name].ipNetInt=msg.ipNetInt;
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
let itop; //Used as shared var between /phase1, /phase2...
app.set('view engine', 'pug')
app.use(express.static('views/assets'));
app.use('/assets', express.static('views/assets'));
const MAX_DISTANCE = 10
app.get('/', (req, res) => {
    itop = new iTop(tracerouteData, networkData, MAX_DISTANCE);
    itop.run();
    
    let nodes = itop.g.nodes();
    let edges = itop.g.edges()
    let nodes_res = [];
    for(let i = 0; i<nodes.length; i++){
        let node = nodes[i];
        nodes_res.push({id: node, label: `${node}\n${itop.g.node(node).type || ""}`, group: `${itop.g.node(node).type || ""}`});
    }
    let edges_res = [];
    for(i = 0; i<edges.length; i++){
        let edge = edges[i];
        edges_res.push({from: edge.v, to: edge.w, label: itop.g.edge(edges[i]) ? JSON.stringify(  itop.g.edge(edges[i]).mergeOption)  : "NO LABEL" });
    }
    res.render('network', {nodes: JSON.stringify(nodes_res), edges: JSON.stringify(edges_res)})
})
app.get('/phase1', (req, res) => {
    itop = new iTop(tracerouteData, networkData, MAX_DISTANCE);
    itop.phase1();
    let nodes = itop.g.nodes();
    let edges = itop.g.edges()
    let nodes_res = [];
    for(let i = 0; i<nodes.length; i++){
        let node = nodes[i];
        nodes_res.push({id: node, label: `${node}\n${itop.g.node(node).type || ""}`, group: `${itop.g.node(node).type || ""}`});
    }
    let edges_res = [];
    for(i = 0; i<edges.length; i++){
        let edge = edges[i];
        edges_res.push({from: edge.v, to: edge.w, label: itop.g.edge(edges[i]) ? JSON.stringify(  itop.g.edge(edges[i]).mergeOption)  : "NO LABEL" });
    }
    res.render('network', {nodes: JSON.stringify(nodes_res), edges: JSON.stringify(edges_res)})
})
app.get('/phase2', (req, res) => {
    itop.phase2();
    let nodes = itop.g.nodes();
    let edges = itop.g.edges()
    let nodes_res = [];
    for(let i = 0; i<nodes.length; i++){
        let node = nodes[i];
        nodes_res.push({id: node, label: `${node}\n${itop.g.node(node).type || ""}`, group: `${itop.g.node(node).type || ""}`});
    }
    let edges_res = [];
    for(i = 0; i<edges.length; i++){
        let edge = edges[i];
        edges_res.push({from: edge.v, to: edge.w, label: itop.g.edge(edges[i]) ? JSON.stringify( itop.g.edge(edges[i]).mergeOption)  : "NO LABEL" });
    }
    res.render('network', {nodes: JSON.stringify(nodes_res), edges: JSON.stringify(edges_res)})
})
app.get('/phase3step', (req, res) => {
    console.log("\n\n\n\n EXECUTING PHASE3STEP")
    let nodes = itop.g.nodes();
    let edges = itop.g.edges()
    let nodes_res = [];
    for(let i = 0; i<nodes.length; i++){
        let node = nodes[i];
        nodes_res.push({id: node, label: `${node}\n${itop.g.node(node).type || ""}`, group: `${itop.g.node(node).type || ""}`});
    }
    let edges_res = [];
    for(i = 0; i<edges.length; i++){
        let edge = edges[i];
        edges_res.push({from: edge.v, to: edge.w, label: itop.g.edge(edges[i]) ? JSON.stringify(  itop.g.edge(edges[i]).mergeOption)  : "NO LABEL" });
    }

    itop.runStep();

    nodes = itop.g.nodes();
    edges = itop.g.edges()
    let nodes_res_new = [];
    for(let i = 0; i<nodes.length; i++){
        let node = nodes[i];
        nodes_res_new.push({id: node, label: `${node}\n${itop.g.node(node).type || ""}`, group: `${itop.g.node(node).type || ""}`});
    }
    let edges_res_new = [];
    for(i = 0; i<edges.length; i++){
        let edge = edges[i];
        edges_res_new.push({from: edge.v, to: edge.w, label: itop.g.edge(edges[i]) ? JSON.stringify(  itop.g.edge(edges[i]).mergeOption)  : "NO LABEL" });
    }

    res.render('doubleNetwork', {nodes: JSON.stringify(nodes_res), edges: JSON.stringify(edges_res), nodes_new: JSON.stringify(nodes_res_new), edges_new: JSON.stringify(edges_res_new)})
})

app.get('/merge', (req, res) => {
    console.log("\n\n\n\n EXECUTING PHASE3STEP")
    let itop = new iTop();
    let g = new Graph({directed: false});
    g.setNode("x2", {type: "A"});
    g.setNode("x1", {type: "A"});
    g.setNode("y1", {type: "A"});
    g.setNode("y2", {type: "A"})
    g.setNode("tmp1", {type: "A"})
    g.setNode("tmp2", {type: "A"})
    g.setEdge("x1", "x2");
    g.setEdge("x2", "y1");
    g.setEdge("y1", "y2");
    g.setEdge("y2", "tmp1");
    g.setEdge("tmp1", "tmp2");

    let d = graphlib.alg.floydWarshall(g, () => 1, (node) => g.nodeEdges(node));
    console.log(d);
    return;

    
    /*g.setEdge("x1", "x2", {mergeOption: [{v: "A", w: "B"}], path: ["AI", "AJ"] })
    g.setEdge("y1", "y2", {mergeOption: [{v: "a1", w: "b1"}], path: ["AJ", "AZ"] })
    g.setEdge("tmp1", "x1", {mergeOption: [{v: "A3", w: "B"}, {v: "x1", w: "x2"}], path: ["AI", "AJ"] })
    g.setEdge("tmp2", "y1", {mergeOption: [{v: "A3", w: "B"}, {v: "y1", w: "y2"}], path: ["AI", "AJ"] })
    g.setEdge("tmp1", "tmp2", {mergeOption: [{v: "y1", w: "y2"}, {v: "x1", w: "x2"}], path: ["AI", "AJ"] })*/
    //itop.merge(g, {v: req.param.v1, w: req.param.v2}, {v: req.param.v3, w: req.param.v4});
    
    
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

    itop.merge(g, {v: "x1", w: "x2"}, {v: "y1", w: "y2"});

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
        edges_res_new.push({from: edge.v, to: edge.w, label: g.edge(edges[i]) ? JSON.stringify(   g.edge(edges[i]).mergeOption)  : "NO LABEL" });
    }

    res.render('doubleNetwork', {nodes: JSON.stringify(nodes_res), edges: JSON.stringify(edges_res), nodes_new: JSON.stringify(nodes_res_new), edges_new: JSON.stringify(edges_res_new)})
})

app.listen(3000, () => console.log('Example app listening on port 3000!'))


