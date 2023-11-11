import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from './entities/message.entity';

@Injectable()
export class MessagesService {
  private messages: Message[] = [
    { author: 'Admin', text: 'Welcome to the chat room' },
  ];

  private clientToUser = new Map();

  create(createMessageDto: CreateMessageDto): Message {
    const msg: Message = { ...createMessageDto };

    this.messages.push(msg);

    return msg;
  }

  findAllMessages(): Message[] {
    return this.messages;
  }

  identify(name: string, userId: string): string[] {
    this.clientToUser.set(userId, name);

    return Array.from(this.clientToUser.values());
  }

  removeUser(userId: string): boolean {
    return this.clientToUser.delete(userId);
  }

  getClientName(clientId: string): string {
    return this.clientToUser.get(clientId);
  }

  userExists(name: string): boolean {
    return Array.from(this.clientToUser.values()).includes(name);
  }
}
