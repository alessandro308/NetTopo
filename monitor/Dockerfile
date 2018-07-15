FROM ubuntu:16.04
ENV GOVERSION 1.6.2
ENV GOROOT /opt/go
ENV GOPATH /root/.go

RUN apt-get update && apt-get install -y build-essential traceroute wget vim nano
RUN cd /opt && wget https://storage.googleapis.com/golang/go${GOVERSION}.linux-amd64.tar.gz && \
    tar zxf go${GOVERSION}.linux-amd64.tar.gz && rm go${GOVERSION}.linux-amd64.tar.gz && \
    ln -s /opt/go/bin/go /usr/bin/ && \
    mkdir $GOPATH
# Download Ally source code
ADD http://research.cs.washington.edu/networking/rocketfuel/software/ally-0.1.0.tar.gz ally-0.1.0.tar.gz
# Extract, compile and install Ally
RUN tar -xvf ally-0.1.0.tar.gz \
	&& cd ally-0.1.0 \
	&& ./configure \
	&& make && make install

WORKDIR /go/src/app
COPY main.go .
RUN go build main.go

ENTRYPOINT /bin/bash
