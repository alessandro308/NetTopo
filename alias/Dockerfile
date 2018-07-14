FROM ubuntu:16.04

RUN apt-get update && apt-get install -y build-essential
# Download Ally source code
ADD http://research.cs.washington.edu/networking/rocketfuel/software/ally-0.1.0.tar.gz ally-0.1.0.tar.gz
# Extract, compile and install Ally
RUN tar -xvf ally-0.1.0.tar.gz \
	&& cd ally-0.1.0 \
	&& ./configure \
	&& make && make install
