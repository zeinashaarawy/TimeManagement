export declare class CreateExceptionDto {
    employeeId: string;
    exceptionType: string;
    submitter: string;
    approverChain?: string[];
    comments?: string;
    deadline?: Date;
}
