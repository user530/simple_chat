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

  handleConnection(client: any, ...args: any[]) {
    console.log('Gateway connection established');
  }

  handleDisconnect(client: any) {
    this.messagesService.removeUser(client.id);
  }

  @SubscribeMessage('userLoginAttempt')
  loginAttempt(
    @MessageBody('name') name: string,
    @ConnectedSocket() client: Socket
  ) {
    console.log('User login attempt');
    if (this.messagesService.userExists(name))
      return { status: 'failed', message: 'Username is already taken' }
    else {
      const users = this.messagesService.identify(name, client.id);
      const messages = this.messagesService.findAllMessages();

      client.broadcast.emit('userJoined', name);

      return { status: 'success', users, messages }
    }
  }

  @SubscribeMessage('userLeft')
  logout(@MessageBody('userId') userId: string, @ConnectedSocket() client: Socket) {
    console.log('User disconnected!');
    return this.messagesService.removeUser(userId);
  }

  @SubscribeMessage('createMessage')
  async create(@MessageBody() createMessageDto: CreateMessageDto) {
    console.log('Create message emit recieved!');
    const message = await this.messagesService.create(createMessageDto);

    this.server.emit('message', message);

    return message;
  }



  @SubscribeMessage('userTyping')
  async typing(
    @MessageBody('isTyping') isTyping: boolean,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('User typing emit recieved!');
    const name = this.messagesService.getClientName(client.id);

    // Send to everyone except the sender
    client.broadcast.emit('typing', { name, isTyping });
  }
}
