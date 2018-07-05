"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Node = function Node(id, type) {
    _classCallCheck(this, Node);

    this.id = id;
    this.type = type;
};

var Edge = function Edge(id, start, end, props) {
    _classCallCheck(this, Edge);

    this.start = start;
    this.end = end;
    this.id = id;
    this.props = props ? props : {};
};

var Graph = function () {
    function Graph() {
        _classCallCheck(this, Graph);

        this.nodes = [];
        this.edges = [];
    }

    _createClass(Graph, [{
        key: "addNode",
        value: function addNode(id, label) {
            if (!hasNode(id)) this.nodes.push(new Node(id, label));
        }
    }, {
        key: "addEdge",
        value: function addEdge(id, start, end, props) {
            if (getNode(start) === undefined) {
                this.addNode(start);
            }
            if (getNode(end) === undefined) {
                this.addNode(end);
            }
            this.edges.push(new Edge(id, start, end, props));
        }
    }, {
        key: "getNode",
        value: function getNode(id) {
            return this.nodes.filter(function (node) {
                return node.id === id;
            }).length > 0;
        }
    }, {
        key: "getEdge",
        value: function getEdge(startOrID, end) {
            if (arguments.length === 1) {
                return this.edges.filter(function (e) {
                    return e.id === startOrID;
                });
            } else {
                return this.edges.filter(function (e) {
                    return e.start === startOrID && e.end === end;
                });
            }
        }
    }, {
        key: "hasNode",
        value: function hasNode(id) {
            return this.getNode(id) !== undefined;
        }
    }, {
        key: "hasEdge",
        value: function hasEdge(startOrID, end) {
            return getEdge(startOrID, end) !== undefined;
        }
    }, {
        key: "nodes",
        value: function nodes() {
            return this.nodes.slice();
        }
    }, {
        key: "edges",
        value: function edges() {
            return this.edges.slice();
        }
    }]);

    return Graph;
}();

module.exports = {
    Graph: Graph
};