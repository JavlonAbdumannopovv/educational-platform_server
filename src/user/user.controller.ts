import { Body, Controller, Get, HttpCode, Param, Put } from '@nestjs/common';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { User } from './decorators/user.decorator';
import { InterfaceEmailAndPassword, UpdateUserDto } from './user.interface';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @Auth()
  async getProfile(@User('_id') _id: string) {
    return this.userService.byId(_id);
  }

  @HttpCode(200)
  @Put('edit-password')
  async editPassword(@Body() dto: InterfaceEmailAndPassword) {
    return this.userService.editPassword(dto);
  }

  @HttpCode(200)
  @Put('update')
  @Auth()
  async updateUser(@User('_id') _id: string, @Body() dto: UpdateUserDto) {
    const response = await this.userService.updateUser(_id, dto);
    return response;
  }

  @HttpCode(200)
  @Get('my-courses')
  @Auth()
  async myCourses(@User('_id') _id: string) {
    const response = await this.userService.myCourses(_id);
    return response;
  }
}
