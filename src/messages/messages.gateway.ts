import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessagesGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly messagesService: MessagesService) { }

  @SubscribeMessage('createMessage')
  async create(@MessageBody() createMessageDto: CreateMessageDto) {
    console.log('Create message emit recieved!');
    const message = await this.messagesService.create(createMessageDto);

    this.server.emit('message', message);

    return message;
  }

  @SubscribeMessage('findAllMessages')
  findAll() {
    console.log('Find All Messages emit recieved!');
    return this.messagesService.findAll();
  }

  @SubscribeMessage('userLoginAttempt')
  loginAttempt(
    @MessageBody('name') name: string,
    @ConnectedSocket() client: Socket
  ) {
    if (this.messagesService.userExists(name))
      return { status: 'failed', message: 'Username is already taken' }
    else {
      const userList = this.messagesService.identify(name, client.id);

      client.broadcast.emit('userJoined', name);

      return { status: 'success', users: userList }
    }
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
