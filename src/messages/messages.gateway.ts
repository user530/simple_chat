import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly messagesService: MessagesService) { }

  handleConnection(client: Socket, ...args: any[]) {
    console.log('Gateway connection established');
  }

  handleDisconnect(client: Socket) {
    const name = this.messagesService.removeUser(client.id);
    if (name) this.server.emit('userLeft', name);
    return name;
  }

  @SubscribeMessage('userLoginAttempt')
  loginAttempt(
    @MessageBody('name') name: string,
    @ConnectedSocket() client: Socket
  ) {
    if (this.messagesService.userExists(name))
      return { status: 'failed', message: 'Username is already taken' }
    else {
      const users = this.messagesService.identify(name, client.id);
      const messages = this.messagesService.findAllMessages();

      client.broadcast.emit('userJoined', name);

      return { status: 'success', users, messages }
    }
  }

  @SubscribeMessage('createMessage')
  async create(
    @MessageBody() createMessageDto: CreateMessageDto
  ) {
    const message = await this.messagesService.create(createMessageDto);

    this.server.emit('newMessage', message);

    return message;
  }



  @SubscribeMessage('userTyping')
  async typing(
    @MessageBody('isTyping') isTyping: boolean,
    @ConnectedSocket() client: Socket,
  ) {
    const name = this.messagesService.getClientName(client.id);

    // Send to everyone except the sender
    client.broadcast.emit('typing', { name, isTyping });
  }
}
