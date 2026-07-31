const aedes = require('aedes')();
const server = require('net').createServer(aedes.handle);
const port = 1883;

server.listen(port, function () {
  console.log('==================================================');
  console.log('CATalyst Local MQTT Broker Started! (Node/Aedes)');
  console.log(`TCP Broker Endpoint: mqtt://localhost:${port}`);
  console.log('==================================================');
  console.log('Keep this script running in the background for your demo.\n');
});

aedes.on('client', function (client) {
  console.log(`[CLIENT_CONNECTED] Client ${(client ? client.id : client)} connected to broker`);
});

aedes.on('clientDisconnect', function (client) {
  console.log(`[CLIENT_DISCONNECTED] Client ${(client ? client.id : client)} disconnected from broker`);
});
