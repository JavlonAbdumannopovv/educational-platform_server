import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { genSalt, hash } from 'bcryptjs';
import { Model } from 'mongoose';
import { InterfaceEmailAndPassword, UpdateUserDto } from './user.interface';
import { User, UserDocument } from './user.model';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async byId(id: string) {
    const user = await this.userModel.findById(id);

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  async editPassword(dto: InterfaceEmailAndPassword) {
    const { email, password } = dto;

    const existUser = await this.userModel.findOne({ email });
    if (!existUser) throw new UnauthorizedException('user_not_found');

    const salt = await genSalt(10);
    const hashPassword = await hash(password, salt);

    await this.userModel.findByIdAndUpdate(
      existUser._id,
      { $set: { password: hashPassword } },
      { new: true },
    );

    return 'Success';
  }

  async updateUser(userId: string, dto: UpdateUserDto) {
    const { firstName, lastName, bio, birthday, avatar, job } = dto;
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      {
        $set: { fullName: firstName + lastName, bio, birthday, avatar, job },
      },
      { new: true },
    );

    return user;
  }

  async myCourses(userId: string) {
    const user = await this.userModel.findById(userId).populate('courses').exec();

    return user.courses;
  }
}
