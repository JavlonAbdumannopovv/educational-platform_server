import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as SchemaMS } from 'mongoose';
import { RoleUser } from './user.interface';
import { Course } from 'src/course/course.model';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ unique: true, required: true })
  email: string;

  @Prop()
  fullName: string;

  @Prop()
  password: string;

  @Prop()
  role: RoleUser;

  @Prop()
  instructorId: string;

  @Prop()
  avatar: string;

  @Prop()
  job: string;

  @Prop()
  createdAt: string;

  @Prop([{ type: SchemaMS.Types.ObjectId, ref: 'Course' }])
  courses: Course[];

  @Prop()
  bio: string;

  @Prop()
  birthday: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
