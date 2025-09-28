import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { compare, genSalt, hash } from 'bcryptjs';
import { Model } from 'mongoose';
import { InterfaceEmailAndPassword, UpdateUserDto, UserChangePasswordDto } from './user.interface';
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
    const fullName = `${firstName} ${lastName}`;
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      {
        $set: { fullName, bio, birthday, avatar, job },
      },
      { new: true },
    );

    return user;
  }

  async myCourses(userId: string) {
    const user = await this.userModel.findById(userId).populate('courses').exec();

    return user.courses;
  }

  async changePassword(userId: string, dto: UserChangePasswordDto) {
    const user = await this.userModel.findById(userId);

    if (dto.oldPassword.length) {
      const currentPassword = await compare(dto.oldPassword, user.password);
      if (!currentPassword) throw new BadRequestException('incorrect_password');
    }

    const salt = await genSalt(10);
    const hashPassword = await hash(dto.newPassword, salt);

    await this.userModel.findByIdAndUpdate(
      userId,
      {
        $set: { password: hashPassword },
      },
      { new: true },
    );

    return 'Success';
  }
}
