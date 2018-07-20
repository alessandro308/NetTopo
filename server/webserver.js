// Webserver


class WebServer {
    constructor(){
        this.run = () => {
            const express = require('express')
            const app = express()
            let itop; //Used as shared var between /phase1, /phase2...
            app.set('view engine', 'pug')
            app.use(express.static('views/assets'));
            app.use('/assets', express.static('views/assets'));
            const MAX_DISTANCE = 10
            app.get("/", (req,res) => {
                itop = new iTop(tracerouteData, networkData, undefined);
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
            app.get('/phase1/:distance', (req, res) => {
                itop = new iTop(tracerouteData, networkData, req.params.distance); //undefined può essere settato con un int e a quel punto considera quella come distanza
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
            app.get('/phase1', (req, res) => {
                itop = new iTop(tracerouteData, networkData, undefined); //undefined può essere settato con un int e a quel punto considera quella come distanza
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
        }
    }
}