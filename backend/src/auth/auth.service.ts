import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Role } from '../common/enums';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './dto/jwt-payload.dto';
import { User,UserDocument } from 'src/users/schemas/user.schema';
import { LoginDto } from './dto/LoginData.dto';
import {
  PASSWORD_LENGTH,
  BCRYPT_ROUNDS,
  PASSWORD_CHARS,
} from '../common/constains';
import { RegisterDto } from './dto/RegisterDto.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private generateToken(userId: string, email: string, role: string): string {
    const payload: JwtPayload = { sub: userId, email, role };
    return this.jwtService.sign(payload);
  }

  async register(userData: RegisterDto) {
  const hashedPassword = await bcrypt.hash(userData.password, BCRYPT_ROUNDS);

  const user = await this.usersService.create({
    email: userData.email,
    password: hashedPassword,
    firstName: userData.firstName,
    lastName: userData.lastName,
    role: userData.role || Role.PARTICIPANT,
  });

  const token = this.generateToken(
    user._id.toString(),
    user.email,
    user.role || Role.PARTICIPANT
  );
  return  {token:token,
    user:{lastName:user.lastName,firstName:user.firstName,email:user.email,role:user.role}
  }
  

}

async login(userData: LoginDto) {
 
  const user = await this.usersService.findByEmail(userData.email);
  
  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }

 
  const isPasswordValid = await bcrypt.compare(userData.password, user.password);
  
  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid credentials');
  }


  const token = this.generateToken(
    user._id.toString(),
    user.email,
    user.role || Role.PARTICIPANT
  );

 
  return {
    token: token,
    user: {
      lastName: user.lastName,
      firstName: user.firstName,
      email: user.email,
      role: user.role
    }
  };
}
}
    






























// @Injectable()
// export class AuthService {
//   constructor(private readonly usersService: UsersService  private readonly jwtService: JwtService,) {}

//    private generateToken(userId: string, email: string, role: string): string {
//     const payload: JwtPayload = {
//       sub: userId,
//       email,
//       role,
//     };

//     return this.jwtService.sign(payload);
//   }
//   async register(userData:RegisterDto) {
//     let passwordToUse = userData.password;
    
//     const hashedPassword = await bcrypt.hash(passwordToUse, BCRYPT_ROUNDS);
//     const user = await this.usersService.create({
//       email: userData.email,
//       password: hashedPassword,
//       firstName: userData.firstName,
//       lastName: userData.lastName,
//       role: userData.role,
//     });

 

//     return {
//       firstName:user.firstName,
//       lastName:user.lastName,
//       email:user.email,
//       role:user.role
     
//     };
//   }

// //   // LOGIN: Authentifier un utilisateur
// //   async login(credentials: {
// //     email: string;
// //     password: string;
// //   }): Promise<any> {
// //     // Récupérer l'utilisateur avec son mot de passe
// //     const user = await this.usersService.findByEmailWithPassword(
// //       credentials.email,
// //     );

// //     if (!user) {
// //       throw new UnauthorizedException('Invalid credentials');
// //     }

// //     // Vérifier le mot de passe
// //     const isPasswordValid = await bcrypt.compare(
// //       credentials.password,
// //       user.password,
// //     );

// //     if (!isPasswordValid) {
// //       throw new UnauthorizedException('Invalid credentials');
// //     }

// //     // Retourner l'utilisateur sans le mot de passe
// //     const userObject = user.toObject();
// //     delete userObject.password;

// //     return userObject;
// //   }

// //   // VALIDATE USER: Valider un utilisateur (utilisé par les stratégies Passport)
// //   async validateUser(email: string, password: string): Promise<any> {
// //     const user = await this.usersService.findByEmailWithPassword(email);

// //     if (!user) {
// //       return null;
// //     }

// //     const isPasswordValid = await bcrypt.compare(password, user.password);

// //     if (!isPasswordValid) {
// //       return null;
// //     }

// //     const userObject = user.toObject();
// //     delete userObject.password;
// //     return userObject;
// //   }

  
// }