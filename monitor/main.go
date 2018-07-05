package main

import (
	"flag"
	"fmt"
	"log"
	"regexp"
	"net"
	"os"
	"strconv"
	"strings"

	"encoding/json"
	"os/exec"
)

// TracerouteHop type
type TracerouteHop struct {
	Address     string	`json:"address"`
	Host        string	`json:"host"`
	Success     bool	`json:"success"`
	TTL         int		`json:"ttl"`
}
// Final result type
type TracerouteResult struct {
	From    string          `json:"from"`
	To      string			`json:"to"`
	Type	string			`json:"type"`
	Hops    []TracerouteHop	`json:"hops"`
}

type Monitor struct {
	IP		string	`json:"ip"`
	Name	string	`json:"name"`
	Type	string	`json:"type"`
}

func main() {
	var to = flag.String("to", "127.0.0.1", "")
	var server = flag.String("server", "1.1.1.254:5000", "")
	var maxHops = flag.String("m", "10", "")

	flag.Parse()
	
	fmt.Printf("Connection to NetTopo Server %s... ", *server)
	conn, err := net.Dial("tcp", *server)
	
	if err != nil {
		fmt.Println("Error:")
		log.Fatal(err)
	} else {
		fmt.Println("Done!")
	}

	// Subscription phase
	fmt.Printf("Subscribing current monitor... ")
	var monitor Monitor
	monitor.Name, _ = os.Hostname()
	// Retrieve IP address associated to the `eth0` interface
	netInterface, _ := net.InterfaceByName("eth0")
	ips, _ :=	netInterface.Addrs()
	ip := ips[0].String()
	monitor.IP = ip[:len(ip)-3]
	// Subscribe current monitor
	monitor.Type = "notify"
	subscription, _ := json.Marshal(monitor)
	conn.Write(subscription)
	fmt.Println("Done!")
	
	traceroute := exec.Command("traceroute", *to, "-m", *maxHops)
	fmt.Printf("Traceroute to Monitor %s... ", *to)
	output, err := traceroute.Output()

	if err != nil {
		fmt.Println("Error:")
		log.Fatal(err)
	} else {
		fmt.Println("Done!")
	}

	var result TracerouteResult
	result.From, _ = os.Hostname()
	result.To = *to
	result.Type = "trace"

	traceID := regexp.MustCompile(`^\s(\d+)\s(.+)$`)
	replyID := regexp.MustCompile(`(\S+)\s\((\S+)\)`)

	// Remove the header of the trace list
	traces := strings.Split(string(output), "\n")[1:]
	currentTTL := 0

	for _, trace := range traces {
		// Start a new hop
		if traceID.MatchString(trace) {
			hopMatch := traceID.FindStringSubmatch(trace)
			currentTTL, _ = strconv.Atoi(hopMatch[1])

			var hop TracerouteHop
			hop.Address = "0.0.0.0"
			hop.Host = "unknown"
			hop.Success = false
			hop.TTL = currentTTL

			result.Hops = append(result.Hops, hop)
		}
		// In the current trace there is a reply of the curret TTL
		if replyID.MatchString(trace) {
			replyMatch := replyID.FindStringSubmatch(trace)
			result.Hops[currentTTL-1].Address = replyMatch[2]
			result.Hops[currentTTL-1].Host = replyMatch[1]
			result.Hops[currentTTL-1].Success = true
		}
	}

	packet, _ := json.Marshal(result)
	fmt.Println(string(packet))

	fmt.Printf("Sending traceroute result... ")
	conn.Write(packet)
	fmt.Println("Done!")
}
