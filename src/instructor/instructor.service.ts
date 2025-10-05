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
    const courses = (await this.courseModel
      .aggregate([
        { $match: { author } },
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'author',
          },
        },
        {
          $lookup: {
            from: 'sections',
            localField: 'sections',
            foreignField: '_id',
            as: 'sections',
            pipeline: [
              {
                $lookup: {
                  from: 'lessons',
                  localField: 'lessons',
                  foreignField: '_id',
                  as: 'lessons',
                },
              },
              {
                $project: {
                  _id: 1,
                  title: 1,
                  lessons: {
                    _id: 1,
                    name: 1,
                    minute: 1,
                    second: 1,
                    hour: 1,
                  },
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'course',
            as: 'reviews',
          },
        },
        {
          $addFields: {
            reviewCount: { $size: '$reviews' },
            reviewAvg: { $avg: '$reviews.rating' },
          },
        },
        { $unwind: '$author' },
        {
          $project: {
            _id: 1,
            author: 1,
            sections: {
              $map: {
                input: { $ifNull: ['$sections', []] },
                as: 'section',
                in: {
                  _id: '$$section._id',
                  title: '$$section.title',
                  lessons: {
                    $map: {
                      input: { $ifNull: ['$$section.lessons', []] },
                      as: 'lesson',
                      in: {
                        _id: '$$lesson._id',
                        name: '$$lesson.name',
                        minute: '$$lesson.minute',
                        second: '$$lesson.second',
                        hour: '$$lesson.hour',
                      },
                    },
                  },
                },
              },
            },
            slug: 1,
            isActive: 1,
            learn: 1,
            requirements: 1,
            tags: 1,
            description: 1,
            level: 1,
            category: 1,
            price: 1,
            previewImage: 1,
            title: 1,
            exerpt: 1,
            language: 1,
            updatedAt: 1,
            reviewCount: 1,
            reviewAvg: 1,
            students: 1,
          },
        },
      ])
      .sort({ createdAt: -1 })
      .exec()) as (CourseDocument & { reviewCount: number; reviewAvg: number })[];

    return courses.map(course => this.getSpecificFieldCourse(course));
  }

  getReviewAverage(ratingArr: number[]) {
    if (!ratingArr?.length) return 5;
    if (ratingArr.length === 1) return ratingArr[0];
    const sum = ratingArr.reduce((prev, next) => prev + next, 0);
    return sum / ratingArr.length;
  }

  getSpecificFieldCourse(
    course: CourseDocument & { reviewCount: number; reviewAvg: number },
    students?,
  ) {
    const sections = course.sections || [];
    const lessonCount = sections
      .map(s => (s.lessons ? s.lessons.length : 0))
      .reduce((a, b) => a + b, 0);

    return {
      title: course.title,
      previewImage: course.previewImage,
      price: course.price,
      level: course.level,
      category: course.category,
      _id: course._id,
      author: {
        fullName: course.author.fullName,
        avatar: course.author.avatar,
        job: course.author.job,
        students: students || [],
      },
      lessonCount,
      totalHour: this.getTotalHours(course),
      updatedAt: course.updatedAt,
      learn: course.learn,
      requirements: course.requirements,
      description: course.description,
      language: course.language,
      exerpt: course.exerpt,
      slug: course.slug,
      reviewCount: course.reviewCount,
      reviewAvg: course.reviewAvg,
      students: course.students,
      isActive: course.isActive,
    };
  }

  getTotalHours(course: CourseDocument) {
    const sections = course.sections || [];
    let totalHour = 0;

    for (const section of sections) {
      const lessons = section.lessons || [];
      for (const lesson of lessons) {
        const h = parseInt(String(lesson.hour || 0));
        const m = parseInt(String(lesson.minute || 0));
        const s = parseInt(String(lesson.second || 0));
        const totalSeconds = h * 3600 + m * 60 + s;
        totalHour += totalSeconds / 3600;
      }
    }

    return totalHour.toFixed(1);
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
