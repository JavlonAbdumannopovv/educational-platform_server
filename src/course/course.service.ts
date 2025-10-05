import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Instructor, InstructorDocument } from 'src/instructor/instructor.model';
import { User, UserDocument } from 'src/user/user.model';
import { CourseBodyDto } from './coourse.dto';
import { Course, CourseDocument } from './course.model';
import { Review, ReviewDocument } from 'src/review/review.model';

@Injectable()
export class CourseService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Instructor.name) private instructorModel: Model<InstructorDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
  ) {}

  async createCourse(dto: CourseBodyDto, id: string) {
    const slugify = (str: string) =>
      str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const slug = slugify(dto.title);
    const course = await this.courseModel.create({ ...dto, slug: slug, author: id });
    await this.instructorModel.findOneAndUpdate(
      { author: id },
      { $push: { courses: course._id } },
      { new: true },
    );
    return 'Success';
  }

  async editCourse(dto: CourseBodyDto, courseId: string) {
    return await this.courseModel.findByIdAndUpdate(courseId, dto, { new: true });
  }

  async deleteCourse(courseId: string, userId: string) {
    await this.courseModel.findByIdAndRemove(courseId);
    await this.instructorModel.findOneAndUpdate(
      { author: userId },
      { $pull: { courses: courseId } },
      { new: true },
    );
    return 'Success';
  }

  async activateCourse(courseId: string) {
    const course = await this.courseModel.findByIdAndUpdate(
      courseId,
      { $set: { isActive: true } },
      { new: true },
    );

    return course;
  }

  async draftCourse(courseId: string) {
    const course = await this.courseModel.findByIdAndUpdate(
      courseId,
      { $set: { isActive: false } },
      { new: true },
    );

    return course;
  }

  async dragCourseSections(courseId: string, sections: string[]) {
    const course = await this.courseModel
      .findByIdAndUpdate(courseId, { $set: { sections } }, { new: true })
      .populate({ path: 'sections', populate: { path: 'lessons' } });

    return course.sections;
  }

  async getCourses(language: string, limit: string) {
    const courses = (await this.courseModel
      .aggregate([
        { $match: { language, isActive: true } },
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
      .limit(Number(limit))
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
    const course = (await this.courseModel
      .findOne({ slug })
      .populate({ path: 'sections', populate: { path: 'lessons' } })
      .populate({ path: 'author', populate: { path: 'instructorId' } })
      .exec()) as CourseDocument & { reviewCount: number; reviewAvg: number };

    const reviews = await this.reviewModel.find({ course: course._id });
    const avarage = this.getReviewAverage(reviews.map(c => c.rating));
    const allStudents = await this.userModel.find({ courses: course._id });
    const instructor = await this.instructorModel.findById(course.author.instructorId);

    return {
      ...this.getSpecificFieldCourse(course, instructor.students),
      reviewCount: reviews.length,
      reviewAvg: avarage,
      allStudents: allStudents.length,
    };
  }

  async getAdminCourses() {
    return this.courseModel.find().populate('author').exec();
  }

  async enrollUser(userID: string, courseId: string) {
    await this.userModel.findByIdAndUpdate(userID, { $push: { courses: courseId } }, { new: true });
    await this.courseModel.findByIdAndUpdate(
      courseId,
      { $push: { students: userID } },
      { new: true },
    );
    await this.instructorModel.findOneAndUpdate(
      { author: userID },
      {
        $push: { students: userID },
      },
      { new: true },
    );
    return 'Success';
  }
}
