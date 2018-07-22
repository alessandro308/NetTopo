import React, { Component } from 'react';
import './App.css';
import {Navbar, Nav, NavItem, Jumbotron, Button} from "react-bootstrap";
import Inventory from "./components/inventory"
import Topology from "./components/Topology"
import {HOST} from "./Global"

function Home(props) {
   return (
    <Jumbotron>
      <h2>This is NetTopo!</h2>
      <p>
          Please, choose a page on the main menu in order to see your network topology.
      </p>
  </Jumbotron>
   )
}


class Menu extends Component{

  render() {
    return (<Navbar>
      <Navbar.Header>
        <Navbar.Brand>
          NetTopo
        </Navbar.Brand>
      </Navbar.Header>
      <Nav>
        <NavItem onClick={() => this.props.onClick(0)} active={this.selected === 0 ? true : false}>
          {this.selected === 0 ? <b>Inventory</b> : "Inventory" }
        </NavItem>
        <NavItem onClick={() => this.props.onClick(1)} active={this.selected === 1 ? true : false}>
          {this.selected === 1 ? <b>Topology</b> : "Topology" }
        </NavItem>
        <NavItem onClick={() => this.props.onClick(2)}>
          <font color="red">Reload Network</font>
        </NavItem>
      </Nav>

        <Navbar.Text pullRight>Developed by A. Mantovani e A. Pagiaro</Navbar.Text>

    </Navbar>
    )
  }
}
  

class App extends Component {

  constructor(props){
    super(props);
    this.state = {
      selectedMenu: -1
    }
    this.changeMenu = (key) => {
      if(key === 2){
        fetch(`${HOST}/init`).then( res => {
          this.setState({selectedMenu: -1, ready: true});
          this.forceUpdate();
        })
      }else{
        this.setState({selectedMenu: key})
      }
    }
  }

  render() {
    let page;
    switch (this.state.selectedMenu) {
      case -1:
        page = <Home ready={this.state.ready}/>
        break;
      case 0:
        page = <Inventory />
        break;
      case 1:
        page = <Topology /> 
        break;
      default:
        break;
    }
    return (
      <div className="App">
        <Menu onClick={this.changeMenu} selected={this.state.selectedMenu}/>
        <div className="container" id="main">
          {page}
        </div>
      </div>
    );
  }
}

export default App;
