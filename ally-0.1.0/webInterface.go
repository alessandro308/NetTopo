package main

import (
	"encoding/json"
	"fmt"
	"net"
)

func allyExecuter(ip1 string, ip2 string) {

}

func start() {
	ln, err := net.Listen("tcp", ":8080")
	if err != nil {
		fmt.Println("%v", err.Error())
	}
	for {
		conn, err := ln.Accept()
		if err != nil {
			fmt.Println("%v", err.Error())
		}
		go func(conn net.Conn) {
			byt := make([]byte, 1024)
			// Read the incoming connection into the buffer.

			_, err := conn.Read(byt)
			if err != nil {
				fmt.Println("%v", err.Error())
			}
			var dat map[string]interface{}

			//Here’s the actual decoding, and a check for associated errors.
			if err := json.Unmarshal(byt, &dat); err != nil {
				panic(err)
			}
			fmt.Println(dat)
			//In order to use the values in the decoded map, we’ll need to cast them to their appropriate type. For example here we cast the value in num to the expected float64 type.
			num := dat["num"].(float64)
			fmt.Println(num)
		}(conn)
	}
}

func main() {
	start()
}
