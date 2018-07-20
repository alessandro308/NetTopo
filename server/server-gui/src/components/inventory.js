import React from "react"
import {HOST, Init} from "../Global"
import {Table} from "react-bootstrap"

class InventoryTable extends React.Component{
    
    render() {
        let nodes = [];
        for( let key in this.props.data ){
            nodes.push({
                name: key,
                alias: this.props.data[key].alias,
                type: this.props.data[key].type
            })
        }
        return (<Table striped bordered condensed hover>
            <thead>
                <tr>
                <th>#</th>
                <th>Symbolic Router Name</th>
                <th>Connected Interfaces</th>
                <th>IP Interfaces</th>
                <th>Type</th>
                </tr>
            </thead>
            <tbody>
                {
                    nodes.map((currentData, index) => (
                        <tr key={currentData.name}>
                            <td>{index}</td>
                            <td>{currentData.name}</td>
                            <td>{currentData.alias ? currentData.alias.length : "unkown"}</td>
                            <td>{currentData.alias ? currentData.alias.map( (e) => `${e}\t`) : "unknown"}</td>
                            <td>{currentData.type }</td>
                        </tr>
                    ))
                }
            </tbody>
        </Table>)
    }
}


export default class InventoryPanel extends React.Component{
    constructor(props){
        super(props);
        this.state = {loading: true};
    }

    getNodes = () => {
        fetch(`${HOST}/nodes`)
        .then( res => res.json() )
        .then( res => {
            console.log(res);
            if(res.type === "NO_INIT"){
                this.setState({
                    loading: false,
                    ready: false
                });
            }else{
                this.setState({
                    loading: false,
                    nodes: res.nodes,
                    ready: true
                });
            }
        });
    }

    componentWillMount(){
        this.getNodes()
    }
    render(){
        if(this.state.loading){
            return <div className="loader loader-big"></div>;
        }else{
            if(this.state.ready){
                return <InventoryTable data={this.state.nodes}/>;
            }else{
                return (
                    <Init handler={this.getNodes} />
                )
            }
            
        }
    }
}