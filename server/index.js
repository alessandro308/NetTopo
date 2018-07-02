const Graph = require("@dagrejs/graphlib").Graph
var fs = require('fs');
var networkData = JSON.parse(fs.readFileSync('./netdata.json', 'utf8'));
var tracerouteData = JSON.parse(fs.readFileSync('./traceroute.json', 'utf8'));

getRouterName = function(){
    let routerName = 0;
    return function(){
        routerName++;
        return "A"+routerName;
    }
}();

function IP(addressBytes){
    return `${addressBytes[0]}.${addressBytes[1]}.${addressBytes[2]}.${addressBytes[3]}`;
}
function getName(networkData, address){
    for (var key in networkData) {
        if(networkData[key].alias.includes(address)){
            return key;
        }
    }
    return "00";
}


function phase1(networkData, tracerouteData, routerID /*array*/) {
    let g = new Graph({ directed: true, compound: false, multigraph: true });
    g.setDefaultNodeLabel("R")
    routerID.forEach(element => {
        g.setNode(element)
    });
    tracerouteData.forEach(trace => {
        let hops = trace.hops;
        let originRouter = getName(networkData, hops.from);
        if(hops[hops.length-1].Success){ /* If origin can communicate with destination */
            for(let i = 0; i<hops.length; i++){
                let hop = hops[i];
                let previousRouter = i == 0 ? originRouter : getName(networkData, IP(hops[i-1].Address));
                if(hop.Success){ /* has replied */
                    let destinationName = getName(networkData, IP(hop.Address));
                    if(!g.hasNode(destinationName)){
                        g.setNode(destinationName);
                    }
                    g.setEdge(previousRouter, destinationName)
                }else{ /* Anonymous one */
                    let destinationName = getRouterName();
                    if(!g.hasNode(destinationName)){
                        g.setNode(destinationName, "A");
                    }
                    g.setEdge(previousRouter, destinationName)
                }
            }
        }
    });
    
}

let routerID = [];
for(key in networkData){
    routerID.push(key);
}
phase1(networkData, tracerouteData, routerID)

