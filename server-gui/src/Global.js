import React from "react"
import {Jumbotron, Button} from "react-bootstrap"

export const HOST = window.location.protocol + '//' + window.location.host

export class Init extends React.Component {

    render(){
        return ( <Jumbotron>
            <h1>Wait for a monitors, then run the algorithm...</h1>
            <p>
                In order to see the something, you have to run the algorithm.
            </p>
            <p>
                <Button bsStyle="primary" onClick={() => {
                    console.log("Clicked");
                    if(!this.state || !this.state.loading){
                        this.setState({loading: true});
                        fetch(`${HOST}/init`).then( res => {
                            this.setState({loading: false});
                            this.props.handler()
                        })
                    }
                }} > {this.state && this.state.loading ? <div className="loader"/> : "Run it now!"}</Button>
            </p>
        </Jumbotron>)
    }
} 