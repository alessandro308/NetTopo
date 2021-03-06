package main

import (
	"bufio"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net"
	"os"
	"os/exec"
	"regexp"
	"strconv"
	"strings"

	. "github.com/logrusorgru/aurora"
)

type AliasResult struct {
	IP1     string `json:"ip1"`
	IP2     string `json:"ip2"`
	Type    string `json:"type"`
	Success bool   `json:"success"`
}

type AliasRequest struct {
	IP1  string `json:"ip1"`
	IP2  string `json:"ip2"`
	Type string `json:"type"`
}

type Monitor struct {
	IpNetInt     string `json:"ipNetInt"`
	IpNetUnknown string `json:"ipNetUnknown"`
	Name         string `json:"name"`
	Type         string `json:"type"`
}

// TracerouteHop type
type TracerouteHop struct {
	Address string `json:"address"`
	Host    string `json:"host"`
	Success bool   `json:"success"`
	TTL     int    `json:"ttl"`
}

type TraceRequest struct {
	IP   string
	Name string
}

// Final result type
type TracerouteResult struct {
	From string          `json:"from"`
	To   string          `json:"to"`
	Type string          `json:"type"`
	Hops []TracerouteHop `json:"hops"`
}

func AliasResolutionHandler(ip1 string, ip2 string, serverAddr string) {
	ally := exec.Command("ally", ip1, ip2)
	output, err := ally.Output()

	if err != nil {
		fmt.Println("Error:")
		log.Fatal(err)
	}

	var result AliasResult
	result.IP1 = ip1
	result.IP2 = ip2
	result.Type = "ally_reply"

	sameIpID := regexp.MustCompile(`same_ip`)
	notSameIpID := regexp.MustCompile(`!same_ip`)
	// Find `same_ip` result but it can be a negative response
	result.Success = sameIpID.MatchString(string(output)) && !notSameIpID.MatchString(string(output))

	packet, _ := json.Marshal(result)

	server, err := net.Dial("tcp", serverAddr)
	if err != nil {
		fmt.Println("Error:")
		log.Fatal(err)
	}
	server.Write(packet)
	server.Close()
	fmt.Println(Green("Done!"))
}

func GetIpInterface(nameInt string) string {
	netInterface, _ := net.InterfaceByName(nameInt)
	ips, _ := netInterface.Addrs()
	ip := ips[0].String()
	return ip[:len(ip)-3]
}

func ParseTracerouteOutput(output string, result *TracerouteResult) {
	traceID := regexp.MustCompile(`^\s(\d+)\s(.+)$`)
	replyID := regexp.MustCompile(`(\S+)\s\((\S+)\)`)

	// Remove the header of the trace list un attimo
	traces := strings.Split(output, "\n")[1:]
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
}

func TracerouteHandler(from string, monitors []TraceRequest, maxHops string, serverAddr string) {
	for _, monitor := range monitors {
		go func(monitor TraceRequest) {
			traceroute := exec.Command("traceroute", monitor.IP, "-m", maxHops)
			fmt.Println("Traceroute to Monitor %s", Brown(monitor.IP))
			output, err := traceroute.Output()

			if err != nil {
				fmt.Println("Error:")
				log.Fatal(err)
			}

			var result TracerouteResult
			result.From = from
			result.To = monitor.Name
			result.Type = "trace"

			ParseTracerouteOutput(string(output), &result)

			packet, _ := json.Marshal(result)

			server, err := net.Dial("tcp", serverAddr)
			if err != nil {
				fmt.Println("Error:")
				log.Fatal(err)
			}
			server.Write(packet)
			server.Close()
		}(monitor)
	}
}

func main() {
	var serverAddr = flag.String("server", "1.1.1.254:5000", "")
	var maxHops = flag.String("m", "10", "")

	flag.Parse()
	fmt.Printf("Establishment connection with the server... ")
	l, err := net.Listen("tcp", ":5000")
	if err != nil {
		fmt.Println("Error:")
		log.Fatal(err)
	} else {
		fmt.Println(Green("Done!"))
	}

	// Subscription phase
	fmt.Printf("Subscribing current monitor to server... ")
	server, err := net.Dial("tcp", *serverAddr)

	if err != nil {
		fmt.Println("Error:")
		log.Fatal(err)
	}

	var monitor Monitor
	monitor.Name, _ = os.Hostname()
	// Retrieve IP address associated to the interface attached to the unknow netwrok
	monitor.IpNetUnknown = GetIpInterface("eth0")
	// Retrieve IP address associated to the interface attached to the NetTopo network
	monitor.IpNetInt = GetIpInterface("eth1")
	// Subscribe current monitor
	monitor.Type = "notify"
	subscription, _ := json.Marshal(monitor)
	server.Write(subscription)
	server.Close()
	fmt.Println(Green("Done!"))

	defer l.Close()
	fmt.Println("Listening on 5000 for incoming server requests...")

	for {
		conn, err := l.Accept()
		if err != nil {
			fmt.Println("Error during connection accepting:")
			log.Fatal(err)
		}

		go func() {

			scanner := bufio.NewScanner(conn)
			ok := scanner.Scan()
			if !ok {
				fmt.Println("Error network reading: ", scanner.Err())
				return
			}

			var request map[string]interface{}

			//Here’s the actual decoding, and a check for associated errors.
			if err := json.Unmarshal(scanner.Bytes(), &request); err != nil {
				fmt.Println("Error on decoding request:", err)
			}

			switch request["type"].(string) {
			case "trace":
				fmt.Println(Bold(Brown("Received Traceroute Request ")))
				traces := request["monitors"].([]interface{})
				traceRequest := make([]TraceRequest, 0)
				for i := range traces {
					r := traces[i].(map[string]interface{})
					traceRequest = append(traceRequest, TraceRequest{IP: r["ip"].(string), Name: r["name"].(string)})
				}
				TracerouteHandler(monitor.Name, traceRequest, *maxHops, *serverAddr)
			case "ally":
				fmt.Println(Cyan("Received Ally Request for "), Bold(Cyan(request["ip1"].(string))), Cyan(" and "), Bold(Cyan(request["ip2"].(string))))
				AliasResolutionHandler(request["ip1"].(string), request["ip2"].(string), *serverAddr)
			}

		}()
	}
}

// Scemo chi legge
