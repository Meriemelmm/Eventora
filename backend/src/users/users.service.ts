import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User,UserDocument } from './schemas/user.schema';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../common/enums';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

 
  async existingUser(email: string): Promise<UserDocument | null> {
    return await this.userModel.findOne({ email }).exec();
  }


  async create(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: Role;
  }): Promise<UserDocument>{
    
    const existingUser = await this.existingUser(userData.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const newUser = new this.userModel({
      email: userData.email,
      password: userData.password, 
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role || Role.PARTICIPANT,
    });

    
    return await newUser.save();
  }

 
  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

 
  async findByEmail(email: string): Promise<UserDocument>{
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  

  

 


}