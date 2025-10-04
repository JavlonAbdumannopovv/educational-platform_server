import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course, CourseDocument } from 'src/course/course.model';
import { User, UserDocument } from 'src/user/user.model';
import { InstructorApplyDto } from './dto/instructor.dto';
import { Instructor, InstructorDocument } from './instructor.model';

@Injectable()
export class InstructorService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Instructor.name) private instructorModel: Model<InstructorDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
  ) {}

  async applyAsInstructor(dto: InstructorApplyDto) {
    const { email, firstName, lastName, socialMedia, job, language } = dto;
    let user: UserDocument;

    const existUser = await this.userModel.findOne({ email });
    user = existUser;

    if (user) {
      await this.userModel.findByIdAndUpdate(user._id, {
        $set: { job, fullName: `${firstName} ${lastName}` },
      });
    }

    if (!existUser) {
      const newUser = await this.userModel.create({ ...dto, fullName: `${firstName} ${lastName}` });
      user = newUser;
    }

    const data = { socialMedia, author: user._id, language };
    const existInstructor = await this.instructorModel.findOne({ author: user._id });

    if (existInstructor)
      throw new BadRequestException('Instructor with that email already exist in our system');

    const instructor = await this.instructorModel.create(data);

    if (instructor) {
      await this.userModel.findByIdAndUpdate(user._id, {
        $set: { instructorId: instructor._id },
      });
    }

    return 'Success';
  }

  async getAllCourses(author: string) {
    return await this.courseModel.find({ author });
  }

  async getDetailedCourse(slug: string) {
    return await this.courseModel.findOne({ slug });
  }

  async getStudents(userId: string, limit: string) {
    const instructor = await this.instructorModel
      .findOne({ author: userId })
      .populate('students')
      .limit(Number(limit))
      .exec();

    return instructor.students.map(student => this.getSpecificFieldStudents(student));
  }

  getSpecificFieldStudents(student) {
    return {
      email: student.email,
      createdAt: student.createdAt,
      coursesCount: student.courses.length,
    };
  }

  async getInstructors(language: string, limit: string) {
    const instructors = await this.instructorModel
      .find({ language, approved: true })
      .populate('author')
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .exec();

    return instructors.map(instructor => this.getSpecificFieldInstructor(instructor));
  }

  async getDetailedInstructor(instructorId: string) {
    const instructor = await this.instructorModel
      .findById(instructorId)
      .populate('author')
      .populate('courses');

    return this.getSpecificFieldInstructor(instructor);
  }

  getSpecificFieldInstructor(instructor: InstructorDocument) {
    return {
      _id: instructor._id,
      author: instructor.author,
      avatar: instructor.author.avatar,
      fullName: instructor.author.fullName,
      totalCourses: instructor.courses.length,
      job: instructor.author.job,
      studentsCount: instructor.students.length,
      courses: instructor.courses,
    };
  }
}
