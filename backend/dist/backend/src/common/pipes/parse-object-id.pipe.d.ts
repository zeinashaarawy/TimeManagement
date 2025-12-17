import { PipeTransform } from '@nestjs/common';
import { Types } from 'mongoose';
export declare class ParseObjectIdPipe implements PipeTransform<string, Types.ObjectId> {
    transform(value: string): Types.ObjectId;
}
