
// TCP Server to receive Traceroute
net = require('net');
net.createServer(function (socket) {
    socket.on('data', function (data) {
        let trace = JSON.parse(data);
        console.log(trace);
    });
    socket.on('end', function () {
        process.stdout.write("communication close");
    });
    socket.on("error", (err) => {
        console.log(err);
    });
}).listen(5000);