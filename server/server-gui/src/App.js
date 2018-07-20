import React, { Component } from 'react';
import './App.css';
import {Navbar, Nav, NavItem} from "react-bootstrap";
import Inventory from "./components/inventory"
import Topology from "./components/Topology"
import {Init} from "./Global"

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
        <NavItem onClick={() => this.props.onClick(2)} active={this.selected === 2 ? true : false}>
          {this.selected === 1 ? <b>Distances</b> : "Distances" }
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
      console.log("MENU CHANGE "+key)
      this.setState({selectedMenu: key})
    }
  }

  render() {
    let page;
    switch (this.state.selectedMenu) {
      case -1:
        page = <Init handler={() => this.setState({selectedMenu: 1})} />
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
