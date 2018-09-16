'use strict';

const io = require('socket.io');
const DEFAULT_ADAPTER = require('./adapters/icebreaker.io-adapter');
const inboundEvents = require('./events/events').inbound;

const DEFAULT_SOCKET_PATH = '/socket';

class _SignalingServer {
  /**
   * Constructs the signaling server (it has the same signature
   * that socket.io since it starts the socket server through it).
   *
   * - If no path is provided, '/socket' default one will be used.
   *
   * @param {http.Server|Number|Object} httpServer, port or options
   * @param {Object} [opts]
   */
  constructor(_httpServer = {}, _opts = {}) {
    let httpServer = _httpServer;
    let opts;

    if (typeof httpServer === 'object' && !httpServer.listen) {
      opts = httpServer;
      httpServer = null;
    }

    opts = opts || _opts || {};
    opts.path = opts.path || DEFAULT_SOCKET_PATH;
    this.adapter = opts.signalingServerAdapter || DEFAULT_ADAPTER;
    this.serverSocket = io(httpServer, opts);

    // Binding
    this.onConnection = this.onConnection.bind(this);
    this.bindEventHandlers = this.bindEventHandlers.bind(this);

    this.serverSocket.on('connection', this.onConnection);
  }

  onConnection(socket) {
    this.bindEventHandlers(socket);
  }

  bindEventHandlers(socket) {
    Object.keys(inboundEvents).forEach((name) => {
      const handler = inboundEvents[name].handler;
      socket.on(name, (event, clientCb) => {
        const handlerProps = {
          event,
          socket,
          clientCb,
          adapter: this.adapter
        };
        handler(handlerProps);
      });
    });
  }

}

// This allows calling signalingServer without the 'new'
const SignalingServer = (httpServer = {}, opts = {}) => new _SignalingServer(httpServer, opts);
module.exports = SignalingServer;
