import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway(8000, {
  cors: {
    origin: '*', // In production, restrict this to your frontend's URL
  },
})
export class QrGateway implements OnGatewayConnection, OnGatewayDisconnect {
  // Get a reference to the native socket.io server instance
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`✨ Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`🔌 Client disconnected: ${client.id}`);
  }

  // A helper method our service will call to send progress
  sendProgressUpdate(
    clientId: string,
    progress: { currentPage: number; totalPages: number },
  ) {
    this.server.to(clientId).emit('scan-progress', progress);
  }

  // A helper method for when the scan is complete
  sendScanComplete(
    clientId: string,
    result: { totalPages: number; foundCodes: number },
  ) {
    this.server.to(clientId).emit('scan-complete', result);
  }
}
