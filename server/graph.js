// FILE DEPRECATED, UNUSED!!
class Node {
    constructor(id, type){
        this.id = id;
        this.type = type;
    }

}

class Edge {
    constructor(id, start, end, props){
        this.start = start;
        this.end = end;
        this.id = id;
        this.props = props || {};
    }
}

class Graph{
    constructor(){
        this._nodes = [];
        this._edges = [];
        this._defaultLabel = "None"
        this.paths = [];
    }

    setDefaultNodeLabel(label){
        this.defaultLabel = label;
    }
    addNode(id, label){
        if(!this.hasNode(id))
            this._nodes.push(new Node(id, label || this.defaultLabel));
    }
    addEdge(start, end, props, id){
        if(this.getNode(start) === undefined){
            this.addNode(start)
        }
        if(this.getNode(end) === undefined){
            this.addNode(end);
        }
        if(id === null){
            id = `${start}${end}${JSON.stringify(props)}`;
        }
        if(props !== undefined && "path" in props){
            if(!this.paths.includes(props.path)){
                this.paths.push(props.path);
            }
        }
        this._edges.push(new Edge(id, start, end, props));
    }

    getNode(id){
        return this._nodes.filter(node => node.id === id)[0];
    }
    
    getEdge(startOrID, end){
        if(arguments.length === 1){
            return this._edges.filter(e => e.id === startOrID)[0];
        }else{
            return this._edges.filter(e => e.start === startOrID && e.end === end)[0];
        }
    }

    getOutEdge(nodeId){
        return this._edges.filter(e => e.start === nodeId);
    }
    getInEdge(nodeId){
        return this._edges.filter(e => e.end === nodeId);
    }

    hasNode(id){
        return this.getNode(id) !== undefined
    }
    hasEdge(startOrID, end){
        return getEdge(startOrID, end) !== undefined
    }

    nodes(){
        return this._nodes;
    }
    edges(){
        return this._edges;
    }

    getEdgeByPath(path){
        return this._edges.filter(e => e.props.path === path);
    }

    adjMatrix(){
        let result = {};
        for(let i = 0; i<this._nodes.length; i++){
            let row = {};
            for(let j = 0; j<this._nodes.length; j++){
                row[this._nodes[j].id] = 0;
            }
            result[this._nodes[i].id] = row;
        }
        this._edges.forEach(edge => {
            result[edge.start][edge.end] = 1;
        })
        return result;
    }
}

module.exports = {
    Graph: Graph
}

