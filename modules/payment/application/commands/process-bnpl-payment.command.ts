import {
  ICommand,
  ICommandHandler,
  CommandResult,
} from '../../../../packages/core/src/application/cqrs';
import { BnplTransactionService } from '../services/bnpl-transaction.service';
import { BnplTransactionDTO } from '../../domain/entities/bnpl-transaction.entity';

type BnplAction = 'approve' | 'reject' | 'activate' | 'complete' | 'cancel';

export interface ProcessBnplPaymentCommand extends ICommand {
  readonly bnplId: string;
  readonly action: BnplAction;
  readonly userId?: string;
}

export class ProcessBnplPaymentHandler implements ICommandHandler<
  ProcessBnplPaymentCommand,
  CommandResult<BnplTransactionDTO>
> {
  constructor(private readonly bnplService: BnplTransactionService) {}

  async handle(command: ProcessBnplPaymentCommand): Promise<CommandResult<BnplTransactionDTO>> {
    let result: BnplTransactionDTO;

    switch (command.action) {
      case 'approve':
        result = await this.bnplService.approveBnplTransaction(command.bnplId, command.userId);
        break;
      case 'reject':
        result = await this.bnplService.rejectBnplTransaction(command.bnplId, command.userId);
        break;
      case 'activate':
        result = await this.bnplService.activateBnplTransaction(command.bnplId, command.userId);
        break;
      case 'complete':
        result = await this.bnplService.completeBnplTransaction(command.bnplId, command.userId);
        break;
      case 'cancel':
        result = await this.bnplService.cancelBnplTransaction(command.bnplId, command.userId);
        break;
      default:
        return CommandResult.failure('Unsupported action', ['action']);
    }

    return CommandResult.success(result);
  }
}
