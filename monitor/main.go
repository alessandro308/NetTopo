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
	Address     string
	Host        string
	Success     bool
	TTL         int
}
// Final result type
type TracerouteResult struct {
	From    string          `json:"from"`
	To      string			`json:"to"`
	Hops    []TracerouteHop	`json:"hops"`
}

func main() {
	var to = flag.String("to", "127.0.0.1", "")
	var server = flag.String("server", "1.1.1.1:5000", "")

	flag.Parse()
	
	fmt.Printf("Connection to NetTopo Server %s... ", *server)
	conn, err := net.Dial("tcp", *server)
	
	if err != nil {
		log.Fatal(err)
	} else {
		fmt.Println("Done!")
	}
	
	traceroute := exec.Command("traceroute", *to)
	fmt.Printf("Traceroute to Monitor %s... ", *to)
	output, err := traceroute.Output()

	if err != nil {
		log.Fatal(err)
	} else {
		fmt.Println("Done!")
	}

	var result TracerouteResult
	result.From, _ = os.Hostname()
	result.To = *to

	traceID := regexp.MustCompile(`^\s(\d+)\s(.+)$`)
	replyID := regexp.MustCompile(`(\S+)\s\((\S+)\)`)

	// Remove the informative log
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

			// Received the ICMP packet reply
			if replyID.MatchString(hopMatch[2]) {
				replyMatch := replyID.FindStringSubmatch(hopMatch[2])
				result.Hops[currentTTL-1].Address = replyMatch[2]
				result.Hops[currentTTL-1].Host = replyMatch[1]
				result.Hops[currentTTL-1].Success = true
			}
		// The current trace is a reply of the already set TTL
		} else if replyID.MatchString(trace) {
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
