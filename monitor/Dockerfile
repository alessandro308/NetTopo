FROM golang

WORKDIR /go/src/app
COPY traceroute.go .
COPY main.go .
RUN go get github.com/aeden/traceroute && go build main.go

ENTRYPOINT /bin/sh