import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { UsersService } from './users.service';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    //Fake copy of usersService
    const users: User[] = [];
    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filteredUsers);
      },
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 99999),
          email,
          password,
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
    };
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: fakeUsersService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password', async () => {
    const user = await service.signUp('test@test.com', 'asdf');

    expect(user.password).not.toEqual('asdf');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if signup with email already in use', async () => {
    await service.signUp('test@test.com', 'test');

    expect.assertions(2);

    try {
      await service.signUp('test@test.com', 'asdf');
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.message).toBe('email in use');
    }
  });

  it('throws if signin is called with an unused email', async () => {
    try {
      await service.signIn('test@test.com', 'asdf');
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundException);
      expect(err.message).toBe('User not found');
    }
  });

  it('throws if an invalid password is provided', async () => {
    await service.signUp('abc@def.com', 'password');
    let user;
    try {
      user = await service.signIn('abc@def.com', 'password1');
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      expect(err.message).toBe('bad password');
    }

    expect(user).not.toBeDefined();
  });

  it('returns a user if correct password is provided', async () => {
    await service.signUp('asdf@asdf.com', 'pass');

    const user = await service.signIn('asdf@asdf.com', 'pass');
    expect(user).toBeDefined();
  });
});
