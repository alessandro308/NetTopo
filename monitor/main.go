package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"net"

	"github.com/aeden/traceroute"
)

type result_t struct {
	From    net.IP                     `json:"from"`
	To      *net.IPAddr                `json:"to"`
	Maxhops int                        `json:"maxHops"`
	Host    string                     `json:"host"`
	Hops    []traceroute.TracerouteHop `json:"hops"`
}

var result result_t = result_t{}

func printHop(hop traceroute.TracerouteHop) {
	addr := fmt.Sprintf("%v.%v.%v.%v", hop.Address[0], hop.Address[1], hop.Address[2], hop.Address[3])
	hostOrAddr := addr
	if hop.Host != "" {
		hostOrAddr = hop.Host
	}
	if hop.Success {
		fmt.Printf("%-3d %v (%v)  %v\n", hop.TTL, hostOrAddr, addr, hop.ElapsedTime)

	} else {
		fmt.Printf("%-3d *\n", hop.TTL)
	}
}

func address(address [4]byte) string {
	return fmt.Sprintf("%v.%v.%v.%v", address[0], address[1], address[2], address[3])
}

func test(c chan traceroute.TracerouteHop) {
	var m = flag.Int("m", traceroute.DEFAULT_MAX_HOPS, `Set the max time-to-live (max number of hops) used in outgoing probe packets (default is 64)`)
	var q = flag.Int("q", 1, `Set the number of probes per "ttl" to nqueries (default is one probe).`)

	flag.Parse()
	host := flag.Arg(0)
	options := traceroute.TracerouteOptions{}
	options.SetRetries(*q - 1)
	options.SetMaxHops(*m + 1)

	ipAddr, err := net.ResolveIPAddr("ip", host)
	if err != nil {
		return
	}
	myAddr := net.IP("ipv4")
	fmt.Printf("traceroute from %v to %v (%v), %v hops max, %v byte packets\n", myAddr, host, ipAddr, options.MaxHops(), options.PacketSize())
	result.From = net.IP("ipv4")
	result.To = ipAddr
	result.Host = host
	result.Maxhops = options.MaxHops()
	_, err = traceroute.Traceroute(host, &options, c)
	if err != nil {
		fmt.Printf("Error: ", err)
	}
}

func main() {

	c := make(chan traceroute.TracerouteHop, 0)
	end := make(chan bool)
	go func() {
		hops := make([]traceroute.TracerouteHop, 0)
		var network bytes.Buffer
		enc := json.NewEncoder(&network)
		for {
			hop, ok := <-c
			if !ok {
				result.Hops = hops
				//res := &result_t{from: result.from, to: result.to, maxhops: result.maxhops, host: result.host, hops: result.hops}
				enc.Encode(result)
				conn, _ := net.Dial("tcp", "1.1.1.1:8081")
				conn.Write(network.Bytes())
				end <- true
				return
			}
			hops = append(hops, hop)
			printHop(hop)
		}
	}()

	test(c)
	<-end
}
