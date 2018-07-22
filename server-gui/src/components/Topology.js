import React from "react"
import Graph from "react-graph-vis"
import Tooltip from 'rc-tooltip';
import Slider from 'rc-slider';
import {HOST, Init} from "../Global"
import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';
import graphlib from "@dagrejs/graphlib"

export default class Topology extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            graph: {
                nodes: [
                  ],
                edges: [
                  ]
            },
            ready: false,
            sliderValue: 1
        }
        this.sliderHandler = (props) => {
            const { value, dragging, index, ...restProps } = props;
            return (
              <Tooltip
                prefixCls="rc-slider-tooltip"
                overlay={value}
                visible={dragging}
                placement="top"
                key={index}
              >
                <Slider.Handle value={value} {...restProps} />
              </Tooltip>
            );
        };
        this.setGraph = (e) => {
            if(e > this.state.graphs.length - 1 ){
                e = this.state.graphs.length -1
            }
            let g = graphlib.json.read(this.state.graphs[e]);
            console.log(g);
            let nodes = g.nodes();
            let edges = g.edges();
            let nodes_res = [];
           
            for(let i = 0; i<nodes.length; i++){
                let node = nodes[i];
                nodes_res.push({id: node, label: `${node}\n${g.node(node).type || ""}`, group: `${g.node(node).type || ""}`});
            }
            
            let edges_res = [];
            if(e < this.state.graphs.length - 1 ){
                for(let i = 0; i<edges.length; i++){
                    let edge = edges[i];
                    edges_res.push({from: edge.v, to: edge.w, label: g.edge(edges[i]) ? JSON.stringify( g.edge(edges[i]).mergeOption)  : "NO LABEL" });
                }
            }else{
                for(let i = 0; i<edges.length; i++){
                    let edge = edges[i];
                    edges_res.push({from: edge.v, to: edge.w});
                }
            }
            this.setState({
                graph: {nodes: nodes_res, edges: edges_res}
            })
        }

        this.fetchGraphs = () => {
            return fetch(HOST+"/graphs")
            .then(res => res.json())
            .then(res => {
                if(res.type === "NO_INIT"){
                    this.setState( { ready: false} );
                }else{
                    let phase3count = res.length;
                    console.log("graph length", res.length);
                    for(let i = 3; i<phase3count; i++){ 
                        this.marks[i] = {style: {color: 'green'}, label: i } 
                    };
                    this.marks[phase3count] = { style: {color: "Green", fontSize: "15px"}, label: "Final"}
                    this.setState( {ready: true, graphs: res});
                    this.setGraph(1);
                }
            })
        }
        this.marks = {
            1: {style: {
                color: 'red',
              }, label: "1"},
            2: {style: {
                color: 'orange',
              }, label: "2"}
        }
    }

    componentWillMount(){
        this.fetchGraphs();
    }

    render(){
        let opt = {
                        edges:{
                            arrows: {
                            to:     {enabled: false, scaleFactor:1, type:'arrow'},
                            middle: {enabled: false, scaleFactor:1, type:'arrow'},
                            from:   {enabled: false, scaleFactor:1, type:'arrow'}
                            }
                        }
                    }
        return (
                this.state.ready ? 
                (<React.Fragment>
                    <div id="slider">
                    <h2>Steps</h2>
                    <Slider min={0} marks={this.marks} max={this.state.graphs.length} defaultValue={1} handle={this.sliderHandler} onChange={this.setGraph}/>
                    </div>
                    <div id="graph">
                        <Graph heigth="100%" options={opt} graph={this.state.graph} />
                    </div>
                </React.Fragment>)
                :(
                    <Init handler={this.fetchGraphs}/>
                )
        
        )
    }
}