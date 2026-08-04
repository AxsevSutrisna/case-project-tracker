export class BusinessRuleError extends Error {
  statusCode: number;
  conflictingEntity?: any;

  constructor(message: string, conflictingEntity?: any) {
    super(message);
    this.name = 'BusinessRuleError';
    this.statusCode = 409;
    this.conflictingEntity = conflictingEntity;
  }
}
