import {
  IFeedbackRepository,
  ListFeedbacksParams,
  ListFeedbacksResult,
} from "../../domain/repositories/IFeedbackRepository";

export class ListFeedbacksUseCase {
  constructor(private feedbackRepository: IFeedbackRepository) {}

  async execute(params: ListFeedbacksParams): Promise<ListFeedbacksResult> {
    return this.feedbackRepository.list(params);
  }
}
