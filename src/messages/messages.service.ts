import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from './entities/message.entity';

@Injectable()
export class MessagesService {
  private messages: Message[] = [
    { author: 'Admin', text: 'Welcome to the chat room' },
  ];

  private clientToUser = {};

  create(createMessageDto: CreateMessageDto) {
    const msg: Message = { ...createMessageDto };

    this.messages.push(msg);

    return msg;
  }

  findAll(): Message[] {
    return this.messages;
  }

  identify(name: string, userId: string) {
    this.clientToUser[userId] = name;

    return Object.values(this.clientToUser);
  }

  getClientName(clientId: string) {
    return this.clientToUser[clientId];
  }
}
