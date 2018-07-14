# How to discover a network Topology



In these days, I'm developing (with Andrea) a software to discover a network topology. The project is becoming a bit complex but we are trying to reach a useful state to distribute the code.

We have read several papers and publication to understand which are the technique used at this moment and we have chosen one paper written by [Authors] in 2015 that describes an algorithm called iTop. So, we have chosen to implement this algorithm. 

### The test net
Before to start to write code, we have built a network test net in order to write some test-driven code. 
There are several tools online to build a fake test net but we have searched for something that is much real as possible so we have chosen GNS3. This software permits to run on your own physical machine several docker containers (that act as a computer node) and several VMs (that are the routers) and then connect them using a simple GUI. For the router we have tried VyOS (an open-source router OS) but, due to the bare documentation, we moved to Cisco router image. So, after some days (and nights), our test net was ready to execute our software... __But__...Our test net has no internet connection outside the net, so, to deploy something, we have to dockerize the application, push the image on Docker Hub, then install a node in the test net -remember, each computer is a docker container- (no so much fun and fast when you forgot a semicolon, but we have built some supporting tool that permits to read some data inside the test net in order to test the application outside the testnet, given the inputs and the outputs).

[ TEST-NET IMAGE]

## The algorithm
The algorithm is composed of three phase. The first phase builds an overestimated network topology, then the following ones try to merge the links that are the same link in the real topology.

### Phase 1
The first phase analyzes all the traceroute path that the server received by the monitor. Each traceroute path can be of three type:
 - complete
 - complete with stars
 - blocked

#### Complete
If the path is complete, then we can easily apply this path on the graph, that means to add edge and nodes wherever they appear on the path

#### Complete with stars
If the path is complete with stars means that some router doesn't reply to the ICMP error, so we have something like:
[[ TRACEROUTE PATH ]]
In this case, our server takes the path, add on the graph the known edges and then when finding the stars (that are the anonymous routers), add these routers to the graph adding new nodes (that probably overestimated the network topology).

#### Blocked
In this case, our trace is incomplete. In order to reconstruct a complete path, we combine the incomplete path  A->B with the path B->A. Given the distance between A and B, we can infer how many routers are blocked and so we add the path to the graph considering these router like they are stars.

[[[ Computed images ]]]

### Phase 2
In this phase, the edges are analyzed in order to understand which are the candidates for the merging. The main problem is the computational complexity of this step (I'll describe step by step the problems).

For every edge, all other edges are checked. If these three checked are passed, then these edges are valid candidates for merging. - we perform checks O(|V|^2)
The checks to pass are:
 - Trace preservation: since there is no loop in the real network topology, if merging two edges we create a loop, probably these edges are different edges in the real topology, so keep it disjoint. 
In order to implement this step, we iterate over the trace for every check, that results as O(|trace|)
 - Distance preservation: since we know the path length, if we merge two edges we have to preserve the distance, that means that if the merging involves into distance alteration, these edges are disjoint in the real topology. 
In order to implement this step, we perform a Floyd-Warshall algorithm that is O(|V|^3), and this algorithm is in O(|V|^2) loop... 
 -  Link endpoint compatibility: if I know that a router is R1 and another is R2, since I know who they are, I cannot merge these two routers into the same. Same thing, if I know that a router is anonymous or blocked. In this paper, there is a table to explain what this implies that is clearer than hundreds of words.

### Phase 3
The last phase, given the merging candidates for every edge, tries to merge the nodes according to the candidates. The loop check, every time, if the previous merging has not invalidated the candidates set.

## The monitor
The monitor is the software that runs on some computer in our test network. It's written in Go and simply runs traceroute, serialize the result in a JSON and send it to the server.
Before to runs traceroute, the monitor notifies to the router that it is running and send to the server the distance between itself and all the nodes that act as monitors.

## Server
The server listens for new traceroute data, then analyse the path and add it to the graph (phase 1).  Then performs the phase 2 and the phase 3. 
Moreover, listen on the port 3000 for new traceroute result and, on port 5000, for HTTP connection to show the graph computed.

# Which are the problem?
We use traceroute, a tool that sends packets with incremental TTL number and collects every error message to infers the path of the packet. Of course, some routers do not reply with an error (anonymous) and some other drop the packets (blocked). These two router category complicates the network topology identification since we cannot collect complete path. The paper tries to resolve the problem by adding some virtual router that, in phase 3, should be merged with some other router and the result is declared to be "within 5% of the original networks for all considered metrics.". 

Another problem that we have found, and that the paper doesn't consider is that a router is identified by several interfaces, i.e. `192.168.1.1` should be the same router as `192.168.1.2`. We have resolved this problem using a static table that reports for each router its all interfaces address and transforming, before to analyze the path, the address into the symbolic name of the router. Our future intent is to delegate the alias resolving to some external algorithm like Ally.
